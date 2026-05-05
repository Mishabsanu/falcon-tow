'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiService } from '@/services/apiService';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  User,
  Truck
} from 'lucide-react';
import styles from './payroll.module.css';

export default function PayrollOverview() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/salaries/payroll-summary?month=${selectedMonth}&year=${selectedYear}`);
        const result = await res.json();
        
        if (result.success) {
          setWorkers(result.data); // result.data now contains calculated payroll
        }
      } catch (err) {
        console.error('Failed to fetch payroll data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedMonth, selectedYear]);

  const payrollData = workers;

  const totalPayroll = payrollData.reduce((sum, p) => sum + p.netSalary, 0);

  if (loading) return <div className="loading">Calculating Payroll...</div>;

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard/salaries" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={styles.title}>Monthly Payroll Overview</h1>
            <p className={styles.subtitle}>Consolidated salary calculations for all active workers.</p>
          </div>
        </div>
        
        <div className={styles.controls}>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className={styles.select}
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className={styles.select}
          >
            {['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-primary">
            <Download size={18} />
            <span>Export Payroll</span>
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass-card`}>
          <User size={24} color="var(--primary)" />
          <div>
            <label>Total Workers</label>
            <h3>{workers.length}</h3>
          </div>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <DollarSign size={24} color="var(--success)" />
          <div>
            <label>Total Net Payroll</label>
            <h3>QAR {totalPayroll.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Worker Name</th>
              <th>Base Salary</th>
              <th>Cash Collection (90%)</th>
              <th>Expenses</th>
              <th>Net Payable</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className={styles.workerInfo}>
                    <div className={styles.avatar}>{p.name?.charAt(0)}</div>
                    <div>
                      <span className={styles.nameText}>{p.name}</span>
                      <span className={styles.subtext}>{p.totalTows} jobs this month</span>
                    </div>
                  </div>
                </td>
                <td className={styles.boldAmount}>QAR {Number(p.salary || 0).toLocaleString()}</td>
                <td className={styles.deduction}>-QAR {p.retention.toLocaleString()}</td>
                <td className={styles.deduction}>-QAR {p.totalExpenses.toLocaleString()}</td>
                <td className={styles.netAmount}>QAR {p.netSalary.toLocaleString()}</td>
                <td>
                  <div className={styles.actionCell}>
                    <button className={styles.payBtn} onClick={() => alert('Payment recorded!')}>
                      <CheckCircle2 size={16} />
                      <span>Mark Paid</span>
                    </button>
                    <Link href={`/dashboard/users/${p.id}`} className={styles.viewBtn}>
                      <AlertCircle size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
