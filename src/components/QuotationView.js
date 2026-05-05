'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer, Download, ArrowLeft, Edit3, CheckCircle2 } from 'lucide-react';
import { apiService } from '@/services/apiService';
import styles from './InvoiceView.module.css'; // Reusing invoice styles

export default function QuotationView({ id }) {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const q = await apiService.getRecord('quotations', id);
        if (q) {
          setQuotation(q);
        }
      } catch (error) {
        console.error('Failed to load quotation details:', error);
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
      filename: `Quotation_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };

    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().set(opt).from(element).save();
  };

  const handleApproveAndConvert = async () => {
    if (!quotation) return;

    try {
      // 1. Update quotation status to Approved
      await apiService.updateRecord('quotations', id, { ...quotation, status: 'Approved' });

      // 2. Create new Tow entry
      const newTow = {
        customer: quotation.customer,
        vehicle: quotation.vehicle,
        driver: quotation.driver,
        pickup: quotation.pickup,
        dropoff: quotation.dropoff,
        date: quotation.date,
        amount: quotation.amount,
        status: 'Pending',
        paymentMethod: 'Cash' // Default
      };

      const createdTow = await apiService.createRecord('tows', newTow);
      
      alert('Quotation Approved! A new Tow Job has been created.');
      router.push(`/tows/${createdTow.id}`);
    } catch (error) {
      console.error('Failed to convert quotation to tow:', error);
      alert('Failed to process approval.');
    }
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

  if (loading) return <div className={styles.loading}>Loading Quotation...</div>;
  if (!quotation) return <div className={styles.error}>Quotation not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar + ' no-print'}>
        <Link href="/quotations" className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {quotation.status !== 'Approved' && (
            <button onClick={handleApproveAndConvert} className={styles.actionBtn} style={{ background: '#10b981' }}>
              <CheckCircle2 size={18} />
              <span>Approve & Create Tow</span>
            </button>
          )}
          <button onClick={handlePrint} className={styles.actionBtn}>
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button onClick={handleDownload} className={styles.pdfBtn}>
            <Download size={18} />
            <span>PDF</span>
          </button>
          <Link href={`/quotations/${id}/edit`} className={styles.editBtn}>
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
          <h1 className={styles.mainInvoiceTitle}>QUOTATION</h1>
        </div>

        <section className={styles.detailsSection}>
          <div className={styles.leftDetails}>
            <div style={{ marginBottom: '20px' }}>
              <span className={styles.sectionTitle}>Customer Details</span>
              <div className={styles.detailRow}><strong>{quotation.customer}</strong></div>
              <div className={styles.detailRow}>Doha, Qatar</div>
            </div>
            <div>
              <span className={styles.sectionTitle}>Service Details</span>
              <div className={styles.detailRow}><strong>Vehicle:</strong> {quotation.vehicle}</div>
              <div className={styles.detailRow}><strong>Pickup:</strong> {quotation.pickup}</div>
              <div className={styles.detailRow}><strong>Drop-off:</strong> {quotation.dropoff}</div>
            </div>
          </div>

          <div className={styles.rightDetails}>
            <span className={styles.sectionTitle}>Quotation Info</span>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span>Quote No:</span>
                <span>{id}</span>
              </div>
              <div className={styles.metaItem}>
                <span>Date:</span>
                <span>{quotation.date}</span>
              </div>
              <div className={styles.metaItem}>
                <span>Status:</span>
                <span style={{ color: quotation.status === 'Approved' ? '#10b981' : '#64748b' }}>{quotation.status}</span>
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
                  <strong>Towing Service / Roadside Assistance (Quoted)</strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
                    Transport Service from {quotation.pickup} to {quotation.dropoff}
                  </div>
                </td>
                <td>Nos</td>
                <td>1</td>
                <td>{Number(quotation.amount || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan="4" className={styles.totalLabelCell}>Total Quoted Amount (QAR)</td>
                <td className={styles.totalAmountCell}>{Number(quotation.amount || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.summarySection}>
          <div className={styles.wordsBox}>
            <p>Amount in words: Qatari Riyal {amountInWords(quotation.amount)} Only</p>
          </div>
        </div>

        <div className={styles.disclaimer}>
          <p>This is a computer-generated quotation. E & OE</p>
        </div>

        <div className={styles.signatureSection}>
          <div className={styles.signBox}>Customer Approval</div>
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
