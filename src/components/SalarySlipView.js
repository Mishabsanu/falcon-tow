'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer, Download, ArrowLeft, ShieldCheck, Landmark, User, FileCheck, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { apiService } from '@/services/apiService';
import styles from './InvoiceView.module.css';

// Standard Hex Colors to avoid OKLCH issues with html2pdf
const COLORS = {
  emerald950: '#022c22',
  emerald900: '#064e3b',
  emerald800: '#065f46',
  emerald700: '#047857',
  emerald600: '#059669',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  rose900: '#450a0a',
  rose600: '#e11d48',
  rose400: '#fb7185',
  amber600: '#d97706',
  white: '#ffffff',
  black: '#000000'
};

export default function SalarySlipView({ id, hideToolbar = false }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    setUser(userData);

    async function loadData() {
      try {
        const data = await apiService.getRecord('salaries', id);
        setSalary(data);
      } catch (error) {
        console.error('Failed to load salary slip:', error);
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
    const element = document.getElementById('salary-slip-content');
    const opt = {
      margin: [0, 0, 0, 0],
      filename: `SalarySlip_${salary.worker}_${salary.month}_${salary.year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794
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

  const currency = (val) => `QAR ${Number(val || 0).toFixed(2)}`;

  if (loading) return <div className={styles.loading}>Generating Settlement Document...</div>;
  if (!salary) return <div className={styles.error}>Salary record not found.</div>;

  return (
    <div className={styles.container}>
      <div className={`${styles.toolbar} no-print ${hideToolbar ? 'hidden' : ''}`} style={hideToolbar ? { display: 'none' } : {}}>
        <Link href="/dashboard/salaries" className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Return to Ledger</span>
        </Link>
        <div className={styles.toolbarActions}>
          <button onClick={handlePrint} className={`${styles.actionBtn} no-print`}>
            <Printer size={16} />
            <span>Print Slip</span>
          </button>
          <button onClick={handleDownload} className={`${styles.pdfBtn} no-print`}>
            <Download size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div id="salary-slip-content" className={`${styles.paper} ${styles.invoicePaper}`}>
        <header className={styles.paperHeader}>
          <div className={styles.headerBrand}>
            <div className={styles.logoSection}>
              <img src="/logo-1.png" alt="Falcon Plus" className={styles.logoImg} />
            </div>
          </div>
          <div className={styles.headerContact}>
            <span>Official Payroll Record</span>
            <strong>www.falconplusqa.com</strong>
          </div>
        </header>

        <section className={styles.invoiceMetaSection}>
          <div className={styles.titleArea}>
            <h1 style={{ fontSize: '1.8rem' }}>SALARY SLIP</h1>
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Slip #</span>
                <span className={styles.metaValue}>{salary.id}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Period</span>
                <span className={styles.metaValue}>{salary.month} {salary.year}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Status</span>
                <span className={styles.metaValue} style={{ color: salary.status === 'Paid' ? '#10b981' : '#f59e0b' }}>{salary.status}</span>
              </div>
            </div>
          </div>
          <div className={styles.clientArea}>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Employee</span>
              <span className={styles.clientValue}>{salary.worker}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Worker ID</span>
              <span className={styles.clientValue}>{salary.workerId || 'F-00'+salary.id}</span>
            </div>
            <div className={styles.clientRow}>
              <span className={styles.clientLabel}>Designation</span>
              <span className={styles.clientValue}>Service Executive</span>
            </div>
          </div>
        </section>

        <div className={styles.invoiceTableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th width="34">SL</th>
                <th>EARNINGS / DEDUCTIONS DESCRIPTION</th>
                <th width="120" style={{ textAlign: 'right' }}>AMOUNT (QAR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>
                <td>
                  <div className={styles.itemDesc}>Monthly Basic Salary</div>
                  <div className={styles.itemSub}>Standard contractual basic pay</div>
                </td>
                <td className={styles.itemAmount}>{currency(salary.baseSalary)}</td>
              </tr>
              <tr>
                <td>02</td>
                <td>
                  <div className={styles.itemDesc}>Service Commission (10%)</div>
                  <div className={styles.itemSub}>Accrued performance-based incentives</div>
                </td>
                <td className={styles.itemAmount} style={{ color: '#059669' }}>+{currency(salary.retention)}</td>
              </tr>
              <tr>
                <td>03</td>
                <td>
                  <div className={styles.itemDesc}>Hand Cash</div>
                  <div className={styles.itemSub}>Cash collected by worker</div>
                </td>
                <td className={styles.itemAmount} style={{ color: '#dc2626' }}>-{currency(salary.cashDeduction90)}</td>
              </tr>
              <tr>
                <td>04</td>
                <td>
                  <div className={styles.itemDesc}>Operational Expenses</div>
                  <div className={styles.itemSub}>Assigned fuel and maintenance costs</div>
                </td>
                <td className={styles.itemAmount} style={{ color: '#dc2626' }}>-{currency(salary.expenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.invoiceTotalsTop}>
          <div className={styles.totalsArea}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Gross Settlement</span>
              <span className={styles.totalValue}>{currency(Number(salary.baseSalary || 0) + Number(salary.retention || 0))}</span>
            </div>
            <div className={styles.grandTotalRow}>
              <span className={styles.grandLabel}>Net Payable</span>
              <span className={styles.grandValue}>{currency(salary.amount)}</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.notesArea}>
            <span className={styles.notesTitle}>Administrative Notes</span>
            <p className={styles.notesText}>
              This is an official document of Falcon Plus Towing & Recovery.
              Salary calculations are based on the standard company performance formula.
              This is a computer generated record.
            </p>
            <p className={styles.thankYouText}>FALCON PLUS GARAGE - HR DEPARTMENT</p>
            
            <div className={styles.paymentInfoBox}>
              <span className={styles.notesTitle}>Payment Method</span>
              <p className={styles.paymentMethodText}>Bank Transfer / Cash Disbursement</p>
            </div>

            <div className={styles.wordsWrapper}>
              <p className={styles.wordsText}>Amount in words: Qatari Riyal {amountInWords(Math.round(salary.amount || 0))} Only</p>
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
