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

    const visibleFields = config.fields.filter(f => (!f.hidden || f.name === 'status') && !f.readOnly && f.type !== 'file');
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

            {/* RIGHT SIDE DRAWER (COMPACT) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-[9999] flex flex-col border-l border-emerald-100"
            >
              {/* COMPACT HEADER */}
              <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/10">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-600 text-white rounded text-[7px] font-bold uppercase tracking-widest">Protocol 4.0</div>
                  <h2 className="text-xl font-black text-emerald-950">Import <span className="text-emerald-600">Engine</span></h2>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Target: {moduleKey} registry</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* STEP 1: PREPARE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">1</div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Prepare Data</h3>
                  </div>
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                    <p className="text-[9px] text-slate-500 font-bold mb-4 uppercase tracking-tight">Download the template and reference sheet first.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={downloadTemplate}
                        className="flex items-center justify-center gap-2 px-3 py-3 bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                      >
                        <Download size={12} />
                        <span>Template</span>
                      </button>
                      <button
                        onClick={downloadReferenceData}
                        className="flex items-center justify-center gap-2 px-3 py-3 bg-white border border-emerald-200 text-emerald-900 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
                      >
                        <FileText size={12} />
                        <span>Sub-Sheet</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* STEP 2: FORMAT */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-950 text-white text-[10px] font-bold flex items-center justify-center">2</div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Format Dates</h3>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={14} className="text-emerald-600 mt-0.5" />
                      <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase">
                        Dates must be <span className="text-emerald-600 font-black">YYYY-MM-DD</span>. <br/>
                        IDs must match the reference Sub-Sheet exactly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* STEP 3: UPLOAD */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">3</div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Final Upload</h3>
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
                    className="w-full flex flex-col items-center justify-center gap-4 py-10 bg-emerald-50/20 rounded-[2rem] border-2 border-dashed border-emerald-100 hover:border-emerald-500 hover:bg-white transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
                      <FileUp size={24} className="text-emerald-600" />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="block text-[11px] font-black text-emerald-950 uppercase tracking-tight">
                        {importing ? 'Processing...' : 'Upload CSV'}
                      </span>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">
                        Click to select local file
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* COMPACT FOOTER */}
              <div className="p-6 border-t border-emerald-50 bg-slate-50/50">
                <p className="text-[8px] font-black text-emerald-900/40 uppercase tracking-[0.2em] text-center">
                  Automated Data Validation Active
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
