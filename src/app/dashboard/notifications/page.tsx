"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Trash2, 
  MoreVertical,
  Zap,
  Package,
  Wrench,
  ArrowRight,
  ShieldAlert,
  Layers,
  Inbox,
  Filter,
  CheckCheck,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      toast.success("Notification acknowledged");
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const markAllRead = async () => {
     try {
        await fetch('/api/notifications?id=all', { method: 'PATCH' });
        // Optimistic UI update
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
     } catch (error) {
        toast.error("Failed to mark all as read");
     }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      setNotifications(notifications.filter(n => n._id !== id));
      toast.success("Notification deleted successfully");
    } catch (error) {
      toast.error("Purge failed");
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(n => {
        const matchesFilter = activeFilter === "ALL" || n.type === activeFilter;
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, activeFilter, searchQuery]);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'tow': return { 
        icon: <Wrench size={18} />, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-100',
        label: 'Tow Job'
      };
      case 'payment': return { 
        icon: <RefreshCw size={18} />, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50', 
        border: 'border-amber-100',
        label: 'Finance'
      };
      case 'alert': return { 
        icon: <ShieldAlert size={18} />, 
        color: 'text-rose-600', 
        bg: 'bg-rose-50', 
        border: 'border-rose-100',
        label: 'System Alert'
      };
      case 'status': return { 
        icon: <Zap size={18} />, 
        color: 'text-sky-600', 
        bg: 'bg-sky-50', 
        border: 'border-sky-100',
        label: 'Status Update'
      };
      default: return { 
        icon: <Bell size={18} />, 
        color: 'text-slate-600', 
        bg: 'bg-slate-50', 
        border: 'border-slate-100',
        label: 'General'
      };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-[1760px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-emerald-100 pb-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">
             <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
             Operational Command Center
          </div>
          <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">
            System <span className="text-emerald-600">Alerts</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-3">
             <Layers size={16} className="text-emerald-600/40" /> Real-time operational notifications and system telemetry
          </p>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={markAllRead}
             className="flex items-center gap-2 px-6 py-3.5 bg-white border border-emerald-100 text-emerald-700 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
           >
             <CheckCheck size={16} className="text-emerald-600" /> Acknowledge All
           </button>
           <button 
             onClick={fetchNotifications}
             className="btn-primary"
           >
             <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Database
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        
        {/* FILTERS SIDEBAR */}
        <div className="space-y-8 sticky top-24">
           <div className="space-y-3">
              <label className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-[0.2em] ml-1">Search Cluster</label>
              <div className="relative group">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Filter alerts by keyword..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-12 pr-4 py-4 bg-white border border-emerald-100/50 rounded-2xl text-sm font-bold text-emerald-950 outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all shadow-sm"
                 />
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                 <Filter size={12} /> Filter Node Type
              </label>
              <div className="flex flex-col gap-2">
                 {[
                    { id: 'ALL', label: 'All Clusters', icon: <Inbox size={14} />, count: notifications.length },
                    { id: 'tow', label: 'Tow Jobs', icon: <Wrench size={14} />, count: notifications.filter(n => n.type === 'tow').length },
                    { id: 'payment', label: 'Financials', icon: <RefreshCw size={14} />, count: notifications.filter(n => n.type === 'payment').length },
                    { id: 'status', label: 'Operations', icon: <Zap size={14} />, count: notifications.filter(n => n.type === 'status').length },
                    { id: 'alert', label: 'Security', icon: <ShieldAlert size={14} />, count: notifications.filter(n => n.type === 'alert').length },
                 ].map((filter) => (
                   <button
                     key={filter.id}
                     onClick={() => setActiveFilter(filter.id)}
                     className={`flex items-center justify-between px-5 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                       activeFilter === filter.id 
                         ? "bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 translate-x-1" 
                         : "bg-white border border-emerald-100/50 text-slate-500 hover:bg-emerald-50/50"
                     }`}
                   >
                     <div className="flex items-center gap-3">
                        {filter.icon}
                        {filter.label}
                     </div>
                     <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${activeFilter === filter.id ? "bg-white text-emerald-700" : "bg-emerald-50 text-emerald-600"}`}>
                        {filter.count}
                     </span>
                   </button>
                 ))}
              </div>
           </div>

           <div className="bg-emerald-950 rounded-2xl p-6 shadow-2xl shadow-emerald-900/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] relative z-10">Unread Backlog</p>
              <div className="flex items-center gap-4 mt-4 relative z-10">
                 <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <span className="text-xl font-bold text-white">{unreadCount}</span>
                 </div>
                 <div>
                    <p className="text-[11px] font-bold text-white uppercase leading-none">Critical Nodes</p>
                    <p className="text-[9px] font-bold text-emerald-400/60 mt-1 uppercase tracking-widest">Awaiting Command</p>
                 </div>
              </div>
           </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="lg:col-span-3 space-y-4">
           {loading ? (
             <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                   <div key={i} className="h-32 bg-emerald-50/50 animate-pulse rounded-2xl border border-emerald-100/50"></div>
                ))}
             </div>
           ) : filteredNotifications.length === 0 ? (
             <div className="glass-card !p-24 text-center border-2 border-dashed border-emerald-100/50 flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-200">
                   <Inbox size={40} />
                </div>
                <div className="space-y-2">
                   <p className="text-sm font-bold text-emerald-950 uppercase tracking-widest">Protocol Nominal</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active alerts detected in selected cluster.</p>
                </div>
             </div>
           ) : filteredNotifications.map((notification) => {
              const typeStyles = getTypeStyles(notification.type);
              return (
                <div 
                  key={notification._id} 
                  className={`group relative bg-white rounded-2xl p-8 border transition-all duration-500 hover:shadow-xl hover:shadow-emerald-900/5 flex items-start gap-8 ${
                    notification.isRead 
                      ? "border-emerald-50/50 opacity-60" 
                      : "border-emerald-100 shadow-sm border-l-[6px] border-l-emerald-600"
                  }`}
                >
                   <div className={`w-14 h-14 rounded-xl ${typeStyles.bg} ${typeStyles.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm border ${typeStyles.border}`}>
                      {typeStyles.icon}
                   </div>

                   <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded ${typeStyles.bg} ${typeStyles.color}`}>
                               {typeStyles.label}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                               <Clock size={10} /> {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => deleteNotification(notification._id)}
                              className="p-2.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                              title="Purge Record"
                            >
                               <Trash2 size={14} />
                            </button>
                         </div>
                      </div>
                      
                      <h3 className={`text-lg font-bold tracking-tight ${notification.isRead ? "text-emerald-950/40" : "text-emerald-950"}`}>
                         {notification.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${notification.isRead ? "text-slate-400" : "text-slate-600"} font-medium max-w-2xl`}>
                         {notification.message}
                      </p>

                      <div className="pt-6 flex items-center gap-4">
                         {!notification.isRead && (
                           <button 
                             onClick={() => markAsRead(notification._id)}
                             className="group/btn relative px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-lg shadow-emerald-900/10 active:scale-95 overflow-hidden"
                           >
                             <span className="relative z-10 flex items-center gap-2">
                                Acknowledge <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                             </span>
                           </button>
                         )}
                         {notification.isRead && (
                           <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-800/30 uppercase tracking-widest">
                              <CheckCircle2 size={14} className="text-emerald-600/30" /> Acknowledged
                           </span>
                         )}
                      </div>
                   </div>

                   {!notification.isRead && (
                      <div className="absolute top-8 right-8 w-2 h-2 bg-emerald-600 rounded-full animate-ping"></div>
                   )}
                </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}
