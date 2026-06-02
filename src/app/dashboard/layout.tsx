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
          className="fixed inset-0 z-[200] bg-emerald-950/40 backdrop-blur-md lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="h-full w-[18.5rem] bg-white shadow-2xl animate-in slide-in-from-left duration-500 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-4 top-4 z-[210] lg:hidden">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Close navigation"
              >
                <X size={24} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Sidebar Container */}
      <div className="hidden lg:block h-screen w-[18.5rem] shrink-0 shadow-sm z-50 sticky top-0">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="garage-workspace flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 scroll-smooth md:px-5 md:py-7 lg:px-6 lg:py-8 pb-24 lg:pb-10">
          <div className="max-w-[1650px] mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
          </div>
          <div className="h-8" />
        </main>
      </div>

      <MobileBottomNav onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}
