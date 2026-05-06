'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer, Download, ArrowLeft, ShieldCheck, Landmark, User, FileCheck } from 'lucide-react';
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

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', fontWeight: '900', color: COLORS.emerald900, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px' }}>Generating Premium Settlement Document...</div>;
  if (!salary) return <div style={{ padding: '80px', textAlign: 'center', fontWeight: '900', color: COLORS.rose600, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px' }}>Salary record not found.</div>;

  return (
    <div className={styles.container}>
      <div className={`${styles.toolbar} no-print ${hideToolbar ? 'hidden' : ''}`} style={hideToolbar ? { display: 'none' } : {}}>
        <Link href="/dashboard/salaries" className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Return to Ledger</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handlePrint} className={styles.actionBtn}>
            <Printer size={18} />
            <span>Print Slip</span>
          </button>
          <button onClick={handleDownload} className={styles.pdfBtn}>
            <Download size={18} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className={styles.paper} id="salary-slip-content" style={{ background: COLORS.white, padding: '20mm', color: COLORS.emerald950 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${COLORS.emerald600}`, paddingBottom: '24px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <img src="/logo-1.png" alt="Falcon" style={{ height: '50px', width: 'auto' }} />
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '900', color: COLORS.emerald950, margin: 0 }}>FALCON PLUS <span style={{ color: COLORS.emerald600 }}>TOWING</span></h1>
                <p style={{ fontSize: '9px', fontWeight: '800', color: COLORS.emerald600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Official Payroll Record</p>
             </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <p style={{ fontSize: '10px', fontWeight: '900', color: COLORS.emerald950, margin: 0 }}>SLIP #{salary.id}</p>
             <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase', margin: '4px 0 0 0' }}>{salary.month} {salary.year}</p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', marginBottom: '40px' }}>
          <div>
             <h4 style={{ fontSize: '10px', fontWeight: '900', color: COLORS.emerald600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', borderBottom: `1px solid ${COLORS.emerald50}`, pb: '4px' }}>Employee Details</h4>
             <table style={{ width: '100%', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ py: '6px', color: COLORS.slate500, fontWeight: '600' }}>Full Name:</td>
                    <td style={{ py: '6px', fontWeight: '900', color: COLORS.emerald950 }}>{salary.worker}</td>
                  </tr>
                  <tr>
                    <td style={{ py: '6px', color: COLORS.slate500, fontWeight: '600' }}>Worker ID:</td>
                    <td style={{ py: '6px', fontWeight: '900', color: COLORS.emerald950 }}>{salary.workerId || 'F-00'+salary.id}</td>
                  </tr>
                </tbody>
             </table>
          </div>
          <div>
             <h4 style={{ fontSize: '10px', fontWeight: '900', color: COLORS.emerald600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', borderBottom: `1px solid ${COLORS.emerald50}`, pb: '4px' }}>Status</h4>
             <div style={{ padding: '12px', background: salary.status === 'Paid' ? COLORS.emerald50 : '#fff7ed', borderRadius: '8px', border: `1px solid ${salary.status === 'Paid' ? COLORS.emerald100 : '#ffedd5'}` }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: salary.status === 'Paid' ? COLORS.emerald700 : COLORS.amber600, textTransform: 'uppercase' }}>{salary.status}</span>
             </div>
          </div>
        </div>

        <table style={{ width: '100%', marginBottom: '40px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.emerald950}` }}>
              <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '12px 0', textAlign: 'right', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Amount (QAR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px 0', fontSize: '11px', fontWeight: '700', color: COLORS.emerald950 }}>Basic Salary</td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '11px', fontWeight: '900' }}>{Number(salary.baseSalary || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0', fontSize: '11px', fontWeight: '700', color: COLORS.emerald950 }}>Commission (10%)</td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: COLORS.emerald600 }}>+{Number(salary.retention || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0', fontSize: '11px', fontWeight: '700', color: COLORS.rose900 }}>Cash Advance / Deduction</td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: COLORS.rose600 }}>-{Number(salary.cashDeduction90 || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0', fontSize: '11px', fontWeight: '700', color: COLORS.rose900 }}>Operational Expenses</td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: COLORS.rose600 }}>-{Number(salary.expenses || 0).toLocaleString()}</td>
            </tr>
          </tbody>
          <tfoot>
             <tr style={{ borderTop: `2px solid ${COLORS.emerald950}`, borderBottom: `2px solid ${COLORS.emerald950}` }}>
                <td style={{ padding: '20px 0' }}>
                   <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Net Payable Amount</span>
                </td>
                <td style={{ padding: '20px 0', textAlign: 'right' }}>
                   <span style={{ fontSize: '20px', fontWeight: '900', color: COLORS.emerald600 }}>QAR {Number(salary.amount || 0).toLocaleString()}</span>
                </td>
             </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: '20px', marginBottom: '60px' }}>
           <p style={{ fontSize: '10px', fontWeight: '700', fontStyle: 'italic', color: COLORS.slate500 }}>
             Amount in Words: {amountInWords(Math.round(salary.amount || 0))} Qatari Riyals Only
           </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px' }}>
           <div style={{ borderTop: `1px solid ${COLORS.slate200}`, pt: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Employee Signature</p>
           </div>
           <div style={{ borderTop: `1px solid ${COLORS.slate200}`, pt: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Authorized Signature</p>
           </div>
        </div>

        <footer style={{ marginTop: '80px', textAlign: 'center', borderTop: `1px solid ${COLORS.emerald50}`, pt: '20px' }}>
           <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.slate400, margin: 0 }}>FALCON PLUS TOWING & RECOVERY | DOHA, QATAR | CR NO. 210580</p>
           <p style={{ fontSize: '8px', fontWeight: '600', color: COLORS.slate300, mt: '4px' }}>System Generated Record - No Stamp Required Unless Specified</p>
        </footer>
      </div>
    </div>
  );
}
