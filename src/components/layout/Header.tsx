"use client";

import { Bell, Command, Search, Settings, Wrench, ShieldCheck, Zap, LogOut, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName] = useState<string | null>(() => {
    if (typeof document === "undefined") return null;
    const name = document.cookie
      .split("; ")
      .find((row) => row.startsWith("name="))
      ?.split("=")[1];

    return name ? decodeURIComponent(name) : null;
  });

  const [userRole] = useState<string | null>(() => {
    if (typeof document === "undefined") return null;
    return document.cookie.split("; ").find(r => r.startsWith("role="))?.split("=")[1] || null;
  });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.slice(0, 5));
        const unread = data.data.filter((n: any) => n.unread).length;
        setNotificationCount(unread);
      }
    } catch {
      console.error("Header notification sync failed");
    }
  }, []);

  useEffect(() => {
    const initialSync = window.setTimeout(fetchNotificationCount, 0);
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => {
      window.clearTimeout(initialSync);
      clearInterval(interval);
    };
  }, [fetchNotificationCount]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "name=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      toast.success("Session Purged Successfully");
      router.push("/login");
    } catch (error) {
      router.push("/login");
    }
  };

  const getPageTitle = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return "Workshop Overview";
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
  };

  return (
    <header className="sticky top-0 z-40 flex h-[5.25rem] items-center justify-between border-b border-emerald-100 bg-white/80 px-8 shadow-sm backdrop-blur-xl">
      {/* LEFT: BRANDING & TITLE */}
      <div className="flex min-w-0 items-center gap-8">
        <div className="flex items-center gap-4">
           <img src="/logo-1.png" alt="Falcon Tow" className="h-11 w-auto" />
           <div className="h-9 w-px bg-emerald-100 hidden md:block"></div>
           <div className="hidden md:block">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-950">Falcon <span className="text-emerald-600">Tow</span></h2>
              <p className="text-[8px] font-bold uppercase text-slate-400 leading-none mt-1.5 tracking-widest">Intelligence Hub</p>
           </div>
        </div>

        <div className="flex flex-col">
          <h1 className="truncate text-xl font-bold tracking-tight text-emerald-950">{getPageTitle()}</h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-800/40 mt-0.5">
            Node Control / {pathname.replace('/dashboard/', '').toUpperCase()}
          </p>
        </div>
      </div>

      {/* CENTER & RIGHT ACTIONS */}
      <div className="flex items-center gap-6">
        {/* SEARCH HUB (HIDDEN ON MOBILE) */}
        <div className="hidden w-72 items-center rounded-xl border border-emerald-100/50 bg-emerald-50/30 px-4 py-2.5 transition-all duration-300 group focus-within:border-emerald-500/50 focus-within:bg-white lg:flex shadow-inner">
          <Search size={14} className="text-emerald-600/40 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Global Telemetery Search..."
            className="ml-3 w-full border-none bg-transparent text-[10px] font-bold uppercase tracking-widest text-emerald-950 placeholder:text-emerald-800/30 focus:outline-none"
          />
        </div>

        {/* NOTIFICATIONS & SETTINGS */}
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 ${isNotificationOpen ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-white border-emerald-100 text-emerald-900 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm'}`}
          >
            <Bell size={18} className={isNotificationOpen ? "" : "text-emerald-700/60"} />
            {notificationCount > 0 && (
              <span className={`absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black shadow-sm ${isNotificationOpen ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'}`}>
                {notificationCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-14 w-80 bg-white border border-emerald-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Operational Alerts</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-emerald-50">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-3">
                    <ShieldCheck size={24} className="text-emerald-100" />
                    <p className="text-[9px] font-bold text-emerald-800/30 uppercase tracking-widest">Protocol Nominal</p>
                  </div>
                ) : notifications.map(n => (
                  <div key={n._id} className="px-6 py-4 hover:bg-emerald-50/50 transition-colors cursor-pointer group">
                    <p className="text-[10px] font-bold text-emerald-950 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{n.title}</p>
                    <p className="text-[9px] text-slate-500 mt-1 line-clamp-1 font-medium">{n.message}</p>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/notifications" className="block w-full py-3 bg-emerald-50 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 transition-all">
                View All Intelligence
              </Link>
            </div>
          )}

          <Link href="/dashboard/settings" className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-800/40 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm">
            <Settings size={18} />
          </Link>
        </div>

        <div className="mx-2 h-9 w-px bg-emerald-100/60"></div>

        {/* USER PROFILE & LOGOUT DROPDOWN */}
        <div className="relative profile-node">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`group flex items-center gap-4 rounded-xl border py-1.5 pl-5 pr-2 transition-all duration-300 ${isProfileOpen ? 'bg-emerald-950 border-emerald-950 shadow-xl shadow-emerald-900/40' : 'bg-white border-emerald-100 hover:border-emerald-300 shadow-sm'}`}
          >
            <div className="text-right hidden sm:block">
              <p className={`max-w-[120px] truncate text-[11px] font-bold tracking-tight ${isProfileOpen ? 'text-white' : 'text-emerald-950'}`}>
                {userName || "Operator"}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 justify-end">
                 <ShieldCheck size={9} className="text-emerald-500/60" />
                 <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-500">{userRole}</p>
              </div>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all duration-500 ${isProfileOpen ? 'bg-white border-white text-emerald-950' : 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/10'} text-sm font-bold`}>
              {userName ? userName.charAt(0) : "U"}
            </div>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-white' : 'text-emerald-800/40'}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-16 w-60 bg-white border border-emerald-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="p-5 bg-emerald-50/50 border-b border-emerald-100">
                  <p className="text-[9px] font-bold text-emerald-800/40 uppercase tracking-[0.2em]">Active Credentials</p>
                  <p className="text-sm font-bold text-emerald-950 mt-1">{userName}</p>
                  <p className="text-[8px] font-bold text-emerald-600 uppercase mt-1 tracking-widest">{userRole} AUTHENTICATED</p>
               </div>
               <div className="p-2.5">
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-950 hover:bg-emerald-50 transition-all group">
                     <Settings size={14} className="text-emerald-800/30 group-hover:text-emerald-600 transition-colors" /> Parameters
                  </Link>
                  <div className="my-1 border-t border-emerald-50"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all"
                  >
                     <LogOut size={14} /> Terminate Session
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
