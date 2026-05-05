'use client';
import { CheckCircle2, XCircle } from 'lucide-react';
import styles from './Toast.module.css';

export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  const Icon = type === 'error' ? XCircle : CheckCircle2;

  return (
    <div className={`${styles.toast} ${type === 'error' ? styles.error : styles.success}`} role="status">
      <Icon size={18} />
      <span>{message}</span>
    </div>
  );
}
