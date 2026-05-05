'use client';
import { getModuleRecord, moduleData } from '@/lib/moduleData';
import { apiService } from '@/services/apiService';
import { Activity, ArrowLeft, FileText, Plus, Save, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Modal from './Modal';
import { toast } from 'sonner';

export default function ModuleForm({ moduleKey, mode, id, onSuccess, isModal = false }) {
  const router = useRouter();
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
  const isWorker = currentUser?.role === 'Worker';
  const config = moduleData[moduleKey];
  const initialValues = useMemo(() => {
    const record = mode === 'edit' ? getModuleRecord(moduleKey, id) : {};
    const today = new Date().toISOString().split('T')[0];

    return Object.fromEntries(config.fields.map((field) => {
      let defaultValue = record?.[field.name] ?? field.defaultValue ?? '';

      if (mode !== 'edit' && field.type === 'date' && !defaultValue) {
        defaultValue = today;
      }
      return [field.name, defaultValue];
    }));
  }, [config.fields, id, mode, moduleKey]);

  const [options, setOptions] = useState({});
  const [quickAdd, setQuickAdd] = useState(null);

  // Dynamic Validation Schema
  const validationSchema = useMemo(() => {
    return Yup.object().shape(
      Object.fromEntries(
        config.fields.map(field => {
          if (field.hidden) return [field.name, Yup.string()];

          let validator = Yup.string();
          if (field.type === 'number') validator = Yup.number();

          if (field.required !== false) {
            validator = validator.required(`${field.label} is required`);
          }

          if (field.type === 'email') {
            validator = validator.email('Invalid email address');
          }

          return [field.name, validator];
        })
      )
    );
  }, [config.fields]);

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const payload = { ...values };
        const fileFields = config.fields.filter(f => f.type === 'file' && payload[f.name]?.startsWith('data:image'));

        // Prepare initial payload (images are set to placeholders for background processing)
        const initialPayload = { ...payload };
        fileFields.forEach(f => {
          initialPayload[f.name] = 'https://res.cloudinary.com/dwkom79iv/image/upload/v1714578144/uploading_placeholder.png';
        });

        // Add audit info (Captured from active session)
        const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
        initialPayload.createdBy = user?.name || 'System';
        initialPayload.createdById = user?._id || null; // Store native ObjectId for lookups

        // 1. Create/Update record immediately
        const result = mode === 'edit'
          ? await apiService.updateRecord(moduleKey, id, initialPayload)
          : await apiService.createRecord(moduleKey, initialPayload);

        const recordId = result?._id || id;

        // 2. IMMEDIATE REDIRECTION (NO WAIT)
        toast.success(`${config.title} ${mode === 'edit' ? 'updated' : 'created'} successfully.`);
        if (onSuccess) {
          onSuccess(result);
        } else {
          router.replace(config.listPath);
        }

        // 3. Deferred Background Upload (Wait 500ms to allow navigation to start)
        if (fileFields.length > 0) {
          setTimeout(() => {
            fileFields.forEach(async (field) => {
              try {
                const res = await fetch('/api/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image: payload[field.name] })
                });
                const data = await res.json();
                if (data.success) {
                  await apiService.updateRecord(moduleKey, recordId, { [field.name]: data.url });
                  console.log(`[BACKGROUND_SYNC] ${field.label} updated for ${recordId}`);
                }
              } catch (err) {
                console.error(`[BACKGROUND_FAILURE] ${field.label}:`, err);
              }
            });
          }, 500);
        }

      } catch (error) {
        console.error('Submission error:', error);
        const errorMsg = error.message || 'System integrity check failed.';
        toast.error(`Unable to save: ${errorMsg}`);
      }
    }
  });

  const { values, setValues, setFieldValue, handleSubmit, touched, errors } = formik;

  const fetchOptions = useCallback(async () => {
    // If we are creating an invoice, we want to know which tows are already invoiced
    let invoicedJobIds = [];
    if (moduleKey === 'invoices') {
      try {
        const invResult = await apiService.getRecords('invoices', { limit: 1000 });
        invoicedJobIds = (invResult.data || []).map(inv => {
          // jobId is stored as "ID - Name"
          return inv.jobId?.split(' - ')[0].trim();
        }).filter(Boolean);
      } catch (error) {
        console.error('Failed to fetch existing invoices for filtering:', error);
      }
    }

    const promises = config.fields.map(async (field) => {
      if (field.module) {
        try {
          const result = await apiService.getRecords(field.module, { limit: 100 });
          if (result.data) {
            let data = result.data;

            // Filter tows for invoices
            if (moduleKey === 'invoices' && field.module === 'tows' && mode !== 'edit') {
              data = data.filter(r => !invoicedJobIds.includes(r.id));
            }

            // Filter users to only show Workers in selection fields (Tows, Expenses, etc.)
            if (field.module === 'users') {
              data = data.filter(r => r.role === 'Worker');
            }

            setOptions((prev) => ({
              ...prev,
              [field.name]: data.map(r => {
                let label = '';
                if (field.module === 'vehicles') label = `${r.name} - ${r.plate} [${r.modelRef || 'N/A'}] (${r.year || 'N/A'})`;
                else if (field.module === 'users') label = r.name;
                else if (field.module === 'tows') label = `${r.id} - ${r.customer}`;
                else label = r.name || r.id || r.title;

                return { label, value: label, _id: r._id, raw: r };
              })
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch options for ${field.name}:`, error);
        }
      }
    });
    await Promise.all(promises);
  }, [config.fields, moduleKey, mode]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Worker Self-Selection for Tow Jobs and Expenses
  useEffect(() => {
    if (mode === 'create' && (moduleKey === 'tows' || moduleKey === 'expenses')) {
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
      if (user && user.role === 'Worker') {
        const fieldName = moduleKey === 'tows' ? 'driver' : 'worker';
        const idFieldName = moduleKey === 'tows' ? 'driverId' : 'workerId';
        setFieldValue(fieldName, user.name);
        // Store the native MongoDB _id for relational lookups
        if (user._id) setFieldValue(idFieldName, user._id);
      }
    }
  }, [moduleKey, mode, setFieldValue]);

  useEffect(() => {
    if (mode === 'edit' || values.id) return;

    const generateNextId = async () => {
      try {
        // Fetch all records to find the highest ID
        const result = await apiService.getRecords(moduleKey, { limit: 1000 });
        const records = result.data || [];

        const prefix = moduleKey === 'users' ? 'EMP' :
          moduleKey === 'tows' ? 'TOW' :
            moduleKey === 'invoices' ? 'INV' :
              moduleKey === 'quotations' ? 'QTN' : 'REF';

        if (records.length === 0) {
          setFieldValue('id', `${prefix}-001`);
          return;
        }

        // Extract numbers from existing IDs and find the maximum
        const numbers = records.map(r => {
          const idValue = r.id || '';
          const match = idValue.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        }).filter(n => !isNaN(n));

        const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
        const nextNum = (maxNum + 1).toString().padStart(3, '0');

        const nextId = `${prefix}-${nextNum}`;
        console.log(`[ID_GENERATOR] Module: ${moduleKey}, Next ID: ${nextId}`);
        setFieldValue('id', nextId);
      } catch (error) {
        console.error('Failed to generate sequential ID:', error);
        // Better fallback: Default to 001 instead of random to maintain structure
        const prefix = moduleKey === 'users' ? 'EMP' : 'REF';
        setFieldValue('id', `${prefix}-001`);
      }
    };

    if (config.fields.some(f => f.name === 'id')) {
      generateNextId();
    }
  }, [moduleKey, mode, config.fields, setFieldValue]);

  useEffect(() => {
    if (mode !== 'edit') return;

    async function loadRecord() {
      try {
        const result = await apiService.getRecord(moduleKey, id);
        if (result) {
          formik.setValues(
            Object.fromEntries(
              config.fields.map((field) => [field.name, result[field.name] ?? ''])
            )
          );
        }
      } catch (error) {
        console.error('Failed to load record:', error);
      }
    }
    loadRecord();
  }, [config.fields, id, mode, moduleKey]);

  const showToast = (message, type = 'success') => {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  };


  const handleFileChange = (fieldName, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFieldValue(fieldName, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleQuickAddSuccess = (newRecord) => {
    const fieldName = quickAdd.fieldName;
    const displayName = newRecord.name || newRecord.id || newRecord.title;

    // Refresh options and select new record
    fetchOptions().then(() => {
      setFieldValue(fieldName, displayName);
      setQuickAdd(null);
    });
  };

  useEffect(() => {
    if (moduleKey !== 'tows') return;

    const amount = Number(values.amount || 0);
    const paymentMethod = values.paymentMethod;

    if (paymentMethod === 'Cash' && amount > 0) {
      const driverShare = (amount * 0.1).toFixed(2);
      const companyShare = (amount * 0.9).toFixed(2);

      if (values.driverShare !== driverShare || values.companyShare !== companyShare) {
        setFieldValue('driverShare', driverShare);
        setFieldValue('companyShare', companyShare);
      }
    } else if (values.driverShare !== '0' || values.companyShare !== '0') {
      setFieldValue('driverShare', '0');
      setFieldValue('companyShare', '0');
    }
  }, [moduleKey, values.amount, values.paymentMethod, values.driverShare, values.companyShare, setFieldValue]);

  useEffect(() => {
    if (moduleKey !== 'tows' || !values.driver) return;
    const driverOptions = options['driver'] || [];
    const selected = driverOptions.find(opt => opt.value === values.driver);
    if (selected && selected._id && values.driverId !== selected._id) {
      setFieldValue('driverId', selected._id);
    }
  }, [moduleKey, values.driver, options, setFieldValue]);

  useEffect(() => {
    if (moduleKey !== 'tows' || !values.vehicle) return;
    const vehicleOptions = options['vehicle'] || [];
    const selected = vehicleOptions.find(opt => opt.value === values.vehicle);
    if (selected && selected._id && values.vehicleId !== selected._id) {
      setFieldValue('vehicleId', selected._id);
    }
  }, [moduleKey, values.vehicle, options, setFieldValue]);

  useEffect(() => {
    if (moduleKey !== 'invoices') return;

    if (!values.jobId) {
      setValues({
        ...values,
        customer: '',
        worker: '',
        vehicle: '',
        total: ''
      });
      return;
    }

    async function fetchJobDetails() {
      try {
        const extractId = (str) => {
          return str.split(' - ')[0].trim();
        };

        const jobId = extractId(values.jobId);
        const result = await apiService.getRecord('tows', jobId);
        if (result) {
          setValues({
            ...values,
            towId: result._id,
            customer: result.customer,
            customerId: result.customerId,
            worker: result.driver,
            workerId: result.driverId,
            vehicle: result.vehicle,
            vehicleId: result.vehicleId,
            type: result.paymentMethod || 'Credit',
            total: result.amount
          });
        }
      } catch (error) {
        console.error('Failed to fetch job details:', error);
      }
    }
    fetchJobDetails();
  }, [moduleKey, values.jobId]);

  useEffect(() => {
    if (moduleKey !== 'invoices') return;

    const total = Number(values.total || 0);
    const paid = Number(values.paid || 0);
    let newStatus = 'Unpaid';

    if (paid >= total && total > 0) {
      newStatus = 'Paid';
    } else if (paid > 0) {
      newStatus = 'Partial';
    }

    if (values.status !== newStatus) {
      setFieldValue('status', newStatus);
    }
  }, [moduleKey, values.total, values.paid, values.status]);

  useEffect(() => {
    if (moduleKey !== 'salaries') return;

    async function calculateSalary() {
      const workerName = values.worker;
      const month = values.month;
      const year = values.year;

      if (!workerName || !month || !year) return;

      try {
        // Extract ID if in "Name (ID)" format
        const extractId = (str) => {
          const match = str.match(/\(([^)]+)\)$/);
          return match ? match[1] : str;
        };

        const workerId = extractId(workerName);

        // 1. Fetch worker base salary from 'users'
        const usersResult = await apiService.getRecords('users', { q: workerId });
        const worker = usersResult.data?.find(w => w.id === workerId || w.name === workerName || w.username === workerId);
        const baseSalary = Number(worker?.salary || 0);

        // 2. Fetch completed cash tows for this worker/month/year
        const towsResult = await apiService.getRecords('tows', { limit: 1000 });
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = monthNames.indexOf(month);

        const workerTows = (towsResult.data || []).filter(tow => {
          const towWorkerId = extractId(tow.driver || '');
          if (towWorkerId !== workerId || tow.status !== 'Completed' || tow.paymentMethod !== 'Cash') return false;
          const towDate = new Date(tow.date);
          return towDate.getMonth() === monthIndex && towDate.getFullYear().toString() === year;
        });

        const cashCollected = workerTows.reduce((sum, tow) => sum + Number(tow.amount || 0), 0);

        // 3. Fetch expenses for this worker/month/year
        const expensesResult = await apiService.getRecords('expenses', { limit: 1000 });
        const workerExpenses = (expensesResult.data || []).filter(exp => {
          const expWorkerId = extractId(exp.worker || '');
          if (expWorkerId !== workerId) return false;
          const expDate = new Date(exp.date);
          return expDate.getMonth() === monthIndex && expDate.getFullYear().toString() === year;
        });

        const totalExpenses = workerExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

        // 4. Update values
        // Retention is 10% commission for driver (90% remains for company)
        const driverCommission = cashCollected * 0.1;
        const netAmount = baseSalary + driverCommission - cashCollected - totalExpenses;

        setValues({
          ...values,
          baseSalary: baseSalary.toString(),
          cashCollected: cashCollected.toString(),
          retention: driverCommission.toString(),
          expenses: totalExpenses.toString(),
          amount: netAmount.toString()
        });

      } catch (error) {
        console.error('Failed to calculate salary details:', error);
      }
    }

    calculateSalary();
  }, [moduleKey, values.worker, values.month, values.year]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('jobId');
      if (jobId && !values.jobId) {
        // Try to find the job in options once they are loaded
        const jobOption = (options.jobId || []).find(opt => opt.value.startsWith(jobId));
        if (jobOption) {
          setValues({ ...values, jobId: jobOption.value, towId: jobOption._id });
        }
      }
    }
  }, [options.jobId, values.jobId]);

  return (
    <div className={!isModal ? "animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out" : ""}>
      {/* Quick Add Modal */}
      {quickAdd && (
        <Modal
          isOpen={true}
          onClose={() => setQuickAdd(null)}
          title={`Quick Add ${moduleData[quickAdd.moduleKey].title}`}
        >
          <ModuleForm
            moduleKey={quickAdd.moduleKey}
            mode="create"
            onSuccess={handleQuickAddSuccess}
            isModal={true}
          />
        </Modal>
      )}

      {!isModal && (
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-10">
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
              Return to Node Directory
            </button>
            <h1 className="text-4xl font-black text-emerald-950 tracking-tight">
              {mode === 'edit' ? 'Synchronize ' : 'Initialize '}
              <span className="text-emerald-600">{config.title}</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {mode === 'edit' ? 'Updating existing parameters in the global ledger.' : 'Establishing a new data record in the system architecture.'}
            </p>
          </div>
        </div>
      )}

      <div className={`overflow-hidden ${!isModal ? 'border border-emerald-100/50 bg-white shadow-sm rounded-2xl' : ''}`}>
        {!isModal && (
          <div className="bg-emerald-50/20 border-b border-emerald-100/30 px-8 py-10">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/50 border border-emerald-200">
                <FileText className="text-emerald-600" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-950 tracking-tight">
                  {config.title} <span className="text-emerald-600">Configuration</span>
                </h2>
                <p className="text-xs font-bold text-emerald-800/40 mt-1 uppercase tracking-widest">Target UUID: {id || 'SYSTEM_NEW_NODE'}</p>
              </div>
            </div>
          </div>
        )}

        <form className={!isModal ? "p-8 md:p-12 space-y-12" : "p-10 space-y-8"} onSubmit={handleSubmit}>
          <div className="space-y-10">
            {(() => {
              const sections = [];
              let currentSection = { title: null, fields: [] };

              config.fields.forEach((field) => {
                if (field.hidden) return;
                if (moduleKey === 'tows' && (field.name === 'driverShare' || field.name === 'companyShare')) {
                  if (values.paymentMethod !== 'Cash') return;
                }

                if (field.section !== currentSection.title) {
                  if (currentSection.fields.length > 0 || currentSection.title) {
                    sections.push(currentSection);
                  }
                  currentSection = { title: field.section, fields: [] };
                }
                currentSection.fields.push(field);
              });
              if (currentSection.fields.length > 0) sections.push(currentSection);

              return sections.map((section, sIdx) => (
                <div key={section.title || sIdx} className="space-y-6">
                  {section.title && (
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">{section.title}</span>
                      <div className="h-px flex-1 bg-emerald-50/50"></div>
                    </div>
                  )}
                  <div className={section.title === 'Financial Split' ? "flex items-start gap-4 -mx-6 bg-emerald-50/10 p-6 rounded-2xl border border-emerald-100/20" : `grid grid-cols-12 ${isModal ? 'gap-4' : 'gap-4 sm:gap-8 md:gap-10'}`}>
                    {section.fields.map((field) => {
                      const colSpan = section.title === 'Financial Split' ? "flex-1" : `col-span-${field.span || 4}`;
                      return (
                        <div key={field.name} className={`space-y-4 ${colSpan}`}>
                          <div className="flex items-center justify-between">
                            <label htmlFor={field.name} className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                              {field.label} {field.required !== false && <span className="text-red-500 ml-1 text-xs">*</span>}
                            </label>
                            {field.module && field.allowQuickAdd && (
                              <button
                                type="button"
                                className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-600 hover:text-emerald-700 transition-colors"
                                onClick={() => setQuickAdd({ fieldName: field.name, moduleKey: field.module })}
                              >
                                <Plus size={12} /> Fast Register
                              </button>
                            )}
                          </div>

                          {field.type === 'select' ? (
                            <select
                              id={field.name}
                              name={field.name}
                              disabled={isWorker && ((moduleKey === 'tows' && field.name === 'driver') || (moduleKey === 'expenses' && field.name === 'worker'))}
                              value={values[field.name]}
                              onChange={(event) => {
                                const val = event.target.value;
                                const fieldOptions = options[field.name] || [];
                                const selectedOpt = fieldOptions.find(o => o.value === val);

                                setFieldValue(field.name, val);

                                if (selectedOpt && selectedOpt._id) {
                                  const idFieldName = `${field.name}Id`;
                                  setFieldValue(idFieldName, selectedOpt._id);

                                  if (field.name === 'jobId') {
                                    setFieldValue('towId', selectedOpt._id);
                                  }
                                }
                              }}
                              className={`block w-full px-1 py-4 bg-transparent border-b-2 ${touched[field.name] && errors[field.name] ? 'border-red-300' : 'border-emerald-100'} focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer`}
                            >
                              <option value="">Select {field.label}</option>
                              {(options[field.name] || field.options || []).map((option, idx) => {
                                const label = typeof option === 'object' ? option.label : option;
                                const value = typeof option === 'object' ? option.value : option;
                                return (
                                  <option key={`${value}-${idx}`} value={value}>{label}</option>
                                );
                              })}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <div className="space-y-1">
                              <textarea
                                id={field.name}
                                name={field.name}
                                value={values[field.name]}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder={`Enter ${field.label.toLowerCase()} information...`}
                                readOnly={field.readOnly}
                                rows={4}
                                className={`block w-full px-1 py-4 bg-transparent border-b-2 ${touched[field.name] && errors[field.name] ? 'border-red-300' : 'border-emerald-100'} focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm placeholder:text-slate-400 resize-none`}
                              />
                              {touched[field.name] && errors[field.name] && (
                                <p className="text-[9px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors[field.name]}</p>
                              )}
                            </div>
                          ) : field.type === 'file' ? (
                            <div className="space-y-4">
                              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-emerald-100 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                                  <Plus className="w-8 h-8 mb-2 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
                                  <div>
                                    <p className="mb-1 text-xs text-slate-500"><span className="font-bold text-slate-700">Proof Image</span></p>
                                    <p className="text-[8px] text-slate-400 uppercase tracking-widest">Tap to Upload</p>
                                  </div>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                                  accept="image/*"
                                />
                              </label>
                              {values[field.name] && (
                                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-emerald-100 group shadow-lg">
                                  <img src={values[field.name]} alt="Preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => setFieldValue(field.name, '')}
                                      className="bg-emerald-600 text-white p-2 rounded-xl shadow-xl hover:bg-emerald-700 transition-colors"
                                    >
                                      <Plus size={16} className="rotate-45" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              {touched[field.name] && errors[field.name] && (
                                <p className="text-[9px] font-bold text-red-500 mt-1 ml-1 uppercase tracking-wider">{errors[field.name]}</p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <input
                                type={field.type}
                                id={field.name}
                                name={field.name}
                                value={values[field.name] || ''}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                readOnly={field.readOnly}
                                className={`block w-full px-1 py-4 bg-transparent border-b-2 ${touched[field.name] && errors[field.name] ? 'border-red-300' : 'border-emerald-100'} focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm placeholder:text-slate-400 ${field.readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                              />
                              {touched[field.name] && errors[field.name] && (
                                <p className="text-[9px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors[field.name]}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Form Actions */}
          <div className="pt-12 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-end gap-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-10 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-950 transition-all"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-600 px-12 py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-white shadow-xl shadow-emerald-900/20 transition-all hover:bg-emerald-700 active:scale-95 rounded-xl"
            >
              {mode === 'edit' ? 'Update System Node' : 'Register New Node'}
              <Save size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
