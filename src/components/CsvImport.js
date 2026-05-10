'use client';
import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X, FileUp, FileText, Activity } from 'lucide-react';
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

        const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
        
        // Robust CSV splitter that handles quotes
        const splitCsvLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ''));
          return result;
        };

        const headers = splitCsvLine(rows[0]);
        const config = moduleData[moduleKey];
        
        // Create a lookup map: Label (lowercase) -> Internal Name
        const labelToNameMap = {};
        config.fields.forEach(field => {
          labelToNameMap[field.label.toLowerCase()] = field.name;
          labelToNameMap[field.name.toLowerCase()] = field.name;
        });

        const data = rows.slice(1).filter(r => r.trim()).map(row => {
          const values = splitCsvLine(row);
          const obj = {};
          headers.forEach((header, index) => {
            if (header) {
              const cleanHeader = header.trim().toLowerCase();
              // Map the CSV header back to the internal field name (case-insensitive)
              const internalName = labelToNameMap[cleanHeader] || cleanHeader;
              obj[internalName] = values[index];
            }
          });
          
          // Inject Audit Info
          obj.createdBy = user?.name || 'System';
          obj.createdById = user?._id || null;
          
          return obj;
        });

        toast.loading(`Syncing ${data.length} records...`);

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

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-2xl z-[9999] flex flex-col border-l border-emerald-100 overflow-hidden"
            >
              {/* HEADER (MICRO) */}
              <div className="p-3 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/10">
                <div className="space-y-0">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[5px] font-bold uppercase tracking-widest">Protocol Sync</div>
                  <h2 className="text-base font-black text-emerald-950 leading-tight">Bulk <span className="text-emerald-600">Import</span></h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 p-5 space-y-5 flex flex-col overflow-hidden">
                {/* INTEGRATED USER GUIDE (ENHANCED LEGIBILITY) */}
                <div className="bg-emerald-950 rounded-2xl p-5 text-white shadow-xl shadow-emerald-900/20">
                  <div className="flex items-center gap-2.5 mb-4">
                    <Activity size={16} className="text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Sync Protocol Guide</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <span className="text-[10px] font-black text-emerald-400 opacity-50">01</span>
                      <p className="text-[10px] font-bold leading-relaxed uppercase text-emerald-100/70">
                        Download <span className="text-white italic">CSV Form</span> & <span className="text-white italic">IDs Reference</span> to match system nodes.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-[10px] font-black text-emerald-400 opacity-50">02</span>
                      <p className="text-[10px] font-bold leading-relaxed uppercase text-emerald-100/70">
                        Ensure dates are <span className="text-emerald-400 font-black underline underline-offset-4">YYYY-MM-DD</span>. Do not change headers.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-[10px] font-black text-emerald-400 opacity-50">03</span>
                      <p className="text-[10px] font-bold leading-relaxed uppercase text-emerald-100/70">
                        Upload payload. System will auto-map fields and synchronize records.
                      </p>
                    </div>
                  </div>
                </div>

                {/* STEP 1: PREPARE */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-emerald-600/20">1</div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-950">Preparation</h3>
                  </div>
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 grid grid-cols-2 gap-3">
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center justify-center gap-2.5 px-3 py-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                    >
                      <Download size={14} />
                      <span>CSV Form</span>
                    </button>
                    <button
                      onClick={downloadReferenceData}
                      className="flex items-center justify-center gap-2.5 px-3 py-4 bg-white border border-emerald-200 text-emerald-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
                    >
                      <FileText size={14} />
                      <span>IDs Reference</span>
                    </button>
                  </div>
                </div>

                {/* STEP 2: UPLOAD (EXPANDED TO FILL) */}
                <div className="space-y-3 flex-1 flex flex-col pt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-emerald-600/20">2</div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-950">Data Execution</h3>
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
                    className="flex-1 w-full flex flex-col items-center justify-center gap-5 bg-emerald-50/20 rounded-[2.5rem] border-2 border-dashed border-emerald-100 hover:border-emerald-500 hover:bg-white transition-all group relative overflow-hidden"
                  >
                    <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-emerald-100 flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500">
                      <FileUp size={32} className="text-emerald-600" />
                    </div>
                    <div className="text-center space-y-2.5">
                      <span className="block text-sm font-black text-emerald-950 uppercase tracking-tight">
                        {importing ? 'Syncing Node...' : 'Sync CSV Payload'}
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Prepare • Format • Sync
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-3 border-t border-emerald-50 bg-slate-50/50 flex items-center justify-center">
                <p className="text-[6px] font-black text-emerald-900/20 uppercase tracking-[0.4em]">
                  Secure Node Transmission
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
