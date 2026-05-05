'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer, Download, ArrowLeft, Edit3, MapPin } from 'lucide-react';
import { apiService } from '@/services/apiService';
import styles from './InvoiceView.module.css';

export default function TowJobView({ id }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await apiService.getRecord('tows', id);
        if (result) {
          setJob(result);
        }
      } catch (error) {
        console.error('Failed to load tow job details:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const element = document.querySelector(`.${styles.paper}`);
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `TowJob_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };

    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().set(opt).from(element).save();
  };

  if (loading) return <div className={styles.loading}>Loading Job Details...</div>;
  if (!job) return <div className={styles.error}>Job not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar + ' no-print'}>
        <Link href="/tows" className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handlePrint} className={styles.actionBtn}>
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button onClick={handleDownload} className={styles.pdfBtn}>
            <Download size={18} />
            <span>PDF</span>
          </button>
          <Link href={`/tows/${id}/edit`} className={styles.editBtn}>
            <Edit3 size={18} />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      <div className={styles.paper}>
        <header className={styles.paperHeader}>
          <img src="/logo-1.png" alt="Falcon Plus Garage" className={styles.logoImg} />
        </header>

        <div className={styles.invoiceTitleSection}>
          <h1 className={styles.mainInvoiceTitle}>TOWING JOB CARD</h1>
        </div>

        <section className={styles.detailsSection}>
          <div className={styles.leftDetails}>
            <div style={{ marginBottom: '20px' }}>
              <span className={styles.sectionTitle}>Customer Information</span>
              <div className={styles.detailRow}><strong>{job.customer}</strong></div>
              <div className={styles.detailRow}>Doha, Qatar</div>
            </div>
            <div>
              <span className={styles.sectionTitle}>Vehicle Details</span>
              <div className={styles.detailRow}><strong>Model:</strong> {job.vehicle}</div>
              <div className={styles.detailRow}><strong>Assigned Worker:</strong> {job.driver}</div>
            </div>
          </div>

          <div className={styles.rightDetails}>
            <span className={styles.sectionTitle}>Job Tracking</span>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span>Job ID:</span>
                <span>{id}</span>
              </div>
              <div className={styles.metaItem}>
                <span>Date:</span>
                <span>{job.date}</span>
              </div>
              <div className={styles.metaItem}>
                <span>Status:</span>
                <span style={{ fontWeight: 800, color: job.status === 'Completed' ? '#10b981' : '#f59e0b' }}>
                  {job.status}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span>Payment:</span>
                <span>{job.paymentMethod}</span>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.invoiceTableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th width="60">#</th>
                <th>Service Location Details</th>
                <th width="150">Charges</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center' }}>01</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <MapPin size={16} color="#ef4444" />
                    <strong>Pickup:</strong> {job.pickup}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} color="#10b981" />
                    <strong>Drop-off:</strong> {job.dropoff}
                  </div>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>
                  QAR {Number(job.amount || 0).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td colSpan="2" className={styles.totalLabelCell}>Total Amount (QAR)</td>
                <td className={styles.totalAmountCell}>QAR {Number(job.amount || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.disclaimer}>
          <p>This is a computer-generated job card. E & OE</p>
          <p>Service provided by Falcon Plus Garage Roadside Assistance Team.</p>
        </div>

        <div className={styles.signatureSection}>
          <div className={styles.signBox}>Customer Confirmation</div>
          <div className={styles.signBox}>Authorized Signature</div>
        </div>

        <footer className={styles.paperFooter}>
          <p>info@falconplusqa.com | www.falconplusqa.com</p>
          <p>Mob.: +974 3074 0770 / +974 7072 7121 | C.R. No. 210580</p>
          <p>Street No.: 27, Gate No.: 62, Industrial Area, Doha - Qatar.</p>
        </footer>
      </div>
    </div>
  );
}
