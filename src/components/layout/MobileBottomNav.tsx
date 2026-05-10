"use client";

import { LayoutDashboard, Truck, Receipt, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MobileBottomNav({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      const role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1] ?? "ADMIN";
      setUserRole(role);
    }
  }, []);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
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

  const isVisible = (path: string) => {
    if (!userRole) return true;
    const role = userRole.toUpperCase();
    if (role === "ADMIN" || role === "ADMINISTRATOR") return true;

    // RBAC Rules for Bottom Nav
    if (path === "/dashboard/expenses" && role === "WORKER") return true;
    if (path === "/dashboard/tows") return true;
    if (path === "/dashboard") return true;

    return false;
  };

  const filteredItems = navItems.filter(item => isVisible(item.path));

  if (!mounted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 border-t border-emerald-100 backdrop-blur-xl lg:hidden">
      <div className="grid h-16 grid-cols-4 items-center px-2 pb-[env(safe-area-inset-bottom)]">
        {filteredItems.map((item) => {
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
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-1 bg-emerald-600 rounded-b-full shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
                />
              )}
              <div className={`p-1 rounded-xl transition-all duration-300 ${isActive ? "bg-emerald-50 scale-105" : ""}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-tighter transition-all ${isActive ? "opacity-100 translate-y-0" : "opacity-40"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        
        {/* Menu Toggle */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center gap-1 text-emerald-950 active:scale-95 transition-transform h-full"
        >
          <div className="p-1 rounded-xl bg-emerald-50 text-emerald-600">
            <Menu size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[8px] font-bold uppercase tracking-tighter">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
}
