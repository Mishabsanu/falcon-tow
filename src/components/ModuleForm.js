'use client';
import { getModuleRecord, moduleData } from '@/lib/moduleData';
import { apiService } from '@/services/apiService';
import { Activity, ArrowLeft, FileText, Plus, Save, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { toast } from 'sonner';

export default function ModuleForm({ moduleKey, mode, id, onSuccess }) {
  const router = useRouter();
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
  const [values, setValues] = useState(initialValues);

  const [options, setOptions] = useState({});
  const [quickAdd, setQuickAdd] = useState(null);

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
                if (field.module === 'vehicles') label = `${r.name} (${r.plate})`;
                else if (field.module === 'users') label = `${r.name} (${r.id || r.username})`;
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

  useEffect(() => {
    if (mode !== 'edit') return;

    async function loadRecord() {
      try {
        const result = await apiService.getRecord(moduleKey, id);
        if (result) {
          setValues(
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      showToast('Please complete all required fields.', 'error');
      return;
    }

    try {
      const result = mode === 'edit'
        ? await apiService.updateRecord(moduleKey, id, values)
        : await apiService.createRecord(moduleKey, values);

      showToast(`${config.title} ${mode === 'edit' ? 'updated' : 'created'} successfully.`);

      if (onSuccess) {
        onSuccess(result);
      } else {
        window.setTimeout(() => router.push(config.listPath), 700);
      }
    } catch (error) {
      showToast('Unable to save. Please try again.', 'error');
    }
  };

  const handleFileChange = (fieldName, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setValues(prev => ({ ...prev, [fieldName]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleQuickAddSuccess = (newRecord) => {
    const fieldName = quickAdd.fieldName;
    const displayName = newRecord.name || newRecord.id || newRecord.title;

    // Refresh options and select new record
    fetchOptions().then(() => {
      setValues(prev => ({ ...prev, [fieldName]: displayName }));
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
        setValues(prev => ({
          ...prev,
          driverShare,
          companyShare
        }));
      }
    } else if (values.driverShare !== '0' || values.companyShare !== '0') {
      // For non-cash or zero amount, shares are zero or handle as per policy
      // Usually only cash has this split handled this way
      setValues(prev => ({
        ...prev,
        driverShare: '0',
        companyShare: '0'
      }));
    }
  }, [moduleKey, values.amount, values.paymentMethod, values.driverShare, values.companyShare]);

  useEffect(() => {
    if (moduleKey !== 'invoices') return;

    if (!values.jobId) {
      setValues(prev => ({
        ...prev,
        customer: '',
        worker: '',
        vehicle: '',
        total: ''
      }));
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
          setValues(prev => ({
            ...prev,
            towId: result._id,
            customer: result.customer,
            customerId: result.customerId,
            worker: result.driver,
            workerId: result.driverId,
            vehicle: result.vehicle,
            vehicleId: result.vehicleId,
            type: result.paymentMethod || 'Credit',
            total: result.amount
          }));
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
      setValues(prev => ({ ...prev, status: newStatus }));
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

        setValues(prev => ({
          ...prev,
          baseSalary: baseSalary.toString(),
          cashCollected: cashCollected.toString(),
          retention: driverCommission.toString(),
          expenses: totalExpenses.toString(),
          amount: netAmount.toString()
        }));

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
          setValues(prev => ({ ...prev, jobId: jobOption.value, towId: jobOption._id }));
        }
      }
    }
  }, [options.jobId, values.jobId]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
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
          />
        </Modal>
      )}

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-10">
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            Return to Node Directory
          </button>
          <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">
            {mode === 'edit' ? 'Synchronize ' : 'Initialize '}
            <span className="text-emerald-600">{config.title}</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {mode === 'edit' ? 'Updating existing parameters in the global ledger.' : 'Establishing a new data record in the system architecture.'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden border border-emerald-100/50 bg-white shadow-sm rounded-2xl">
        <div className="bg-emerald-50/20 border-b border-emerald-100/30 px-8 py-10">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/50 border border-emerald-200">
              <FileText className="text-emerald-600" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-950 tracking-tight">{config.title} Configuration</h2>
              <p className="text-xs font-bold text-emerald-800/40 mt-1 uppercase tracking-widest">Target UUID: {id || 'SYSTEM_NEW_NODE'}</p>
            </div>
          </div>
        </div>

        <form className="p-8 md:p-12 space-y-12" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {config.fields.map((field, index) => {
              const showSection = field.section && (index === 0 || config.fields[index - 1].section !== field.section);

              return (
                <div key={field.name} style={{ display: field.hidden ? 'none' : 'contents' }}>
                  {showSection && (
                    <div className="col-span-1 md:col-span-2 flex items-center gap-4 mt-6 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">{field.section}</span>
                      <div className="h-px flex-1 bg-emerald-50/50"></div>
                    </div>
                  )}

                  <div className={`space-y-4 ${field.type === 'textarea' || field.type === 'file' ? 'col-span-1 md:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between">
                      <label htmlFor={field.name} className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                        {field.label}
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
                        value={values[field.name]}
                        onChange={(event) => {
                          const val = event.target.value;
                          const fieldOptions = options[field.name] || [];
                          const selectedOpt = fieldOptions.find(o => o.value === val);

                          setValues((current) => {
                            const next = { ...current, [field.name]: val };
                            if (selectedOpt && selectedOpt._id) {
                              const idFieldName = `${field.name}Id`;
                              if (idFieldName in next) {
                                next[idFieldName] = selectedOpt._id;
                              }
                              if (field.name === 'jobId') {
                                next.towId = selectedOpt._id;
                              }
                            }
                            return next;
                          });
                        }}
                        required={field.required !== false}
                        className="block w-full px-5 py-4 bg-slate-50 border border-emerald-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-semibold text-sm appearance-none cursor-pointer"
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
                      <textarea
                        id={field.name}
                        value={values[field.name]}
                        onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()} information...`}
                        required={field.required !== false}
                        readOnly={field.readOnly}
                        rows={4}
                        className="block w-full px-5 py-4 bg-slate-50 border border-emerald-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-semibold text-sm placeholder:text-slate-400 resize-none"
                      />
                    ) : field.type === 'file' ? (
                      <div className="space-y-6">
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-emerald-100 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Plus className="w-10 h-10 mb-4 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
                            <p className="mb-2 text-sm text-slate-500"><span className="font-bold text-slate-700">Upload Visual Data</span> or Drag-and-Drop</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Supported formats: JPG, PNG, SVG</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                            accept="image/*"
                          />
                        </label>
                        {values[field.name] && (
                          <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-emerald-100 group shadow-2xl">
                            <img src={values[field.name]} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setValues(prev => ({ ...prev, [field.name]: '' }))}
                                className="bg-emerald-600 text-white p-3 rounded-xl shadow-xl hover:bg-emerald-700 transition-colors"
                              >
                                <Plus size={20} className="rotate-45" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        id={field.name}
                        value={values[field.name] || ''}
                        onChange={(e) => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        readOnly={field.readOnly}
                        className={`block w-full px-5 py-4 bg-slate-50 border border-emerald-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-semibold text-sm placeholder:text-slate-400 shadow-sm ${field.readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        required={field.required !== false}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
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
