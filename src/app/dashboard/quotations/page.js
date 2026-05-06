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
  CheckCircle2
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
      // 1. Update quotation status to Approved
      await apiService.updateRecord('quotations', q.id, { ...q, status: 'Approved' });

      // 2. Create new Tow entry
      const newTow = {
        customer: q.customer,
        vehicle: q.vehicle,
        driver: q.driver,
        pickup: q.pickup,
        dropoff: q.dropoff,
        date: q.date,
        amount: q.amount,
        status: 'Pending',
        paymentMethod: 'Cash'
      };

      const createdTow = await apiService.createRecord('tows', newTow);

      toast.success('Quotation Approved! A new Tow Job has been created.');
      router.push(`/dashboard/tows/${createdTow.id}`);
    } catch (error) {
      console.error('Failed to approve quotation:', error);
      toast.error('Failed to process approval.');
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="search-wrapper flex-1 relative">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search quotations..."
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
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2">Quote Filters:</span>
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
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
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
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading quotations...</td></tr>
            ) : quotations.map((q) => (
              <motion.tr key={q.id} variants={item}>
                <td><span className={styles.invId}>{q.id}</span></td>
                <td><span className={styles.nameText}>{q.customer}</span></td>
                <td>{q.date}</td>
                <td className="amount">QAR {Number(q.amount ?? 0).toLocaleString()}</td>
                <td>
                  <span className={`badge ${q.status === 'Approved' ? 'badge-success' :
                    q.status === 'Draft' ? 'badge-info' : 'badge-warning'
                    }`}>
                    {q.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actionCell}>
                    {q.status !== 'Approved' && (
                      <button
                        className={styles.payBtn}
                        style={{ color: '#10b981' }}
                        title="Approve & Create Tow"
                        onClick={() => handleApprove(q)}
                      >
                        <CheckCircle2 size={16} />
                      </button>
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
