'use client';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
