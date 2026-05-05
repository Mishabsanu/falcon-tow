'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiService } from '@/services/apiService';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileText,
  Filter,
  MapPin,
  Plus,
  Search,
  Trash2,
  Truck,
  User,
} from 'lucide-react';
import styles from './page.module.css';

import CsvImport from '@/components/CsvImport';

export default function Tows() {
  const [towJobs, setTowJobs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const isWorker = user?.role === 'Worker';

  const fetchTows = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords('tows', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        status: status
      });
      setTowJobs(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch tow jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTows();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTows]);

  const handleDelete = async (id) => {
    if (isWorker) return;
    if (confirm('Are you sure you want to delete this tow job?')) {
      try {
        await apiService.deleteRecord('tows', id);
        fetchTows();
      } catch (error) {
        alert(error.message || 'Failed to delete tow job');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const activeJobsCount = towJobs.filter((tow) => ['Pending', 'In Progress'].includes(tow.status)).length;
  const pageRevenue = towJobs.reduce((sum, tow) => sum + Number(tow.amount ?? 0), 0);

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tow Jobs</h1>
          <p className={styles.subtitle}>{isWorker ? 'Track your active tow requests and job status.' : 'Track every tow request from dispatch to completion.'}</p>
        </div>
        <div className="flex gap-4 items-center">
          {!isWorker && <CsvImport moduleKey="tows" onComplete={fetchTows} />}
          <Link href="/dashboard/tows/new" className="btn-primary">
            <Plus size={18} />
            <span>Create Tow Job</span>
          </Link>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className="glass-card">
          <span className={styles.summaryLabel}>{isWorker ? 'My Records' : 'Total Records'}</span>
          <strong className={styles.summaryValue}>{pagination.total}</strong>
        </div>
        <div className="glass-card">
          <span className={styles.summaryLabel}>{isWorker ? 'My Active Jobs' : 'Active Dispatch'}</span>
          <strong className={styles.summaryValue}>{activeJobsCount}</strong>
        </div>
        {!isWorker && (
          <div className="glass-card">
            <span className={styles.summaryLabel}>Page Revenue</span>
            <strong className={styles.summaryValue}>QAR {pageRevenue.toLocaleString()}</strong>
          </div>
        )}
      </div>

      <div className="list-header">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search job, customer, vehicle, driver..."
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
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job ID / Vehicle</th>
              <th>Customer</th>
              <th>Route</th>
              <th>Assigned Driver</th>
              <th>Service Date</th>
              <th>Service Charges</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading tow jobs...</td></tr>
            ) : towJobs.map((tow) => (
              <tr key={tow.id}>
                <td>
                  <div className={styles.jobCell}>
                    <div className={styles.iconBox}><Truck size={18} /></div>
                    <div>
                      <span className={styles.towId}>{tow.id}</span>
                      <span className={styles.subtext}>{tow.vehicle}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.customerCell}>
                    <User size={16} />
                    <div>
                      <span className={styles.nameText}>{tow.customer}</span>
                      <span className={styles.subtext}>{tow.phone}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.routeCell}>
                    <MapPin size={16} />
                    <span>{tow.pickup} to {tow.dropoff}</span>
                  </div>
                </td>
                <td>{tow.driver}</td>
                <td>
                  <div className={styles.dateCell}>
                    <CalendarDays size={16} />
                    <span>{tow.date}</span>
                  </div>
                </td>
                <td className={styles.amountText}>QAR {Number(tow.amount ?? 0).toLocaleString()}</td>
                <td>
                  <span className={`badge ${
                    tow.status === 'Completed' ? 'badge-success' :
                    ['In Progress', 'Pending'].includes(tow.status) ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {tow.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actionCell}>
                    {!isWorker && tow.status === 'Completed' && (
                      <Link 
                        href={`/dashboard/invoices/new?jobId=${tow.id}`} 
                        className={styles.invoiceBtn} 
                        title="Create Invoice"
                      >
                        <FileText size={16} />
                      </Link>
                    )}
                    <Link href={`/dashboard/tows/${tow.id}`} className={styles.viewBtn} title="View"><Eye size={16} /></Link>
                    {!isWorker && <Link href={`/dashboard/tows/${tow.id}/edit`} className={styles.moreBtn} title="Edit"><Edit3 size={16} /></Link>}
                    {!isWorker && <button className={styles.moreBtn} title="Delete" onClick={() => handleDelete(tow.id)}><Trash2 size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && towJobs.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No tow jobs found.</td></tr>
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span className="page-info">
            Showing {towJobs.length} of {pagination.total} jobs (Page {pagination.page} of {pagination.totalPages})
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
