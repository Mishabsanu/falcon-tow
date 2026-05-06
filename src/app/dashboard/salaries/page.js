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
import { toast } from 'sonner';

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
  const [status, setStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
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
        limit: pagination.limit,
        status: status
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
  }, [searchTerm, pagination.page, pagination.limit, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSalaries();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSalaries]);

  const handleDelete = async (id) => {
    if (isWorker) return; // Extra safety
    if (confirm('Permanently purge this salary record?')) {
      try {
        await apiService.deleteRecord('salaries', id);
        toast.success('Salary record purged successfully');
        fetchSalaries();
      } catch (error) {
        toast.error(error.message || 'Purge operation failed');
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-emerald-950 tracking-tight">
            Worker <span className="text-emerald-600">Earnings</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Audit worker settlements and manage monthly payroll performance.
          </p>
        </div>
        {!isWorker && (
          <div className="flex gap-4 items-center">
            <Link href="/dashboard/salaries/payroll" className="flex items-center gap-2 px-6 py-3 bg-white border border-emerald-100 text-emerald-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm">
               <Calendar size={18} className="text-emerald-600" />
               <span>Payroll Summary</span>
            </Link>
            <Link href="/dashboard/salaries/new" className="flex items-center gap-2 px-6 py-3 bg-emerald-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/20">
               <Plus size={18} className="text-emerald-400" />
               <span>Record Payment</span>
            </Link>
          </div>
        )}
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="search-wrapper flex-1 relative">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search salary records by worker name..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
            showFilters 
              ? 'bg-emerald-950 text-emerald-400 border-emerald-800 shadow-emerald-900/40' 
              : 'bg-white text-emerald-700 border border-emerald-100 hover:bg-emerald-50 shadow-emerald-900/5'
          }`}
        >
          <Filter size={18} />
          <span>{showFilters ? 'Hide Filters' : 'Filter View'}</span>
        </button>
      </div>

      {/* Active Filter Chips */}
      {status !== 'All' && (
        <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2">Payroll Filters:</span>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
            <span>Status: {status}</span>
            <button onClick={() => setStatus('All')} className="hover:text-rose-500 transition-colors"><Plus size={12} className="rotate-45" /></button>
          </div>
          <button 
            onClick={() => setStatus('All')}
            className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 ml-2"
          >
            Reset
          </button>
        </div>
      )}

      {showFilters && (
        <div className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Payroll Query Engine</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="filter-group-premium">
                <Activity size={14} className="text-emerald-600" />
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Settled</option>
                  <option value="Pending">Outstanding</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <WorkerSalaryDashboard user={user} adminMode={!isWorker} />
    </div>
  );
}
