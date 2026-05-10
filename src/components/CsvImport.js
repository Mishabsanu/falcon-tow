'use client';
import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X, FileUp, FileText } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { moduleData } from '@/lib/moduleData';

export default function CsvImport({ moduleKey, onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);

        if (rows.length < 2) {
          throw new Error('CSV is empty or missing headers');
        }

        const headers = rows[0].split(',').map(h => h.trim());
        const data = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });

        toast.loading(`Importing ${data.length} records...`);

        const result = await apiService.importRecords(moduleKey, data);
        const successCount = result.count || 0;

        toast.dismiss();
        toast.success(`Successfully imported ${successCount} records.`);
        if (onComplete) onComplete();
        setIsOpen(false);

      } catch (err) {
        toast.error(`Import failed: ${err.message}`);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  const downloadTemplate = async () => {
    const config = moduleData[moduleKey];
    if (!config) return;

    const visibleFields = config.fields.filter(f => !f.hidden && !f.readOnly && f.type !== 'file');
    const headers = visibleFields.map(f => f.label).join(',');

    // Add 1 sample row based on hints
    let sampleRow = "";
    try {
      const dropdownFields = visibleFields.filter(f => f.type === 'select');
      const hintData = {};
      for (const field of dropdownFields) {
        if (field.module) {
          const result = await apiService.getRecords(field.module, { limit: 1 });
          hintData[field.name] = (result.data || []).map(d => field.module === 'vehicles' ? `${d.name} - ${d.plate}` : d.name)[0] || "";
        } else if (field.options) {
          hintData[field.name] = field.options[0];
        }
      }
      sampleRow = visibleFields.map(f => `"${(hintData[f.name] || '').replace(/"/g, '""')}"`).join(',');
    } catch (e) { }

    const csvContent = [headers, sampleRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleKey}_template.csv`;
    a.click();
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    toast.success('Template downloaded successfully.');
  };

  const downloadReferenceData = async () => {
    toast.loading('Preparing reference data...');
    try {
      const workers = await apiService.getAllRecords('users');
      const vehicles = await apiService.getAllRecords('vehicles');
      const customers = await apiService.getAllRecords('customers');

      const headers = "TYPE,VALID_VALUE,EXTRA_INFO";
      const rows = [
        ...workers.map(w => `WORKER,"${w.name}","${w.id}"`),
        ...vehicles.map(v => `VEHICLE,"${v.name} - ${v.plate}","${v.id}"`),
        ...customers.map(c => `CUSTOMER,"${c.name}","${c.phone || c.id}"`)
      ];

      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${moduleKey}_reference_data.csv`;
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      toast.dismiss();
      toast.success('Reference sheet (Sub-Sheet) downloaded!');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to fetch reference data.');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 border border-emerald-100 bg-white text-emerald-950 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm group"
      >
        <Upload size={14} className="text-emerald-600 group-hover:-translate-y-0.5 transition-transform" />
        <span>Import Data</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* OVERLAY */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !importing && setIsOpen(false)}
              className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[9998]"
            />

            {/* DRAWER -> TRANSFORMED TO CENTERED MODAL */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden border border-emerald-100"
              >
                {/* HEADER */}
                <div className="p-8 md:p-10 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/30">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/10">Data Engine</div>
                    <h2 className="text-3xl font-black tracking-tighter text-emerald-950">Bulk <span className="text-emerald-600">Import</span></h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing {moduleKey} via CSV protocol</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-4 bg-white text-emerald-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-emerald-900/5 active:scale-90"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-12">
                  {/* UTILITIES SECTION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
                        <Download size={20} />
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-950 mb-2">CSV Template</h4>
                      <p className="text-[10px] text-slate-500 font-bold mb-6 leading-relaxed">Download the official schema to ensure data compatibility.</p>
                      <button
                        onClick={downloadTemplate}
                        className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        Download Template
                      </button>
                    </div>

                    <div className="group bg-slate-50/50 rounded-3xl p-6 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-500">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4 text-slate-600 group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-950 mb-2">Reference Sheet</h4>
                      <p className="text-[10px] text-slate-500 font-bold mb-6 leading-relaxed">Lookup IDs for Workers, Vehicles, and Customers.</p>
                      <button
                        onClick={downloadReferenceData}
                        className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                      >
                        Get Sub-Sheet
                      </button>
                    </div>
                  </div>

                  {/* UPLOAD ZONE */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="h-[1px] flex-1 bg-emerald-100"></div>
                       <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.3em]">Drop Zone</span>
                       <div className="h-[1px] flex-1 bg-emerald-100"></div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".csv"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className="w-full flex flex-col items-center justify-center gap-6 py-16 bg-white rounded-[2rem] border-4 border-dashed border-emerald-50 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-400/5 blur-3xl rounded-full"></div>
                      <div className="w-24 h-24 rounded-3xl bg-white border border-emerald-100 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
                        <FileUp size={40} className="text-emerald-600" />
                      </div>
                      <div className="text-center space-y-2 relative z-10">
                        <span className="block text-sm font-black text-emerald-950 uppercase tracking-tighter">
                          {importing ? 'Processing File...' : 'Choose CSV Payload'}
                        </span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-8">
                          Drag & drop or click to browse local storage
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* FOOTER TIPS */}
                <div className="p-8 bg-emerald-950 text-white flex items-center gap-6">
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                      <AlertCircle size={20} className="text-emerald-400" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] font-bold text-white uppercase tracking-widest leading-relaxed">
                         Protocol: Dates must follow <span className="text-emerald-400 font-black italic">YYYY-MM-DD</span>. 
                         Ensure reference IDs match the Sub-Sheet.
                      </p>
                   </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
