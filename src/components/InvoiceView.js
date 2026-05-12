'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer, Download, ArrowLeft, Edit3, Phone, Mail, MapPin, Globe, Calendar, Hash } from 'lucide-react';
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
          // Fallback: If contact details are missing in the invoice, fetch them from the customer record
          if (inv.customerId && (!inv.customerMobile || !inv.customerEmail || !inv.customerAddress)) {
            try {
              const customer = await apiService.getRecord('customers', inv.customerId);
              if (customer) {
                inv.customerMobile = inv.customerMobile || customer.phone || 'N/A';
                inv.customerEmail = inv.customerEmail || customer.email || 'N/A';
                inv.customerAddress = inv.customerAddress || customer.address || 'Doha, Qatar';
              }
            } catch (err) {
              console.error('Failed to fetch fallback customer details:', err);
            }
          }

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
    const element = document.getElementById('invoice-paper');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Invoice_${id}_${new Date().getTime()}.pdf`,
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

  const lineItems = invoice.towDetails || invoice.jobs || [];
  const invoiceRows = lineItems.length > 0 ? lineItems : [{
    vehicleName: 'Standard Towing & Recovery',
    pickup: 'Official Service Log',
    dropoff: '',
    customerPlate: invoice.vehiclePlate || 'N/A',
    amount: invoice.total || 0,
    serviceCommission: 0
  }];
  const formattedDate = new Date(invoice.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const totalAmount = lineItems.length > 0
    ? invoiceRows.reduce((sum, job) => sum + Number(job.amount || 0), 0)
    : Number(invoice.total || 0);
  const currency = (value) => `QAR ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  const shortDate = (value) => value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : formattedDate;
  const getRoute = (job) => {
    if (job.route) return job.route;
    return [job.pickup, job.dropoff].filter(Boolean).join(' -> ') || 'N/A';
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.toolbar} no-print`}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Back to Records</span>
        </button>
        <div className={styles.toolbarActions}>
          <button onClick={handlePrint} className={`${styles.actionBtn} no-print`}>
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
          <button onClick={handleDownload} className={`${styles.pdfBtn} no-print`}>
            <Download size={16} />
            <span>Export PDF</span>
          </button>
          <Link href={`/dashboard/invoices/${id}/edit`} className={styles.editBtn}>
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
            <span>Invoice Document</span>
            <strong>www.falconplusqa.com</strong>
          </div>
        </header>

        <section className={styles.invoiceMetaSection}>
          <div className={styles.titleArea}>
            <h1>INVOICE</h1>
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Invoice #</span>
                <span className={styles.metaValue}>{invoice.id}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Date</span>
                <span className={styles.metaValue}>{formattedDate}</span>
              </div>
            </div>
          </div>
          <div className={styles.clientArea}>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Invoice To</span>
              <span className={styles.clientValue}>{invoice.customer}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Address</span>
              <span className={styles.clientValue}>{invoice.customerAddress || 'Doha, Qatar'}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Email</span>
              <span className={styles.clientValue}>{invoice.customerEmail || 'N/A'}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Phone</span>
              <span className={styles.clientValue}>{invoice.customerMobile || 'N/A'}</span>
            </div>

          </div>
        </section>

        <div className={styles.invoiceTableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th width="34">SL</th>
                <th width="64">DATE</th>
                <th>VEHICLE / SERVICE</th>
                <th width="76">PLATE NO</th>
                <th>ROUTE</th>
                <th width="78">PRICE</th>
                <th width="88" style={{ textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map((job, index) => {
                const rowTotal = Number(job.amount || 0);

                return (
                  <tr key={index}>
                    <td>{(index + 1).toString().padStart(2, '0')}</td>
                    <td>{shortDate(job.date)}</td>
                    <td>
                      <div className={styles.itemDesc}>{job.vehicleName || job.vehicle || 'Towing Service'}</div>
                    </td>
                    <td>{job.customerPlate || job.vehiclePlate || 'N/A'}</td>
                    <td>{getRoute(job)}</td>
                    <td>{currency(rowTotal)}</td>
                    <td className={styles.itemAmount}>{currency(rowTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.invoiceTotalsTop}>
          <div className={styles.totalsArea}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal</span>
              <span className={styles.totalValue}>{currency(totalAmount)}</span>
            </div>
            <div className={styles.grandTotalRow}>
              <span className={styles.grandLabel}>Total</span>
              <span className={styles.grandValue}>{currency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.notesArea}>
            <span className={styles.notesTitle}>Terms & Conditions / Notes</span>
            <p className={styles.notesText}>
              Thank you for your business. Please ensure payment is made within the agreed timeframe.
              This is a computer generated document.
            </p>
            <p className={styles.thankYouText}>THANK YOU FOR YOUR BUSINESS</p>
            <div style={{ marginTop: '20px' }}>
              <span className={styles.notesTitle}>Payment Method</span>
              <p className={styles.notesText}>{invoice.type || invoice.paymentMethod || 'Cash'} Payment</p>
            </div>
            <p className={styles.wordsText}>Amount in words: Qatari Riyal {amountInWords(Math.round(totalAmount))} Only</p>
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
            <span>Street 27, Industrial Area, Doha</span>
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
