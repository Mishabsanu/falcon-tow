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
  X,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import ExportCsvButton from '@/components/ExportCsvButton';
import styles from './page.module.css';
import { toast } from 'sonner';
import ResponsiveTable from '@/modules/common/components/ResponsiveTable';
import SummaryCard from '@/modules/common/components/SummaryCard';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ global: 0, totalAmount: 0, paidAmount: 0, dueAmount: 0 });

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
      if (result.summary) {
        setSummary(result.summary);
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
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await apiService.deleteRecord('invoices', id);
        toast.success('Invoice deleted');
        fetchInvoices();
      } catch (error) {
        toast.error(error.message || 'Failed to delete');
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
          <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">Invoice <span className="text-emerald-600">Ledger</span></h1>
          <p className={styles.subtitle}>Track payments and manage invoices.</p>
        </motion.div>
        <motion.div variants={item} className="flex flex-wrap gap-3 md:gap-4 items-center">
          <ExportCsvButton moduleKey="invoices" filename="Invoice_Ledger" />
          <Link href="/dashboard/invoices/new" className="btn-primary">
            <Plus size={18} />
            <span>New Invoice</span>
          </Link>
        </motion.div>
      </header>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-10">
        <SummaryCard 
          label="Billing Directory" 
          value={summary.global} 
          icon={Receipt} 
          color="emerald" 
          isLoading={loading}
        />
        <SummaryCard 
          label="Paid Collections" 
          value={`QAR ${Number(summary.paidAmount || 0).toLocaleString()}`} 
          icon={DollarSign} 
          color="blue" 
          isLoading={loading}
        />
        <SummaryCard 
          label="Outstanding Dues" 
          value={`QAR ${Number(summary.dueAmount || 0).toLocaleString()}`} 
          icon={Activity} 
          color="rose" 
          isLoading={loading}
        />
      </motion.div>

      <motion.div variants={item} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 mb-8">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search invoices (ID, Name, Amount)..."
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
            <span>{showFilters ? 'Hide Filter' : 'Show Filter'}</span>
          </button>
        </div>
      </motion.div>

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 space-y-8"
        >
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Filter Options</span>
            </div>

            {/* Active System Filters — Inside Panel */}
            {(filters.worker !== 'All' || filters.vehicle !== 'All' || filters.customer !== 'All' || filters.type !== 'All' || filters.startDate || filters.endDate) && (
              <div className="flex flex-wrap items-center gap-3 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
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
                  Clear Filters
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              {/* Worker Filter */}
              <div className="filter-group-premium">
                <UserCircle size={14} className="text-emerald-600" />
                <select 
                  value={filters.worker} 
                  onChange={(e) => setFilters(f => ({ ...f, worker: e.target.value }))}
                >
                  <option value="All">All Workers</option>
                  {filterOptions.workers.map(w => <option key={w.id || w._id} value={w.name}>{w.name}</option>)}
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
                  {filterOptions.vehicles.map(v => <option key={v.id || v._id} value={v.name}>{v.name}</option>)}
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
                  {filterOptions.customers.map(c => <option key={c.id || c._id} value={c.name}>{c.name}</option>)}
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">Date Range</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Search by date</span>
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

      <motion.div variants={item}>
        <ResponsiveTable
          headers={[
            { label: "Invoice Number" },
            { label: "Customer Name" },
            { label: "Issue Date" },
            { label: "Payment Type" },
            { label: "Grand Total" },
            { label: "Amount Paid" },
            { label: "Due Balance" },
            { label: "Billing Status" },
            { label: "Commission Status" },
            { label: "Created By" },
            { label: "Actions", style: { textAlign: 'right' } }
          ]}
          data={invoices}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          renderRow={(inv) => {
            const getHiddenCharges = (i) => {
              if (i.totalHiddenCharges !== undefined && i.totalHiddenCharges !== null) {
                return Number(i.totalHiddenCharges);
              }
              const lines = i.towDetails || i.jobs || [];
              return lines.reduce((sum, job) => sum + Number(job.serviceCommission || 0), 0);
            };
            const hiddenCharges = getHiddenCharges(inv);

            return (
              <tr key={inv.id}>
                <td><span className={styles.invId}>{inv?.id || 'N/A'}</span></td>
                <td>
                  <span className={styles.nameText}>{inv?.customer || 'Unknown'}</span>
                  <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                    {inv?.companyName || 'Corporate Client'}
                  </div>
                </td>
                <td>{inv?.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                <td>
                  <div className={styles.typeCell}>
                    {(inv.type ?? 'Credit') === 'Cash' ? <DollarSign size={14} /> : <CreditCard size={14} />}
                    <span>{inv.type ?? 'Credit'}</span>
                  </div>
                </td>
                <td className={`amount ${styles.amountText}`}>QAR {Number(inv?.total ?? 0).toLocaleString()}</td>
                <td className={`amount ${styles.paidText}`}>QAR {Number(inv.paid ?? 0).toLocaleString()}</td>
                <td className={`amount ${styles.balanceText}`}>QAR {(Number(inv.total ?? 0) - Number(inv.paid ?? 0)).toLocaleString()}</td>
                <td>
                  <span className={`badge ${
                    inv?.status === 'Closed' ? 'badge-success' : 
                    inv?.status === 'Partial' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {inv?.status || 'Pending'}
                  </span>
                </td>
                <td>
                  {hiddenCharges > 0 ? (
                    <span className={`badge ${
                      inv.commissionStatus === 'Paid' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {inv.commissionStatus === 'Paid' ? 'Comm. Paid' : 'Comm. Unpaid'}
                    </span>
                  ) : (
                    <span className="badge badge-neutral">
                      No Commission
                    </span>
                  )}
                </td>
                <td>
                  <div className="text-[10px] font-bold text-emerald-950 uppercase tracking-tight">{inv.createdBy || 'System'}</div>
                  <div className="text-[9px] font-bold text-slate-400 mt-1">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-GB') : 'System Processed'}</div>
                </td>
                <td>
                  <div className={styles.actionCell}>
                    <Link href={`/dashboard/invoices/${inv.id}/edit`} className={styles.editBtn} title="Edit"><Edit3 size={16} /></Link>
                    <Link href={`/dashboard/invoices/${inv.id}`} className={styles.payBtn} title="View & Print">
                      <Eye size={16} />
                    </Link>
                    <Link href={`/dashboard/invoices/${inv.id}/report`} className={styles.reportBtn} title="View Report">
                      <FileText size={16} />
                    </Link>
                    <button className={styles.deleteBtn} title="Delete" onClick={() => handleDelete(inv.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          }}
          renderMobileCard={(inv) => {
            const getHiddenCharges = (i) => {
              if (i.totalHiddenCharges !== undefined && i.totalHiddenCharges !== null) {
                return Number(i.totalHiddenCharges);
              }
              const lines = i.towDetails || i.jobs || [];
              return lines.reduce((sum, job) => sum + Number(job.serviceCommission || 0), 0);
            };
            const hiddenCharges = getHiddenCharges(inv);

            return (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Receipt size={16} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">#{inv?.id || 'N/A'}</p>
                      <p className="text-sm font-black text-emerald-950 uppercase">{inv?.customer || 'Unknown'}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{inv?.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${
                      inv?.status === 'Closed' ? 'badge-success' : 
                      inv?.status === 'Partial' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {inv?.status || 'Pending'}
                    </span>
                    {hiddenCharges > 0 ? (
                      <span className={`badge ${
                        inv.commissionStatus === 'Paid' ? 'badge-success' : 'badge-danger'
                      }`}>
                        {inv.commissionStatus === 'Paid' ? 'Comm. Paid' : 'Comm. Unpaid'}
                      </span>
                    ) : (
                      <span className="badge badge-neutral">
                        No Commission
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-emerald-50">
                   <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Billed</p>
                      <p className="text-xs font-black text-emerald-950">QAR {inv.total || 0}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Balance</p>
                      <p className="text-xs font-black text-rose-600">QAR {(inv.total || 0) - (inv.paid || 0)}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Eye size={18} />
                    </Link>
                    <Link href={`/dashboard/invoices/${inv.id}/report`} className="p-3 bg-sky-50 text-sky-600 rounded-xl" title="View Report">
                      <FileText size={18} />
                    </Link>
                    <Link href={`/dashboard/invoices/${inv.id}/edit`} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Edit3 size={18} />
                    </Link>
                    <button onClick={() => handleDelete(inv.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">{inv.date || 'N/A'}</div>
                </div>
              </div>
            );
          }}
        />
      </motion.div>
    </motion.div>
  );
}
