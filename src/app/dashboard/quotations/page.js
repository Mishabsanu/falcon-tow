'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/apiService';
import {
  FileText,
  Search,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Filter,
  Activity,
  X,
  Truck,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import ExportCsvButton from '@/components/ExportCsvButton';
import styles from '../invoices/page.module.css';
import { toast } from 'sonner';
import ResponsiveTable from '@/modules/common/components/ResponsiveTable';
import SummaryCard from '@/modules/common/components/SummaryCard';

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('All');
  const [summary, setSummary] = useState({ global: 0, total: 0, totalAmount: 0, statusCounts: {} });
  
  // New Filters
  const [filters, setFilters] = useState({
    customer: 'All',
    vehicle: 'All',
    worker: 'All',
    startDate: '',
    endDate: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    customers: [],
    vehicles: [],
    workers: []
  });

  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadOptions() {
      try {
        const [c, v, u] = await Promise.all([
          apiService.getAllRecords('customers'),
          apiService.getAllRecords('vehicles'),
          apiService.getAllRecords('users')
        ]);
        setFilterOptions({
          customers: c || [],
          vehicles: v || [],
          workers: (u || []).filter(user => user.role === 'Worker')
        });
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    }
    loadOptions();
  }, []);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const extraParams = {};
      if (filters.customer !== 'All') extraParams.customer = filters.customer;
      if (filters.vehicle !== 'All') extraParams.vehicle = filters.vehicle;
      if (filters.worker !== 'All') extraParams.driver = filters.worker; // Quotation model uses 'driver'
      if (filters.startDate) extraParams.startDate = filters.startDate;
      if (filters.endDate) extraParams.endDate = filters.endDate;

      const result = await apiService.getRecords('quotations', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        status: status,
        extraParams
      });
      setQuotations(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
      if (result.summary) {
        setSummary(result.summary);
      }
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit, status, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuotations();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchQuotations]);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this quote? This action is irreversible.')) {
      const toastId = toast.loading('Purging quotation from pipeline...');
      try {
        await apiService.deleteRecord('quotations', id);
        toast.success('Quotation purged successfully.', { id: toastId });
        fetchQuotations();
      } catch (error) {
        toast.error('Failed to purge quotation.', { id: toastId });
      }
    }
  };

  const [isApproving, setIsApproving] = useState(null);

  const handleApprove = async (q) => {
    toast(`Finalize Approval for ${q.id}?`, {
      description: `This will mark quotation ${q.id} as finalized and approved.`,
      action: {
        label: 'Confirm Approval',
        onClick: async () => {
          setIsApproving(q.id);
          try {
            await apiService.updateRecord('quotations', q.id, { ...q, status: 'Approved' });
            toast.success(`Quote ${q.id} Approved Successfully`);
            fetchQuotations();
          } catch (error) {
            toast.error('Failed to update system state.');
          } finally {
            setIsApproving(null);
          }
        }
      },
      cancel: { label: 'Cancel' }
    });
  };

  const handleStatusUpdate = async (id, status, label) => {
    if (!confirm(`Are you sure you want to mark this quote as ${label}?`)) return;
    try {
      const q = quotations.find(item => item.id === id);
      await apiService.updateRecord('quotations', id, { ...q, status });
      toast.success(`Quotation marked as ${label}`);
      fetchQuotations();
    } catch (error) {
      toast.error(`Failed to update status to ${label}`);
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
          <h1 className={styles.title}>Quotations</h1>
          <p className={styles.subtitle}>Manage customer quotes and finalize project approvals in the sales pipeline.</p>
        </motion.div>
        <motion.div variants={item} className="flex flex-wrap gap-3 md:gap-4 items-center">
          <ExportCsvButton moduleKey="quotations" filename="Quotations_Ledger" />
          <Link href="/dashboard/quotations/new" className="btn-primary">
            <Plus size={18} />
            <span>New Quotation</span>
          </Link>
        </motion.div>
      </header>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-10">
        <SummaryCard 
          label="Sales Pipeline" 
          value={summary.global} 
          icon={FileText} 
          color="emerald" 
          isLoading={loading}
        />
        <SummaryCard 
          label="Estimated Pipeline Value" 
          value={`QAR ${Number(summary.totalAmount || 0).toLocaleString()}`} 
          icon={Activity} 
          color="blue" 
          isLoading={loading}
        />
        <SummaryCard 
          label="Average Quote" 
          value={`QAR ${summary.total > 0 ? Math.round((summary.totalAmount || 0) / summary.total).toLocaleString() : 0}`} 
          icon={Plus} 
          color="amber" 
          isLoading={loading}
        />
      </motion.div>

      <motion.div variants={item} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 mb-8">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search Sales Intel... (Quote ID, Customer, Subject)"
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

      {/* Active System Filters */}
      {showFilters && (
        <div className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Sales Query Engine</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
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
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Approved">Approved</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rejected">Rejected</option>
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
                  {filterOptions.customers.map(c => (
                    <option key={c.id || c._id} value={c.name}>{c.name}</option>
                  ))}
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

              {/* Worker Filter */}
              <div className="filter-group-premium">
                <UserCircle size={14} className="text-emerald-600" />
                <select
                  value={filters.worker}
                  onChange={(e) => setFilters(f => ({ ...f, worker: e.target.value }))}
                >
                  <option value="All">All Workers</option>
                  {filterOptions.workers.map(w => (
                    <option key={w.id || w._id} value={w.name}>{w.name}</option>
                  ))}
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

            {/* Active Filter Chips — inside panel */}
            {(status !== 'All' || filters.customer !== 'All' || filters.vehicle !== 'All' || filters.worker !== 'All' || filters.startDate || filters.endDate) && (
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-emerald-50">
                <div className="flex items-center gap-2 mr-2">
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
                  {filters.customer !== 'All' && (
                    <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                      <span>Customer: {filters.customer}</span>
                      <button onClick={() => setFilters(f => ({ ...f, customer: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
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
                  {filters.worker !== 'All' && (
                    <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                      <span>Worker: {filters.worker}</span>
                      <button onClick={() => setFilters(f => ({ ...f, worker: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
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
                    setFilters({ customer: 'All', vehicle: 'All', worker: 'All', startDate: '', endDate: '' });
                  }}
                  className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear Pipeline View
                </button>
              </div>
            )}
          </div>
        </div>
      )}      <motion.div variants={item}>
        <ResponsiveTable
          headers={[
            { label: "Quote ID" },
            { label: "Customer" },
            { label: "Vehicle" },
            { label: "Estimated Date" },
            { label: "Quoted Amount" },
            { label: "Status" },
            { label: "Created By" },
            { label: "Actions", style: { textAlign: 'right' } }
          ]}
          data={quotations}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          renderRow={(q) => (
            <tr key={q.id}>
              <td><span className={styles.invId}>{q.id}</span></td>
              <td><span className={styles.nameText}>{q.customer}</span></td>
              <td>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-emerald-950 uppercase">{q.customerVehicle || 'N/A'}</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">{q.customerPlate || 'N/A'}</span>
                </div>
              </td>
              <td>{new Date(q.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
              <td className="amount">QAR {Number(q.amount ?? 0).toLocaleString()}</td>
              <td>
                <span className={`badge ${
                  q.status === 'Approved' ? 'badge-success' :
                  q.status === 'Draft' ? 'badge-info' : 
                  q.status === 'Cancelled' ? 'badge-error opacity-50' :
                  q.status === 'Rejected' ? 'badge-error' :
                  'badge-warning'
                  }`}>
                  {q.status}
                </span>
              </td>
              <td>
                <div className="text-[10px] font-bold text-emerald-950 uppercase tracking-tight">{q.createdBy || 'System'}</div>
                <div className="text-[9px] font-bold text-slate-400 mt-1">{q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : 'Initial Draft'}</div>
              </td>
              <td>
                <div className={styles.actionCell}>
                  {q.status !== 'Approved' && q.status !== 'Cancelled' && q.status !== 'Rejected' && (
                    <>
                      <button
                        className={styles.payBtn}
                        style={{ color: '#10b981' }}
                        title="Approve Quote"
                        disabled={isApproving !== null}
                        onClick={() => handleApprove(q)}
                      >
                        {isApproving === q.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      </button>
                      <button
                        className={styles.deleteBtn}
                        style={{ color: '#ef4444' }}
                        title="Reject"
                        onClick={() => handleStatusUpdate(q.id, 'Rejected', 'Rejected')}
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  <Link href={`/dashboard/quotations/${q.id}/edit`} className={styles.editBtn} title="Edit"><Edit3 size={16} /></Link>
                  <Link href={`/dashboard/quotations/${q.id}`} className={styles.payBtn} title="View & Export">
                    <Eye size={16} />
                  </Link>
                  <button className={styles.deleteBtn} title="Delete" onClick={() => handleDelete(q.id)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          )}
          renderMobileCard={(q) => (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">#{q.id}</p>
                    <p className="text-sm font-black text-emerald-950 uppercase">{q.customer}</p>
                  </div>
                </div>
                <span className={`badge ${
                  q.status === 'Approved' ? 'badge-success' :
                  q.status === 'Draft' ? 'badge-info' : 
                  'badge-warning'
                }`}>
                  {q.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-emerald-50">
                 <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quote Value</p>
                    <p className="text-xs font-black text-emerald-950">QAR {q.amount || 0}</p>
                 </div>
                 <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Date</p>
                    <p className="text-xs font-bold text-slate-500">{new Date(q.date).toLocaleDateString()}</p>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {q.status !== 'Approved' && (
                    <button onClick={() => handleApprove(q)} className="p-3 bg-emerald-600 text-white rounded-xl">
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  <Link href={`/dashboard/quotations/${q.id}/edit`} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Edit3 size={18} />
                  </Link>
                  <button onClick={() => handleDelete(q.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">{q.createdBy || 'System'}</div>
              </div>
            </div>
          )}
        />
      </motion.div>
    </motion.div>
  );
}
