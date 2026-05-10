'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Truck,
  UserSquare2,
  FileText,
  Receipt,
  Bell,
  BarChart3,
  ClipboardList,
  DollarSign,
  LogOut
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { clsx } from 'clsx';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: ClipboardList, label: 'Tow Jobs', href: '/tows' },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: UserSquare2, label: 'User Management', href: '/users' },
  { icon: Truck, label: 'Vehicles', href: '/vehicles' },
  { icon: Receipt, label: 'Invoices', href: '/invoices' },
  { icon: FileText, label: 'Quotations', href: '/quotations' },
  { icon: Receipt, label: 'Expenses', href: '/expenses' },
  { icon: DollarSign, label: 'Salaries', href: '/salaries' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },


  { icon: Bell, label: 'Notifications', href: '/notifications' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const role = user?.role || 'Administrator';
  const isWorker = role === 'Worker';

  const filteredMenuItems = menuItems.filter(item => {
    if (isWorker) {
      // Worker only sees Dashboard, Tow Jobs, Expenses, Salaries
      return ['Dashboard', 'Tow Jobs', 'Expenses', 'Salaries'].includes(item.label);
    }
    return true; // Admin sees everything
  });

  const handleLogout = () => {
    localStorage.removeItem('isLogind');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/logo.jpeg" alt="Falcon Towing" className={styles.logoImg} />
      </div>
      <nav className={styles.nav}>
        {filteredMenuItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(styles.link, isActive && styles.linkActive)}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>{user?.name?.charAt(0) || 'A'}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.name || 'Loading...'}</p>
            <p className={styles.userRole}>{user?.role || 'Guest'}</p>
          </div>
          <button onClick={handleLogout} className="ml-auto text-slate-400 hover:text-rose-600 transition-colors" title="System Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
