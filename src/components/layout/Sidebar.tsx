"use client";

import {
  Activity,
  Banknote,
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Terminal,
  Truck,
  Users,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * ADVANCED ROLE-BASED ACCESS CONTROL (RBAC)
 * - ADMIN: Ultimate control over all telemetry and financial hubs.
 * - SERVICE_ADVISOR: Operational focus (Quotations, Jobs, Invoicing).
 * - TECHNICIAN: Workshop queue and job execution nodes.
 * - ACCOUNTANT: Financial auditing and payment settlements.
 * - STORE_MANAGER: Inventory, Procurement, and Vendor nodes.
 */
const ROLE_VISIBILITY: Record<string, string[]> = {
  "/dashboard": ["ADMIN", "MANAGER", "WORKER"],
  "/dashboard/notifications": ["ADMIN", "MANAGER", "DISPATCHER"],
  "/dashboard/quotations": ["ADMIN", "MANAGER", "DISPATCHER"],
  "/dashboard/tows": ["ADMIN", "MANAGER", "DISPATCHER", "WORKER"],
  "/dashboard/invoices": ["ADMIN", "MANAGER", "ACCOUNTANT"],
  "/dashboard/customers": ["ADMIN", "MANAGER", "DISPATCHER"],
  "/dashboard/vehicles": ["ADMIN", "MANAGER"],
  "/dashboard/users": ["ADMIN", "MANAGER"],
  "/dashboard/salaries": ["ADMIN", "MANAGER", "ACCOUNTANT", "WORKER"],
  "/dashboard/expenses": ["ADMIN", "MANAGER", "ACCOUNTANT", "WORKER"],
  "/dashboard/reports": ["ADMIN", "MANAGER", "ACCOUNTANT"],
};

const menuGroups = [
  {
    label: "Dashboard",
    items: [
      { name: "Home", path: "/dashboard", icon: LayoutDashboard },
      { name: "Notifications", path: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Quotations", path: "/dashboard/quotations", icon: FileText },
      { name: "Tow Jobs", path: "/dashboard/tows", icon: Truck },
      { name: "Invoices", path: "/dashboard/invoices", icon: Wallet },
      { name: "Reports", path: "/dashboard/reports", icon: ClipboardList },
    ],
  },
  {
    label: "Fleet & People",
    items: [
      { name: "Customers", path: "/dashboard/customers", icon: Users },
      { name: "Vehicles", path: "/dashboard/vehicles", icon: Activity },
      { name: "User Management", path: "/dashboard/users", icon: Terminal },
    ],
  },
  {
    label: "Admin Panel",
    isAdminOnly: false, // Changed to false to allow worker visibility if path is allowed
    items: [
      { name: "Salaries", path: "/dashboard/salaries", icon: Banknote },
      { name: "Expenses", path: "/dashboard/expenses", icon: Receipt },
    ],
  },
];

import { Receipt } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1] ?? "ADMIN"; // Default to ADMIN to ensure all modules are visible
      setUserRole(role);
    }
  }, []);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        const unreadCount = data.data.filter((n: any) => n.unread).length;
        setNotificationCount(unreadCount);
      }
    } catch {
      console.error("Alert sync failure");
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
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  const isVisible = (path: string) => {
    if (!userRole) return true;
    if (userRole === "ADMIN" || userRole === "ADMINISTRATOR") return true; // ADMIN SEES EVERYTHING

    const restrictedPaths = Object.keys(ROLE_VISIBILITY).sort((a, b) => b.length - a.length);
    const matchedPath = restrictedPaths.find(p => path.startsWith(p));

    if (!matchedPath) return true;
    return ROLE_VISIBILITY[matchedPath].includes(userRole);
  };

  return (
    <aside className="sticky top-0 z-50 flex h-screen w-[18.5rem] flex-col overflow-hidden bg-white border-r border-emerald-100 shadow-sm">
      {/* BRANDING AREA */}
      <div className="relative px-6 py-10 flex flex-col items-center border-b border-emerald-800 bg-emerald-900 overflow-hidden">
        {/* THEME GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 opacity-95"></div>
        
        {/* PREMIUM GLOWS & TEXTURE */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full"></div>
        
        <Link href="/dashboard" className="relative z-10 w-full group">
          <div className="h-16 w-full transition-all duration-500 group-hover:scale-105 flex items-center justify-center">
            <img src="/logo-1.png" alt="Falcon Tow" className="h-full w-full object-contain brightness-0 invert" />
          </div>
        </Link>
        <div className="mt-6 flex items-center gap-2.5 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 shadow-inner relative z-10">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-100">{userRole} AUTHENTICATED</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-8 overflow-y-auto px-5 py-8 hide-scrollbar">
        {menuGroups.map((group) => {
          if (group.isAdminOnly && userRole !== "ADMIN" && userRole !== "ADMINISTRATOR") return null;
          const visibleItems = group.items.filter((item) => isVisible(item.path));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-4">
              <p className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-800/40 flex items-center gap-2">
                {group.label}
              </p>
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.path);

                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`group flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-300 ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                            : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Icon size={18} className={isActive ? "text-white" : "text-emerald-400 group-hover:text-emerald-700"} strokeWidth={isActive ? 2.5 : 2} />
                          <span className="text-[11px] font-bold uppercase tracking-wide">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.name === "Notifications" && notificationCount > 0 && (
                            <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-lg px-1.5 text-[10px] font-bold ${
                              isActive ? "bg-white text-emerald-600" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {notificationCount}
                            </span>
                          )}
                          {isActive && (
                            <div className="h-1 w-1 rounded-full bg-white shadow-[0_0_8px_white]" />
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* FOOTER AREA */}
      <div className="mt-auto border-t border-emerald-100 bg-emerald-50/30 p-6">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
        >
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
