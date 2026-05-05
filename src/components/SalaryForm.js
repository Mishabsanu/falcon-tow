'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, X, Calculator, Info, RefreshCw } from 'lucide-react';
import Toast from './Toast';
import styles from './ModuleForm.js'; // Reusing styles from ModuleForm if possible or standard styles
import crudStyles from './CrudPage.module.css';

export default function SalaryForm({ mode, id }) {
   const router = useRouter();
   const [toast, setToast] = useState(null);
   const [workers, setWorkers] = useState([]);

   const [values, setValues] = useState({
      month: 'May',
      year: '2026',
      worker: '',
      baseSalary: 0,
      cashCollected: 0,
      retention: 0,
      cashDeduction90: 0,
      expenses: 0,
      amount: 0,
      status: 'Pending'
   });

   const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
   const years = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];

   useEffect(() => {
      async function loadInitialData() {
         // Only fetch workers, no more 5000+ records on mount!
         const wRes = await fetch('/api/workers?limit=1000');
         const wData = await wRes.json();
         setWorkers(wData.data || []);

         if (mode === 'edit' && id) {
            const sRes = await fetch(`/api/salaries/${id}`);
            const sData = await sRes.json();
            if (sData.data) setValues(sData.data);
         }
      }
      loadInitialData();
   }, [id, mode]);

   const [breakdown, setBreakdown] = useState({ tows: [], expenses: [] });

   const [calculating, setCalculating] = useState(false);

   const calculatePayroll = async () => {
      if (!values.worker) {
         showToast('Please select a worker first', 'error');
         return;
      }

      setCalculating(true);
      const monthIndex = months.indexOf(values.month);
      const yearNum = values.year;

      try {
         const res = await fetch(`/api/salaries/calculate-single?worker=${encodeURIComponent(values.worker)}&month=${monthIndex}&year=${yearNum}`);
         const result = await res.json();

         if (!result.success) throw new Error(result.error);

         const { tows, expenses, stats } = result.data;

         // Find worker object to get base salary
         const workerObj = workers.find(w => w.name === values.worker || w.id === values.worker);
         const baseSalary = Number(workerObj?.salary || 0);

         // Net Pay = (Base Salary) + (10% Commission on ALL services) + (Expenses) - (90% of Cash Collected)
         const netSalary = baseSalary + stats.totalCommission + stats.totalExpensesAmount - stats.cashDeduction90;

         setValues(prev => ({
            ...prev,
            baseSalary,
            cashCollected: stats.cashCollected,
            retention: stats.totalCommission,
            cashDeduction90: stats.cashDeduction90,
            expenses: stats.totalExpensesAmount,
            amount: netSalary
         }));

         setBreakdown({
            tows: tows.map(t => ({
               id: t.id,
               date: t.date,
               customer: t.customer,
               worker: t.driver,
               vehicle: t.vehicle,
               amount: t.amount,
               paymentMethod: t.paymentMethod,
               commission: (Number(t.amount) * 0.1).toFixed(2),
               deduction: t.paymentMethod === 'Cash' ? (Number(t.amount) * 0.9).toFixed(2) : '0.00'
            })),
            expenses: expenses.map(e => ({
               id: e.id,
               date: e.date,
               amount: e.amount,
               description: e.description,
               worker: e.worker,
               vehicle: e.vehicle
            }))
         });

         showToast('Calculations synchronized with server history.');
      } catch (err) {
         console.error(err);
         showToast('Failed to calculate payroll from server', 'error');
      } finally {
         setCalculating(false);
      }
   };

   const showToast = (message, type = 'success') => {
      setToast({ message, type });
      window.setTimeout(() => setToast(null), 2600);
   };

   const handleSubmit = async (event) => {
      event.preventDefault();
      const response = await fetch(mode === 'edit' ? `/api/salaries/${id}` : '/api/salaries', {
         method: mode === 'edit' ? 'PUT' : 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(values),
      });

      if (!response.ok) {
         showToast('Unable to save. Please try again.', 'error');
         return;
      }

      showToast(`Salary record ${mode === 'edit' ? 'updated' : 'created'} successfully.`);
      window.setTimeout(() => router.push('/dashboard/salaries'), 700);
   };

   return (
      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
         <Toast message={toast?.message} type={toast?.type} />

         {/* HEADER */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 md:px-0">
            <div className="space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">Payroll Terminal</span>
               </div>
               <h1 className="text-3xl md:text-4xl font-bold text-emerald-950 tracking-tight">
                  {mode === 'edit' ? 'Edit' : 'Record'} <span className="text-emerald-600">Payment</span>
               </h1>
               <p className="text-slate-500 text-xs md:text-sm font-medium">Process worker settlements with automatic commission and cash tracking telemetry.</p>
            </div>
         </div>

         <form className="bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden" onSubmit={handleSubmit}>
            <div className="bg-emerald-950 px-6 py-10 md:px-10 md:py-12 text-white flex flex-col sm:flex-row items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
               <div className="relative z-10 text-center sm:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">Settlement <span className="text-emerald-400">Workspace</span></h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-400/60 mt-2">Automatic Calculation Engine Active</p>
               </div>
               <Calculator className="text-white/5 absolute -right-4 -bottom-4 hidden sm:block" size={160} />
               <Calculator className="text-emerald-400 mt-6 sm:mt-0 relative z-10 opacity-20 block sm:hidden" size={48} />
            </div>

            <div className="p-6 md:p-12 space-y-10 md:space-y-12 bg-[#fcfcfd]">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                  <div className="space-y-3">
                     <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Select Worker</label>
                     <select
                        className="w-full border-b border-emerald-100 bg-transparent py-3 text-[11px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 cursor-pointer uppercase"
                        value={values.worker}
                        onChange={(e) => setValues({ ...values, worker: e.target.value })}
                        required
                     >
                        <option value="">Select Employee</option>
                        {workers.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                     </select>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Payroll Month</label>
                     <select
                        className="w-full border-b border-emerald-100 bg-transparent py-3 text-[11px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 cursor-pointer uppercase"
                        value={values.month}
                        onChange={(e) => setValues({ ...values, month: e.target.value })}
                     >
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Payroll Year</label>
                     <div className="flex items-center gap-3">
                        <select
                           className="flex-1 border-b border-emerald-100 bg-transparent py-3 text-[11px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 cursor-pointer uppercase"
                           value={values.year}
                           onChange={(e) => setValues({ ...values, year: e.target.value })}
                        >
                           {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button
                           type="button"
                           title="Sync from history"
                           onClick={calculatePayroll}
                           disabled={calculating}
                           className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                        >
                           <RefreshCw size={14} className={calculating ? 'animate-spin' : ''} />
                        </button>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Base Salary (QAR)</label>
                     <input
                        type="number"
                        className="w-full border-b border-emerald-50 bg-emerald-50/20 py-3 text-[11px] font-bold text-emerald-950 outline-none transition-all"
                        value={values.baseSalary}
                        readOnly
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-rose-600/60">Cash Collected (QAR)</label>
                     <input
                        type="number"
                        className="w-full border-b border-rose-100 bg-rose-50/20 py-3 text-[11px] font-bold text-rose-600 outline-none transition-all"
                        value={values.cashCollected}
                        readOnly
                     />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex-1 space-y-3">
                       <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600">10% Split</label>
                       <input 
                          type="number" 
                          className="w-full border-b border-emerald-100 bg-emerald-50/20 py-3 text-[11px] font-bold text-emerald-600 outline-none transition-all"
                          value={values.retention} 
                          readOnly
                       />
                    </div>
                    <div className="flex-1 space-y-3">
                       <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-rose-500">90% Split</label>
                       <input 
                          type="number" 
                          className="w-full border-b border-rose-100 bg-rose-50/20 py-3 text-[11px] font-bold text-rose-500 outline-none transition-all"
                          value={values.cashDeduction90} 
                          readOnly
                       />
                    </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Expense Reimbursement</label>
                     <input
                        type="number"
                        className="w-full border-b border-emerald-50 bg-emerald-50/20 py-3 text-[11px] font-bold text-emerald-950 outline-none transition-all"
                        value={values.expenses}
                        readOnly
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Final Net Payable (QAR)</label>
                     <input
                        type="number"
                        className="w-full border-b border-emerald-950 bg-emerald-50/20 py-3 text-[16px] md:text-[20px] font-bold text-emerald-950 outline-none transition-all"
                        value={values.amount}
                        readOnly
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Payment Status</label>
                     <select
                        className="w-full border-b border-emerald-100 bg-transparent py-3 text-[11px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 cursor-pointer uppercase"
                        value={values.status}
                        onChange={(e) => setValues({ ...values, status: e.target.value })}
                     >
                        <option>Paid</option>
                        <option>Pending</option>
                     </select>
                  </div>
               </div>

                {/* CALCULATION BREAKDOWN SECTION */}
                {(breakdown.tows.length > 0 || breakdown.expenses.length > 0) && (
                   <div className="mt-8 md:mt-16 p-5 md:p-10 bg-white rounded-2xl border-2 border-dashed border-emerald-100 shadow-inner overflow-hidden">
                      <div className="flex items-center gap-4 mb-8 md:mb-10">
                         <div className="p-3 bg-emerald-950 rounded-xl shadow-lg">
                            <Calculator size={20} className="text-emerald-400" />
                         </div>
                         <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-950">Calculation Ledger</h3>
                            <p className="text-[9px] font-bold text-emerald-800/40 uppercase tracking-widest">Audit trail for current settlement period</p>
                         </div>
                      </div>

                      {breakdown.tows.length > 0 && (
                         <div className="mb-10 md:mb-12 overflow-hidden rounded-xl border border-emerald-100">
                            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                               <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-950">Service Commissions & Cash Logic</h4>
                            </div>
                            <div className="overflow-x-auto">
                               <table className="w-full text-left">
                                  <thead>
                                     <tr className="bg-white border-b border-emerald-100 text-emerald-800/40">
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest">Job Ref / Date</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest">Customer / Vehicle</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest">Method</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-right">Service (QAR)</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-right text-emerald-600">Comm (10%)</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-right text-rose-500">Ded (90%)</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-emerald-50">
                                     {breakdown.tows.map(t => (
                                        <tr key={t.id} className="hover:bg-emerald-50/30 transition-colors">
                                           <td className="px-6 py-4">
                                              <div className="flex flex-col">
                                                 <span className="text-[10px] font-bold text-emerald-950">#{t.id}</span>
                                                 <span className="text-[8px] font-bold text-slate-400">{t.date}</span>
                                              </div>
                                           </td>
                                           <td className="px-6 py-4">
                                              <div className="flex flex-col">
                                                 <span className="text-[10px] font-bold text-emerald-950 uppercase truncate max-w-[120px]">{t.customer || 'No Customer'}</span>
                                                 <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">{t.vehicle || 'No Vehicle'}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter border-l border-emerald-100 pl-2">{t.worker || 'No Worker'}</span>
                                                 </div>
                                              </div>
                                           </td>
                                           <td className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400">{t.paymentMethod}</td>
                                           <td className="px-6 py-4 text-[11px] font-bold text-right text-emerald-950">{Number(t.amount).toLocaleString()}</td>
                                           <td className="px-6 py-4 text-[11px] font-bold text-right text-emerald-600">{t.commission}</td>
                                           <td className="px-6 py-4 text-[11px] font-bold text-right text-rose-500">
                                              {t.paymentMethod === 'Cash' ? t.deduction : '—'}
                                           </td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      )}

                      {breakdown.expenses.length > 0 && (
                         <div className="overflow-hidden rounded-xl border border-emerald-100">
                            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                               <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Reimbursable Business Expenses</h4>
                            </div>
                            <div className="overflow-x-auto">
                               <table className="w-full text-left">
                                  <thead>
                                     <tr className="bg-white border-b border-emerald-100 text-emerald-800/40">
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest">Exp Ref / Date</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest">Vehicle / Worker</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-right text-emerald-600">Credit (QAR)</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-emerald-50">
                                     {breakdown.expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-emerald-50/30 transition-colors">
                                           <td className="px-6 py-4">
                                              <div className="flex flex-col">
                                                 <span className="text-[10px] font-bold text-emerald-950">#{e.id}</span>
                                                 <span className="text-[8px] font-bold text-slate-400">{e.date}</span>
                                              </div>
                                           </td>
                                           <td className="px-6 py-4">
                                              <div className="flex flex-col">
                                                 <span className="text-[10px] font-bold text-emerald-950 uppercase">{e.vehicle || 'No Vehicle'}</span>
                                                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{e.worker || 'No Worker'}</span>
                                              </div>
                                           </td>
                                           <td className="px-6 py-4 text-[11px] font-medium text-emerald-950">{e.description}</td>
                                           <td className="px-6 py-4 text-[11px] font-bold text-right text-emerald-600">{Number(e.amount).toLocaleString()}</td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      )}
                   </div>
                )}

               <div className="p-6 md:p-12 bg-emerald-50/20 border-t border-emerald-100 flex flex-col sm:flex-row justify-end gap-4">
                  <Link
                     href="/dashboard/salaries"
                     className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-emerald-950 text-emerald-950 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-950 hover:text-white transition-all shadow-sm"
                  >
                     <X size={14} />
                     <span>Discard Settlement</span>
                  </Link>
                  <button
                     type="submit"
                     className="flex items-center justify-center gap-2 px-10 py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20"
                  >
                     <Save size={14} />
                     <span>{mode === 'edit' ? 'Save Changes' : 'Finalize Payment'}</span>
                  </button>
               </div>
            </div>
         </form>
      </div>
   );
}
