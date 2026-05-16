'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer, Download, ArrowLeft, Edit3, CheckCircle2, Phone, Mail, Globe, MapPin } from 'lucide-react';
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
    const element = document.getElementById('invoice-paper');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Quotation_${id}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2.5,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.clientWidth
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };

    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().set(opt).from(element).save();
  };

  const handleApprove = async () => {
    if (!quotation) return;

    try {
      // Update quotation status to Approved
      await apiService.updateRecord('quotations', id, { ...quotation, status: 'Approved' });

      setQuotation({ ...quotation, status: 'Approved' });
      alert('Quotation has been successfully Approved.');
    } catch (error) {
      console.error('Failed to approve quotation:', error);
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

  const shortDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
  };

  const currency = (val) => `QAR ${Number(val || 0).toFixed(2)}`;

  if (loading) return <div className={styles.loading}>Loading Quotation...</div>;
  if (!quotation) return <div className={styles.error}>Quotation not found.</div>;

  const formattedDate = shortDate(quotation.date);

  return (
    <div className={styles.container}>
      <div className={`${styles.toolbar} no-print`}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Back to List</span>
        </button>
        <div className={styles.toolbarActions}>
          {quotation.status !== 'Approved' && (
            <button onClick={handleApprove} className={`${styles.actionBtn} no-print`} style={{ background: '#10b981' }}>
              <CheckCircle2 size={16} />
              <span>Approve Quotation</span>
            </button>
          )}
          <button onClick={handlePrint} className={`${styles.actionBtn} no-print`}>
            <Printer size={16} />
            <span>Print Quote</span>
          </button>
          <button onClick={handleDownload} className={`${styles.pdfBtn} no-print`}>
            <Download size={16} />
            <span>Export PDF</span>
          </button>
          <Link href={`/dashboard/quotations/${id}/edit`} className={`${styles.editBtn} no-print`}>
            <Edit3 size={16} />
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
            <span>Quotation Document</span>
            <strong>www.falconplusqa.com</strong>
          </div>
        </header>

        <section className={styles.invoiceMetaSection}>
          <div className={styles.titleArea}>
            <h1>QUOTATION</h1>
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Quote #</span>
                <span className={styles.metaValue}>{quotation.id}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Date</span>
                <span className={styles.metaValue}>{formattedDate}</span>
              </div>

            </div>
          </div>
          <div className={styles.clientArea}>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Quote To</span>
              <span className={styles.clientValue}>{quotation.customer}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Address</span>
              <span className={styles.clientValue}>Doha, Qatar</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Vehicle</span>
              <span className={styles.clientValue}>{quotation.vehicle || 'N/A'}</span>
            </div>
          </div>
        </section>

        <div className={styles.invoiceTableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th width="34">SL</th>

                <th width="100">VEHICLE NAME</th>
                <th width="90">PLATE NO</th>
                <th width="110">PICKUP</th>
                <th width="110">DROPOFF</th>
                <th width="88" style={{ textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>

                <td style={{ fontWeight: '700' }}>{quotation.customerVehicle || 'N/A'}</td>
                <td style={{ fontWeight: '700' }}>{quotation.customerPlate || 'N/A'}</td>
                <td>{quotation.pickup || 'N/A'}</td>
                <td>{quotation.dropoff || 'N/A'}</td>
                <td className={styles.itemAmount}>{currency(quotation.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.invoiceTotalsTop}>
          <div className={styles.totalsArea}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal</span>
              <span className={styles.totalValue}>{currency(quotation.amount)}</span>
            </div>
            <div className={styles.grandTotalRow}>
              <span className={styles.grandLabel}>Total</span>
              <span className={styles.grandValue}>{currency(quotation.amount)}</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.notesArea}>
            <span className={styles.notesTitle}>Terms & Conditions / Notes</span>
            <p className={styles.notesText}>
              This quotation is valid for 7 days from the date of issue.
              Prices are subject to change based on actual site conditions.
              This is a computer generated document.
            </p>
            <p className={styles.thankYouText}>WE APPRECIATE YOUR BUSINESS</p>

            <div className={styles.paymentInfoBox}>
              <span className={styles.notesTitle}>Validity</span>
              <p className={styles.paymentMethodText}>7 Days from Date of Issue</p>
            </div>

            <div className={styles.wordsWrapper}>
              <p className={styles.wordsText}>Amount in words: Qatari Riyal {amountInWords(Math.round(quotation.amount || 0))} Only</p>
            </div>
          </div>
        </div>


        <footer className={styles.contactBar}>
          <div className={styles.contactItem}>
            <Phone size={14} className={styles.contactIcon} />
            <span>+974 3074 0770</span>
          </div>
          <div className={styles.contactItem}>
            <Mail size={14} className={styles.contactIcon} />
            <span>info@falconplusqa.com</span>
          </div>
          <div className={styles.contactItem}>
            <MapPin size={14} className={styles.contactIcon} />
            <span>Industrial Area, Doha</span>
          </div>
          <div className={styles.contactItem}>
            <Globe size={14} className={styles.contactIcon} />
            <span>www.falconplusqa.com</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
