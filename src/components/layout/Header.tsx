"use client";

import { Bell, Command, Search, Settings, Wrench, ShieldCheck, Zap, LogOut, ChevronDown, Activity, Globe } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      const name = document.cookie
        .split("; ")
        .find((row) => row.startsWith("name="))
        ?.split("=")[1];
      if (name) setUserName(decodeURIComponent(name));

      const role = document.cookie
        .split("; ")
        .find(r => r.startsWith("role="))
        ?.split("=")[1];
      if (role) setUserRole(role);
    }
  }, []);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLive, setIsLive] = useState(true);

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
    
    // Subtle "heartbeat" for the live indicator
    const heartbeat = setInterval(() => setIsLive(prev => !prev), 2000);

    return () => {
      window.clearTimeout(initialSync);
      clearInterval(interval);
      clearInterval(heartbeat);
    };
  }, [fetchNotificationCount]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "name=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      localStorage.removeItem("user");
      localStorage.removeItem("isLogind");
      toast.success("Logged out");
      window.location.href = "/login";
    } catch (error) {
      window.location.href = "/login";
    }
  };

  const getPageTitle = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return { main: "Workshop", sub: "Overview" };
    const lastPart = parts[parts.length - 1].replace(/-/g, ' ');
    const titleParts = lastPart.split(' ');
    
    if (titleParts.length > 1) {
      const sub = titleParts.pop() || '';
      const main = titleParts.join(' ');
      return { main, sub };
    }
    
    return { main: lastPart, sub: "" };
  };

  const pageTitle = getPageTitle();

  if (!mounted) return null;

  return (
    <header className={`sticky top-0 z-40 flex h-[5.5rem] items-center justify-between border-b border-emerald-100/30 bg-white/70 px-8 shadow-sm backdrop-blur-2xl transition-all duration-500 ${userRole === 'Worker' ? 'hidden md:flex' : 'flex'}`}>
      {/* LEFT: BRANDING & TITLE */}
      <div className="flex min-w-0 items-center gap-10">
        <div className="flex items-center gap-5">
           <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 shadow-lg shadow-emerald-900/20">
              <Zap size={24} className="text-white fill-emerald-100" />
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"></div>
           </div>
           <div className="hidden lg:block space-y-1">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950 flex items-center gap-2">
                Falcon <span className="text-emerald-600">Tow</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </h2>
              <p className="text-[9px] font-bold uppercase text-slate-400 leading-none tracking-widest flex items-center gap-2">
                <Globe size={10} className="text-emerald-300" /> Live System
              </p>
           </div>
        </div>

        <div className="h-10 w-px bg-emerald-100/50 hidden md:block"></div>

        <div className="flex flex-col">
        </div>
      </div>

      {/* CENTER & RIGHT ACTIONS */}
      <div className="flex items-center gap-8">
        {/* SEARCH HUB (MODERN COMMAND STYLE) */}
        <div className="hidden w-80 items-center rounded-2xl border border-emerald-100/40 bg-emerald-50/20 px-5 py-3 transition-all duration-500 group focus-within:border-emerald-400/50 focus-within:bg-white lg:flex shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-emerald-50/40">
          <Search size={14} className="text-emerald-600/30 group-focus-within:text-emerald-600 transition-all duration-300 transform group-focus-within:scale-110" />
          <input
            type="text"
            placeholder="Search..."
            suppressHydrationWarning={true}
            className="ml-4 w-full border-none bg-transparent text-[11px] font-bold uppercase tracking-widest text-emerald-950 placeholder:text-emerald-800/20 focus:outline-none"
          />
          <div className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-emerald-100/30 border border-emerald-200/40">
            <Command size={10} className="text-emerald-600/40" />
            <span className="text-[9px] font-bold text-emerald-600/40">K</span>
          </div>
        </div>

        {/* NOTIFICATIONS & SETTINGS */}
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            suppressHydrationWarning={true}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500 ${isNotificationOpen ? 'bg-emerald-950 border-emerald-950 text-white shadow-2xl shadow-emerald-950/40' : 'bg-white border-emerald-100 text-emerald-900 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm'}`}
          >
            <Bell size={20} className={isNotificationOpen ? "animate-bounce" : "text-emerald-700/60 group-hover:text-emerald-600 transition-colors"} />
            {notificationCount > 0 && (
              <span className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black border-2 border-white shadow-lg ${isNotificationOpen ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-600 text-white'}`}>
                {notificationCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-16 w-80 bg-white border border-emerald-100 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="bg-emerald-950 px-8 py-6 flex items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-50"></div>
                <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.25em] text-white">Notifications</span>
                <span className="relative z-10 text-[8px] font-bold text-emerald-400 uppercase tracking-widest">{notificationCount} New</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-emerald-50">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                      <ShieldCheck size={32} className="text-emerald-100" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">No Notifications</p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Everything is up to date</p>
                    </div>
                  </div>
                ) : notifications.map(n => (
                  <div key={n._id} className="px-8 py-5 hover:bg-emerald-50/50 transition-all cursor-pointer group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{n.title}</p>
                      <Activity size={12} className="text-emerald-100 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="text-[9px] text-slate-500 mt-2 line-clamp-2 font-medium leading-relaxed uppercase tracking-wider">{n.message}</p>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/notifications" className="block w-full py-4 bg-emerald-50 text-center text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700 hover:bg-emerald-100 transition-all border-t border-emerald-100">
                View all notifications
              </Link>
            </div>
          )}
        </div>

        <div className="mx-2 h-10 w-px bg-emerald-100/40"></div>

        {/* USER PROFILE DROPDOWN */}
        <div className="relative profile-node">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            suppressHydrationWarning={true}
            className={`group flex items-center gap-5 rounded-2xl border py-2 pl-6 pr-2 transition-all duration-500 ${isProfileOpen ? 'bg-emerald-950 border-emerald-950 shadow-2xl shadow-emerald-950/40' : 'bg-white border-emerald-100 hover:border-emerald-300 hover:shadow-lg shadow-sm'}`}
          >
            <div className="text-right hidden sm:block space-y-1">
              <p className={`max-w-[140px] truncate text-[11px] font-black tracking-[0.05em] uppercase ${isProfileOpen ? 'text-white' : 'text-emerald-950'}`}>
                {userName || "Operator"}
              </p>
              <div className="flex items-center gap-2 justify-end">
                 <ShieldCheck size={10} className={`${isProfileOpen ? 'text-emerald-400' : 'text-emerald-600/40'}`} />
                 <p className={`text-[8px] font-black uppercase tracking-[0.25em] ${isProfileOpen ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {userRole}
                 </p>
              </div>
            </div>
            <div className="relative">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all duration-700 ${isProfileOpen ? 'bg-white border-emerald-400 text-emerald-950 rotate-6 scale-110' : 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-100 text-white shadow-lg shadow-emerald-900/20'} text-sm font-black`}>
                {userName ? userName.charAt(0) : "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500"></div>
            </div>
            <ChevronDown size={14} className={`transition-transform duration-500 ${isProfileOpen ? 'rotate-180 text-white' : 'text-emerald-800/40'}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-20 w-64 bg-white border border-emerald-100 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="p-8 bg-emerald-50/30 border-b border-emerald-100 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-950 flex items-center justify-center text-white text-xl font-black mb-4 shadow-xl">
                    {userName?.charAt(0)}
                  </div>
                  <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.3em]">User Profile</p>
                  <p className="text-base font-black text-emerald-950 mt-2 tracking-tight">{userName}</p>
                  <p className="text-[9px] font-black text-emerald-600 uppercase mt-1 tracking-[0.2em] px-3 py-1 rounded-full bg-emerald-100/50">{userRole}</p>
               </div>
               <div className="p-4 space-y-1">
                  <Link href="/dashboard/settings" className="flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-emerald-950 hover:bg-emerald-50 transition-all group">
                     <Settings size={16} className="text-emerald-600/30 group-hover:text-emerald-600 transition-colors" /> Settings
                  </Link>
                  <div className="my-2 border-t border-emerald-50 mx-4"></div>
                   <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-rose-500 hover:bg-rose-50 transition-all group"
                  >
                     <LogOut size={16} className="group-hover:translate-x-1 transition-transform" /> Logout
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
