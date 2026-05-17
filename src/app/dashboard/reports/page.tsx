"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Calendar,
  Users,
  Download,
  Wallet,
  Clock,
  AlertTriangle,
  Users2,
  Truck,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState("invoices");

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchCustomers(),
        fetchWorkers(),
        fetchVehicles()
      ]);
      setLoading(false);
    };
    init();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers?limit=1000");
      const json = await res.json();
      setCustomers(json.data || (Array.isArray(json) ? json : []));
    } catch (err) {
      console.error("Customer sync error:", err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await fetch("/api/users?role=Worker&limit=1000");
      const json = await res.json();
      setWorkers(json.data || (Array.isArray(json) ? json : []));
    } catch (err) {
      console.error("Worker sync error:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles?limit=1000");
      const json = await res.json();
      setVehicles(json.data || (Array.isArray(json) ? json : []));
    } catch (err) {
      console.error("Vehicle sync error:", err);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data found for the selected filters.");
      return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]).join(",");
    
    // Create rows
    const rows = data.map(obj =>
      Object.values(obj).map(val => {
        // Escape quotes and wrap in quotes
        const stringVal = String(val || '').replace(/"/g, '""');
        return `"${stringVal}"`;
      }).join(",")
    ).join("\n");
    
    const csvContent = headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `falcon_tow_${filename}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async (data: any[], moduleName: string) => {
    const html2pdf = (await import('html2pdf.js')).default;
    const content = document.getElementById('export-content');
    const tableContainer = document.getElementById('export-table-container');
    const titleEl = document.getElementById('export-title');

    if (titleEl) titleEl.innerText = `${moduleName.replace(/-/g, ' ')} REPORT`;

    if (tableContainer && data.length > 0) {
      const headers = Object.keys(data[0]);
      tableContainer.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
          <thead>
            <tr style="background: #059669; color: white;">
              ${headers.map(h => `<th style="padding: 10px; text-align: left; text-transform: uppercase; font-size: 10px;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                ${headers.map(h => `<td style="padding: 10px; font-size: 10px; color: #1e293b;">${row[h]}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const opt = {
      margin: 10,
      filename: `falcon_tow_${moduleName}_report.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4' as const, orientation: 'landscape' as const }
    };

    if (!content) return;
    content.classList.remove('hidden');
    await html2pdf().set(opt).from(content).save();
    content.classList.add('hidden');
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    const moduleName = (document.getElementById('exportModule') as HTMLSelectElement).value;
    const start = (document.getElementById('exportStart') as HTMLInputElement).value;
    const end = (document.getElementById('exportEnd') as HTMLInputElement).value;
    const customer = (document.getElementById('exportCustomer') as HTMLSelectElement)?.value || 'All';
    const worker = (document.getElementById('exportWorker') as HTMLSelectElement).value;
    const vehicle = (document.getElementById('exportVehicle') as HTMLSelectElement).value;

    const promise = async () => {
      const res = await fetch(`/api/dashboard/export?module=${moduleName}&start=${start}&end=${end}&customer=${customer}&worker=${worker}&vehicle=${vehicle}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      if (format === 'excel') {
        exportToCSV(json.data, moduleName);
      } else {
        await exportToPDF(json.data, moduleName);
      }
    };

    toast.promise(promise(), {
      loading: `Generating ${moduleName} report...`,
      success: `Report downloaded successfully.`,
      error: (err) => `Failed to generate report: ${err.message}`
    });
  };

  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Reports...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20 px-4 md:px-0">
      {/* HEADER */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
           <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
           <span className="text-[9px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">Management System</span>
        </div>
        <h1 className="text-4xl font-black text-emerald-950 tracking-tight">
          Operational <span className="text-emerald-600">Reports</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium max-w-xl">
          Generate and export professional business reports, financial statements, and operational logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT: SELECTION */}
        <div className="lg:col-span-1 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Select Report Category</p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'invoices', label: 'Invoices & Billing', desc: 'Financial audit of all billed services and payment statuses.', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { id: 'tows', label: 'Tow Service Logs', desc: 'Comprehensive history of operational tow jobs and driver logs.', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
              { id: 'expenses', label: 'Company Expenses', desc: 'Breakdown of operational costs, vehicle maintenance, and overhead.', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
              { id: 'salaries', label: 'Payroll History', desc: 'Detailed tracking of employee commissions and monthly settlements.', icon: Users2, color: 'text-emerald-700', bg: 'bg-emerald-100/50' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedModule(item.id)}
                className={`flex items-start gap-4 p-6 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                  selectedModule === item.id 
                    ? 'bg-emerald-950 border-emerald-600 shadow-xl shadow-emerald-900/20 -translate-y-1' 
                    : 'bg-white border-emerald-100 hover:border-emerald-300 hover:shadow-lg'
                }`}
              >
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${selectedModule === item.id ? 'bg-emerald-800 text-emerald-400' : `${item.bg} ${item.color}`}`}>
                  <item.icon size={22} />
                </div>
                <div className="relative z-10">
                  <h3 className={`text-sm font-bold ${selectedModule === item.id ? 'text-white' : 'text-emerald-950'}`}>{item.label}</h3>
                  <p className={`text-[10px] mt-1 leading-relaxed ${selectedModule === item.id ? 'text-emerald-400/60' : 'text-slate-400'}`}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: FILTERS & ACTIONS */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 md:p-12 space-y-10 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-emerald-50 pb-8">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-950 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-900/20">
                    <FileCheck size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-emerald-950 tracking-tight capitalize">{selectedModule} Parameters</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Customize your export data</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-emerald-50/50 px-5 py-3 rounded-2xl border border-emerald-100/50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Report Insights</span>
                    <span className="text-[11px] font-bold text-emerald-800">
                      {selectedModule === 'invoices' && 'Financial Audit Ready'}
                      {selectedModule === 'tows' && 'Operational History'}
                      {selectedModule === 'expenses' && 'Cost Analysis Active'}
                      {selectedModule === 'salaries' && 'Payroll Compliance'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 ml-1">Report Module</label>
                  <select 
                    id="exportModule" 
                    value={selectedModule} 
                    onChange={(e) => setSelectedModule(e.target.value)} 
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="invoices">Invoices</option>
                    <option value="tows">Tow Jobs</option>
                    <option value="expenses">Expenses</option>
                    <option value="salaries">Salaries</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 ml-1">Date Range (Start)</label>
                  <input 
                    type="date" 
                    id="exportStart" 
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 ml-1">Date Range (End)</label>
                  <input 
                    type="date" 
                    id="exportEnd" 
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm" 
                  />
                </div>

                {['invoices', 'tows'].includes(selectedModule) && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 ml-1">Filter by Customer</label>
                    <select 
                      id="exportCustomer" 
                      className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer"
                    >
                      <option value="All">All Customers</option>
                      {customers.map((c, i) => (
                        <option key={c.id || c._id || i} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 ml-1">Filter by Worker</label>
                  <select 
                    id="exportWorker" 
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="All">All Workers</option>
                    {workers.map((w, i) => (
                      <option key={w.id || w._id || i} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 ml-1">Filter by Vehicle</label>
                  <select 
                    id="exportVehicle" 
                    className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="All">All Vehicles</option>
                    {vehicles.map((v, i) => (
                      <option key={v.id || v._id || i} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-8 bg-emerald-50/30 border-t border-emerald-100 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleExport('pdf')}
                className="flex-1 flex items-center justify-center gap-3 bg-emerald-950 px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-900/20 transition-all hover:bg-black active:scale-95 rounded-xl group"
              >
                <div className="p-1.5 bg-emerald-800 rounded-lg group-hover:bg-emerald-700 transition-colors">
                  <Download size={14} className="text-emerald-400" />
                </div>
                Generate PDF Report
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-emerald-950 text-emerald-950 px-8 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-900/5 group"
              >
                <div className="p-1.5 bg-emerald-50 rounded-lg group-hover:bg-white/20 transition-colors">
                  <FileText size={14} className="text-emerald-600 group-hover:text-white" />
                </div>
                Export CSV / Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Export Content for PDF Generation */}
      <div id="export-content" className="hidden" style={{ background: '#ffffff', color: '#022c22', fontFamily: 'sans-serif' }}>
        <div style={{ padding: '40px' }}>
          <h1 id="export-title" style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '30px', color: '#022c22' }}></h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #022c22', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '4px' }}>Company</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#022c22' }}>Falcon Tow Management</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '4px' }}>Report Date</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#022c22' }}>{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div id="export-table-container"></div>
        </div>
      </div>
    </div>
  );
}
