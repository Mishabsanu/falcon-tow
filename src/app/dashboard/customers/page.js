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
  MoreHorizontal
} from 'lucide-react';
import styles from './page.module.css';

import CsvImport from '@/components/CsvImport';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords('customers', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        status: status
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
  }, [searchTerm, pagination.page, pagination.limit, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await apiService.deleteRecord('customers', id);
        fetchCustomers();
      } catch (error) {
        alert('Failed to delete customer');
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
        <div className="flex gap-4 items-center">
          <CsvImport moduleKey="customers" onComplete={fetchCustomers} />
          <Link href="/dashboard/customers/new" className="btn-primary">
            <Plus size={18} />
            <span>Add New Customer</span>
          </Link>
        </div>
      </header>

      <div className="list-header">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>
        <div className="filter-group">
          <div className="filter-btn">
            <Filter size={18} />
            <select 
              className={styles.statusSelect} 
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
      </div>

      <div className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Contact Number</th>
              <th>Street Address</th>
              <th>Account Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading customers...</td></tr>
            ) : customers.map((c) => (
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
            ))}
            {!loading && customers.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No customers found.</td></tr>
            )}
          </tbody>
        </table>
        
        <div className="pagination">
          <span className="page-info">
            Showing {customers.length} of {pagination.total} entries (Page {pagination.page} of {pagination.totalPages})
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
