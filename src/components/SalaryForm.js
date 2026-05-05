'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calculator, FileText, RefreshCw, Save, DollarSign } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';

export default function SalaryForm({ mode, id }) {
  const router = useRouter();
  const [workers, setWorkers] = useState([]);
  const [calculating, setCalculating] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];

  const validationSchema = Yup.object().shape({
    worker: Yup.string().required('Employee is required'),
    month: Yup.string().required('Month is required'),
    year: Yup.string().required('Year is required'),
    status: Yup.string().required('Status is required'),
  });

  const formik = useFormik({
    initialValues: {
      month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date()),
      year: new Date().getFullYear().toString(),
      worker: '',
      workerId: '',
      baseSalary: '0',
      cashCollected: '0',
      retention: '0',
      cashDeduction90: '0',
      expenses: '0',
      amount: '0',
      status: 'Pending'
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = { ...values };
        const result = mode === 'edit'
          ? await apiService.updateRecord('salaries', id, payload)
          : await apiService.createRecord('salaries', payload);

        toast.success(`Salary settlement ${mode === 'edit' ? 'updated' : 'finalized'} successfully.`);
        router.push('/dashboard/salaries');
      } catch (error) {
        toast.error(`Submission failed: ${error.message}`);
      }
    }
  });

  const { values, setValues, setFieldValue, handleSubmit, touched, errors } = formik;

  useEffect(() => {
    async function loadData() {
      try {
        const wRes = await fetch('/api/users?role=Worker&limit=1000');
        const wData = await wRes.json();
        setWorkers(wData.data || []);

        if (mode === 'edit' && id) {
          const sRes = await fetch(`/api/salaries/${id}`);
          const sData = await sRes.json();
          if (sData.data) {
             setValues(sData.data);
          }
        }
      } catch (error) {
        console.error('Initial load failed:', error);
      }
    }
    loadData();
  }, [id, mode, setValues]);

  const calculatePayroll = async () => {
    if (!values.worker) {
      toast.error('Please identify an employee first');
      return;
    }

    setCalculating(true);
    const monthIndex = months.indexOf(values.month);
    const yearNum = values.year;

    try {
      const res = await fetch(`/api/salaries/calculate-single?worker=${encodeURIComponent(values.worker)}&month=${monthIndex}&year=${yearNum}`);
      const result = await res.json();

      if (!result.success) throw new Error(result.error);

      const { stats } = result.data;
      const workerObj = workers.find(w => w.name === values.worker || w.id === values.worker);
      const baseSalary = Number(workerObj?.salary || 0);

      const netSalary = baseSalary + stats.totalCommission + stats.totalExpensesAmount - stats.cashDeduction90;

      setValues({
        ...values,
        baseSalary: baseSalary.toString(),
        cashCollected: stats.cashCollected.toString(),
        retention: stats.totalCommission.toString(),
        cashDeduction90: stats.cashDeduction90.toString(),
        expenses: stats.totalExpensesAmount.toString(),
        amount: netSalary.toString()
      });

      toast.success('Calculations synchronized with history.');
    } catch (err) {
      toast.error('Sync failed: Calculation engine error');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-10 px-1">
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            Return to Ledger
          </button>
          <h1 className="text-4xl font-black text-emerald-950 tracking-tight">
            {mode === 'edit' ? 'Update ' : 'Initialize '}
            <span className="text-emerald-600">Settlement</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
             Establishing a new payroll record in the automated settlement system.
          </p>
        </div>
      </div>

      <div className="overflow-hidden border border-emerald-100/50 bg-white shadow-sm rounded-2xl">
        <div className="bg-emerald-50/20 border-b border-emerald-100/30 px-8 py-10">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/50 border border-emerald-200">
              <Calculator className="text-emerald-600" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-950 tracking-tight">
                Payroll <span className="text-emerald-600">Configuration</span>
              </h2>
              <p className="text-xs font-bold text-emerald-800/40 mt-1 uppercase tracking-widest">
                 System Ref: {id || 'SYSTEM_NEW_ENTRY'}
              </p>
            </div>
          </div>
        </div>

        <form className="p-8 md:p-12 space-y-12" onSubmit={handleSubmit}>
          {/* Section: Employee & Period */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Employee Assignment</span>
              <div className="h-px flex-1 bg-emerald-50/50"></div>
            </div>

            <div className="grid grid-cols-12 gap-8 md:gap-10">
              <div className="col-span-12 md:col-span-4 space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Target Worker <span className="text-red-500 ml-1 text-xs">*</span>
                </label>
                <select
                  name="worker"
                  value={values.worker}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFieldValue('worker', val);
                    const workerObj = workers.find(w => w.name === val);
                    if (workerObj) setFieldValue('workerId', workerObj._id);
                  }}
                  onBlur={formik.handleBlur}
                  className={`block w-full px-1 py-4 bg-transparent border-b-2 ${touched.worker && errors.worker ? 'border-red-300' : 'border-emerald-100'} focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer`}
                >
                  <option value="">Select Employee</option>
                  {workers.map(w => (
                     <option key={w.id || w._id} value={w.name}>{w.name} ({w.id})</option>
                  ))}
                </select>
                {touched.worker && errors.worker && (
                  <p className="text-[9px] font-bold text-red-500 ml-1 uppercase tracking-wider">{errors.worker}</p>
                )}
              </div>

              <div className="col-span-12 md:col-span-4 space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Payroll Month <span className="text-red-500 ml-1 text-xs">*</span>
                </label>
                <select
                  name="month"
                  value={values.month}
                  onChange={formik.handleChange}
                  className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer"
                >
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="col-span-12 md:col-span-4 space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Fiscal Year <span className="text-red-500 ml-1 text-xs">*</span>
                </label>
                <div className="flex gap-4">
                   <select
                     name="year"
                     value={values.year}
                     onChange={formik.handleChange}
                     className="flex-1 px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer"
                   >
                     {years.map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                   <button
                     type="button"
                     onClick={calculatePayroll}
                     disabled={calculating}
                     className="px-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                     title="Sync from history"
                   >
                     <RefreshCw size={18} className={calculating ? 'animate-spin' : ''} />
                   </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Financial Ledger */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Financial Ledger</span>
              <div className="h-px flex-1 bg-emerald-50/50"></div>
            </div>

            <div className="grid grid-cols-12 gap-8 md:gap-10">
               <div className="col-span-12 md:col-span-3 space-y-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Base Salary</label>
                  <input
                    type="text"
                    value={values.baseSalary}
                    readOnly
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-50 opacity-50 cursor-not-allowed outline-none text-emerald-950 font-bold text-sm"
                  />
               </div>
               <div className="col-span-12 md:col-span-3 space-y-4">
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest ml-1">Commission (10%)</label>
                  <input
                    type="text"
                    value={values.retention}
                    readOnly
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 opacity-80 cursor-not-allowed outline-none text-emerald-600 font-bold text-sm"
                  />
               </div>
               <div className="col-span-12 md:col-span-3 space-y-4">
                  <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">90% Ded (Cash)</label>
                  <input
                    type="text"
                    value={values.cashDeduction90}
                    readOnly
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-rose-100 opacity-80 cursor-not-allowed outline-none text-rose-500 font-bold text-sm"
                  />
               </div>
               <div className="col-span-12 md:col-span-3 space-y-4">
                  <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Expenses</label>
                  <input
                    type="text"
                    value={values.expenses}
                    readOnly
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-rose-50 opacity-80 cursor-not-allowed outline-none text-rose-400 font-bold text-sm"
                  />
               </div>
            </div>
          </div>

          {/* Section: Final Settlement */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Settlement Verification</span>
              <div className="h-px flex-1 bg-emerald-50/50"></div>
            </div>

            <div className="grid grid-cols-12 gap-8 md:gap-10">
               <div className="col-span-12 md:col-span-6 space-y-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Final Net Payable (QAR)</label>
                  <input
                    type="text"
                    value={Number(values.amount).toLocaleString()}
                    readOnly
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-950 outline-none text-emerald-950 font-black text-2xl"
                  />
               </div>
               <div className="col-span-12 md:col-span-6 space-y-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Status</label>
                  <select
                    name="status"
                    value={values.status}
                    onChange={formik.handleChange}
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
               </div>
            </div>
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
              {mode === 'edit' ? 'Update Settlement' : 'Finalize Settlement'}
              <Save size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
