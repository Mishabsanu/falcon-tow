'use client';
import { useState, useEffect } from 'react';
import { Calendar, Download, ChevronRight, FileText, Filter, Printer, Users } from 'lucide-react';
import { apiService } from '@/services/apiService';
import SalarySlipView from './SalarySlipView';
import Link from 'next/link';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const years = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export default function WorkerSalaryDashboard({ user, adminMode = false }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(adminMode ? '' : user?._id || user?.id);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSalary, setActiveSalary] = useState(null);

  useEffect(() => {
    if (adminMode) {
      async function fetchWorkers() {
        try {
          const workerList = await apiService.getAllRecords('users');
          const filtered = workerList.filter(u => u.role === 'Worker' || u.role === 'TECHNICIAN');
          setWorkers(filtered);
          if (filtered.length > 0 && !selectedWorkerId) {
            setSelectedWorkerId(filtered[0]._id || filtered[0].id);
          }
        } catch (error) {
          console.error('Failed to fetch workers:', error);
        }
      }
      fetchWorkers();
    }
  }, [adminMode]);

  useEffect(() => {
    async function fetchSalaries() {
      const targetId = adminMode ? selectedWorkerId : (user?._id || user?.id);
      if (!targetId) return;
      
      setLoading(true);
      try {
        const result = await apiService.getRecords('salaries', { 
          extraParams: { workerId: targetId },
          limit: 100 
        });
        setSalaries(result.data || []);
        
        const current = (result.data || []).find(s => s.month === selectedMonth && s.year === selectedYear);
        if (current) setActiveSalary(current);
        else setActiveSalary(null);
      } catch (error) {
        console.error('Failed to fetch salaries:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSalaries();
  }, [selectedMonth, selectedYear, user, selectedWorkerId, adminMode]);

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    const found = salaries.find(s => s.month === month && s.year === selectedYear);
    setActiveSalary(found || null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-210px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 lg:pb-0">
      {/* LEFT SIDEBAR: Months & Year Selection */}
      <div className="w-full lg:w-80 flex flex-col bg-white rounded-2xl border border-emerald-100/50 shadow-sm overflow-hidden shrink-0">
        <div className="p-6 border-b border-emerald-50 bg-emerald-50/10 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-emerald-950 uppercase tracking-tight">Payroll Archive</h2>
              <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Select Period</p>
            </div>
          </div>

          {adminMode && (
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600">
                <Users size={14} />
              </div>
              <select 
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-emerald-950 outline-none focus:border-emerald-600 appearance-none cursor-pointer shadow-sm group-hover:border-emerald-200 transition-all"
              >
                <option value="">Select Worker...</option>
                {workers.map(w => <option key={w._id || w.id} value={w._id || w.id}>{w.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <div className="relative group">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-emerald-950 outline-none focus:border-emerald-600 appearance-none cursor-pointer shadow-sm group-hover:border-emerald-200 transition-all"
              >
                {years.map(y => <option key={y} value={y}>{y} Fiscal Year</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-hidden hide-scrollbar bg-emerald-50/5">
          {months.map((month) => {
            const hasData = salaries.some(s => s.month === month && s.year === selectedYear);
            const isActive = selectedMonth === month;
            
            return (
              <button
                key={month}
                onClick={() => handleMonthSelect(month)}
                className={`min-w-[120px] lg:min-w-0 flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 translate-x-1' 
                    : 'bg-white lg:bg-transparent hover:bg-emerald-50 text-slate-600 border border-emerald-50 lg:border-none shadow-sm lg:shadow-none'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${hasData ? (isActive ? 'bg-white shadow-[0_0_8px_white]' : 'bg-emerald-500') : 'bg-slate-200'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-emerald-950'}`}>{month}</span>
                </div>
                <div className="hidden lg:block">
                  {hasData && !isActive && <div className="text-[7px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded tracking-tighter">PAID</div>}
                  {isActive && <ChevronRight size={14} className="animate-pulse" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE: Salary Slip View */}
      <div className="flex-1 bg-white rounded-2xl border border-emerald-100/50 shadow-sm overflow-hidden flex flex-col min-h-[600px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Synchronizing Payroll...</p>
            </div>
          </div>
        )}

        {activeSalary ? (
          <>
            <div className="px-6 py-4 border-b border-emerald-50 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-950 uppercase tracking-tight">Settlement Node</h3>
                    <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">{selectedMonth} {selectedYear} period</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-100 text-emerald-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95 shadow-sm"
                >
                    <Printer size={14} />
                    Print Slip
                </button>
                <button 
                  onClick={() => {
                    const btn = document.querySelector('[class*="pdfBtn"]');
                    if (btn) btn.click();
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/10 active:scale-95"
                >
                    <Download size={14} className="text-emerald-400" />
                    Download PDF
                </button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
               <div className="w-full bg-white rounded-2xl overflow-hidden">
                  <SalarySlipView id={activeSalary.id} hideToolbar={true} />
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-emerald-50/5">
            <div className="w-24 h-24 bg-emerald-100/50 rounded-3xl flex items-center justify-center mb-8 text-emerald-600 rotate-3 border border-emerald-100">
              <FileText size={48} className="opacity-40" />
            </div>
            <h3 className="text-2xl font-black text-emerald-950 uppercase italic tracking-tight">No Active Record</h3>
            <p className="text-slate-500 max-w-sm mt-4 text-sm font-medium leading-relaxed">
              We couldn&apos;t find any salary settlement for <span className="font-bold text-emerald-600 underline decoration-emerald-200 underline-offset-4">{selectedMonth} {selectedYear}</span> in the decentralized ledger. 
            </p>
            {adminMode && (
              <Link href="/dashboard/salaries/new" className="mt-8 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
                Generate Record Now
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
