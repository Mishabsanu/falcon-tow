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
  Download,
  DollarSign,
  CreditCard,
  Eye,
  User,
  Truck,
  UserCircle,
  Calendar,
  Activity,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import ExportCsvButton from '@/components/ExportCsvButton';
import styles from './page.module.css';
import { toast } from 'sonner';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // New Filters
  const [filters, setFilters] = useState({
    worker: 'All',
    vehicle: 'All',
    customer: 'All',
    type: 'All',
    startDate: '',
    endDate: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    workers: [],
    vehicles: [],
    customers: []
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [u, v, c] = await Promise.all([
          apiService.getAllRecords('users'),
          apiService.getAllRecords('vehicles'),
          apiService.getAllRecords('customers')
        ]);
        setFilterOptions({
          workers: u.filter(user => user.role === 'Worker'),
          vehicles: v,
          customers: c
        });
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    }
    loadOptions();
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const extraParams = {};
      if (filters.worker !== 'All') extraParams.worker = filters.worker;
      if (filters.vehicle !== 'All') extraParams.vehicle = filters.vehicle;
      if (filters.customer !== 'All') extraParams.customer = filters.customer;
      if (filters.type !== 'All') extraParams.type = filters.type;
      if (filters.startDate) extraParams.startDate = filters.startDate;
      if (filters.endDate) extraParams.endDate = filters.endDate;

      const result = await apiService.getRecords('invoices', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        extraParams
      });
      setInvoices(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  const handleDelete = async (id) => {
    if (confirm('Permanently purge this invoice record from the ledger?')) {
      try {
        await apiService.deleteRecord('invoices', id);
        toast.success('Invoice record purged successfully');
        fetchInvoices();
      } catch (error) {
        toast.error(error.message || 'Purge operation failed');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={container}
      className="animate-fade-in"
    >
      <header className={styles.header}>
        <motion.div variants={item}>
          <h1 className={styles.title}>Billing & Invoices</h1>
          <p className={styles.subtitle}>Track payments, manage credits, and issue official receipts.</p>
        </motion.div>
        <motion.div variants={item} className={styles.actions}>
          <ExportCsvButton moduleKey="invoices" filename="Invoice_Ledger" />
          <Link href="/dashboard/invoices/new" className="btn-primary">
            <Plus size={18} />
            <span>New Invoice</span>
          </Link>
        </motion.div>
      </header>

      <motion.div variants={item} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 mb-8">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search Financial Records... (Invoice ID, Customer, Amount)"
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
      </motion.div>

      {/* Active System Filters */}
      {(filters.worker !== 'All' || filters.vehicle !== 'All' || filters.customer !== 'All' || filters.type !== 'All' || filters.startDate || filters.endDate) && (
        <motion.div variants={item} className="flex flex-wrap items-center gap-3 mb-10 p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100/50">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40">Active Filters</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
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

            {filters.customer !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Customer: {filters.customer}</span>
                <button onClick={() => setFilters(f => ({ ...f, customer: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {filters.type !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg shadow-emerald-600/20 hover:bg-rose-600 transition-all cursor-default">
                <span>Type: {filters.type}</span>
                <button onClick={() => setFilters(f => ({ ...f, type: 'All' }))} className="p-0.5 hover:bg-white/20 rounded-md transition-colors">
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
              setFilters({ worker: 'All', vehicle: 'All', customer: 'All', type: 'All', startDate: '', endDate: '' });
            }}
            className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2"
          >
            Clear Financial Map
          </button>
        </motion.div>
      )}

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 space-y-8"
        >
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Financial Query Engine</span>
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

              {/* Customer Filter */}
              <div className="filter-group-premium">
                <User size={14} className="text-emerald-600" />
                <select 
                  value={filters.customer} 
                  onChange={(e) => setFilters(f => ({ ...f, customer: e.target.value }))}
                >
                  <option value="All">All Customers</option>
                  {filterOptions.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Payment Type Filter */}
              <div className="filter-group-premium">
                <CreditCard size={14} className="text-emerald-600" />
                <select 
                  value={filters.type} 
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="All">All Types</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit">Credit</option>
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">Billing Period</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Temporal audit range</span>
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
        </motion.div>
      )}

      <motion.div variants={item} className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Customer Name</th>
              <th>Issue Date</th>
              <th>Payment Type</th>
              <th>Grand Total</th>
              <th>Amount Paid</th>
              <th>Due Balance</th>
              <th>Billing Status</th>
              <th>Issued By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>Loading invoices...</td></tr>
            ) : invoices.map((inv) => (
              <motion.tr 
                key={inv.id}
                variants={item}
              >
                <td>
                  <span className={styles.invId}>{inv.id}</span>
                </td>
                <td>
                  <div className={styles.customerInfo}>
                    <span className={styles.nameText}>{inv.customer}</span>
                  </div>
                </td>
                <td>{inv.date}</td>
                <td>
                  <div className={styles.typeCell}>
                    {(inv.type ?? 'Credit') === 'Cash' ? <DollarSign size={14} /> : <CreditCard size={14} />}
                    <span>{inv.type ?? 'Credit'}</span>
                  </div>
                </td>
                <td className={`amount ${styles.amountText}`}>QAR {Number(inv.total ?? 0).toLocaleString()}</td>
                <td className={`amount ${styles.paidText}`}>QAR {Number(inv.paid ?? 0).toLocaleString()}</td>
                <td className={`amount ${styles.balanceText}`}>QAR {(Number(inv.total ?? 0) - Number(inv.paid ?? 0)).toLocaleString()}</td>
                <td>
                  <span className={`badge ${
                    inv.status === 'Paid' ? 'badge-success' : 
                    inv.status === 'Partial' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-950 uppercase">{inv.createdBy || 'System'}</span>
                      <span className="text-[8px] text-slate-400">
                         {inv.createdBy === 'System' || !inv.createdBy ? 'System Processed' : 'Billing Staff'}
                      </span>
                   </div>
                </td>
                <td>
                  <div className={styles.actionCell}>
                    <Link href={`/dashboard/invoices/${inv.id}/edit`} className={styles.editBtn} title="Edit"><Edit3 size={16} /></Link>
                    <Link href={`/dashboard/invoices/${inv.id}`} className={styles.payBtn} title="View & Print">
                      <Eye size={16} />
                    </Link>
                    <button className={styles.deleteBtn} title="Delete" onClick={() => handleDelete(inv.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {!loading && invoices.length === 0 && (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</td></tr>
            )}
          </tbody>
        </table>
        
        <div className="pagination">
          <span className="page-info">
            Showing {invoices.length} of {pagination.total} invoices (Page {pagination.page} of {pagination.totalPages})
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
      </motion.div>
    </motion.div>
  );
}
