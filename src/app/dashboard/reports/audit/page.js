'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Truck, 
  Wallet, 
  User, 
  FileText,
  TrendingUp,
  AlertCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function AuditReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/audit?date=${date}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message || 'Audit synchronization failure');
      }
    } catch (error) {
      toast.error('Network failure during audit sync');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [date]);

  if (loading && !data) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
       <div className="garage-loader"></div>
       <p className="text-[10px] font-bold text-[#64748b]/40 uppercase tracking-widest">Compiling Audit Logs...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
             <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">Financial Audit</span>
          </div>
          <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">Cash & Expense <span className="text-emerald-600">Audit</span></h1>
          <p className="text-slate-500 text-sm font-medium">Daily breakdown of collections, shares, and operational cost telemetry.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-3 border border-emerald-100 rounded-xl shadow-sm">
           <Calendar size={18} className="text-emerald-600 ml-2" />
           <input 
             type="date" 
             value={date} 
             onChange={(e) => setDate(e.target.value)}
             className="border-none outline-none text-xs font-bold uppercase text-emerald-950 bg-transparent"
           />
        </div>
      </div>

      {!data ? (
        <div className="py-20 text-center bg-white border-2 border-dashed border-emerald-100 rounded-2xl">
           <AlertCircle className="mx-auto text-emerald-200 mb-4" size={48} />
           <p className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-[0.3em]">No audit telemetry for the selected period.</p>
        </div>
      ) : (
        <>
          {/* DAILY TOP-LEVEL METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-emerald-950 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
               <p className="text-emerald-400/60 text-[9px] font-bold uppercase tracking-widest">Total Services</p>
               <h3 className="text-2xl md:text-3xl font-bold mt-2 tracking-tighter">{data.summary.totalServices} <span className="text-xs text-white/30 font-normal">JOBS</span></h3>
               <Truck className="absolute -right-2 -bottom-2 text-white/5 group-hover:scale-110 transition-transform duration-700" size={100} />
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-emerald-100 shadow-sm">
               <p className="text-emerald-800/40 text-[9px] font-bold uppercase tracking-widest">Cash Collected</p>
               <h3 className="text-2xl md:text-3xl font-bold text-emerald-950 mt-2 tracking-tighter">QAR {data.summary.totalCash.toLocaleString()}</h3>
               <div className="h-1.5 w-full bg-emerald-50 rounded-full mt-4 md:mt-6 overflow-hidden">
                  <div className="h-full bg-emerald-600 w-[60%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-emerald-100 shadow-sm">
               <p className="text-emerald-800/40 text-[9px] font-bold uppercase tracking-widest">Personnel Share (10%)</p>
               <h3 className="text-2xl md:text-3xl font-bold text-emerald-600 mt-2 tracking-tighter">QAR {data.summary.driverShare.toLocaleString()}</h3>
               <p className="text-[8px] font-bold text-emerald-800/30 uppercase mt-2 tracking-widest">Collective Accrual</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-emerald-100 shadow-sm">
               <p className="text-emerald-800/40 text-[9px] font-bold uppercase tracking-widest">Enterprise Share (90%)</p>
               <h3 className="text-2xl md:text-3xl font-bold text-emerald-950 mt-2 tracking-tighter">QAR {data.summary.companyShare.toLocaleString()}</h3>
               <p className="text-[8px] font-bold text-emerald-600 uppercase mt-2 tracking-widest">Net Revenue Potential</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* SERVICES TABLE */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col">
               <div className="bg-emerald-50/30 px-8 py-6 border-b border-emerald-50 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-950">Service Log <span className="text-emerald-800/40 ml-2">[{date}]</span></h3>
                  <button className="text-[9px] font-bold uppercase text-emerald-600 flex items-center gap-2 hover:text-emerald-700 transition-colors">
                     Download CSV <Download size={12} />
                  </button>
               </div>
               <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-emerald-50 text-[9px] font-bold uppercase tracking-widest text-emerald-800/40">
                        <th className="px-8 py-5">Reference</th>
                        <th className="px-8 py-5">Operator</th>
                        <th className="px-8 py-5">Method</th>
                        <th className="px-8 py-5">Amount</th>
                        <th className="px-8 py-5 text-right">Logic (10/90)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50/50">
                      {data.services.map((s, i) => (
                        <tr key={i} className="hover:bg-emerald-50/20 transition-colors group">
                          <td className="px-8 py-5 text-[10px] font-bold text-emerald-950">#{s.id}</td>
                          <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">{s.worker}</td>
                          <td className="px-8 py-5">
                             <span className={`text-[8px] font-bold px-2.5 py-1 rounded-lg uppercase ${s.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                               {s.paymentMethod}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-[10px] font-bold text-emerald-950">QAR {s.amount}</td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex flex-col gap-1 items-end">
                                <span className="text-[10px] font-bold text-emerald-600">{s.driverShare}</span>
                                <span className="text-[10px] font-bold text-emerald-950 opacity-40">{s.companyShare}</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {data.services.length === 0 && (
                        <tr><td colSpan={5} className="p-20 text-center text-[10px] font-bold text-emerald-800/40 uppercase tracking-[0.3em]">No services synchronized for this date.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>

            {/* EXPENSES BREAKDOWN */}
            <div className="space-y-10">
               <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-rose-50/30 px-8 py-6 border-b border-rose-100/50">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600">Daily Outflow</h3>
                  </div>
                  <div className="p-8 flex-1">
                     <div className="flex items-center justify-between mb-10">
                        <div>
                           <p className="text-[9px] font-bold text-rose-800/40 uppercase tracking-widest">Total Expenses</p>
                           <h4 className="text-3xl font-bold text-rose-950 tracking-tighter">QAR {data.summary.totalExpenses.toLocaleString()}</h4>
                        </div>
                        <Wallet className="text-rose-500" size={40} strokeWidth={1.5} />
                     </div>
                     <div className="space-y-4">
                        {data.expenses.map((e, i) => (
                          <div key={i} className="flex items-center justify-between p-5 bg-rose-50/20 border border-rose-100 rounded-xl hover:bg-rose-50/40 transition-colors">
                             <div className="flex items-center gap-5">
                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-rose-500 border border-rose-100 shadow-sm">
                                   <FileText size={18} />
                                </div>
                                <div>
                                   <p className="text-[11px] font-bold text-rose-950 uppercase">{e.description}</p>
                                   <p className="text-[8px] font-bold text-rose-800/40 uppercase tracking-widest">{e.worker} | {e.vehicle}</p>
                                </div>
                             </div>
                             <span className="text-sm font-bold text-rose-950">QAR {e.amount}</span>
                          </div>
                        ))}
                        {data.expenses.length === 0 && (
                          <p className="text-center py-16 text-[10px] font-bold text-rose-800/40 uppercase tracking-[0.3em]">No expenses recorded today.</p>
                        )}
                     </div>
                  </div>
               </div>

               {/* ANALYTICS CARD */}
               <div className="bg-emerald-950 rounded-2xl p-10 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 transition-transform duration-700 group-hover:scale-150"></div>
                  <div className="relative z-10 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-600 rounded-lg">
                           <TrendingUp size={20} className="text-white" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-[0.3em]">Efficiency Index</h4>
                     </div>
                     <p className="text-sm font-medium text-emerald-100/60 leading-relaxed">
                        Daily cash collection contributes <span className="text-emerald-400 font-bold">{data.summary.totalServices > 0 ? ((data.services.filter(s => s.paymentMethod === 'Cash').length / data.summary.totalServices) * 100).toFixed(1) : 0}%</span> of total operational volume. 
                        Target enterprise remittance for today is <span className="text-emerald-400 font-bold underline decoration-emerald-400/30 underline-offset-4 tracking-tight">QAR {data.summary.companyShare}</span>.
                     </p>
                  </div>
                  <div className="absolute right-[-30px] bottom-[-30px] opacity-[0.03] rotate-12 transition-transform duration-700 group-hover:rotate-0">
                     <Wallet size={160} />
                  </div>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
