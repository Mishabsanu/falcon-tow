'use client';
import { useEffect, useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/apiService';
import { 
  Truck, 
  Settings, 
  ArrowLeft, 
  Calendar, 
  History, 
  DollarSign, 
  User, 
  MapPin,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import styles from './view.module.css';

// Vehicle detailed analytics and reporting view
export default function VehicleDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [tows, setTows] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [vData, tData, eData] = await Promise.all([
          apiService.getRecord('vehicles', id),
          apiService.getAllRecords('tows'),
          apiService.getAllRecords('expenses')
        ]);

        setVehicle(vData);
        
        // Filter tows and expenses for this vehicle
        const vehicleName = vData?.name;
        const vehicleId = vData?.id;
        
        setTows(tData.filter(t => t.vehicle === vehicleName || t.vehicle === vehicleId));
        setExpenses(eData.filter(e => e.vehicle === vehicleName || e.vehicle === vehicleId));
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const stats = useMemo(() => {
    if (!vehicle) return null;
    const totalRevenue = tows.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const totalJobs = tows.length;

    // Group tows by driver
    const drivers = tows.reduce((acc, t) => {
      acc[t.driver] = (acc[t.driver] || 0) + 1;
      return acc;
    }, {});

    return { totalRevenue, totalExpenses, totalJobs, drivers };
  }, [vehicle, tows, expenses]);

  if (loading) return <div className={styles.loading}>Loading Vehicle Data...</div>;
  if (!vehicle) return <div className={styles.error}>Vehicle not found</div>;

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Fleet</span>
        </button>
        <div className={styles.headerActions}>
          <span className={`badge ${vehicle.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>
            {vehicle.status}
          </span>
        </div>
      </header>

      <div className={styles.profileGrid}>
        {/* Left Col: Vehicle Info */}
        <div className={styles.leftCol}>
          <div className={`${styles.card} glass-card`}>
            <div className={styles.userHeader}>
              <div className={styles.avatar}><Truck size={32} /></div>
              <div>
                <h1 className={styles.userName}>{vehicle.name}</h1>
                <p className={styles.userMeta}>Plate: {vehicle.plate}</p>
              </div>
            </div>
            
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <Calendar size={18} />
                <div>
                  <label>Last Service Date</label>
                  <p>{vehicle.lastService || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Settings size={18} />
                <div>
                  <label>Model Reference</label>
                  <p>{vehicle.modelRef || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Calendar size={18} />
                <div>
                  <label>Year of Manufacture</label>
                  <p>{vehicle.year || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <History size={18} />
                <div>
                  <label>Engine Reference</label>
                  <p>{vehicle.engineRef || 'N/A'}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <History size={18} />
                <div>
                  <label>Chassis Reference</label>
                  <p>{vehicle.chassisRef || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.card} glass-card`}>
            <div className={styles.cardHeader}>
              <AlertCircle size={20} color="var(--primary)" />
              <h2>Compliance & Legal</h2>
            </div>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <Calendar size={18} />
                <div>
                  <label>Insurance Expiry</label>
                  <p className={new Date(vehicle.insuranceExpiry) < new Date() ? styles.expired : ''}>
                    {vehicle.insuranceExpiry || 'Not Set'}
                  </p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Calendar size={18} />
                <div>
                  <label>Registration Expiry</label>
                  <p className={new Date(vehicle.registrationExpiry) < new Date() ? styles.expired : ''}>
                    {vehicle.registrationExpiry || 'Not Set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.card} glass-card`}>
            <div className={styles.cardHeader}>
              <User size={20} color="var(--primary)" />
              <h2>Assigned Drivers</h2>
            </div>
            <div className={styles.miniList}>
              {Object.entries(stats.drivers).length > 0 ? (
                Object.entries(stats.drivers).map(([driver, count]) => (
                  <div key={driver} className={styles.miniListItem}>
                    <span>{driver}</span>
                    <strong>{count} missions</strong>
                  </div>
                ))
              ) : (
                <p className={styles.emptyText}>No driver history.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Reports */}
        <div className={styles.rightCol}>
          <div className={styles.statsRow}>
            <div className={`${styles.miniCard} glass-card`}>
              <ClipboardList size={24} color="var(--primary)" />
              <div>
                <p className={styles.miniLabel}>Total Missions</p>
                <h3 className={styles.miniValue}>{stats.totalJobs}</h3>
              </div>
            </div>
            <div className={`${styles.miniCard} glass-card`}>
              <DollarSign size={24} color="var(--success)" />
              <div>
                <p className={styles.miniLabel}>Generated Revenue</p>
                <h3 className={styles.miniValue}>QAR {stats.totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
            <div className={`${styles.miniCard} glass-card`}>
              <AlertCircle size={24} color="var(--danger)" />
              <div>
                <p className={styles.miniLabel}>Total Expenses</p>
                <h3 className={styles.miniValue}>QAR {stats.totalExpenses.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          <div className={`${styles.card} glass-card`}>
            <div className={styles.cardHeader}>
              <History size={20} color="var(--primary)" />
              <h2>Service History (Daily Missions)</h2>
            </div>
            <div className={styles.historyList}>
              {tows.slice(0, 10).map(tow => (
                <div key={tow.id} className={styles.historyItem}>
                  <div className={styles.histMain}>
                    <span className={styles.histId}>{tow.id}</span>
                    <span className={styles.histDate}>{tow.date}</span>
                  </div>
                  <div className={styles.histDetails}>
                    <div className={styles.detailRow}>
                      <User size={14} /> <span>{tow.driver}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <MapPin size={14} /> <span>{tow.pickup} → {tow.dropoff}</span>
                    </div>
                    <span className={styles.histAmount}>QAR {tow.amount}</span>
                  </div>
                </div>
              ))}
              {tows.length === 0 && <p className={styles.emptyText}>No missions recorded yet.</p>}
            </div>
          </div>

          <div className={`${styles.card} glass-card`}>
            <div className={styles.cardHeader}>
              <DollarSign size={20} color="var(--danger)" />
              <h2>Maintenance & Fuel Expenses</h2>
            </div>
            <div className={styles.historyList}>
              {expenses.slice(0, 5).map(exp => (
                <div key={exp.id} className={styles.historyItem}>
                  <div className={styles.histMain}>
                    <span className={styles.expDesc}>{exp.description}</span>
                    <span className={styles.histDate}>{exp.date}</span>
                  </div>
                  <div className={styles.histDetails}>
                    <div className={styles.detailRow}>
                      <User size={14} /> <span>{exp.worker}</span>
                    </div>
                    <span className={styles.expAmount}>-QAR {exp.amount}</span>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && <p className={styles.emptyText}>No expenses logged for this vehicle.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
