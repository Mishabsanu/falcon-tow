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
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import ExportCsvButton from '@/components/ExportCsvButton';
import styles from '../invoices/page.module.css';
import { toast } from 'sonner';

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords('quotations', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        status: status
      });
      setQuotations(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuotations();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchQuotations]);

  const handleDelete = async (id) => {
    if (confirm('Permanently purge this quotation record?')) {
      try {
        await apiService.deleteRecord('quotations', id);
        toast.success('Quotation purged successfully');
        fetchQuotations();
      } catch (error) {
        toast.error('Failed to purge quotation');
      }
    }
  };

  const handleApprove = async (q) => {
    if (!confirm(`Are you sure you want to approve Quote ${q.id} and create a Tow Job?`)) return;

    try {
      await apiService.updateRecord('quotations', q.id, { ...q, status: 'Approved' });
      
      const newTow = {
        customer: q.customer,
        customerId: q.customerId,
        vehicle: q.vehicle,
        vehicleId: q.vehicleId,
        driver: q.driver,
        driverId: q.driverId,
        pickup: q.pickup,
        dropoff: q.dropoff,
        date: q.date,
        amount: q.amount,
        status: 'Pending',
        paymentMethod: 'Cash'
      };

      const createdTow = await apiService.createRecord('tows', newTow);
      toast.success('Quotation Approved! Tow Job created.');
      router.push(`/dashboard/tows`);
    } catch (error) {
      toast.error('Failed to process approval.');
    }
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
          <p className={styles.subtitle}>Manage customer quotes and convert them to tow jobs once approved.</p>
        </motion.div>
        <motion.div variants={item} className={styles.actions}>
          <ExportCsvButton moduleKey="quotations" filename="Quotations_Ledger" />
          <Link href="/dashboard/quotations/new" className="btn-primary">
            <Plus size={18} />
            <span>New Quotation</span>
          </Link>
        </motion.div>
      </header>

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
            <span>{showFilters ? 'System Active' : 'Filter Array'}</span>
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
            </div>

            {/* Active Filter Chips — inside panel */}
            {status !== 'All' && (
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-emerald-50">
                <div className="flex items-center gap-2 mr-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40">Active Filters</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="group flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg shadow-emerald-600/20 hover:bg-rose-600 transition-all cursor-default">
                    <span>Status: {status}</span>
                    <button onClick={() => setStatus('All')} className="p-0.5 hover:bg-white/20 rounded-md transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setStatus('All')}
                  className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear Pipeline View
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <motion.div variants={item} className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Quote ID</th>
              <th>Customer</th>
              <th>Estimated Date</th>
              <th>Quoted Amount</th>
              <th>Status</th>
              <th>Created By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading quotations...</td></tr>
            ) : quotations.map((q) => (
              <motion.tr key={q.id} variants={item}>
                <td><span className={styles.invId}>{q.id}</span></td>
                <td><span className={styles.nameText}>{q.customer}</span></td>
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
                <td><span className={styles.nameText}>{q.createdBy || '—'}</span></td>
                <td>
                  <div className={styles.actionCell}>
                    {q.status !== 'Approved' && q.status !== 'Cancelled' && q.status !== 'Rejected' && (
                      <>
                        <button
                          className={styles.payBtn}
                          style={{ color: '#10b981' }}
                          title="Approve & Create Tow"
                          onClick={() => handleApprove(q)}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          className={styles.deleteBtn}
                          style={{ color: '#ef4444' }}
                          title="Reject"
                          onClick={() => handleStatusUpdate(q.id, 'Rejected', 'Rejected')}
                        >
                          <X size={16} />
                        </button>
                        <button
                          className={styles.editBtn}
                          style={{ color: '#64748b' }}
                          title="Cancel"
                          onClick={() => handleStatusUpdate(q.id, 'Cancelled', 'Cancelled')}
                        >
                          <Activity size={16} className="rotate-90" />
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
              </motion.tr>
            ))}
            {!loading && quotations.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No quotations found.</td></tr>
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span className="page-info">
            Showing {quotations.length} of {pagination.total} quotes
          </span>
          <div className="page-controls">
            <button
              className="page-btn"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeft size={16} />
            </button>
            <button className="page-btn active">{pagination.page}</button>
            <button
              className="page-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
