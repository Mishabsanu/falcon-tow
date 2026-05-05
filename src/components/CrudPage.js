'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';
import styles from './CrudPage.module.css';

export default function CrudPage({ moduleKey }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  

  const config = {
    customers: { title: 'Customers', path: '/dashboard/customers' },
    users: { title: 'User Management', path: '/dashboard/users' },
    vehicles: { title: 'Vehicles', path: '/dashboard/vehicles' },
    invoices: { title: 'Invoices', path: '/dashboard/invoices' },
    quotations: { title: 'Quotations', path: '/dashboard/quotations' },
    expenses: { title: 'Expenses', path: '/dashboard/expenses' },
    salaries: { title: 'Salaries', path: '/dashboard/salaries' },
    tows: { title: 'Tow Jobs', path: '/dashboard/tows' }
  }[moduleKey];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords(moduleKey, { q: search, page, status });
      setRecords(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [moduleKey, search, page, status]);

  useEffect(() => {
    setPage(1);
  }, [status, search, moduleKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await apiService.deleteRecord(moduleKey, id);
      toast.success('Record deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
             <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">Live Directory</span>
          </div>
          <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">
            {config.title} <span className="text-emerald-600">Module</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage your {config.title.toLowerCase()} and operational system records.</p>
        </div>
        <Link href={`${config.path}/new`} className="btn-primary">
          <Plus size={18} />
          <span>Register New Record</span>
        </Link>
      </header>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-white border border-emerald-100/50 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-xl group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder={`Search ${config.title.toLowerCase()} repository...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-emerald-100/50 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-600/50 transition-all outline-none text-emerald-950 font-semibold text-sm placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Filter Node Status</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Entities</option>
            <option value="Pending">Pending Review</option>
            <option value="In Progress">Active Process</option>
            <option value="Completed">Completed Task</option>
            <option value="Cancelled">Terminated</option>
            <option value="Active">System Active</option>
            <option value="Inactive">System Inactive</option>
            <option value="Paid">Cleared Ledger</option>
            <option value="Unpaid">Pending Balance</option>
          </select>
        </div>
      </div>

      <div className="glass-card !p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Identifier</th>
                <th>System Details</th>
                <th>Operational Status</th>
                <th className="text-right">Action Interface</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing with global ledger...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records detected in this cluster.</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <span className="text-emerald-800/30 font-bold text-xs uppercase">ID-{record.id}</span>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-emerald-950">{record.name || record.customer || record.id}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.email || record.phone || record.plate || record.vehicle}</p>
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${
                         record.status === 'Completed' || record.status === 'Paid' || record.status === 'Active' ? 'badge-success' :
                         ['In Progress', 'Pending'].includes(record.status) ? 'badge-warning' : 'badge-neutral'
                      }`}>
                         <div className={`h-1 w-1 rounded-full ${record.status === 'Completed' || record.status === 'Paid' || record.status === 'Active' ? 'bg-emerald-600' : 'bg-emerald-400'}`}></div>
                         {record.status || 'Active'}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`${config.path}/${record.id}`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="View Detail">
                          <Eye size={16} />
                        </Link>
                        <Link href={`${config.path}/${record.id}/edit`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Edit Parameters">
                          <Edit2 size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(record.id)} 
                          className="p-2.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                          title="Terminate Node"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-container">
          <p className="pagination-info">
            Visualizing {records.length} of {pagination.total || 0} active nodes
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`pagination-btn ${page === pageNum ? "pagination-btn-active" : ""}`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button 
              disabled={page >= (pagination.totalPages || 1)} 
              onClick={() => setPage(p => p + 1)}
              className="pagination-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
