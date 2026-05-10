"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { apiService } from "@/services/apiService";
import {
   ArrowUpRight,
   Coins,
   Gauge,
   Layers,
   Receipt,
   Target,
   TrendingDown,
   TrendingUp,
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
             Dashboard
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
       {!isWorker && (
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
                <p className="text-xs text-emerald-100/60">New Tow Jobs Dispatched Today</p>
             </div>
             <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-emerald-50 rounded-xl"><Coins size={24} className="text-emerald-600" /></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Revenue</span>
                </div>
                <p className="text-4xl font-bold text-emerald-950 tracking-tighter mb-2">QAR {data.todayPulse?.invoiceRevenue?.toLocaleString() || 0}</p>
                <p className="text-xs text-slate-500">Invoice Value Created Today</p>
             </div>
             <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-emerald-50 rounded-xl"><Gauge size={24} className="text-emerald-600" /></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Efficiency</span>
                </div>
                <p className="text-4xl font-bold text-emerald-950 tracking-tighter mb-2">{data.todayPulse?.efficiency}%</p>
                <p className="text-xs text-slate-500">Current performance rate</p>
             </div>
          </div>
       </div>
       )}

       {/* DUAL LOGS SECTION */}
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
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
       </div>

       {/* FINANCIAL SUMMARY PANEL */}
       {!isWorker && (
       <div className="bg-white p-10 rounded-3xl border border-emerald-100/50 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
             <div className="space-y-1">
                <h3 className="text-2xl font-bold text-emerald-950">Money Summary</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comparison of money in and money out.</p>
             </div>
             <div className="flex items-center gap-10">
                <div className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                   <span className="text-[10px] font-bold uppercase text-emerald-950 tracking-widest">Revenue</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-rose-600 rounded-full"></div>
                   <span className="text-[10px] font-bold uppercase text-emerald-950 tracking-widest">Expenses</span>
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 border-t border-emerald-50 pt-10">
             <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Net Profit</p>
                <p className="text-3xl font-bold text-emerald-950">QAR {data.financials?.profit?.toLocaleString() || 0}</p>
             </div>
             <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Collection Rate</p>
                <p className="text-3xl font-bold text-emerald-600">
                   {data.financials?.revenue ? Math.round((data.financials.paid / data.financials.revenue) * 100) : 0}%
                </p>
             </div>
             <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pending Settlements</p>
                <p className="text-3xl font-bold text-amber-600">QAR {data.financials?.pending?.toLocaleString() || 0}</p>
             </div>
             <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Expense Ratio</p>
                <p className="text-3xl font-bold text-rose-600">
                   {data.financials?.revenue ? Math.round((data.financials.expenses / data.financials.revenue) * 100) : 0}%
                </p>
             </div>
          </div>
       </div>
       )}
     </div>
   );
}
