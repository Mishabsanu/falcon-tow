'use client';
import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';

/**
 * Reusable CSV Export Button
 * - Only visible to Administrators
 * - Fetches all records for the module and triggers CSV download
 */
export default function ExportCsvButton({ moduleKey, filename }) {
  const [user, setUser] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const isAdmin = user?.role === 'Administrator' || user?.role === 'Admin';

  if (!isAdmin) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await apiService.getAllRecords(moduleKey);
      if (!data || data.length === 0) {
        toast.error('No data available for export');
        return;
      }

      // Filter out internal MongoDB fields and format dates
      const processedData = data.map(row => {
        const newRow = {};
        Object.keys(row).forEach(key => {
          // Skip internal MongoDB keys
          if (key === '_id' || key === '__v' || key.startsWith('_')) return;
          
          let val = row[key];
          
          // Format dates if they look like ISO strings or date objects
          if (val && (key.toLowerCase().includes('date') || key.toLowerCase().includes('at'))) {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
              val = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
            }
          }
          
          newRow[key] = val;
        });
        return newRow;
      });

      if (processedData.length === 0) return;

      const headers = Object.keys(processedData[0]);
      const csvContent = [
        headers.map(h => h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()).join(','), // Title Case headers
        ...processedData.map(row => 
          headers.map(header => {
            let val = row[header] === null || row[header] === undefined ? '' : row[header];
            if (typeof val === 'string') {
              val = val.replace(/"/g, '""');
              if (val.includes(',') || val.includes('\n')) val = `"${val}"`;
            }
            return val;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${filename || moduleKey}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${moduleKey.toUpperCase()} data exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export module data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-6 py-3 bg-white border border-emerald-100 text-emerald-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
    >
      <FileSpreadsheet size={16} className="text-emerald-600" />
      <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
    </button>
  );
}
