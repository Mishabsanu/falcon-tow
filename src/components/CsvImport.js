'use client';
import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X, FileUp } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

        let successCount = 0;
        for (const record of data) {
          try {
            await apiService.createRecord(moduleKey, record);
            successCount++;
          } catch (err) {}
        }

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

  const downloadTemplate = () => {
    const templates = {
      customers: "name,email,phone,address,status",
      expenses: "date,amount,description,worker,vehicle",
      tows: "customer,vehicle,driver,pickup,dropoff,date,paymentMethod,amount,status"
    };
    const blob = new Blob([templates[moduleKey] || "name,description"], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleKey}_template.csv`;
    a.click();
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-3 border border-emerald-100 bg-white text-emerald-950 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm group"
      >
        <Upload size={14} className="text-emerald-600 group-hover:-translate-y-0.5 transition-transform" />
        <span>Import Node Data</span>
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
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Protocol 14-B</div>
                    <h2 className="text-2xl font-bold tracking-tight text-emerald-950">Data <span className="text-emerald-600">Importer</span></h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing intelligence for {moduleKey}</p>
                 </div>
                 <button 
                   onClick={() => setIsOpen(false)} 
                   className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="space-y-14 flex-1">
                 {/* STEP 1 */}
                 <div className="space-y-5">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-emerald-900/20">1</div>
                       <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-950">Acquire Template</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Download the official pre-formatted CSV template to ensure your telemetry matches system constraints.</p>
                    <button 
                      onClick={downloadTemplate}
                      className="w-full flex items-center justify-center gap-3 py-5 border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-800 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:border-emerald-500 hover:bg-white hover:text-emerald-600 transition-all group"
                    >
                       <Download size={18} className="group-hover:animate-bounce" />
                       Download CSV Structure
                    </button>
                 </div>

                 {/* STEP 2 */}
                 <div className="space-y-5">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-xl bg-emerald-950 text-white text-xs font-bold flex items-center justify-center shadow-lg">2</div>
                       <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-950">Initialize Sync</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Select your populated data cluster. Our core engine will automatically validate and map all records to the secure cloud node.</p>
                    
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
                            {importing ? 'Processing Database...' : 'Select CSV Cluster'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Maximum file size: 5.0 MB</span>
                       </div>
                    </button>
                 </div>
              </div>

              <div className="pt-8 border-t border-emerald-50">
                 <div className="flex items-start gap-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                    <AlertCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-emerald-800/60 leading-relaxed uppercase tracking-wider">
                       Validation Protocol: Ensure date formats are standardized (YYYY-MM-DD). All core metadata fields must be populated to prevent sync rejection.
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
