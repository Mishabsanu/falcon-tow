'use client';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.search}>
        <Search size={20} color="#64748b" />
        <input type="text" placeholder="Global search..." />
      </div>
      
      <div className={styles.actions}>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
        <button className={styles.iconBtn} title="Settings">
          <Settings size={20} />
        </button>
        
        <div className={styles.divider}></div>
        
        <div className={styles.userMenu}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>Admin User</p>
            <p className={styles.userStatus}>Online</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
