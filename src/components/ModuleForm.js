'use client';
import { getModuleRecord, moduleData } from '@/lib/moduleData';
import { calculateSalarySettlement } from '@/modules/salaries/logic/salaryBusinessLogic';
import { calculateTowShares } from '@/modules/tows/logic/towBusinessLogic';
import { apiService } from '@/services/apiService';
import { useFormik } from 'formik';
import { Activity, ArrowLeft, Check, Eye, EyeOff, FileText, Lock, Plus, Save, Square } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import Modal from './Modal';

function ModuleFormContent({ moduleKey, mode, id, onSuccess, isModal = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
  const isWorker = currentUser?.role === 'Worker';
  const config = moduleData[moduleKey];
  const initialValues = useMemo(() => {
    const record = mode === 'edit' ? getModuleRecord(moduleKey, id) : {};
    const today = new Date().toISOString().split('T')[0];

    return Object.fromEntries(config.fields.map((field) => {
      let val = record?.[field.name] ?? field.defaultValue ?? '';
      
      // Format static dates for initial load
      if (field.type === 'date' && val) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) val = d.toISOString().split('T')[0];
      }

      // Security: Never populate password fields during edit
      if (mode === 'edit' && field.name === 'password') val = '';

      if (mode !== 'edit' && field.type === 'date' && !val) {
        val = today;
      }
      return [field.name, val];
    }));
  }, [config.fields, id, mode, moduleKey]);

  const [options, setOptions] = useState({});
  const [quickAdd, setQuickAdd] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [initialRecord, setInitialRecord] = useState(null);

  // Dynamic Validation Schema
  const validationSchema = useMemo(() => {
    return Yup.object().shape(
      Object.fromEntries(
        config.fields.map(field => {
          if (field.hidden) return [field.name, Yup.string().nullable()];

          let validator;
          if (field.type === 'number') {
            validator = Yup.number()
              .typeError(`${field.label} must be a number`)
              .transform((value, originalValue) => originalValue === "" ? null : value);
            
            if (field.required !== false) {
              validator = validator.required(`${field.label} is required`).min(0, `${field.label} cannot be negative`);
            } else {
              validator = validator.nullable().min(0, `${field.label} cannot be negative`);
            }
          } else if (field.type === 'email') {
            validator = Yup.string().email('Invalid email address');
            if (field.required !== false) validator = validator.required(`${field.label} is required`);
          } else if (field.type === 'tel') {
            validator = Yup.string()
              .matches(/^[0-9+\s-]{8,15}$/, 'Invalid phone number format');
            if (field.required !== false) validator = validator.required(`${field.label} is required`);
          } else {
            validator = Yup.string();
            if (field.required !== false) {
              validator = validator.required(`${field.label} is required`);
            }
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

        // 0. Clean module-based labels before storage (User Requirement: Separate Storage)
        config.fields.forEach(field => {
          if (field.module && initialPayload[field.name]) {
            // Use helper fields if they were populated by the onChange handler
            if (field.module === 'customers' && values.customerName) {
              initialPayload[field.name] = values.customerName;
            } else if (field.module === 'vehicles' && values.vehicleName) {
              initialPayload[field.name] = values.vehicleName;
            } else {
              // Fallback to option searching if helper fields are missing
              const val = initialPayload[field.name];
              const opt = (options[field.name] || []).find(o => o.value === val);
              if (opt && opt.raw) {
                initialPayload[field.name] = opt.raw.name || opt.raw.id || val;
              }
            }
          }
        });

        // 0.1 Handle Multi-Job Invoices
        if (moduleKey === 'invoices') {
          initialPayload.towDetails = selectedJobs.map(j => ({
            towId: j._id || j.towId,
            jobId: j.id || j.jobId,
            date: j.date,
            vehicleName: j.customerVehicle,
            vehiclePlate: j.customerPlate,
            route: j.route || `${j.pickup} to ${j.dropoff}`,
            amount: Number(j.amount || 0),
            serviceCommission: Number(j.serviceCommission || 0)
          }));
        }

        // 1. Create/Update record immediately
        const result = mode === 'edit'
          ? await apiService.updateRecord(moduleKey, id, initialPayload)
          : await apiService.createRecord(moduleKey, initialPayload);

        const recordId = result?._id || id;

        // 1.1 If creating an invoice, mark all selected tow jobs as 'Closed'
        if (moduleKey === 'invoices' && mode !== 'edit' && selectedJobs.length > 0) {
          try {
            await Promise.all(selectedJobs.map(job => 
              apiService.updateRecord('tows', job._id || job.towId, { status: 'Closed' })
            ));
            console.log(`[INVOICE_SYNC] ${selectedJobs.length} tows marked as Closed`);
          } catch (err) {
            console.error('[INVOICE_SYNC_FAILURE] Failed to close tow jobs:', err);
          }
        }

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

  const { values, setValues, setFieldValue, handleSubmit, touched, errors, setValues: setFormikValues } = formik;

  // Smart Reconciler: If the database has a "Name" but the dropdown needs an "ID",
  // we find the ID once options are loaded.
  useEffect(() => {
    let hasChanged = false;
    const nextValues = { ...values };

    config.fields.forEach(field => {
      if (field.module && values[field.name]) {
        const val = values[field.name];
        // If it's a 24-char Mongo ID, it's already reconciled
        if (/^[0-9a-fA-F]{24}$/.test(val)) return;

        const fieldOptions = options[field.name] || [];
        // Try to find an option whose raw name matches our stored value
        const match = fieldOptions.find(opt => 
          opt.raw?.name === val || opt.raw?.id === val || opt.label === val
        );

        if (match) {
          nextValues[field.name] = match.value;
          hasChanged = true;
          
          // Also sync secondary ID fields if they exist and are empty
          const idField = `${field.name}Id`;
          if (nextValues[idField] === undefined || nextValues[idField] === '') {
            nextValues[idField] = match._id;
          }
        }
      }
    });

    if (hasChanged) {
      setValues(nextValues);
    }
  }, [options, config.fields, moduleKey]);

  const fetchOptions = useCallback(async () => {
    // If we are creating an invoice, we want to know which tows are already invoiced
    let invoicedJobIds = [];
    let billableCustomerIds = [];

    if (moduleKey === 'invoices' && mode !== 'edit') {
      try {
        // 1. Get already invoiced jobs
        const invResult = await apiService.getRecords('invoices', { limit: 1000 });
        invoicedJobIds = (invResult.data || []).map(inv => {
          return inv.jobId?.split(' - ')[0].trim();
        }).filter(Boolean);

        // 2. Get all tows to find customers with outstanding work
        const towsResult = await apiService.getRecords('tows', { limit: 2000, status: 'Completed' });
        const billableTows = (towsResult.data || []).filter(tow => !invoicedJobIds.includes(tow.id));
        billableCustomerIds = [...new Set(billableTows.map(tow => tow.customerId || tow.customerData?._id).filter(Boolean))];
      } catch (error) {
        console.error('Failed to fetch filtering data for invoices:', error);
      }
    }

    const promises = config.fields.map(async (field) => {
      if (field.module) {
        try {
          const result = await apiService.getRecords(field.module, { 
            limit: 500, 
          });
          if (result.data) {
            let data = result.data;

            // Filter tows for invoices
            if (moduleKey === 'invoices' && field.module === 'tows' && mode !== 'edit') {
              data = data.filter(r => !invoicedJobIds.includes(r.id));
            }

            // NEW: Filter customers for invoices (Only show those with billable jobs)
            if (moduleKey === 'invoices' && field.module === 'customers' && mode !== 'edit') {
              data = data.filter(r => billableCustomerIds.includes(r._id));
            }

            // Filter users to only show Workers
            if (field.module === 'users') {
              data = data.filter(r => r.role === 'Worker');
            }

            setOptions((prev) => ({
              ...prev,
              [field.name]: data.map(r => {
                let label = '';
                if (field.module === 'vehicles') label = r.name;
                else if (field.module === 'users') label = r.name;
                else if (field.module === 'tows') label = `${r.id} - ${r.customer}`;
                else if (field.module === 'customers') label = r.name;
                else label = r.name || r.id || r.title;

                return { label, value: r._id || r.id, _id: r._id, raw: r };
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

  const [billableJobs, setBillableJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);

  useEffect(() => {
    if (moduleKey !== 'invoices' || !values.customerId) {
      setBillableJobs([]);
      // Only clear selected jobs if we are not in edit mode or if the customer actually changed
      if (mode !== 'edit' || (initialRecord && values.customerId !== initialRecord.customerId)) {
        setSelectedJobs([]);
      }
      return;
    }

    async function fetchJobs() {
      try {
        const result = await apiService.getRecords('tows', { 
          status: 'Completed',
          limit: 100,
          extraParams: {
            customerId: values.customerId
          }
        });
        const jobs = result.data || [];
        setBillableJobs(jobs);
        
        // Auto-select all jobs by default when fetching new billable jobs (except in edit mode initial load)
        if (mode !== 'edit' || (initialRecord && values.customerId !== initialRecord.customerId)) {
          setSelectedJobs(jobs);
        }
      } catch (error) {
        console.error('Failed to fetch billable jobs:', error);
      }
    }
    fetchJobs();
  }, [moduleKey, values.customerId, mode, initialRecord]);

  // Handle pre-selecting jobs when editing an invoice
  useEffect(() => {
    if (mode === 'edit' && initialRecord?.towDetails && moduleKey === 'invoices' && selectedJobs.length === 0) {
      setSelectedJobs(initialRecord.towDetails.map(j => ({ ...j, _id: j.towId, id: j.jobId })));
    }
  }, [mode, initialRecord, moduleKey, selectedJobs.length]);

  useEffect(() => {
    if (moduleKey !== 'invoices') return;
    const total = selectedJobs.reduce((sum, j) => sum + Number(j.amount || 0), 0);
    // Use non-strict inequality to handle string/number comparisons from Formik
    if (values.total != total) {
      setFieldValue('total', total);
    }
  }, [moduleKey, selectedJobs, values.total, setFieldValue]);

  const toggleJob = (job) => {
    setSelectedJobs(prev => {
      const exists = prev.find(j => (j._id || j.towId) === (job._id || job.towId));
      if (exists) return prev.filter(j => (j._id || j.towId) !== (job._id || job.towId));
      return [...prev, job];
    });
  };

  const hasPrefilled = useRef(false);

  // Worker Self-Selection for Tow Jobs and Expenses
  useEffect(() => {
    if ((mode === 'add' || mode === 'create') && (moduleKey === 'tows' || moduleKey === 'expenses')) {
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
        const result = await apiService.getNextId(moduleKey);
        if (result.success) {
          setFieldValue('id', result.nextId);
        }
      } catch (error) {
        console.error('Failed to generate sequential ID:', error);
      }
    };

    if (config.fields.some(f => f.name === 'id')) {
      generateNextId();
    }
  }, [moduleKey, mode, config.fields, setFieldValue]);

  useEffect(() => {
    if (mode !== 'edit') return;

    async function loadRecord() {
      const loadToast = toast.loading('Retrieving record from database...');
      try {
        const result = await apiService.getRecord(moduleKey, id);
        if (result) {
          setInitialRecord(result);
          formik.setValues((prev) => ({
            ...prev,
            ...Object.fromEntries(
              config.fields.map((field) => {
                let val = result[field.name] ?? '';
                // Robust Date Formatting for HTML5 Inputs
                if (field.type === 'date' && val) {
                  const d = new Date(val);
                  if (!isNaN(d.getTime())) {
                    val = d.toISOString().split('T')[0];
                  }
                }
                if (field.name === 'password') val = '';
                return [field.name, val];
              })
            )
          }));
          toast.success('Record synchronized.', { id: loadToast });
        } else {
          toast.error('Record not found in the system.', { id: loadToast });
        }
      } catch (error) {
        console.error('Failed to load record:', error);
        toast.error('Network error while retrieving record.', { id: loadToast });
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

    const shares = calculateTowShares(values.amount, values.serviceCommission);

    if (values.driverShare !== shares.driverShare || values.companyShare !== shares.companyShare) {
      setFieldValue('driverShare', shares.driverShare);
      setFieldValue('companyShare', shares.companyShare);
    }
  }, [moduleKey, values.amount, values.serviceCommission, setFieldValue, values.driverShare, values.companyShare]);

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

        // 2. Fetch completed tows for this worker/month/year
        const towsResult = await apiService.getRecords('tows', { limit: 1000 });
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = monthNames.indexOf(month);

        const workerTows = (towsResult.data || []).filter(tow => {
          const towWorkerId = extractId(tow.driver || '');
          if (towWorkerId !== workerId || tow.status !== 'Completed') return false;
          const towDate = new Date(tow.date);
          return towDate.getMonth() === monthIndex && towDate.getFullYear().toString() === year;
        });

        const cashCollected = workerTows.filter(t => t.paymentMethod === 'Cash').reduce((sum, tow) => sum + Number(tow.amount || 0), 0);
        const creditRevenue = workerTows.filter(t => t.paymentMethod !== 'Cash').reduce((sum, tow) => sum + Number(tow.amount || 0), 0);

        // 3. Fetch expenses for this worker/month/year
        const expensesResult = await apiService.getRecords('expenses', { limit: 1000 });
        const workerExpenses = (expensesResult.data || []).filter(exp => {
          const expWorkerId = extractId(exp.worker || '');
          if (expWorkerId !== workerId) return false;
          const expDate = new Date(exp.date);
          return expDate.getMonth() === monthIndex && expDate.getFullYear().toString() === year;
        });

        const totalExpenses = workerExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

        // 4. Calculate using the Official Formula
        const settlement = calculateSalarySettlement({
          cashAmount: cashCollected,
          creditAmount: creditRevenue,
          baseSalary: baseSalary,
          expenses: totalExpenses
        });

        setValues({
          ...values,
          baseSalary: settlement.baseSalary.toString(),
          cashCollected: settlement.cashAmount.toString(),
          creditRevenue: settlement.creditAmount.toString(),
          retention: settlement.workerCommission.toString(), // 10% Total Commission
          cashDeduction90: (settlement.cashAmount * 0.9).toString(),
          expenses: settlement.expenses.toString(),
          amount: settlement.netPayout.toString() // Final Payout
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
              Back to List
            </button>
            <h1 className="text-2xl sm:text-4xl font-black text-emerald-950 tracking-tight">
              {mode === 'edit' ? 'Edit ' : 'Create '}
              <span className="text-emerald-600">{config.title}</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {mode === 'edit' ? 'Update the information below.' : 'Fill in the details to create a new record.'}
            </p>
          </div>
        </div>
      )}

      <div className={`overflow-hidden ${!isModal ? 'border border-emerald-100/50 bg-white shadow-sm rounded-2xl' : ''}`}>
        {!isModal && (
          <div className="bg-emerald-50/20 border-b border-emerald-100/30 px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-emerald-100/50 border border-emerald-200">
                <FileText className="text-emerald-600" size={isModal ? 24 : 32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-950 tracking-tight">
                  {config.title} <span className="text-emerald-600">Form</span>
                </h2>
                <p className="text-xs font-bold text-emerald-800/40 mt-1 uppercase tracking-widest">ID: {id || 'New'}</p>
              </div>
            </div>
          </div>
        )}

        <form className={!isModal ? "p-6 md:p-12 space-y-12" : "p-6 sm:p-10 space-y-8"} onSubmit={handleSubmit}>
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
                  <div className={`grid grid-cols-12 ${isModal ? 'gap-4' : 'gap-4 sm:gap-8 md:gap-10'}`}>
                    {section.fields.map((field) => {
                      const spanMap = {
                        1: 'col-span-12 md:col-span-1',
                        2: 'col-span-12 md:col-span-2',
                        3: 'col-span-12 md:col-span-3',
                        4: 'col-span-12 md:col-span-4',
                        5: 'col-span-12 md:col-span-5',
                        6: 'col-span-12 md:col-span-6',
                        7: 'col-span-12 md:col-span-7',
                        8: 'col-span-12 md:col-span-8',
                        9: 'col-span-12 md:col-span-9',
                        10: 'col-span-12 md:col-span-10',
                        11: 'col-span-12 md:col-span-11',
                        12: 'col-span-12',
                      };
                      const colSpan = spanMap[field.span] || 'col-span-12 md:col-span-4';
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
                                <Plus size={12} /> Add New
                              </button>
                            )}
                          </div>

                          {field.type === 'select' ? (
                            <div className="space-y-1">
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

                                  // Store vehicle name and plate separately
                                  if (field.module === 'vehicles' && selectedOpt.raw) {
                                    setFieldValue('vehicleName', selectedOpt.raw.name);
                                    setFieldValue('vehiclePlate', selectedOpt.raw.plate);
                                    
                                    // Handle Tows/Quotes specific fields if they exist
                                    if (values.customerVehicle === undefined) {
                                       // Only auto-fill if the towed vehicle is empty (rare case)
                                    }
                                  }

                                  if (field.module === 'customers' && selectedOpt.raw) {
                                    const raw = selectedOpt.raw;
                                    // Handle multiple naming conventions for phone
                                    setFieldValue('customerMobile', raw.phone || '');
                                    setFieldValue('customerPhone', raw.phone || '');
                                    setFieldValue('customerAddress', raw.address || '');
                                    setFieldValue('customerName', raw.name || '');
                                  }

                                  if (field.name === 'jobId' || field.name === 'job') {
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
                              {touched[field.name] && errors[field.name] && (
                                <p className="text-[9px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors[field.name]}</p>
                              )}
                            </div>
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
                              <div className="relative group">
                                {field.type === 'password' && (
                                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                                    <Lock size={16} />
                                  </div>
                                )}
                                <input
                                  type={field.type === 'password' ? (showPasswords[field.name] ? 'text' : 'password') : field.type}
                                  id={field.name}
                                  name={field.name}
                                  value={values[field.name] || ''}
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  readOnly={field.readOnly}
                                  className={`block w-full ${field.type === 'password' ? 'pl-10 pr-10' : 'px-1'} py-4 bg-transparent border-b-2 ${touched[field.name] && errors[field.name] ? 'border-red-300' : 'border-emerald-100'} focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm placeholder:text-slate-400 ${field.readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                                />
                                {field.type === 'password' && (
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
                                  >
                                    {showPasswords[field.name] ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                )}
                              </div>
                              {touched[field.name] && errors[field.name] && (
                                <p className="text-[9px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors[field.name]}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Tow Selection Table for Invoices */}
                  {moduleKey === 'invoices' && section.title === 'Billing Entity' && values.customerId && (
                    <div className="col-span-12 mt-12 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Activity size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">Select Completed Tows</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choose jobs to include in this invoice</p>
                          </div>
                        </div>
                        {selectedJobs.length > 0 && (
                          <div className="px-4 py-2 bg-emerald-950 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                            {selectedJobs.length} Jobs Selected
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Header Row - Styled like section dividers */}
                        <div className="grid grid-cols-12 gap-4 px-2 py-4 border-b border-emerald-100/50 bg-slate-50/30 sticky top-0 z-10 backdrop-blur-sm">
                          <div className="col-span-1 text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Select</div>
                          <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Job ID</div>
                          <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Date</div>
                          <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Vehicle Name</div>
                          <div className="col-span-1 text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Plate No</div>
                          <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Route</div>
                          <div className="col-span-2 text-right text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Fee (QAR)</div>
                        </div>

                        {billableJobs.length > 0 ? (
                          billableJobs.map((job) => {
                            const isSelected = selectedJobs.some(j => (j._id || j.towId) === (job._id || job.towId));
                            return (
                              <div 
                                key={job._id} 
                                onClick={() => toggleJob(job)}
                                className={`grid grid-cols-12 gap-4 items-center px-2 py-5 cursor-pointer transition-all duration-300 border-b-2 ${isSelected ? 'border-emerald-600 bg-emerald-50/30' : 'border-emerald-50 hover:border-emerald-200'}`}
                              >
                                <div className="col-span-1">
                                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-emerald-600 text-white' : 'border-2 border-emerald-100 text-transparent'}`}>
                                    <Check size={12} strokeWidth={4} />
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-sm font-black text-emerald-950">#{job.id}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-xs font-bold text-slate-600">{new Date(job.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-xs font-black text-emerald-800 uppercase leading-none truncate">{job.customerPlate}</span>
                                </div>
                                <div className="col-span-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{job.customerVehicle}</span>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
                                    <span className="text-[10px] font-medium text-slate-500 truncate">{job.pickup}</span>
                                    <span className="text-[10px] text-emerald-200">→</span>
                                    <span className="text-[10px] font-medium text-slate-500 truncate">{job.dropoff}</span>
                                  </div>
                                </div>
                                <div className="col-span-2 text-right">
                                  <span className={`text-sm font-black transition-colors ${isSelected ? 'text-emerald-600' : 'text-emerald-950'}`}>
                                    {Number(job.amount || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center border-b-2 border-dashed border-emerald-100">
                            <Activity size={24} className="text-emerald-100 mb-2" />
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matching assets found</p>
                          </div>
                        )}
                      </div>
                      
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>

          {/* Form Actions */}
          <div className={`${isModal ? 'px-8 py-8 bg-emerald-50/30 -mx-6 sm:-mx-10 mt-10' : 'pt-12'} border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-end gap-6`}>
            {!isModal && (
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-10 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-950 transition-all"
              >
                Discard Changes
              </button>
            )}
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className={`${isModal ? 'w-full' : 'w-full sm:w-auto'} flex items-center justify-center gap-3 bg-emerald-600 px-12 py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-white shadow-xl shadow-emerald-900/20 transition-all hover:bg-emerald-700 active:scale-95 rounded-xl ${formik.isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {formik.isSubmitting ? (
                <>
                  <Activity size={16} className="animate-spin" />
                  <span>Syncing Node...</span>
                </>
              ) : (
                <>
                  {isModal ? 'Quick Register' : (mode === 'edit' ? 'Update System Node' : 'Register New Node')}
                  <Save size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ModuleForm(props) {
  return (
    <Suspense fallback={null}>
      <ModuleFormContent {...props} />
    </Suspense>
  );
}
