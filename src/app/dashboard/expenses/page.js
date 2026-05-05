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
  Truck
} from 'lucide-react';
import styles from './page.module.css';

import CsvImport from '@/components/CsvImport';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const isWorker = user?.role === 'Worker';

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords('expenses', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit
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
  }, [searchTerm, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchExpenses]);

  const handleDelete = async (id) => {
    if (isWorker) return;
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await apiService.deleteRecord('expenses', id);
        fetchExpenses();
      } catch (error) {
        alert(error.message || 'Failed to delete expense');
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
          <h1 className={styles.title}>Expense Management</h1>
          <p className={styles.subtitle}>{isWorker ? 'View and track your business-related expenses.' : 'Track business costs, fuel, and maintenance expenses.'}</p>
        </div>
        <div className="flex gap-4 items-center">
          {!isWorker && <CsvImport moduleKey="expenses" onComplete={fetchExpenses} />}
          <Link href="/dashboard/expenses/new" className="btn-primary">
            <Plus size={18} />
            <span>Add Expense</span>
          </Link>
        </div>
      </header>

      <div className="list-header">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by description, worker, or vehicle..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>
      </div>

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
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading expenses...</td></tr>
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
                    <span>{exp.vehicle}</span>
                  </div>
                </td>
                <td className={styles.amountText}>QAR {Number(exp.amount ?? 0).toLocaleString()}</td>
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
