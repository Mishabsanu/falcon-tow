'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer, Download, ArrowLeft, Edit3 } from 'lucide-react';
import { apiService } from '@/services/apiService';
import styles from './InvoiceView.module.css';

export default function InvoiceView({ id }) {
  const [invoice, setInvoice] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const inv = await apiService.getRecord('invoices', id);
        if (inv) {
          setInvoice(inv);
          if (inv.jobId) {
            const jobId = inv.jobId.split(' - ')[0];
            const job = await apiService.getRecord('tows', jobId);
            setJobDetails(job);
          }
        }
      } catch (error) {
        console.error('Failed to load invoice details:', error);
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
      filename: `Invoice_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };

    // Dynamically load html2pdf
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

  if (loading) return <div className={styles.loading}>Loading Invoice...</div>;
  if (!invoice) return <div className={styles.error}>Invoice not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar + ' no-print'}>
        <Link href="/invoices" className={styles.backBtn}>
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
          <Link href={`/invoices/${id}/edit`} className={styles.editBtn}>
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
          <h1 className={styles.mainInvoiceTitle}>INVOICE</h1>
        </div>

        <section className={styles.detailsSection}>
          <div className={styles.leftDetails}>
            <div style={{ marginBottom: '20px' }}>
              <span className={styles.sectionTitle}>Customer Details</span>
              <div className={styles.detailRow}><strong>{invoice.customer}</strong></div>
              <div className={styles.detailRow}>Doha, Qatar</div>
            </div>
            <div>
              <span className={styles.sectionTitle}>Vehicle & Job Details</span>
              <div className={styles.detailRow}><strong>Vehicle:</strong> {invoice.vehicle}</div>
              {jobDetails && (
                <>
                  <div className={styles.detailRow}><strong>Pickup:</strong> {jobDetails.pickup}</div>
                  <div className={styles.detailRow}><strong>Drop-off:</strong> {jobDetails.dropoff}</div>
                </>
              )}
            </div>
          </div>

          <div className={styles.rightDetails}>
            <span className={styles.sectionTitle}>Invoice Info</span>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span>Invoice No:</span>
                <span>{id}</span>
              </div>
              <div className={styles.metaItem}>
                <span>Date:</span>
                <span>{invoice.date}</span>
              </div>
              <div className={styles.metaItem}>
                <span>Status:</span>
                <span>{invoice.status}</span>
              </div>
              <div className={styles.metaItem}>
                <span>Job Ref:</span>
                <span>{invoice.jobId?.split(' - ')[0] || 'N/A'}</span>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.invoiceTableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th width="60">SI No.</th>
                <th>Item Description</th>
                <th width="80">Unit</th>
                <th width="80">Qty</th>
                <th width="120">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>
                <td>
                  <strong>Towing Service / Roadside Assistance</strong>
                  {jobDetails && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
                      Transport from {jobDetails.pickup} to {jobDetails.dropoff}
                    </div>
                  )}
                </td>
                <td>Nos</td>
                <td>1</td>
                <td>{Number(invoice.total || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan="4" className={styles.totalLabelCell}>Total Amount (QAR)</td>
                <td className={styles.totalAmountCell}>{Number(invoice.total || 0).toLocaleString()}</td>
              </tr>
            </tbody>
        </table>
      </div>

      <div className={styles.summarySection}>
        <div className={styles.wordsBox}>
          <p>Amount in words: Qatari Riyal {amountInWords(invoice.total)} Only</p>
        </div>
      </div>

      <div className={styles.disclaimer}>
        <p>This is a computer-generated invoice. E & OE</p>
      </div>

        <div className={styles.signatureSection}>
          <div className={styles.signBox}>Receiver&apos;s Signature</div>
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
