'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiService } from '@/services/apiService';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  User,
  Calendar,
  Activity
} from 'lucide-react';
import styles from './page.module.css';
import { toast } from 'sonner';
import CsvImport from '@/components/CsvImport';
import ExportCsvButton from '@/components/ExportCsvButton';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // New Filters
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const extraParams = {};
      if (dateRange.startDate) extraParams.startDate = dateRange.startDate;
      if (dateRange.endDate) extraParams.endDate = dateRange.endDate;

      const result = await apiService.getRecords('customers', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        status: status,
        extraParams
      });
      setCustomers(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit, status, dateRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleDelete = async (id) => {
    if (confirm('Permanently purge this customer record from the directory?')) {
      try {
        await apiService.deleteRecord('customers', id);
        toast.success('Customer directory entry purged successfully');
        fetchCustomers();
      } catch (error) {
        toast.error(error.message || 'Purge operation failed');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>Manage your customer database and service history.</p>
        </div>
        <div className="flex gap-4 items-center">
          <CsvImport moduleKey="customers" onComplete={fetchCustomers} />
          <ExportCsvButton moduleKey="customers" filename="Customer_Database" />
          <Link href="/dashboard/customers/new" className="btn-primary">
            <Plus size={18} />
            <span>Add New Customer</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="search-wrapper flex-1 relative">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
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
      {(status !== 'All' || dateRange.startDate || dateRange.endDate) && (
        <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2">Customer Segment Filters:</span>
          
          {status !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Status: {status}</span>
              <button onClick={() => setStatus('All')} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {(dateRange.startDate || dateRange.endDate) && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Registered: {dateRange.startDate || '...'} to {dateRange.endDate || '...'}</span>
              <button onClick={() => setDateRange({ startDate: '', endDate: '' })} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          <button 
            onClick={() => {
              setStatus('All');
              setDateRange({ startDate: '', endDate: '' });
            }}
            className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 ml-2"
          >
            Reset All
          </button>
        </div>
      )}

      {showFilters && (
        <div className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Demographic Query Engine</span>
            </div>

            <div className="flex flex-wrap gap-3">
               {/* Status Filter */}
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-emerald-50 w-full">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/20">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">Registration Period</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Temporal onboarding range</span>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border-2 border-emerald-100 rounded-2xl overflow-hidden focus-within:border-emerald-500/50 transition-all shadow-sm">
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-xs font-bold text-emerald-950 p-4 outline-none cursor-pointer"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(f => ({ ...f, startDate: e.target.value }))}
                    />
                    <div className="flex items-center justify-center px-2">
                      <div className="w-6 h-[2px] bg-emerald-100 rounded-full"></div>
                    </div>
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-xs font-bold text-emerald-950 p-4 outline-none cursor-pointer"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>

                  {(dateRange.startDate || dateRange.endDate) && (
                    <button 
                      onClick={() => setDateRange({ startDate: '', endDate: '' })}
                      className="h-14 px-6 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      Clear Range
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Contact Number</th>
              <th>Street Address</th>
              <th>Account Status</th>
              <th>Registered By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading customers...</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.avatarMini}>{c.name?.charAt(0) ?? 'C'}</div>
                    <span className={styles.nameText}>{c.name}</span>
                  </div>
                </td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>
                  <span className={styles.addressText}>{c.address}</span>
                </td>
                <td>
                  <span className={`badge ${c.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {c.status}
                  </span>
                </td>
                <td>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-950 uppercase">{c.createdBy || 'System'}</span>
                      <span className="text-[8px] text-slate-400">Admin</span>
                   </div>
                </td>
                <td>
                  <div className={styles.actionCell}>
                    <Link href={`/dashboard/customers/${c.id}/edit`} className={styles.editBtn} title="Edit"><Edit3 size={16} /></Link>
                    <button 
                      className={styles.deleteBtn} 
                      title="Delete"
                      onClick={() => handleDelete(c.id)}
                    ><Trash2 size={16} /></button>
                    <Link href={`/dashboard/customers/${c.id}`} className={styles.moreBtn} title="View Details"><MoreHorizontal size={16} /></Link>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No customers found.</td></tr>
            )}
          </tbody>
        </table>
        
        <div className="pagination">
          <span className="page-info">
            Showing {customers.length} of {pagination.total} entries (Page {pagination.page} of {pagination.totalPages})
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
              disabled={pagination.page >= pagination.totalPages}
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
