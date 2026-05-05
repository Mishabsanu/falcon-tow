'use client';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Edit3, History, User, Calendar, Filter, FileText, Download, ArrowLeft } from 'lucide-react';
import { moduleData } from '@/lib/moduleData';
import styles from './CrudPage.module.css';
import { toast } from 'sonner';

export default function CustomerView({ id }) {
  const config = moduleData.customers;
  const [record, setRecord] = useState(null);
  const [tows, setTows] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, towRes] = await Promise.all([
          fetch(`/api/customers/${id}`).then(r => r.json()),
          fetch(`/api/tows?limit=10000`).then(r => r.json())
        ]);

        if (custRes?.data) setRecord(custRes.data);
        
        if (towRes?.data) {
          // Filter tows by customer name or ID
          // Since records might have customerId or just customer name
          const customerName = custRes?.data?.name;
          const customerTows = towRes.data.filter(t => 
            t.customerId === id || t.customer === customerName
          );
          setTows(customerTows);
        }
      } catch (error) {
        toast.error("Failed to sync customer intelligence");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filteredTows = useMemo(() => {
    return tows.filter(t => {
      if (filters.start && t.date < filters.start) return false;
      if (filters.end && t.date > filters.end) return false;
      return true;
    });
  }, [tows, filters]);

  const exportPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('tow-history-report');
    
    const opt = {
      margin: 10,
      filename: `${record?.name || 'Customer'}_Tow_History.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    toast.loading("Generating History Report...");
    html2pdf().set(opt).from(element).save().then(() => toast.dismiss());
  };

  if (loading) return <div className="p-10 text-center uppercase font-black text-[#64748b]/40 tracking-widest">Loading Customer Dossier...</div>;

  return (
    <div className="animate-fade-in space-y-8">
      <header className={styles.header}>
        <div className="flex items-center gap-4">
           <Link href="/dashboard/customers" className="p-2 bg-white rounded-md border border-[#d8dee6] text-[#64748b] hover:bg-[#f7f4ef]">
              <ArrowLeft size={18} />
           </Link>
           <div>
              <h1 className={styles.title}>Customer Dossier</h1>
              <p className={styles.subtitle}>{record?.name}</p>
           </div>
        </div>
        <Link href={`/dashboard/customers/${id}/edit`} className="btn-primary">
          <Edit3 size={18} />
          <span>Edit Profile</span>
        </Link>
      </header>

      {/* TABS */}
      <div className="flex gap-2 border-b border-emerald-100">
         <button 
           onClick={() => setActiveTab('details')}
           className={`px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'details' ? 'border-emerald-600 text-emerald-950' : 'border-transparent text-slate-400 hover:text-emerald-700'}`}
         >
           Profile Intelligence
         </button>
         <button 
           onClick={() => setActiveTab('history')}
           className={`px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'history' ? 'border-emerald-600 text-emerald-950' : 'border-transparent text-slate-400 hover:text-emerald-700'}`}
         >
           Service History ({tows.length})
         </button>
      </div>

      {activeTab === 'details' ? (
        <section className={`${styles.detailGrid} bg-white rounded-2xl border border-emerald-100 p-10 shadow-sm`}>
          {config.fields.map((field) => (
            <div key={field.name} className={styles.detailItem}>
              <span className={styles.detailLabel}>{field.label}</span>
              <span className={styles.detailValue}>{record?.[field.name] || '-'}</span>
            </div>
          ))}
        </section>
      ) : (
        <div className="space-y-6">
           {/* FILTERS & ACTIONS */}
           <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex gap-8 items-end">
                 <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase text-emerald-800/40 tracking-widest">Start Datum</label>
                    <input 
                      type="date" 
                      className="block w-full border-b border-emerald-100 text-sm py-2 outline-none focus:border-emerald-500 text-emerald-950 font-medium"
                      value={filters.start}
                      onChange={e => setFilters({...filters, start: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase text-emerald-800/40 tracking-widest">End Datum</label>
                    <input 
                      type="date" 
                      className="block w-full border-b border-emerald-100 text-sm py-2 outline-none focus:border-emerald-500 text-emerald-950 font-medium"
                      value={filters.end}
                      onChange={e => setFilters({...filters, end: e.target.value})}
                    />
                 </div>
              </div>
              <button 
                onClick={exportPDF}
                className="flex items-center gap-3 bg-emerald-950 text-white px-8 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20"
              >
                <Download size={14} className="text-emerald-400" /> Export Dossier PDF
              </button>
           </div>

           {/* HISTORY TABLE */}
           <div id="tow-history-report" className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-10 border-b border-emerald-50 bg-emerald-50/20 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-emerald-950">Falcon Tow Intelligence - Customer History</h3>
                    <p className="text-[9px] font-bold text-emerald-800/40 uppercase tracking-[0.3em] mt-1">Detailed Service Logs for {record?.name}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-bold text-emerald-800/40 uppercase tracking-widest">Report Compiled</p>
                    <p className="text-sm font-bold text-emerald-950">{new Date().toLocaleDateString()}</p>
                 </div>
              </div>
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-emerald-950 text-white uppercase text-[9px] font-bold tracking-widest">
                       <th className="p-5 pl-10">Reference</th>
                       <th className="p-5">Date</th>
                       <th className="p-5">Routing</th>
                       <th className="p-5">Asset</th>
                       <th className="p-5">Method</th>
                       <th className="p-5">Amount</th>
                       <th className="p-5 pr-10 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-emerald-50">
                    {filteredTows.length > 0 ? filteredTows.map(tow => (
                       <tr key={tow.id} className="text-xs hover:bg-emerald-50/30 transition-colors">
                          <td className="p-5 pl-10 font-bold text-emerald-950">#{tow.id}</td>
                          <td className="p-5 text-slate-500 font-medium">{tow.date}</td>
                          <td className="p-5">
                             <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-emerald-950/60 flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500"></div> {tow.pickup}</span>
                                <span className="text-[10px] font-bold text-emerald-950/60 flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rose-400"></div> {tow.dropoff}</span>
                             </div>
                          </td>
                          <td className="p-5 text-emerald-950 font-bold">{tow.vehicle}</td>
                          <td className="p-5"><span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[9px] font-bold text-emerald-700">{tow.paymentMethod}</span></td>
                          <td className="p-5 font-bold text-emerald-950">QAR {Number(tow.amount || 0).toLocaleString()}</td>
                          <td className="p-5 pr-10 text-right">
                             <span className={`text-[9px] font-bold uppercase px-3 py-1.5 rounded-full ${
                                tow.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                                tow.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                             }`}>
                                {tow.status}
                             </span>
                          </td>
                       </tr>
                    )) : (
                       <tr>
                          <td colSpan={7} className="p-24 text-center text-emerald-800/20 font-bold uppercase text-[10px] tracking-[0.4em]">
                             No telemetry found for this intelligence window.
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
              <div className="p-8 bg-emerald-50/10 flex justify-end border-t border-emerald-50">
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-widest">Aggregate Historical Value</p>
                    <p className="text-2xl font-bold text-emerald-950">QAR {filteredTows.reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString()}</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
