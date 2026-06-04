'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer, Download, ArrowLeft, Edit3, MapPin } from 'lucide-react';
import { apiService } from '@/services/apiService';
import styles from './InvoiceView.module.css';

export default function TowJobView({ id }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('document'); // 'document' | 'attachments'

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
    const wasAttachments = activeTab === 'attachments';
    if (wasAttachments) {
      setActiveTab('document');
      setTimeout(() => {
        window.print();
        setActiveTab('attachments');
      }, 100);
    } else {
      window.print();
    }
  };

  const handleDownload = async () => {
    const wasAttachments = activeTab === 'attachments';
    if (wasAttachments) {
      setActiveTab('document');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const element = document.querySelector(`.${styles.paper}`);
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `TowJob_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      if (wasAttachments) {
        setActiveTab('attachments');
      }
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

      {/* Tabs Control */}
      <div className="flex border-b border-emerald-100/50 mb-8 gap-6 w-full max-w-[210mm] no-print">
        <button
          type="button"
          onClick={() => setActiveTab('document')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all outline-none border-b-2 ${
            activeTab === 'document'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-emerald-950'
          }`}
        >
          Job Document
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('attachments')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all outline-none border-b-2 ${
            activeTab === 'attachments'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-emerald-950'
          }`}
        >
          Attachments & Proofs
        </button>
      </div>

      {/* Tab 1: Document View */}
      <div id="invoice-paper" className={`${styles.paper} ${styles.invoicePaper} ${activeTab !== 'document' ? 'hidden' : ''}`}>
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

      {/* Tab 2: Attachments & Proofs */}
      {activeTab === 'attachments' && (
        <div className="w-full max-w-[210mm] grid grid-cols-1 md:grid-cols-2 gap-8 no-print animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Pickup Photo Card */}
          <div className="bg-white border border-emerald-100/50 shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-emerald-50/30 px-6 py-4 border-b border-emerald-100/20 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Pickup Proof Attachment</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Image File</span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between gap-6">
              {job.pickupPhoto ? (
                <>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={job.pickupPhoto} alt="Pickup Proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={job.pickupPhoto} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-emerald-950 rounded-xl shadow-lg hover:scale-105 transition-transform font-bold text-[10px] uppercase tracking-widest">View Full Size</a>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pickup Address</span>
                    <p className="text-xs font-bold text-emerald-950 leading-relaxed">{job.pickup || 'Address not registered'}</p>
                  </div>
                  <div className="flex gap-3 mt-auto pt-4 border-t border-emerald-50/50">
                    <a 
                      href={job.pickupPhoto} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center"
                    >
                      View Image
                    </a>
                    <a 
                      href={job.pickupPhoto} 
                      download={`PickupProof_${job.id}.jpg`}
                      className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-emerald-50/30 text-emerald-700 border border-emerald-200 py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center justify-center"
                    >
                      Download File
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                    <MapPin size={24} />
                  </div>
                  <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">No Pickup Proof</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">No image was uploaded at pickup</p>
                </div>
              )}
            </div>
          </div>

          {/* Dropoff Photo Card */}
          <div className="bg-white border border-emerald-100/50 shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-emerald-50/30 px-6 py-4 border-b border-emerald-100/20 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Drop-off Proof Attachment</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Image File</span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between gap-6">
              {job.dropoffPhoto ? (
                <>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={job.dropoffPhoto} alt="Drop-off Proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={job.dropoffPhoto} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-emerald-950 rounded-xl shadow-lg hover:scale-105 transition-transform font-bold text-[10px] uppercase tracking-widest">View Full Size</a>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Drop-off Address</span>
                    <p className="text-xs font-bold text-emerald-950 leading-relaxed">{job.dropoff || 'Address not registered'}</p>
                  </div>
                  <div className="flex gap-3 mt-auto pt-4 border-t border-emerald-50/50">
                    <a 
                      href={job.dropoffPhoto} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md text-center"
                    >
                      View Image
                    </a>
                    <a 
                      href={job.dropoffPhoto} 
                      download={`DropoffProof_${job.id}.jpg`}
                      className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-emerald-50/30 text-emerald-700 border border-emerald-200 py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center justify-center"
                    >
                      Download File
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                    <MapPin size={24} />
                  </div>
                  <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">No Drop-off Proof</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">No image was uploaded at drop-off</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
