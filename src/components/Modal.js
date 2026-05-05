'use client';
import { X, Zap } from 'lucide-react';
import styles from './Modal.module.css';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={styles.modal} 
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.header}>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Zap size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-emerald-950 tracking-tight">{title}</h2>
                  <p className="text-[9px] font-bold text-emerald-800/40 uppercase tracking-widest mt-0.5">Rapid Data Initialization</p>
                </div>
              </div>
              <button onClick={onClose} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </header>
            <div className={styles.content}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
