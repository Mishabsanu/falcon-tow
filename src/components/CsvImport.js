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

            {/* DRAWER */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] p-8 md:p-12 flex flex-col border-l border-emerald-100"
            >
              <div className="flex justify-between items-center mb-12">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Data Import</div>
                  <h2 className="text-2xl font-bold tracking-tight text-emerald-950">Import <span className="text-emerald-600">Data</span></h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Import {moduleKey} from CSV</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-900 mb-1">Helpful Info</h4>
                  <p className="text-[10px] text-emerald-700/60 font-bold">Download the template and reference sheet to make sure your data is correct.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    <Download size={14} />
                    <span>Template</span>
                  </button>
                  <button
                    onClick={downloadReferenceData}
                    className="flex items-center gap-2 px-6 py-4 bg-white border border-emerald-200 text-emerald-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                  >
                    <FileText size={14} />
                    <span>Reference</span>
                  </button>
                </div>
              </div>

              <div className="space-y-14 flex-1 overflow-y-auto pr-2">
                {/* STEP 1 */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-emerald-900/20">1</div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-950">Get Template</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">Download the CSV file to see how to format your data.</p>
                  <button
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-3 py-5 border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-800 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:border-emerald-500 hover:bg-white hover:text-emerald-600 transition-all group"
                  >
                    <Download size={18} className="group-hover:animate-bounce" />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                {/* STEP 2 */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950 text-white text-xs font-bold flex items-center justify-center shadow-lg">2</div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-950">Upload CSV</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">Choose your CSV file. The system will automatically upload your records.</p>

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
                    className="w-full flex flex-col items-center justify-center gap-6 py-12 bg-emerald-50/50 rounded-3xl border-2 border-transparent hover:border-emerald-500 hover:bg-white transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-20 h-20 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <FileUp size={32} className="text-emerald-600" />
                    </div>
                    <div className="text-center space-y-2 relative z-10">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-950">
                        {importing ? 'Importing...' : 'Choose File'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Max size: 5MB</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-emerald-50">
                <div className="flex items-start gap-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <AlertCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-emerald-800/60 leading-relaxed uppercase tracking-wider">
                    Note: Use YYYY-MM-DD for dates. Make sure all required fields are filled.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
