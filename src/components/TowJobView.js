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

  const amountInWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + amountInWords(num % 100) : '');
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest animate-pulse">Synchronizing Node...</p>
      </div>
    );
  }
  if (!job) return <div className={styles.error}>Job not found.</div>;

  const formattedDate = new Date(job.date).toLocaleDateString('en-GB');

  return (
    <div className={styles.container}>
      <div className={styles.toolbar + ' no-print'}>
        <button onClick={() => window.history.back()} className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Back to List</span>
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handlePrint} className={styles.actionBtn}>
            <Printer size={18} />
            <span>Print Job</span>
          </button>
          <button onClick={handleDownload} className={styles.pdfBtn}>
            <Download size={18} />
            <span>Export PDF</span>
          </button>
          <Link href={`/dashboard/tows/${id}/edit`} className={styles.editBtn}>
            <Edit3 size={18} />
            <span>Modify</span>
          </Link>
        </div>
      </div>

      <div id="invoice-paper" className={`${styles.paper} ${styles.invoicePaper}`}>
        <header className={styles.paperHeader}>
          <div className={styles.headerBrand}>
            <div className={styles.logoSection}>
              <img src="/logo-1.png" alt="Falcon Plus" className={styles.logoImg} />
            </div>
          </div>
          <div className={styles.headerContact}>
            <span>Tow Job Document</span>
            <strong>www.falconplusqa.com</strong>
          </div>
        </header>

        <section className={styles.invoiceMetaSection}>
          <div className={styles.titleArea}>
            <h1>TOW JOB CARD</h1>
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Job ID #</span>
                <span className={styles.metaValue}>{job.id}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Date</span>
                <span className={styles.metaValue}>{formattedDate}</span>
              </div>
            </div>
          </div>
          <div className={styles.clientArea}>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Customer</span>
              <span className={styles.clientValue}>{job.customer}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Address</span>
              <span className={styles.clientValue}>Doha, Qatar</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Worker</span>
              <span className={styles.clientValue}>{job.driver || 'N/A'}</span>
            </div>
          </div>
        </section>

        <div className={styles.invoiceTableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th width="34">SL</th>
                <th width="120">VEHICLE NAME</th>
                <th width="100">PLATE NO</th>
                <th>PICKUP</th>
                <th>DROPOFF</th>
                <th width="110" style={{ textAlign: 'right' }}>CHARGES</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>
                <td style={{ fontWeight: '700' }}>{job.customerVehicle || job.vehicle || 'N/A'}</td>
                <td style={{ fontWeight: '700' }}>{job.customerPlate || job.vehiclePlate || 'N/A'}</td>
                <td>{job.pickup}</td>
                <td>{job.dropoff}</td>
                <td className={styles.itemAmount}>
                  QAR {Number(job.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.invoiceTotalsTop}>
          <div className={styles.totalsArea}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal</span>
              <span className={styles.totalValue}>QAR {Number(job.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.grandTotalRow}>
              <span className={styles.grandLabel}>Total</span>
              <span className={styles.grandValue}>QAR {Number(job.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.notesArea}>
            <span className={styles.notesTitle}>Terms & Conditions / Notes</span>
            <p className={styles.notesText}>
              This is a computer-generated job card.
              Service provided by Falcon Plus Garage Roadside Assistance Team.
            </p>
            <p className={styles.thankYouText}>WE APPRECIATE YOUR BUSINESS</p>
            <div className={styles.paymentInfoBox}>
              <span className={styles.notesTitle}>Payment Method</span>
              <p className={styles.paymentMethodText}>{job.paymentMethod} Payment</p>
            </div>
            <div className={styles.wordsWrapper}>
              <p className={styles.wordsText}>Amount in words: Qatari Riyal {amountInWords(Math.round(job.amount || 0))} Only</p>
            </div>
          </div>
        </div>


        <footer className={styles.contactBar}>
          <div className={styles.contactItem}>
            <span>+974 3074 0770</span>
          </div>
          <div className={styles.contactItem}>
            <span>info@falconplusqa.com</span>
          </div>
          <div className={styles.contactItem}>
            <span>Industrial Area, Doha</span>
          </div>
          <div className={styles.contactItem}>
            <span>www.falconplusqa.com</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
