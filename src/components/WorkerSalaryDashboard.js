'use client';
import { useState, useEffect } from 'react';
import { Calendar, Download, ChevronRight, FileText, Filter, Printer } from 'lucide-react';
import { apiService } from '@/services/apiService';
import SalarySlipView from './SalarySlipView';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const years = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export default function WorkerSalaryDashboard({ user }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSalary, setActiveSalary] = useState(null);

  useEffect(() => {
    async function fetchSalaries() {
      if (!user) return;
      setLoading(true);
      try {
        // The apiService now automatically applies workerId filtering based on the session
        const result = await apiService.getRecords('salaries', { limit: 100 });
        console.log(`[WORKER_DEBUG] Fetched ${result.data?.length || 0} settlements.`);
        setSalaries(result.data || []);
        
        // Find salary for current month/year if exists
        const current = (result.data || []).find(s => s.month === selectedMonth && s.year === selectedYear);
        if (current) setActiveSalary(current);
      } catch (error) {
        console.error('Failed to fetch salaries:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSalaries();
  }, [selectedMonth, selectedYear, user]);

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    const found = salaries.find(s => s.month === month && s.year === selectedYear);
    setActiveSalary(found || null);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* LEFT SIDEBAR: Months & Year Selection */}
      <div className="w-80 flex flex-col bg-white rounded-2xl border border-emerald-100/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-emerald-50 bg-emerald-50/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-emerald-950 uppercase tracking-tight">Payroll Archive</h2>
              <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Select Month & Year</p>
            </div>
          </div>

          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-emerald-950 outline-none focus:border-emerald-600 appearance-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y} Fiscal Year</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {months.map((month) => {
            const hasData = salaries.some(s => s.month === month && s.year === selectedYear);
            const isActive = selectedMonth === month;
            
            return (
              <button
                key={month}
                onClick={() => handleMonthSelect(month)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'hover:bg-emerald-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${hasData ? (isActive ? 'bg-white' : 'bg-emerald-500') : 'bg-slate-200'}`}></div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-700'}`}>{month}</span>
                </div>
                {hasData && !isActive && <div className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">PAID</div>}
                {isActive && <ChevronRight size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE: Salary Slip View */}
      <div className="flex-1 bg-white rounded-2xl border border-emerald-100/50 shadow-sm overflow-hidden flex flex-col">
        {activeSalary ? (
          <>
            <div className="px-8 py-6 border-b border-emerald-50 bg-white flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-950 uppercase tracking-tight">Settlement Archive</h3>
                    <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">{selectedMonth} {selectedYear} fiscal period</p>
                  </div>
               </div>
               <button 
                onClick={() => {
                   const btn = document.querySelector('[class*="pdfBtn"]');
                   if (btn) btn.click();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/10"
               >
                  <Download size={14} className="text-emerald-400" />
                  Download PDF Slip
               </button>
            </div>
            <div className="flex-1 overflow-y-auto">
               <SalarySlipView id={activeSalary.id} hideToolbar={true} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-emerald-50/5">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-black text-emerald-950 uppercase italic tracking-tight">No Settlement Record</h3>
            <p className="text-slate-500 max-w-sm mt-2 text-sm">
              We couldn&apos;t find any salary settlement for <span className="font-bold text-emerald-600">{selectedMonth} {selectedYear}</span>. 
              Please contact the accounts department if this is an error.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
