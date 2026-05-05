"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  Filter,
  Download,
  ArrowRight,
  Target,
  Layers
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
      const list = json.data || (Array.isArray(json) ? json : []);
      console.log("Customers Sync:", list.length, "records");
      setCustomers(list);
    } catch (err) {
      console.error("Customer sync error:", err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await fetch("/api/workers?limit=1000");
      const json = await res.json();
      const list = json.data || (Array.isArray(json) ? json : []);
      console.log("Workers Sync:", list.length, "records");
      setWorkers(list);
    } catch (err) {
      console.error("Worker sync error:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles?limit=1000");
      const json = await res.json();
      const list = json.data || (Array.isArray(json) ? json : []);
      console.log("Vehicles Sync:", list.length, "records");
      setVehicles(list);
    } catch (err) {
      console.error("Vehicle sync error:", err);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj =>
      Object.values(obj).map(val => `"${val}"`).join(",")
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `falcon_tow_${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async (data: any[], moduleName: string) => {
    const html2pdf = (await import('html2pdf.js')).default;
    const titleEl = document.getElementById('export-title');
    const tableContainer = document.getElementById('export-table-container');
    const content = document.getElementById('export-content');

    if (titleEl) titleEl.innerText = `${moduleName.toUpperCase()} REPORT`;

    if (tableContainer && data.length > 0) {
      const headers = Object.keys(data[0]);
      tableContainer.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
          <thead>
            <tr style="background: #064e3b; color: white;">
              ${headers.map(h => `<th style="padding: 12px; text-align: left; text-transform: uppercase; font-size: 10px;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr style="border-bottom: 1px solid #ecfdf5;">
                ${headers.map(h => `<td style="padding: 12px; font-size: 11px; color: #064e3b;">${row[h]}</td>`).join('')}
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
    const module = (document.getElementById('exportModule') as HTMLSelectElement).value;
    const start = (document.getElementById('exportStart') as HTMLInputElement).value;
    const end = (document.getElementById('exportEnd') as HTMLInputElement).value;
    const customer = (document.getElementById('exportCustomer') as HTMLSelectElement).value;
    const worker = (document.getElementById('exportWorker') as HTMLSelectElement).value;
    const vehicle = (document.getElementById('exportVehicle') as HTMLSelectElement).value;

    const promise = async () => {
      const res = await fetch(`/api/dashboard/export?module=${module}&start=${start}&end=${end}&customer=${customer}&worker=${worker}&vehicle=${vehicle}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      if (format === 'excel') {
        exportToCSV(json.data, module);
      } else {
        await exportToPDF(json.data, module);
      }
    };

    toast.promise(promise(), {
      loading: `Preparing ${module} intelligence...`,
      success: `${module} report downloaded.`,
      error: (err) => `Export failed: ${err.message}`
    });
  };

  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <div className="garage-loader"></div>
      <p className="text-[10px] font-bold text-[#64748b]/40 uppercase tracking-widest">Synchronizing Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 px-1 md:px-0">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white border border-emerald-100 rounded-lg shadow-sm">
             <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">Global Intelligence Network</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-950 tracking-tight">
            Operational <span className="text-emerald-600">Analytics</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
            Generate professional-grade telemetry documentation and operational audit logs from the Falcon Tow central database.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-emerald-500 transition-all">
              <TrendingUp size={24} className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reports Built</p>
              <p className="text-xl font-bold text-emerald-950">1.2K+</p>
           </div>
           <div className="bg-emerald-950 p-5 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-400/10 blur-xl rounded-full"></div>
              <BarChart3 size={24} className="text-emerald-400 mb-2 relative z-10" />
              <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest relative z-10">Status</p>
              <p className="text-xl font-bold text-white relative z-10">ACTIVE</p>
           </div>
        </div>
      </div>

      {/* INTELLIGENCE CLUSTERS - QUICK CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'invoices', label: 'Billed Revenue', desc: 'Financial invoices and billing cycles', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { id: 'tows', label: 'Service Logs', desc: 'Real-time tow job telemetry', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { id: 'expenses', label: 'Operational Costs', desc: 'Fleet and personnel expenses', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { id: 'salaries', label: 'Payroll History', desc: 'Worker settlement ledger', icon: Users, color: 'text-emerald-700', bg: 'bg-emerald-100/50' }
        ].map((cluster) => (
          <button
            key={cluster.id}
            onClick={() => setSelectedModule(cluster.id)}
            className={`group text-left p-8 rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/10 ${
              selectedModule === cluster.id 
                ? 'bg-emerald-950 border-emerald-600 ring-4 ring-emerald-500/10 -translate-y-2' 
                : 'bg-white border-emerald-100 hover:border-emerald-300'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl ${selectedModule === cluster.id ? 'bg-emerald-800 text-emerald-400' : `${cluster.bg} ${cluster.color}`} flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}>
              <cluster.icon size={28} />
            </div>
            <h3 className={`text-lg font-bold tracking-tight mb-2 ${selectedModule === cluster.id ? 'text-white' : 'text-emerald-950'}`}>{cluster.label}</h3>
            <p className={`text-xs font-medium leading-relaxed ${selectedModule === cluster.id ? 'text-emerald-100/40' : 'text-slate-500'}`}>{cluster.desc}</p>
            {selectedModule === cluster.id && (
              <div className="mt-6 flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-left-2">
                Target Selected <ArrowRight size={14} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* DOCUMENT GENERATION WORKSPACE */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xl overflow-hidden relative group/workspace">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-emerald-50/30 opacity-0 group-hover/workspace:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
        
        <div className="bg-emerald-950 px-8 py-14 md:px-16 md:py-20 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10 text-center md:text-left max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight leading-tight">
              Intelligence <span className="text-emerald-400">Export Node</span>
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-emerald-400/40 mt-4 leading-loose">
              Initialize formal document synthesis protocols for the <span className="text-emerald-400">{selectedModule}</span> cluster.
            </p>
          </div>
          <div className="relative z-10 mt-10 md:mt-0">
             <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-800 rounded-full flex items-center justify-center border-4 border-emerald-600/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                <FileText className="text-emerald-400 animate-pulse" size={48} />
             </div>
          </div>
        </div>

        <div className="p-8 md:p-16 space-y-14 bg-[#fcfcfd]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-14 items-end">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 flex items-center gap-2">
                <Target size={14} /> Intelligence Cluster
              </label>
              <select
                id="exportModule"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full border-b-2 border-emerald-100 bg-transparent py-4 text-[13px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 cursor-pointer uppercase tracking-tight"
              >
                <option value="invoices">Invoices (Billed Revenue)</option>
                <option value="tows">Tow Jobs (Service Logs)</option>
                <option value="expenses">Expenses (Company Costs)</option>
                <option value="salaries">Salaries (Payroll History)</option>
              </select>
            </div>

            {/* Entity Filter - Only for Invoices and Tows */}
            {['invoices', 'tows'].includes(selectedModule) && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 flex items-center gap-2">
                   <Users size={14} /> Entity Filtering
                </label>
                <select id="exportCustomer" className="w-full border-b-2 border-emerald-100 bg-transparent py-4 text-[13px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 cursor-pointer uppercase">
                  <option value="All">Global (All Companies)</option>
                  {customers.map((c, i) => (
                    <option key={c.id || c._id || i} value={c.name}>{c.name || "Unnamed Customer"}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 flex items-center gap-2">
                 <Users size={14} /> Personnel Filter
              </label>
              <select id="exportWorker" className="w-full border-b-2 border-emerald-100 bg-transparent py-4 text-[13px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 cursor-pointer uppercase">
                <option value="All">All Workers</option>
                {workers.map((w, i) => (
                  <option key={w.id || w._id || i} value={w.name}>{w.name || "Unnamed Worker"}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 flex items-center gap-2">
                 <Layers size={14} /> Fleet Intelligence
              </label>
              <select id="exportVehicle" className="w-full border-b-2 border-emerald-100 bg-transparent py-4 text-[13px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 cursor-pointer uppercase">
                <option value="All">Global Fleet</option>
                {vehicles.map((v, i) => (
                  <option key={v.id || v._id || i} value={v.name || v.plate}>{v.name || v.plate || "Unnamed Vehicle"}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 flex items-center gap-2">
                 <Calendar size={14} /> Start Datum
              </label>
              <input type="date" id="exportStart" className="w-full border-b-2 border-emerald-100 bg-transparent py-4 text-[13px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500" />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40 flex items-center gap-2">
                 <Calendar size={14} /> End Datum
              </label>
              <input type="date" id="exportEnd" className="w-full border-b-2 border-emerald-100 bg-transparent py-4 text-[13px] font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 md:gap-10 pt-6">
            <button
              onClick={() => handleExport('pdf')}
              className="flex-1 group relative overflow-hidden bg-emerald-600 text-white py-6 md:py-8 rounded-2xl font-bold text-[11px] md:text-[12px] uppercase tracking-[0.3em] transition-all hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-900/30 active:scale-95 shadow-xl shadow-emerald-900/10"
            >
              <div className="relative z-10 flex items-center justify-center gap-4">
                <Download size={20} className="text-white group-hover:translate-y-1 transition-transform" />
                Synthesize PDF Document
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex-1 group flex items-center justify-center gap-4 border-2 border-emerald-950 text-emerald-950 py-6 md:py-8 rounded-2xl font-bold text-[11px] md:text-[12px] uppercase tracking-[0.3em] hover:bg-emerald-950 hover:text-white transition-all active:scale-95 shadow-lg shadow-emerald-900/5"
            >
              <FileText size={20} className="text-emerald-600 group-hover:text-emerald-400" />
              Excel / CSV Cluster Export
            </button>
          </div>
        </div>

        <div className="px-8 md:px-16 py-8 bg-emerald-50/20 border-t border-emerald-100 flex items-start sm:items-center gap-6">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shrink-0 shadow-sm">
            <AlertTriangle size={20} className="text-emerald-600" />
          </div>
          <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
             Security Protocol: Intelligence exports are compiled from active encrypted nodes. <br className="hidden md:block" />
             Verify operational parameters and date ranges before final document finalization.
          </p>
        </div>
      </div>

      {/* Hidden Export Content for PDF Generation */}
      <div id="export-content" className="hidden">
        <div className="p-20 bg-white">
          <h1 id="export-title" className="text-4xl font-bold uppercase mb-10 text-emerald-950"></h1>
          <div className="flex justify-between border-b-4 border-emerald-950 pb-6 mb-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-800/40">Generated By</p>
              <p className="text-xl font-bold text-emerald-950">Falcon Tow Intelligence Hub</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-800/40">Export Datum</p>
              <p className="text-xl font-bold text-emerald-950">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div id="export-table-container"></div>
        </div>
      </div>
    </div>
  );
}
