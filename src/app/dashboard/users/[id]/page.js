'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiService } from '@/services/apiService';
import { 
  User, 
  Truck, 
  Receipt, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  History,
  Download,
  FileText
} from 'lucide-react';
import styles from './view.module.css';

export default function UserDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tows, setTows] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [uData, tData, eData] = await Promise.all([
          apiService.getRecord('users', id),
          apiService.getAllRecords('tows'),
          apiService.getAllRecords('expenses')
        ]);

        setUser(uData);
        
        // Filter tows and expenses for this user
        const userName = uData?.name;
        
        setTows(tData.filter(t => t.driver === userName || t.driver === id || t.driverId === id));
        setExpenses(eData.filter(e => e.worker === userName || e.worker === id || e.workerId === id));
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const salaryBreakup = useMemo(() => {
    if (!user) return null;

    const baseSalary = Number(user.salary || 0);
    const cashTows = tows.filter(t => t.paymentMethod === 'Cash');
    const totalCashCollected = cashTows.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    
    const commission = totalCashCollected * 0.10;
    const retentionByWorker = totalCashCollected * 0.90;
    
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    
    // Net Salary = Base - 90% of Cash Tows - Expenses
    const netSalary = baseSalary - retentionByWorker - totalExpenses;

    return {
      baseSalary,
      totalCashCollected,
      commission,
      retentionByWorker,
      totalExpenses,
      netSalary,
      totalTows: tows.length
    };
  }, [user, tows, expenses]);

  if (loading) return <div className={styles.loading}>Loading User Profile...</div>;
  if (!user) return <div className={styles.error}>User not found</div>;

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Directory</span>
        </button>
        <div className={styles.headerActions}>
          <button className="btn-primary">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      <div className={styles.profileGrid}>
        {/* Left Col: Info & Salary Slip */}
        <div className={styles.leftCol}>
          <div className={`${styles.card} glass-card`}>
            <div className={styles.userHeader}>
              <div className={styles.avatar}>{user.name?.charAt(0)}</div>
              <div>
                <h1 className={styles.userName}>{user.name}</h1>
                <p className={styles.userMeta}>Employee ID: {user.id}</p>
              </div>
              <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                {user.status}
              </span>
            </div>
            
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <FileText size={18} />
                <div>
                  <label>Email Address</label>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Calendar size={18} />
                <div>
                  <label>Phone Number</label>
                  <p>{user.phone}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.salaryCard} glass-card`}>
            <div className={styles.cardHeader}>
              <FileText size={20} color="var(--primary)" />
              <h2>Monthly Salary Slip</h2>
            </div>
            
            <div className={styles.breakup}>
              <div className={styles.breakupRow}>
                <span>Base Salary</span>
                <span className={styles.amount}>QAR {salaryBreakup.baseSalary.toLocaleString()}</span>
              </div>
              <div className={styles.breakupRow}>
                <span>Total Cash Tows ({tows.filter(t => t.paymentMethod === 'Cash').length})</span>
                <span className={styles.amount}>QAR {salaryBreakup.totalCashCollected.toLocaleString()}</span>
              </div>
              <div className={`${styles.breakupRow} ${styles.deduction}`}>
                <span>Cash Retained by Driver (90%)</span>
                <span className={styles.amount}>-QAR {salaryBreakup.retentionByWorker.toLocaleString()}</span>
              </div>
              <div className={`${styles.breakupRow} ${styles.deduction}`}>
                <span>Total Expenses</span>
                <span className={styles.amount}>-QAR {salaryBreakup.totalExpenses.toLocaleString()}</span>
              </div>
              <div className={styles.divider}></div>
              <div className={`${styles.breakupRow} ${styles.total}`}>
                <span>Net Payable Salary</span>
                <span className={styles.amount}>QAR {salaryBreakup.netSalary.toLocaleString()}</span>
              </div>
            </div>
            
            <button className={styles.generateBtn}>
              <Receipt size={18} />
              <span>Generate Official Slip</span>
            </button>
          </div>
        </div>

        {/* Right Col: History & Reports */}
        <div className={styles.rightCol}>
          <div className={styles.statsRow}>
            <div className={`${styles.miniCard} glass-card`}>
              <Truck size={20} color="var(--primary)" />
              <div>
                <p className={styles.miniLabel}>Total Tows</p>
                <h3 className={styles.miniValue}>{salaryBreakup.totalTows}</h3>
              </div>
            </div>
            <div className={`${styles.miniCard} glass-card`}>
              <TrendingUp size={20} color="var(--success)" />
              <div>
                <p className={styles.miniLabel}>Efficiency</p>
                <h3 className={styles.miniValue}>94%</h3>
              </div>
            </div>
          </div>

          <div className={`${styles.card} glass-card`}>
            <div className={styles.cardHeader}>
              <History size={20} color="var(--primary)" />
              <h2>Recent Tow History</h2>
            </div>
            <div className={styles.historyList}>
              {tows.slice(0, 5).map(tow => (
                <div key={tow.id} className={styles.historyItem}>
                  <div className={styles.histMain}>
                    <span className={styles.histId}>{tow.id}</span>
                    <span className={styles.histDate}>{tow.date}</span>
                  </div>
                  <div className={styles.histDetails}>
                    <span>{tow.vehicle}</span>
                    <span className={tow.paymentMethod === 'Cash' ? styles.cashBadge : styles.otherBadge}>
                      {tow.paymentMethod}
                    </span>
                    <span className={styles.histAmount}>QAR {tow.amount}</span>
                  </div>
                </div>
              ))}
              {tows.length === 0 && <p className={styles.emptyText}>No tow history found.</p>}
            </div>
          </div>

          <div className={styles.reportsGrid}>
            <div className={`${styles.card} glass-card`}>
              <div className={styles.cardHeader}>
                <Truck size={18} color="var(--primary)" />
                <h3>Vehicle Usage</h3>
              </div>
              <div className={styles.miniList}>
                {Object.entries(tows.reduce((acc, t) => {
                  acc[t.vehicle] = (acc[t.vehicle] || 0) + 1;
                  return acc;
                }, {})).map(([vehicle, count]) => (
                  <div key={vehicle} className={styles.miniListItem}>
                    <span>{vehicle}</span>
                    <strong>{count} jobs</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.card} glass-card`}>
              <div className={styles.cardHeader}>
                <User size={18} color="var(--accent)" />
                <h3>Top Customers</h3>
              </div>
              <div className={styles.miniList}>
                {Object.entries(tows.reduce((acc, t) => {
                  acc[t.customer] = (acc[t.customer] || 0) + 1;
                  return acc;
                }, {})).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([customer, count]) => (
                  <div key={customer} className={styles.miniListItem}>
                    <span>{customer}</span>
                    <strong>{count} jobs</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`${styles.card} glass-card`}>
            <div className={styles.cardHeader}>
              <Receipt size={20} color="var(--danger)" />
              <h2>Expense History</h2>
            </div>
            <div className={styles.historyList}>
              {expenses.slice(0, 5).map(exp => (
                <div key={exp.id} className={styles.historyItem}>
                  <div className={styles.histMain}>
                    <span className={styles.expDesc}>{exp.description}</span>
                    <span className={styles.histDate}>{exp.date}</span>
                  </div>
                  <div className={styles.histDetails}>
                    <span>{exp.vehicle || 'General'}</span>
                    <span className={styles.expAmount}>-QAR {exp.amount}</span>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && <p className={styles.emptyText}>No expenses logged.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

