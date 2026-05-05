'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiService } from '@/services/apiService';
import { 
  DollarSign, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  FileSpreadsheet,
  FileText,
  X
} from 'lucide-react';
import styles from './page.module.css';
import Modal from '@/components/Modal';
import WorkerSalaryDashboard from '@/components/WorkerSalaryDashboard';

// For PDF generation
const exportToPDF = () => {
  const element = document.querySelector('.data-table');
  if (!element) return;
  
  // Dynamic import to avoid SSR issues if any
  import('html2pdf.js').then((html2pdf) => {
    const opt = {
      margin: 10,
      filename: `Salaries_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf.default().from(element).set(opt).save();
  });
};

const exportToCSV = (data) => {
  if (!data || !data.length) return;
  
  const headers = ['Ref', 'Worker', 'Month', 'Year', 'Base Salary', 'Commission', 'Cash Deduction', 'Expenses', 'Net Amount', 'Status'];
  const csvContent = [
    headers.join(','),
    ...data.map(sal => [
      sal.id,
      `"${sal.worker}"`,
      sal.month,
      sal.year,
      sal.baseSalary,
      sal.retention,
      sal.cashDeduction90,
      sal.expenses,
      sal.amount,
      sal.status
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Salaries_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Salaries() {
  const [salaries, setSalaries] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const isWorker = user?.role === 'Worker';

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords('salaries', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit
      });
      setSalaries(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch salaries:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSalaries();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSalaries]);

  const handleDelete = async (id) => {
    if (isWorker) return; // Extra safety
    if (confirm('Are you sure you want to delete this salary record?')) {
      try {
        await apiService.deleteRecord('salaries', id);
        fetchSalaries();
      } catch (error) {
        alert(error.message || 'Failed to delete salary record');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (isWorker) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-emerald-950 tracking-tight">Your <span className="text-emerald-600">Earnings</span></h1>
            <p className="text-slate-500 text-sm font-medium">Access your monthly settlement archive and download payroll slips.</p>
          </div>
        </header>
        <WorkerSalaryDashboard user={user} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payroll & Salaries</h1>
          <p className={styles.subtitle}>{isWorker ? 'View your monthly settlements and payslips.' : 'Manage monthly worker settlements and performance-based commissions.'}</p>
        </div>
        {!isWorker && (
          <div className="flex gap-4 items-center">
            <Link href="/dashboard/salaries/payroll" className={styles.btnSecondary}>
              <Calendar size={18} />
              <span>Generate Payroll</span>
            </Link>
            <Link href="/dashboard/salaries/new" className="btn-primary">
              <Plus size={18} />
              <span>Record Payment</span>
            </Link>
          </div>
        )}
      </header>

      <div className="list-header">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search payroll history..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportToCSV(salaries)}
            className="flex items-center gap-2 px-4 py-2 border border-[#d8dee6] bg-white rounded-md text-[10px] font-black uppercase tracking-widest text-[#64748b] hover:bg-[#263238] hover:text-white transition-all"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Excel</span>
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 border border-[#d8dee6] bg-white rounded-md text-[10px] font-black uppercase tracking-widest text-[#64748b] hover:bg-[#263238] hover:text-white transition-all"
          >
            <FileText size={14} className="text-rose-500" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Worker / Period</th>
              <th>Financial Breakdown</th>
              <th>Total Deductions</th>
              <th>Net Settlement</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Synchronizing Payroll Data...</td></tr>
            ) : salaries.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No payroll records found.</td></tr>
            ) : (
              salaries.map((sal) => (
                <tr key={sal.id}>
                  <td><span className={styles.salId}>#{sal.id}</span></td>
                  <td>
                    <div className={styles.workerCell}>
                      <User size={14} className="text-[#f59e0b]" />
                      <div className="flex flex-col">
                        <span className="font-bold text-[#263238]">{sal.worker}</span>
                        <span className="text-[10px] text-[#64748b] font-medium uppercase tracking-widest">{sal.month} {sal.year}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#263238]">Base: QAR {Number(sal.baseSalary || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-600 font-black">Comm: +QAR {Number(sal.retention || 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-rose-500 font-bold">Cash: -QAR {Number(sal.cashDeduction90 || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-rose-400 font-bold">Exp: -QAR {Number(sal.expenses || 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-[#263238] italic">QAR {Number(sal.amount || 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${sal.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {sal.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button 
                        onClick={() => setSelectedSalary(sal)}
                        className={styles.viewBtn} 
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {!isWorker && (
                        <>
                          <Link href={`/dashboard/salaries/${sal.id}/edit`} className={styles.editBtn} title="Edit">
                            <Edit3 size={16} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(sal.id)}
                            className={styles.deleteBtn}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* View Modal */}
        {selectedSalary && (
          <Modal 
            isOpen={!!selectedSalary} 
            onClose={() => setSelectedSalary(null)} 
            title={`Salary Settlement #${selectedSalary.id}`}
          >
            <div className="p-8 space-y-8 bg-white">
              <div className="flex justify-between items-start border-b border-[#d8dee6] pb-6">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black text-[#263238] uppercase italic">{selectedSalary.worker}</h2>
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.3em]">{selectedSalary.month} {selectedSalary.year} PAYROLL</p>
                 </div>
                 <div className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest ${selectedSalary.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {selectedSalary.status}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="p-4 bg-[#f8fafc] rounded-md border border-[#d8dee6]">
                       <span className="block text-[8px] font-black text-[#64748b] uppercase tracking-widest mb-1">Base Salary</span>
                       <span className="text-lg font-black text-[#263238]">QAR {Number(selectedSalary.baseSalary || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-md border border-emerald-100">
                       <span className="block text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Commission (10%)</span>
                       <span className="text-lg font-black text-emerald-600">QAR {Number(selectedSalary.retention || 0).toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="p-4 bg-rose-50 rounded-md border border-rose-100">
                       <span className="block text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Cash Deductions (90%)</span>
                       <span className="text-lg font-black text-rose-500">-QAR {Number(selectedSalary.cashDeduction90 || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-md border border-rose-100">
                       <span className="block text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Expenses Reimbursement</span>
                       <span className="text-lg font-black text-rose-500">-QAR {Number(selectedSalary.expenses || 0).toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-[#263238] p-6 rounded-md flex justify-between items-center shadow-xl">
                 <span className="text-[10px] font-black text-[#f59e0b] uppercase tracking-[0.3em]">Final Net Settlement</span>
                 <span className="text-2xl font-black text-white italic">QAR {Number(selectedSalary.amount || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-end pt-4">
                 <button 
                  onClick={() => setSelectedSalary(null)}
                  className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-[#64748b] hover:text-[#263238]"
                 >
                  Close
                 </button>
              </div>
            </div>
          </Modal>
        )}

        <div className="pagination">
          <span className="page-info">
            Showing {salaries.length} of {pagination.total || 0} entries (Page {pagination.page} of {pagination.totalPages || 1})
          </span>
          <div className="page-controls">
            <button 
              className="page-btn" 
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button className="page-btn active">{pagination.page}</button>
            <button 
              className="page-btn" 
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
