'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { getModuleRecord, moduleData } from '@/lib/moduleData';
import styles from './CrudPage.module.css';

export default function ModuleView({ moduleKey, id }) {
  const config = moduleData[moduleKey];
  const [record, setRecord] = useState(() => getModuleRecord(moduleKey, id));
  const title = record?.[config.nameField] ?? config.title;

  useEffect(() => {
    fetch(`/api/${moduleKey}/${id}`)
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (result?.data) setRecord(result.data);
      });
  }, [id, moduleKey]);

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{config.title} Details</h1>
          <p className={styles.subtitle}>{title}</p>
        </div>
        <Link href={`${config.listPath}/${id}/edit`} className="btn-primary">
          <Edit3 size={18} />
          <span>Edit {config.title}</span>
        </Link>
      </header>

      <section className={`${styles.detailGrid} glass-card`}>
        {config.fields.map((field) => (
          <div key={field.name} className={styles.detailItem}>
            <span className={styles.detailLabel}>{field.label}</span>
            <span className={styles.detailValue}>{record?.[field.name] || '-'}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
