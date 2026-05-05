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
      {!hideToolbar && (
        <div className={styles.toolbar + ' no-print'}>
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
      )}

      <div className={styles.paper} id="salary-slip-content" style={{ background: COLORS.white, padding: '15mm', color: COLORS.emerald950 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `4px solid ${COLORS.emerald900}`, paddingBottom: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <img src="/logo-1.png" alt="Falcon Plus Garage" style={{ height: '64px', width: 'auto' }} />
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: COLORS.emerald950, letterSpacing: '-0.02em', margin: 0 }}>FALCON PLUS <span style={{ color: COLORS.emerald600 }}>GROUP</span></h1>
                <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.slate500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Premium Fleet Management & Recovery Services</p>
             </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: COLORS.emerald950, color: COLORS.white, borderRadius: '8px' }}>
                <FileCheck size={14} style={{ color: COLORS.emerald400 }} />
                <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Official Settlement Slip</span>
             </div>
             <p style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Document ID: {salary.id}</p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '48px' }}>
          <div style={{ padding: '24px', background: COLORS.slate50, borderRadius: '16px', border: `1px solid ${COLORS.slate100}` }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <User size={16} style={{ color: COLORS.emerald600 }} />
                <span style={{ fontSize: '10px', fontWeight: '900', color: COLORS.emerald900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Employee Profile</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.slate200}`, paddingBottom: '8px' }}>
                   <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase' }}>Name</span>
                   <span style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950, textTransform: 'uppercase' }}>{salary.worker}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.slate200}`, paddingBottom: '8px' }}>
                   <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase' }}>ID No.</span>
                   <span style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950 }}>{salary.workerId || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase' }}>Role</span>
                   <span style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950 }}>Operational Driver</span>
                </div>
             </div>
          </div>

          <div style={{ padding: '24px', background: 'rgba(236, 253, 245, 0.2)', borderRadius: '16px', border: `1px solid rgba(209, 250, 229, 0.3)` }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Landmark size={16} style={{ color: COLORS.emerald600 }} />
                <span style={{ fontSize: '10px', fontWeight: '900', color: COLORS.emerald900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Settlement Period</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid rgba(209, 250, 229, 0.3)`, paddingBottom: '8px' }}>
                   <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate500, textTransform: 'uppercase' }}>Fiscal Year</span>
                   <span style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950 }}>{salary.year}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid rgba(209, 250, 229, 0.3)`, paddingBottom: '8px' }}>
                   <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate500, textTransform: 'uppercase' }}>Settlement Month</span>
                   <span style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950 }}>{salary.month}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate500, textTransform: 'uppercase' }}>Payment Status</span>
                   <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: salary.status === 'Paid' ? COLORS.emerald600 : COLORS.amber600 }}>{salary.status}</span>
                </div>
             </div>
          </div>
        </div>

        <table style={{ width: '100%', marginBottom: '48px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: COLORS.emerald950, color: COLORS.white }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount (QAR)</th>
            </tr>
          </thead>
          <tbody style={{ borderLeft: `1px solid ${COLORS.slate100}`, borderRight: `1px solid ${COLORS.slate100}` }}>
            <tr style={{ borderBottom: `1px solid ${COLORS.slate100}` }}>
              <td style={{ padding: '20px 24px' }}>
                 <p style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950, textTransform: 'uppercase', margin: 0 }}>Basic Monthly Salary</p>
                 <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase', margin: '4px 0 0 0' }}>Fixed contractual base amount</p>
              </td>
              <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '900', color: COLORS.emerald950 }}>{Number(salary.baseSalary || 0).toLocaleString()}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${COLORS.slate100}` }}>
              <td style={{ padding: '20px 24px' }}>
                 <p style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950, textTransform: 'uppercase', margin: 0 }}>Performance Commission (10%)</p>
                 <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.emerald600, opacity: 0.6, textTransform: 'uppercase', margin: '4px 0 0 0' }}>Calculated from completed cash services</p>
              </td>
              <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '900', color: COLORS.emerald600 }}>+{Number(salary.retention || 0).toLocaleString()}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${COLORS.slate100}` }}>
              <td style={{ padding: '20px 24px' }}>
                 <p style={{ fontSize: '11px', fontWeight: '900', color: COLORS.rose900, textTransform: 'uppercase', margin: 0 }}>Cash Deduction (90%)</p>
                 <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.rose400, textTransform: 'uppercase', margin: '4px 0 0 0' }}>Cash collected on-site (Company share)</p>
              </td>
              <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '900', color: COLORS.rose600 }}>-{Number(salary.cashDeduction90 || 0).toLocaleString()}</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${COLORS.slate100}` }}>
              <td style={{ padding: '20px 24px' }}>
                 <p style={{ fontSize: '11px', fontWeight: '900', color: COLORS.rose900, textTransform: 'uppercase', margin: 0 }}>Operational Expenses / Advances</p>
                 <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.rose400, textTransform: 'uppercase', margin: '4px 0 0 0' }}>Reimbursed or advanced payments</p>
              </td>
              <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '900', color: COLORS.rose600 }}>-{Number(salary.expenses || 0).toLocaleString()}</td>
            </tr>
          </tbody>
          <tfoot>
             <tr style={{ background: COLORS.emerald50 }}>
                <td style={{ padding: '24px' }}>
                   <p style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950, textTransform: 'uppercase', margin: 0 }}>Total Net Payable</p>
                   <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.emerald600, opacity: 0.6, textTransform: 'uppercase', margin: '4px 0 0 0' }}>
                      Qatari Riyal {amountInWords(Math.round(salary.amount || 0))} Only
                   </p>
                </td>
                <td style={{ padding: '24px', textAlign: 'right' }}>
                   <p style={{ fontSize: '24px', fontWeight: '900', color: COLORS.emerald950, fontStyle: 'italic', margin: 0 }}>QAR {Number(salary.amount || 0).toLocaleString()}</p>
                </td>
             </tr>
          </tfoot>
        </table>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '80px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
             <p style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>Employee Acknowledgement</p>
             <div style={{ borderTop: `2px solid ${COLORS.slate200}`, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950, textTransform: 'uppercase' }}>{salary.worker}</span>
                <span style={{ fontSize: '9px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase' }}>Driver Signature</span>
             </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
             <p style={{ fontSize: '10px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase', letterSpacing: '0.3em', textAlign: 'right', margin: 0 }}>Authorized By</p>
             <div style={{ borderTop: `2px solid ${COLORS.slate200}`, paddingTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <ShieldCheck size={14} style={{ color: COLORS.emerald600 }} />
                   <span style={{ fontSize: '11px', fontWeight: '900', color: COLORS.emerald950, textTransform: 'uppercase' }}>MANAGEMENT</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase' }}>Falcon Plus Group</span>
             </div>
          </div>
        </div>

        <footer style={{ marginTop: '128px', paddingTop: '32px', borderTop: `1px solid ${COLORS.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: '9px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Contact Information</p>
              <p style={{ fontSize: '10px', fontWeight: '900', color: COLORS.emerald950, margin: 0 }}>Mob: +974 3074 0770 | info@falconplusqa.com</p>
              <p style={{ fontSize: '10px', fontWeight: '900', color: COLORS.emerald950, margin: 0 }}>CR No. 210580 | Doha, Qatar</p>
           </div>
           <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                 <div style={{ width: '6px', height: '6px', background: COLORS.emerald500, borderRadius: '50%' }}></div>
                 <p style={{ fontSize: '9px', fontWeight: '900', color: COLORS.emerald950, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Verified Secure</p>
              </div>
              <p style={{ fontSize: '8px', fontWeight: '700', color: COLORS.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Document Generated: {new Date(salary.createdAt).toLocaleDateString()}</p>
           </div>
        </footer>
      </div>
    </div>
  );
}
