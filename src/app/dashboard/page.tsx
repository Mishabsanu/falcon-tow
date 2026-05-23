"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { apiService } from "@/services/apiService";
import {
   ArrowUpRight,
   Building2,
   Coins,
   Gauge,
   Layers,
   Percent,
   Receipt,
   Target,
   TrendingDown,
   TrendingUp,
   Users,
   Wallet,
   Zap
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function DashboardPage() {
   const [data, setData] = useState<any>(null);
   const [user, setUser] = useState<any>(null);
   const [range, setRange] = useState('monthly');
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const userData = localStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
   }, []);

   const fetchStats = useCallback(async () => {
      setLoading(true);
      try {
         const res = await apiService.getDashboardStats({ range });
         if (res.success) setData(res);
      } catch (err) {
         console.error("Dashboard sync error:", err);
      } finally {
         setLoading(false);
      }
   }, [range]);

   useEffect(() => {
    fetchStats();
    // Trigger Fleet Scout to check for expiring insurance/registration
    fetch('/api/cron/fleet-scout').catch(err => console.error('Fleet Scout failed:', err));
  }, [fetchStats]);

   if (loading && !data) return <LoadingSpinner label="Loading Dashboard..." />;
   if (!data) return null;

   const isWorker = user?.role === 'Worker';

   const stats = data.stats.map((s: any) => ({
     ...s,
     title: s.label,
     icon: s.icon === 'Wallet' ? Wallet : s.icon === 'Coins' ? Coins : s.icon === 'TrendingDown' ? TrendingDown : TrendingUp,
     bg: s.color.includes('rose') ? 'bg-rose-50' : 'bg-emerald-50',
     textColor: s.color.includes('rose') ? 'text-rose-600' : 'text-emerald-600'
   }));

   return (
     <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
       {/* COMMAND HEADER */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-1 md:px-0">
         <div className="space-y-2">
           <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">
             Hi, {user?.name || 'User'}
           </h1>
           <p className="text-slate-500 text-sm font-medium">View your business stats and latest activity.</p>
         </div>
         
         <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm self-start lg:self-auto">
            <div className="px-4 py-2 border-r border-emerald-50 hidden md:block">
               <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Filter</span>
            </div>
            <select 
              className="bg-transparent outline-none text-xs font-bold text-emerald-950 cursor-pointer px-4 py-2"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
            <button onClick={fetchStats} className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">
               <Zap size={18} fill="currentColor" />
            </button>
         </div>
       </div>

        {/* TOW REVENUE SPLIT */}
        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-emerald-950">Tow Revenue <span className="text-emerald-600">Split</span></h2>
              <div className="h-px flex-1 bg-emerald-100"></div>
           </div>
           <div className={`grid grid-cols-1 ${isWorker ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
              <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-xl"><Users size={24} className="text-emerald-600" /></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isWorker ? "My Share (10%)" : "Driver Share (10%)"}</span>
                 </div>
                 <p className="text-4xl font-bold text-emerald-950 tracking-tighter mb-2">QAR {data.financials?.driverShare?.toLocaleString() || 0}</p>
                 <p className="text-xs text-slate-500">{isWorker ? "Your accumulated earnings from completed tow jobs" : "Total accumulated driver payout from tow jobs"}</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-xl"><Building2 size={24} className="text-emerald-600" /></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isWorker ? "To Company (90%)" : "Company Share (90%)"}</span>
                 </div>
                 <p className="text-4xl font-bold text-emerald-950 tracking-tighter mb-2">QAR {data.financials?.companyShare?.toLocaleString() || 0}</p>
                 <p className="text-xs text-slate-500">{isWorker ? "Amount to be handed over to the company" : "Total company revenue from tow jobs"}</p>
              </div>
              {!isWorker && (
              <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-xl"><Percent size={24} className="text-emerald-600" /></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Company Commission</span>
                 </div>
                 <p className="text-4xl font-bold text-emerald-950 tracking-tighter mb-2">QAR {data.financials?.serviceCommission?.toLocaleString() || 0}</p>
                 <p className="text-xs text-slate-500">Total commissions and partner charges collected</p>
              </div>
              )}
           </div>
        </div>

       {/* PRIMARY STATS GRID */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {stats.map((stat: any, i: number) => (
           <div key={i} className="group bg-white p-8 border border-emerald-100/50 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden">
             <div className="flex justify-between items-start mb-8 relative z-10">
               <div className={`p-4 rounded-xl ${stat.bg} ${stat.textColor}`}>
                 <stat.icon size={24} />
               </div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                 {range} Filter Active
               </div>
             </div>
             <div className="space-y-1 relative z-10">
               <p className="text-emerald-800/40 text-[10px] font-bold uppercase tracking-[0.2em]">{stat.title}</p>
               <p className="text-3xl font-bold text-emerald-950 tracking-tight">{stat.value}</p>
             </div>
           </div>
         ))}
       </div>

       {/* TODAY'S PULSE SECTION */}
       <div className="space-y-6">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-emerald-950">Today&apos;s <span className="text-emerald-600">Pulse</span></h2>
             <div className="h-px flex-1 bg-emerald-100"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-emerald-950 p-8 rounded-2xl text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-white/10 rounded-xl"><Target size={24} className="text-emerald-400" /></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Jobs</span>
                </div>
                <p className="text-4xl font-bold tracking-tighter mb-2">{data.todayPulse?.towCount || 0}</p>
                <p className="text-xs text-emerald-100/60">{isWorker ? "Your Tow Jobs Dispatched Today" : "New Tow Jobs Dispatched Today"}</p>
             </div>
             <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-emerald-50 rounded-xl"><Coins size={24} className="text-emerald-600" /></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isWorker ? "Earnings" : "Revenue"}</span>
                </div>
                <p className="text-4xl font-bold text-emerald-950 tracking-tighter mb-2">
                   QAR {isWorker 
                      ? (data.todayPulse?.driverEarnings?.toLocaleString() || 0) 
                      : (data.todayPulse?.invoiceRevenue?.toLocaleString() || 0)}
                </p>
                <p className="text-xs text-slate-500">{isWorker ? "Your share from today's tow dispatches" : "Invoice Value Created Today"}</p>
             </div>
             <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-emerald-50 rounded-xl"><Gauge size={24} className="text-emerald-600" /></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Efficiency</span>
                </div>
                <p className="text-4xl font-bold text-emerald-950 tracking-tighter mb-2">{data.todayPulse?.efficiency}%</p>
                <p className="text-xs text-slate-500">Current performance rate</p>
             </div>
          </div>
       </div>

       {/* DUAL LOGS SECTION */}
       <div className={`grid grid-cols-1 ${isWorker ? '' : 'xl:grid-cols-2'} gap-10`}>
          {/* LATEST TOWS */}
          <div className="bg-white rounded-3xl border border-emerald-100/50 shadow-sm overflow-hidden flex flex-col">
             <div className="px-10 py-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><Layers size={24} /></div>
                   <div>
                      <h3 className="text-lg font-bold text-emerald-950">Latest Tows</h3>
                      <p className="text-[9px] text-emerald-800/40 font-bold uppercase tracking-[0.2em]">Live Dispatch Feed</p>
                   </div>
                </div>
                <Link href="/dashboard/tows" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><ArrowUpRight size={18} /></Link>
             </div>
             <div className="p-2">
                {data.recentTows?.map((tow: any) => (
                   <div key={tow._id} className="flex items-center justify-between p-6 hover:bg-emerald-50/50 rounded-2xl transition-all">
                      <div className="flex items-center gap-4">
                         <span className="text-xs font-bold text-slate-300">#{tow?.id || 'N/A'}</span>
                         <div>
                            <p className="text-sm font-bold text-emerald-950">{tow?.customer || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{tow?.vehicle || 'No Vehicle'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-emerald-950">QAR {tow?.amount || 0}</p>
                         <span className="text-[9px] font-bold uppercase text-emerald-600 tracking-widest">{tow?.status || 'Completed'}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* LATEST INVOICES */}
          {!isWorker && (
          <div className="bg-white rounded-3xl border border-emerald-100/50 shadow-sm overflow-hidden flex flex-col">
             <div className="px-10 py-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-950 rounded-xl flex items-center justify-center text-white"><Receipt size={24} /></div>
                   <div>
                      <h3 className="text-lg font-bold text-emerald-950">Latest Invoices</h3>
                      <p className="text-[9px] text-emerald-800/40 font-bold uppercase tracking-[0.2em]">Recent Billing Activity</p>
                   </div>
                </div>
                <Link href="/dashboard/invoices" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><ArrowUpRight size={18} /></Link>
             </div>
             <div className="p-2">
                {data.recentInvoices?.map((inv: any) => (
                   <div key={inv._id} className="flex items-center justify-between p-6 hover:bg-emerald-50/50 rounded-2xl transition-all">
                      <div className="flex items-center gap-4">
                         <span className="text-xs font-bold text-slate-300">#{inv?.id || 'N/A'}</span>
                         <div>
                            <p className="text-sm font-bold text-emerald-950">{inv?.customer || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-emerald-950">QAR {inv?.total || 0}</p>
                         <span className={`text-[9px] font-bold uppercase tracking-widest ${inv.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {inv?.status || 'Unpaid'}
                         </span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
          )}
       </div>

       {/* FINANCIAL SUMMARY PANEL */}
       {!isWorker && (
       <div className="bg-white p-10 rounded-3xl border border-emerald-100/50 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6">
             <div className="space-y-1">
                <h3 className="text-2xl font-bold text-emerald-950">Money Summary</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comparison of money in and money out.</p>
             </div>
             <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                   <span className="text-[9px] font-bold uppercase text-emerald-950 tracking-widest">Collected</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div>
                   <span className="text-[9px] font-bold uppercase text-emerald-950 tracking-widest">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
                   <span className="text-[9px] font-bold uppercase text-emerald-950 tracking-widest">Expenses</span>
                </div>
             </div>
          </div>

          {/* VISUAL CHART AND BALANCE ROW */}
          {(() => {
             const rev = data.financials?.revenue || 0;
             const exp = data.financials?.expenses || 0;
             const prof = data.financials?.profit || 0;
             const paid = data.financials?.paid || 0;
             const pend = data.financials?.pending || 0;
             
             const paidPct = rev > 0 ? Math.round((paid / rev) * 100) : 0;
             const pendPct = rev > 0 ? Math.round((pend / rev) * 100) : 0;
             const expPct = rev > 0 ? Math.round((exp / rev) * 100) : 0;

             return (
                <>
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 border-t border-b border-emerald-50 my-6">
                      {/* Left: Progress Bars (8 columns) */}
                      <div className="lg:col-span-8 space-y-8 flex flex-col justify-center">
                         {/* Money In Bar */}
                         <div className="space-y-3">
                            <div className="flex justify-between items-end">
                               <span className="text-xs font-black text-emerald-950 uppercase tracking-widest flex items-center gap-2">
                                  Money In (Revenue)
                               </span>
                               <span className="text-base font-black text-emerald-950">
                                  QAR {rev.toLocaleString()}
                               </span>
                            </div>
                            <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex relative shadow-inner">
                               {rev > 0 ? (
                                  <>
                                     <div 
                                        style={{ width: `${paidPct}%` }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700 relative group cursor-pointer"
                                        title={`Collected: QAR ${paid.toLocaleString()} (${paidPct}%)`}
                                     >
                                        {paidPct > 10 && (
                                           <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">
                                              {paidPct}% Collected
                                           </span>
                                        )}
                                     </div>
                                     <div 
                                        style={{ width: `${pendPct}%` }}
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 relative group cursor-pointer"
                                        title={`Pending: QAR ${pend.toLocaleString()} (${pendPct}%)`}
                                     >
                                        {pendPct > 10 && (
                                           <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-amber-950">
                                              {pendPct}% Pending
                                           </span>
                                        )}
                                     </div>
                                  </>
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                     No revenue recorded
                                  </div>
                                )}
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                               <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  Collected: QAR {paid.toLocaleString()} ({paidPct}%)
                               </span>
                               <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                  Pending: QAR {pend.toLocaleString()} ({pendPct}%)
                               </span>
                            </div>
                         </div>

                         {/* Money Out Bar */}
                         <div className="space-y-3">
                            <div className="flex justify-between items-end">
                               <span className="text-xs font-black text-emerald-950 uppercase tracking-widest flex items-center gap-2">
                                  Money Out (Expenses)
                               </span>
                               <span className="text-base font-black text-rose-600">
                                  QAR {exp.toLocaleString()}
                                </span>
                            </div>
                            <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative shadow-inner cursor-pointer">
                               {exp > 0 ? (
                                  <div 
                                     style={{ width: `${Math.min(100, expPct)}%` }}
                                     className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-700 flex items-center justify-end pr-4"
                                     title={`Expenses: QAR ${exp.toLocaleString()} (${expPct}% of Revenue)`}
                                  >
                                     {expPct > 12 && (
                                        <span className="text-[9px] font-black text-white">
                                           {expPct}% Ratio
                                        </span>
                                     )}
                                  </div>
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                     No expenses recorded
                                  </div>
                               )}
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                               <span>
                                  Expense Ratio: {expPct}% of revenue
                               </span>
                               {exp > rev && rev > 0 && (
                                  <span className="text-rose-600 font-extrabold animate-pulse uppercase tracking-wider text-[9px]">
                                     Warning: Expenses exceed revenue!
                                  </span>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Right: Net Balance Card (4 columns) */}
                      <div className="lg:col-span-4 bg-emerald-50/20 border border-emerald-100/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Net Operating Balance</span>
                         <div className="space-y-1">
                            <p className={`text-3xl font-black tracking-tight ${prof >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                               QAR {prof.toLocaleString()}
                            </p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                               prof >= 0 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                            }`}>
                               {prof >= 0 ? 'Net Surplus' : 'Net Deficit'}
                            </span>
                         </div>
                         <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            {prof >= 0 
                               ? "Operating at a surplus. Revenues exceed expenses in this period." 
                               : "Operating at a deficit. Expenses exceed revenues in this period."}
                         </p>
                      </div>
                   </div>

                   {/* Stats Grid Underneath */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pt-4">
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Net Profit</p>
                         <p className={`text-3xl font-bold tracking-tight ${prof >= 0 ? 'text-emerald-950' : 'text-rose-600'}`}>QAR {prof.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Collection Rate</p>
                         <p className="text-3xl font-bold text-emerald-600">{paidPct}%</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pending Settlements</p>
                         <p className="text-3xl font-bold text-amber-600">QAR {pend.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Expense Ratio</p>
                         <p className="text-3xl font-bold text-rose-600">{expPct}%</p>
                      </div>
                   </div>
                </>
             );
          })()}
       </div>
       )}
     </div>
   );
}
