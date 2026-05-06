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
  Activity
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

      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="search-wrapper flex-1 relative">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by invoice ID or customer name..." 
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
      </motion.div>

      {/* Active Filter Chips */}
      {(filters.worker !== 'All' || filters.vehicle !== 'All' || filters.customer !== 'All' || filters.type !== 'All' || filters.startDate || filters.endDate) && (
        <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2">Active Invoices Filters:</span>
          
          {filters.worker !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Worker: {filters.worker}</span>
              <button onClick={() => setFilters(f => ({ ...f, worker: 'All' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {filters.vehicle !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Vehicle: {filters.vehicle}</span>
              <button onClick={() => setFilters(f => ({ ...f, vehicle: 'All' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {filters.customer !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Customer: {filters.customer}</span>
              <button onClick={() => setFilters(f => ({ ...f, customer: 'All' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {filters.type !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Type: {filters.type}</span>
              <button onClick={() => setFilters(f => ({ ...f, type: 'All' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {(filters.startDate || filters.endDate) && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Period: {filters.startDate || '...'} to {filters.endDate || '...'}</span>
              <button onClick={() => setFilters(f => ({ ...f, startDate: '', endDate: '' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          <button 
            onClick={() => {
              setFilters({ worker: 'All', vehicle: 'All', customer: 'All', type: 'All', startDate: '', endDate: '' });
            }}
            className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 ml-2"
          >
            Reset All
          </button>
        </div>
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
