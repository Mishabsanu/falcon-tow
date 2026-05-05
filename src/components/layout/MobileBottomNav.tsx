"use client";

import { LayoutDashboard, Truck, Receipt, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1] ?? "ADMIN";
      setUserRole(role);
    }
  }, []);

  const handleLogout = async () => {
    if (!confirm("Terminate session and logout?")) return;
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

  const navItems = [
    { name: "Home", path: "/dashboard", icon: LayoutDashboard },
    { name: "Tows", path: "/dashboard/tows", icon: Truck },
    { name: "Expenses", path: "/dashboard/expenses", icon: Receipt },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 border-t border-emerald-100 backdrop-blur-xl lg:hidden">
      <div className="grid h-16 grid-cols-4 items-center px-4 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all h-full ${
                isActive ? "text-emerald-600" : "text-slate-400 hover:text-emerald-500"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="bottomNavGlow"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-600 rounded-b-full shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
                />
              )}
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? "bg-emerald-50 scale-105" : "group-hover:bg-emerald-50/50"}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-tighter transition-all ${isActive ? "opacity-100 translate-y-0" : "opacity-40"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 text-rose-500 active:scale-95 transition-transform h-full"
        >
          <div className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors">
            <LogOut size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tighter opacity-100">
            Exit
          </span>
        </button>
      </div>
    </div>
  );
}
