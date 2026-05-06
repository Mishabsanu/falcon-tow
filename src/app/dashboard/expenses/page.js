'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiService } from '@/services/apiService';
import { 
  Receipt, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  User,
  Truck,
  UserCircle,
  Calendar,
  Activity,
  CreditCard,
  X
} from 'lucide-react';
import styles from './page.module.css';
import { toast } from 'sonner';

import CsvImport from '@/components/CsvImport';
import ExportCsvButton from '@/components/ExportCsvButton';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // New Filters
  const [status, setStatus] = useState('All');
  const [filters, setFilters] = useState({
    worker: 'All',
    vehicle: 'All',
    type: 'All',
    startDate: '',
    endDate: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    workers: [],
    vehicles: []
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));

    async function loadOptions() {
      try {
        const [u, v] = await Promise.all([
          apiService.getAllRecords('users'),
          apiService.getAllRecords('vehicles')
        ]);
        setFilterOptions({
          workers: u.filter(user => user.role === 'Worker'),
          vehicles: v
        });
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    }
    loadOptions();
  }, []);

  const isWorker = user?.role === 'Worker';

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const extraParams = {};
      if (filters.worker !== 'All') extraParams.worker = filters.worker;
      if (filters.vehicle !== 'All') extraParams.vehicle = filters.vehicle;
      if (filters.startDate) extraParams.startDate = filters.startDate;
      if (filters.endDate) extraParams.endDate = filters.endDate;

      const result = await apiService.getRecords('expenses', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        extraParams
      });
      setExpenses(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchExpenses]);

  const handleDelete = async (id) => {
    if (isWorker) return;
    if (confirm('Permanently purge this expense record from the ledger?')) {
      try {
        await apiService.deleteRecord('expenses', id);
        toast.success('Expense record purged successfully');
        fetchExpenses();
      } catch (error) {
        toast.error(error.message || 'Purge operation failed');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const cleanVehicle = (v) => {
    if (!v) return '';
    return v.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
  };

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Expense Management</h1>
          <p className={styles.subtitle}>{isWorker ? 'View and track your business-related expenses.' : 'Track business costs, fuel, and maintenance expenses.'}</p>
        </div>
        <div className="flex gap-4 items-center">
          {!isWorker && <CsvImport moduleKey="expenses" onComplete={fetchExpenses} />}
          {!isWorker && <ExportCsvButton moduleKey="expenses" filename="Expense_Ledger" />}
          <Link href="/dashboard/expenses/new" className="btn-primary">
            <Plus size={18} />
            <span>Add Expense</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 mb-8">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search Operational Costs... (Expense ID, Category, Description)"
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
            <span>{showFilters ? 'System Active' : 'Filter Array'}</span>
          </button>
        </div>
      </div>

      {/* Active System Filters */}
      {(status !== 'All' || filters.worker !== 'All' || filters.vehicle !== 'All' || filters.type !== 'All' || filters.startDate || filters.endDate) && (
        <div className="flex flex-wrap items-center gap-3 mb-10 p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100/50">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40">Active Filters</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {status !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg shadow-emerald-600/20 hover:bg-rose-600 transition-all cursor-default">
                <span>Status: {status}</span>
                <button onClick={() => setStatus('All')} className="p-0.5 hover:bg-white/20 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {filters.worker !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Worker: {filters.worker}</span>
                <button onClick={() => setFilters(f => ({ ...f, worker: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {filters.vehicle !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Vehicle: {filters.vehicle}</span>
                <button onClick={() => setFilters(f => ({ ...f, vehicle: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {filters.type !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Category: {filters.type}</span>
                <button onClick={() => setFilters(f => ({ ...f, type: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {(filters.startDate || filters.endDate) && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Period: {filters.startDate || '...'} / {filters.endDate || '...'}</span>
                <button onClick={() => setFilters(f => ({ ...f, startDate: '', endDate: '' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setStatus('All');
              setFilters({ worker: 'All', vehicle: 'All', type: 'All', startDate: '', endDate: '' });
            }}
            className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2"
          >
            Clear Expense Map
          </button>
        </div>
      )}

      {showFilters && (
        <div className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Expense Query Engine</span>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Worker Filter */}
              <div className="filter-group-premium">
                <UserCircle size={14} className="text-emerald-600" />
                <select 
                  value={filters.worker} 
                  onChange={(e) => setFilters(f => ({ ...f, worker: e.target.value }))}
                >
                  <option value="All">All Workers</option>
                  {filterOptions.workers.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
              </div>

              {/* Vehicle Filter */}
              <div className="filter-group-premium">
                <Truck size={14} className="text-emerald-600" />
                <select 
                  value={filters.vehicle} 
                  onChange={(e) => setFilters(f => ({ ...f, vehicle: e.target.value }))}
                >
                  <option value="All">All Vehicles</option>
                  {filterOptions.vehicles.map(v => <option key={v.id} value={`${v.name} - ${v.plate}`}>{v.name} - {v.plate}</option>)}
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">Fiscal Period</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Temporal expense range</span>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border-2 border-emerald-100 rounded-2xl overflow-hidden focus-within:border-emerald-500/50 transition-all shadow-sm">
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-xs font-bold text-emerald-950 p-4 outline-none cursor-pointer"
                      value={filters.startDate}
                      onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                    />
                    <div className="flex items-center justify-center px-2">
                      <div className="w-6 h-[2px] bg-emerald-100 rounded-full"></div>
                    </div>
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-xs font-bold text-emerald-950 p-4 outline-none cursor-pointer"
                      value={filters.endDate}
                      onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>

                  {(filters.startDate || filters.endDate) && (
                    <button 
                      onClick={() => setFilters(f => ({ ...f, startDate: '', endDate: '' }))}
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
              <th>Expense ID</th>
              <th>Transaction Date</th>
              <th>Expense Description</th>
              <th>Assigned Worker</th>
              <th>Associated Vehicle</th>
              <th>Expense Amount</th>
              <th>Authorized By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading expenses...</td></tr>
            ) : expenses.map((exp) => (
              <tr key={exp.id}>
                <td><span className={styles.expId}>{exp.id}</span></td>
                <td>{exp.date}</td>
                <td><span className={styles.descriptionText}>{exp.description}</span></td>
                <td>
                  <div className={styles.workerCell}>
                    <User size={14} />
                    <span>{exp.worker}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.vehicleCell}>
                    <Truck size={14} />
                    <span>{cleanVehicle(exp.vehicle)}</span>
                  </div>
                </td>
                <td className={styles.amountText}>QAR {Number(exp.amount ?? 0).toLocaleString()}</td>
                <td>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-950 uppercase">{exp.createdBy || 'System'}</span>
                      <span className="text-[8px] text-slate-400">
                         {exp.createdBy === 'System' || !exp.createdBy ? 'System Log' : 'Admin Authorized'}
                      </span>
                   </div>
                </td>
                <td>
                  <div className={styles.actionCell}>
                    {!isWorker && (
                      <>
                        <Link href={`/dashboard/expenses/${exp.id}/edit`} className={styles.editBtn} title="Edit"><Edit3 size={16} /></Link>
                        <button className={styles.deleteBtn} title="Delete" onClick={() => handleDelete(exp.id)}><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && expenses.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No expenses found.</td></tr>
            )}
          </tbody>
        </table>
        
        <div className="pagination">
          <span className="page-info">
            Showing {expenses.length} of {pagination.total} expenses (Page {pagination.page} of {pagination.totalPages})
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
