'use client';
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Download,
  Truck,
  Users,
  Wallet,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PayrollOverview() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/salaries/payroll-summary?month=${selectedMonth}&year=${selectedYear}`);
        const result = await res.json();
        
        if (result.success) {
          setWorkers(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch payroll data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedMonth, selectedYear]);

  const totalPayroll = workers.reduce((sum, p) => sum + p.netSalary, 0);

  const exportToCSV = () => {
    if (!workers || workers.length === 0) return;
    const headers = ['Worker Name', 'Total Tows', 'Base Salary', 'Commission', 'Expenses', 'Net Payable'];
    const csvContent = [
      headers.join(','),
      ...workers.map(p => [
        `"${p.name}"`,
        p.totalTows,
        p.salary,
        p.retention,
        p.totalExpenses,
        p.netSalary
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Payroll_Summary_${months[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    const element = document.getElementById('payroll-ledger-table');
    if (!element) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: 10,
      filename: `Payroll_Summary_${months[selectedMonth]}_${selectedYear}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Calculating Global Payroll...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/salaries" className="p-3 bg-white border border-emerald-100 text-emerald-950 rounded-2xl hover:bg-emerald-50 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-emerald-950 tracking-tight">Consolidated <span className="text-emerald-600">Payroll</span></h1>
            <p className="text-slate-500 text-sm font-medium">Aggregated settlement intelligence for the current fiscal period.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-3xl border border-emerald-100 shadow-sm">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-emerald-950 cursor-pointer px-4 py-2 hover:bg-emerald-50 rounded-xl transition-all"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <div className="w-px h-6 bg-emerald-50"></div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-emerald-950 cursor-pointer px-4 py-2 hover:bg-emerald-50 rounded-xl transition-all"
          >
            {['2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/10"
            >
              <Download size={16} className="text-emerald-400" />
              <span>CSV</span>
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
            >
              <FileText size={16} className="text-emerald-100" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-emerald-100/20 group-hover:text-emerald-100/40 transition-colors">
            <Users size={80} />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="p-3 bg-emerald-50 rounded-2xl w-fit text-emerald-600">
                <Users size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Nodes</p>
                <h3 className="text-4xl font-black text-emerald-950 mt-1">{workers.length} Workers</h3>
             </div>
          </div>
        </div>
        <div className="bg-emerald-950 p-8 rounded-3xl shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors">
            <DollarSign size={80} />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="p-3 bg-white/10 rounded-2xl w-fit text-emerald-400">
                <Wallet size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.2em]">Total Liabilities</p>
                <h3 className="text-4xl font-black text-white mt-1">QAR {totalPayroll.toLocaleString()}</h3>
             </div>
          </div>
        </div>
      </div>

      <div id="payroll-ledger-table" className="bg-white rounded-3xl border border-emerald-100/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/30">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Worker Protocol</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Base Parameters</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Deductions</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Net Settlement</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-900/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {workers.map((p) => (
                <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                        {p.name?.charAt(0)}
                      </div>
                      <div>
                        <span className="block text-lg font-black text-emerald-950 leading-tight">{p.name}</span>
                        <span className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          <Truck size={10} className="text-emerald-400" /> {p.totalTows} Operations Conducted
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1">
                       <span className="block text-base font-black text-emerald-950 italic">QAR {Number(p.salary || 0).toLocaleString()}</span>
                       <span className="block text-[8px] font-bold text-emerald-600 uppercase tracking-widest">+ QAR {p.commission.toLocaleString()} Commission</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className="block text-[11px] font-black text-rose-500">-QAR {p.retention.toLocaleString()}</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase">(90% Hand Cash)</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="block text-[11px] font-black text-rose-400">-QAR {p.totalExpenses.toLocaleString()}</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase">(Expenses)</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 inline-block">
                       <span className="block text-xl font-black text-emerald-600">QAR {p.netSalary.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => alert('Settlement Record Locked & Paid')}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                      >
                        <CheckCircle2 size={14} />
                        <span>Authorize</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

