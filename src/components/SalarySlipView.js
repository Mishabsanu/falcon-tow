'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer, Download, ArrowLeft, ShieldCheck, Landmark, User, FileCheck } from 'lucide-react';
import { apiService } from '@/services/apiService';
import styles from './InvoiceView.module.css';

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
      margin: [0, 0, 0, 0], // Remove margins as the paper itself has padding
      filename: `SalarySlip_${salary.worker}_${salary.month}_${salary.year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794 // Approx 210mm in pixels at 96dpi
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

  if (loading) return <div className="p-20 text-center font-black text-emerald-900 animate-pulse uppercase tracking-[0.2em] text-[10px]">Generating Premium Settlement Document...</div>;
  if (!salary) return <div className="p-20 text-center font-black text-rose-600 uppercase tracking-[0.2em] text-[10px]">Salary record not found.</div>;

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

      <div className={styles.paper} id="salary-slip-content">
        <header className="flex justify-between items-start border-b-4 border-emerald-900 pb-8 mb-10">
          <div className="space-y-4">
             <img src="/logo-1.png" alt="Falcon Plus Garage" className="h-16 w-auto" />
             <div className="space-y-1">
                <h1 className="text-2xl font-black text-emerald-950 tracking-tighter">FALCON PLUS <span className="text-emerald-600">GROUP</span></h1>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Premium Fleet Management & Recovery Services</p>
             </div>
          </div>
          <div className="text-right space-y-2">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950 text-white rounded-lg">
                <FileCheck size={14} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Official Settlement Slip</span>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document ID: {salary.id}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3 mb-4">
                <User size={16} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em]">Employee Profile</span>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Name</span>
                   <span className="text-[11px] font-black text-emerald-950 uppercase">{salary.worker}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">ID No.</span>
                   <span className="text-[11px] font-black text-emerald-950">{salary.workerId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Role</span>
                   <span className="text-[11px] font-black text-emerald-950">Operational Driver</span>
                </div>
             </div>
          </div>

          <div className="p-6 bg-emerald-50/20 rounded-2xl border border-emerald-100/30">
             <div className="flex items-center gap-3 mb-4">
                <Landmark size={16} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em]">Settlement Period</span>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between border-b border-emerald-100/30 pb-2">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Fiscal Year</span>
                   <span className="text-[11px] font-black text-emerald-950">{salary.year}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-100/30 pb-2">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Settlement Month</span>
                   <span className="text-[11px] font-black text-emerald-950">{salary.month}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Payment Status</span>
                   <span className={`text-[11px] font-black uppercase ${salary.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{salary.status}</span>
                </div>
             </div>
          </div>
        </div>

        <table className="w-full mb-12">
          <thead>
            <tr className="bg-emerald-950 text-white">
              <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest rounded-tl-2xl">Description</th>
              <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest rounded-tr-2xl">Amount (QAR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 border-x border-slate-100">
            <tr>
              <td className="py-5 px-6">
                 <p className="text-[11px] font-black text-emerald-950 uppercase">Basic Monthly Salary</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Fixed contractual base amount</p>
              </td>
              <td className="py-5 px-6 text-right font-black text-emerald-950">{Number(salary.baseSalary || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-5 px-6">
                 <p className="text-[11px] font-black text-emerald-950 uppercase">Performance Commission (10%)</p>
                 <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-tighter">Calculated from completed cash services</p>
              </td>
              <td className="py-5 px-6 text-right font-black text-emerald-600">+{Number(salary.retention || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-5 px-6">
                 <p className="text-[11px] font-black text-rose-900 uppercase">Cash Deduction (90%)</p>
                 <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Cash collected on-site (Company share)</p>
              </td>
              <td className="py-5 px-6 text-right font-black text-rose-600">-{Number(salary.cashDeduction90 || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-5 px-6">
                 <p className="text-[11px] font-black text-rose-900 uppercase">Operational Expenses / Advances</p>
                 <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Reimbursed or advanced payments</p>
              </td>
              <td className="py-5 px-6 text-right font-black text-rose-600">-{Number(salary.expenses || 0).toLocaleString()}</td>
            </tr>
          </tbody>
          <tfoot>
             <tr className="bg-emerald-50">
                <td className="py-6 px-6 rounded-bl-2xl">
                   <p className="text-[11px] font-black text-emerald-950 uppercase">Total Net Payable</p>
                   <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">
                      Qatari Riyal {amountInWords(Math.round(salary.amount || 0))} Only
                   </p>
                </td>
                <td className="py-6 px-6 text-right rounded-br-2xl">
                   <p className="text-2xl font-black text-emerald-950 tracking-tighter italic">QAR {Number(salary.amount || 0).toLocaleString()}</p>
                </td>
             </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-2 gap-20 mt-20">
          <div className="space-y-12">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Employee Acknowledgement</p>
             <div className="border-t-2 border-slate-200 pt-4 flex flex-col items-start gap-1">
                <span className="text-[11px] font-black text-emerald-950 uppercase">{salary.worker}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Driver Signature</span>
             </div>
          </div>
          <div className="space-y-12">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] text-right">Authorized By</p>
             <div className="border-t-2 border-slate-200 pt-4 flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className="text-emerald-600" />
                   <span className="text-[11px] font-black text-emerald-950 uppercase">MANAGEMENT</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Falcon Plus Group</span>
             </div>
          </div>
        </div>

        <footer className="mt-32 pt-8 border-t border-slate-100 flex justify-between items-end">
           <div className="space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contact Information</p>
              <p className="text-[10px] font-black text-emerald-950 tracking-tight">Mob: +974 3074 0770 | info@falconplusqa.com</p>
              <p className="text-[10px] font-black text-emerald-950 tracking-tight">CR No. 210580 | Doha, Qatar</p>
           </div>
           <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                 <p className="text-[9px] font-black text-emerald-950 uppercase tracking-[0.2em]">Verified Secure</p>
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Document Generated: {new Date(salary.createdAt).toLocaleDateString()}</p>
           </div>
        </footer>
      </div>
    </div>
  );
}
