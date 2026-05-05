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
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './page.module.css';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords('invoices', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit
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
  }, [searchTerm, pagination.page, pagination.limit]);

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
        fetchInvoices();
      } catch (error) {
        alert('Failed to delete invoice');
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
          <button className={styles.btnSecondary}>
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <Link href="/dashboard/invoices/new" className="btn-primary">
            <Plus size={18} />
            <span>New Invoice</span>
          </Link>
        </motion.div>
      </header>

      <motion.div variants={item} className="list-header">
        <div className="search-wrapper">
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
      </motion.div>

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
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Loading invoices...</td></tr>
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
