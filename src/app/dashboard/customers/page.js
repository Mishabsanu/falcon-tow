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
import ResponsiveTable from '@/modules/common/components/ResponsiveTable';
import CsvImport from '@/components/CsvImport';
import ExportCsvButton from '@/components/ExportCsvButton';
import SummaryCard from '@/modules/common/components/SummaryCard';

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
        <div className="flex flex-wrap gap-3 md:gap-4 items-center">
          <CsvImport moduleKey="customers" onComplete={fetchCustomers} />
          <ExportCsvButton moduleKey="customers" filename="Customer_Database" />
          <Link href="/dashboard/customers/new" className="btn-primary">
            <Plus size={18} />
            <span>Add New Customer</span>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-10">
        <SummaryCard 
          label="Total Directory Nodes" 
          value={pagination.total} 
          icon={Users} 
          color="emerald" 
        />
        <SummaryCard 
          label="Active Partnerships" 
          value={customers.filter(c => c.status === 'Active').length} 
          icon={Activity} 
          color="blue" 
        />
        <SummaryCard 
          label="Service Reach" 
          value={customers.length} 
          icon={Plus} 
          color="amber" 
        />
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 mb-8">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold text-emerald-950 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-xl shadow-slate-200/40"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
              showFilters 
                ? 'bg-emerald-950 text-emerald-400 shadow-emerald-900/40 border-transparent' 
                : 'bg-white text-emerald-700 border border-slate-100 hover:bg-emerald-50 shadow-slate-200/40'
            }`}
          >
            <Filter size={18} className={showFilters ? 'animate-pulse' : ''} />
            <span>{showFilters ? 'System Active' : 'Filter Ledger'}</span>
          </button>
        </div>
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

      <ResponsiveTable
        headers={[
          { label: "Full Name" },
          { label: "Email Address" },
          { label: "Contact Number" },
          { label: "Street Address" },
          { label: "Account Status" },
          { label: "Registered By" },
          { label: "Actions", style: { textAlign: 'right' } }
        ]}
        data={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        renderRow={(c) => (
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
        )}
        renderMobileCard={(c) => (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
                  {c.name?.charAt(0) ?? 'C'}
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-950 uppercase">{c.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.phone}</p>
                </div>
              </div>
              <span className={`badge ${c.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                {c.status}
              </span>
            </div>

            <div className="py-3 border-y border-emerald-50">
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
               <p className="text-xs font-bold text-emerald-950">{c.email || 'N/A'}</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Link href={`/dashboard/customers/${c.id}`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                <MoreHorizontal size={16} />
                <span>Details</span>
              </Link>
              <Link href={`/dashboard/customers/${c.id}/edit`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                <Edit3 size={16} />
                <span>Edit</span>
              </Link>
              <button onClick={() => handleDelete(c.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
