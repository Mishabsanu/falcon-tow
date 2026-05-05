"use client";

import { useEffect, useState } from "react";
import {
   TrendingUp,
   TrendingDown,
   Users,
   ClipboardList,
   Wallet,
   AlertTriangle,
   ArrowRight,
   Zap,
   BarChart3,
   Activity,
   Gauge,
   Clock,
   Layers,
   ArrowUpRight,
   ShieldCheck,
   ChevronRight,
   Box,
   Target,
   Coins
} from "lucide-react";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { apiService } from "@/services/apiService";

export default function DashboardPage() {
   const [data, setData] = useState<any>(null);
   const [user, setUser] = useState<any>(null);

   useEffect(() => {
      const userData = localStorage.getItem('user');
      if (userData) {
         setUser(JSON.parse(userData));
      }

      apiService.getDashboardStats()
         .then((res) => {
            if (res.stats) setData(res);
         })
         .catch(err => console.error("Dashboard sync error:", err));
   }, []);

   if (!data) return <LoadingSpinner label="Synchronizing Intelligence..." />;

   const isWorker = user?.role === 'Worker';

   const iconMap: any = {
      Wallet: Wallet,
      Coins: Coins,
      TrendingUp: TrendingUp,
      Users: Users,
   };

  const stats = data.stats.map((s: any) => ({
    ...s,
    title: s.label,
    icon: iconMap[s.icon] || Box,
    bg: s.color.includes('rose') ? 'bg-rose-50' : 'bg-emerald-50',
    textColor: s.color.includes('rose') ? 'text-rose-600' : 'text-emerald-600'
  }));

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-10 px-1 md:px-0">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white border border-emerald-100 rounded-lg shadow-sm">
             <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">
               {isWorker ? 'Personal Operation Node' : 'Global Command Center'}
             </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-950 tracking-tight">
            Dashboard <span className="text-emerald-600">{isWorker ? 'Performance' : 'Overview'}</span>
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            {isWorker ? `Welcome back, ${user?.name || 'Operator'}. Tracking your active fleet metrics.` : 'Real-time status monitor for your business.'}
          </p>
        </div>
        
        <div className="flex items-center gap-6 p-5 md:p-6 bg-white border border-emerald-100 rounded-2xl shadow-sm self-start lg:self-auto">
           <div className="space-y-1">
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{isWorker ? 'My Earnings' : 'Active Revenue'}</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-950 tracking-tighter">
                {isWorker ? data.stats[2]?.value : (data.stats[0]?.value || "QAR 0")}
              </p>
           </div>
           <div className="h-10 w-px bg-emerald-100"></div>
           <div className="flex flex-col items-center">
              <Activity size={24} className="text-emerald-500" />
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Live Feed</p>
           </div>
        </div>
      </div>

      {/* PRIMARY STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat: any, i: number) => (
          <div key={i} className="group bg-white p-8 border border-emerald-100/50 rounded-2xl shadow-sm hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.textColor}`}>
                <stat.icon size={24} />
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.trend}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-emerald-800/40 text-[10px] font-bold uppercase tracking-[0.2em]">{stat.title}</p>
              <p className="text-3xl font-bold text-emerald-950 tracking-tight">{stat.value}</p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] scale-150 group-hover:scale-125 transition-transform duration-700 text-emerald-950">
               <stat.icon size={100} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* SERVICE QUEUE MONITOR */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100/50 shadow-sm overflow-hidden flex flex-col">
           <div className="px-10 py-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/20">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
                    <Layers size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-emerald-950 tracking-tight">{isWorker ? 'My Recent Jobs' : 'Fleet Activity'}</h3>
                    <p className="text-[10px] text-emerald-800/40 font-bold uppercase tracking-[0.3em] mt-1">Real-time status monitor</p>
                 </div>
              </div>
              <Link href="/dashboard/tows" className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-700 transition-all tracking-widest">
                 Access Full Logs <ArrowRight size={14} />
              </Link>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-emerald-50 text-[10px] font-bold uppercase tracking-widest text-emerald-800/40">
                       <th className="px-10 py-5">REF #</th>
                       <th className="px-10 py-5">Vehicle & Customer</th>
                       <th className="px-10 py-5">Status</th>
                       <th className="px-10 py-5">Amount</th>
                    </tr>
                 </thead>
                  <tbody className="divide-y divide-emerald-50/30">
                     {data.recentTows?.map((tow: any) => (
                        <tr key={tow.id} className="hover:bg-emerald-50/40 transition-all group cursor-pointer">
                           <td className="px-10 py-6">
                              <span className="text-sm font-bold text-emerald-800/30">#{tow.id}</span>
                           </td>
                           <td className="px-10 py-6">
                              <p className="text-sm font-bold text-emerald-950">{tow.customer}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{tow.vehicle}</p>
                           </td>
                           <td className="px-10 py-6">
                              <div className={`badge ${
                                 tow.status === 'Completed' ? 'badge-success' :
                                 ['In Progress', 'Pending'].includes(tow.status) ? 'badge-warning' : 'badge-neutral'
                              }`}>
                                 <div className={`h-1 w-1 rounded-full ${tow.status === 'Completed' ? 'bg-emerald-600' : 'bg-amber-600'} ${tow.status === 'In Progress' ? 'animate-ping' : ''}`}></div>
                                 {tow.status}
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <span className="text-[11px] font-bold text-emerald-950 uppercase">{tow.amount}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
              </table>
           </div>
        </div>

        {/* WORKLOAD & CAPACITY PANEL */}
        <div className="space-y-8">
           <div className="bg-white rounded-2xl p-10 border border-emerald-100/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-emerald-50/50">
                 <Users size={120} />
              </div>
              <div className="relative z-10 space-y-10">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-emerald-950 tracking-tight">{isWorker ? 'Efficiency Score' : 'Operational Load'}</h3>
                    <BarChart3 size={20} className="text-emerald-600" />
                 </div>

                 <div className="space-y-8">
                    {data.recentTows?.slice(0, 5).map((tow: any, idx: number) => (
                       <div key={idx} className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                             <span>{tow.location}</span>
                             <span className="text-emerald-600">{tow.status}</span>
                          </div>
                          <div className="h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-emerald-600 transition-all duration-1000 ease-out" 
                               style={{ width: `${Math.random() * 50 + 50}%` }}
                             ></div>
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="pt-6 border-t border-emerald-100 space-y-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Efficiency</p>
                          <p className="text-3xl font-bold text-emerald-950 tracking-tight">98.4%</p>
                       </div>
                       <Gauge size={32} className="text-emerald-500" />
                    </div>
                    <button className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10">
                       Analyze Reports
                    </button>
                 </div>
              </div>
           </div>

           <div className="bg-white border border-emerald-100/50 p-8 rounded-2xl space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="text-emerald-600" size={20} />
                 <h4 className="text-[11px] font-bold uppercase text-emerald-950 tracking-widest">Protocol Status</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Core Database</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Synchronized</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Encryption Engine</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Active</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
