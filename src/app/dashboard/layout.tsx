"use client";

import { useEffect, useState } from "react";
import { Menu, Wrench, X } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  return (
    <div className="flex min-h-screen overflow-hidden bg-emerald-50/20 font-sans antialiased text-emerald-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[100] bg-emerald-950/40 backdrop-blur-md lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="h-full w-[18.5rem] bg-white shadow-2xl animate-in slide-in-from-left duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-[-3rem] top-5 lg:hidden">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2.5 bg-emerald-950 text-white rounded-xl shadow-lg border border-white/10 transition-all hover:scale-110 active:scale-90"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Sidebar Container */}
      <div className="hidden lg:block w-[18.5rem] shrink-0 shadow-sm z-50">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {(userRole?.toUpperCase() === "ADMIN" || userRole?.toUpperCase() === "ADMINISTRATOR") && (
          <div className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-emerald-100 bg-white/90 px-6 shadow-sm backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 shadow-lg shadow-emerald-900/20 p-2 border border-white/10">
                <img src="/logo-1.png" alt="Falcon Tow" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-tight text-emerald-950">Falcon <span className="text-emerald-600">Tow</span></span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Operations</span>
              </div>
            </div>
            
            <button
              onClick={() => setSidebarOpen(true)}
              suppressHydrationWarning={true}
              className="rounded-xl border border-emerald-100 bg-white p-2.5 text-emerald-600 transition-all hover:bg-emerald-50 shadow-sm active:scale-95"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
          </div>
        )}

        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="garage-workspace flex-1 overflow-y-auto overflow-x-hidden p-5 scroll-smooth md:p-7 lg:p-10 pb-24 lg:pb-10">
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
          </div>
          <div className="h-8" />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
