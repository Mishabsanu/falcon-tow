'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, TrendingUp, User, DollarSign, Calendar, ShieldAlert, Award, Sparkles, Trash2, History } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';
import styles from './InvoiceReport.module.css';

export default function InvoiceReport({ id }) {
  const [invoice, setInvoice] = useState(null);
  const [jobsWithDrivers, setJobsWithDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Company Payments Form State
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Commission Payments Form State
  const [commDate, setCommDate] = useState(new Date().toISOString().split('T')[0]);
  const [commAmount, setCommAmount] = useState('');
  const [commNote, setCommNote] = useState('');

  const loadData = useCallback(async () => {
    try {
      const inv = await apiService.getRecord('invoices', id);
      if (inv) {
        setInvoice(inv);
        
        const lineItems = inv.towDetails || inv.jobs || [];
        // Hydrate driver info for fallback on older invoices
        const hydrated = await Promise.all(lineItems.map(async (job) => {
          let driverName = job.driver;
          let driverId = job.driverId;
          if (!driverName && job.towId) {
            try {
              const tow = await apiService.getRecord('tows', job.towId);
              if (tow) {
                driverName = tow.driver;
                driverId = tow.driverId;
              }
            } catch (err) {
              console.error('Failed to load fallback tow details:', err);
            }
          }
          return {
            ...job,
            driver: driverName || 'Unassigned',
            driverId: driverId || null
          };
        }));
        setJobsWithDrivers(hydrated);
      }
    } catch (error) {
      console.error('Failed to load invoice report data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  const currency = (value) => `QAR ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const shortDate = (value) => value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'N/A';

  // Company Payments Handlers
  const handleAddCompanyPayment = async (e) => {
    e.preventDefault();
    if (dueBalance <= 0) {
      toast.error('No remaining dues to record payment for');
      return;
    }
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid positive payment amount');
      return;
    }

    try {
      const newPayment = {
        date: new Date(payDate),
        amount: amount,
        note: payNote.trim() || 'Invoice Payment'
      };

      const currentPayments = invoice.invoicePayments || [];
      const updatedPayments = [...currentPayments, newPayment];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

      let newStatus = 'Pending';
      if (totalPaid >= netExpected) {
        newStatus = 'Closed';
      } else if (totalPaid > 0) {
        newStatus = 'Partial';
      }

      const payload = {
        invoicePayments: updatedPayments,
        paid: totalPaid,
        status: newStatus
      };

      await apiService.updateRecord('invoices', invoice._id || invoice.id, payload);
      toast.success('Company payment recorded successfully');
      
      setPayAmount('');
      setPayNote('');
      setPayDate(new Date().toISOString().split('T')[0]);

      await loadData();
    } catch (err) {
      console.error('Failed to record payment:', err);
      toast.error('Failed to record company payment');
    }
  };

  const handleDeleteCompanyPayment = async (indexToDelete) => {
    if (!confirm('Are you sure you want to delete this payment entry?')) return;

    try {
      const currentPayments = invoice.invoicePayments || [];
      const updatedPayments = currentPayments.filter((_, idx) => idx !== indexToDelete);
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

      let newStatus = 'Pending';
      if (totalPaid >= netExpected) {
        newStatus = 'Closed';
      } else if (totalPaid > 0) {
        newStatus = 'Partial';
      }

      const payload = {
        invoicePayments: updatedPayments,
        paid: totalPaid,
        status: newStatus
      };

      await apiService.updateRecord('invoices', invoice._id || invoice.id, payload);
      toast.success('Payment entry deleted successfully');
      await loadData();
    } catch (err) {
      console.error('Failed to delete payment entry:', err);
      toast.error('Failed to delete payment entry');
    }
  };

  // Commission Payments Handlers
  const handleAddCommissionPayment = async (e) => {
    e.preventDefault();
    if (commissionDue <= 0) {
      toast.error('No remaining commission dues to settle');
      return;
    }
    const amount = Number(commAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid positive settlement amount');
      return;
    }

    try {
      const newPayment = {
        date: new Date(commDate),
        amount: amount,
        note: commNote.trim() || 'Commission Settlement'
      };

      const currentPayments = invoice.commissionPayments || [];
      const updatedPayments = [...currentPayments, newPayment];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

      let newStatus = 'Unpaid';
      if (totalPaid >= totalHiddenCharges) {
        newStatus = 'Paid';
      } else if (totalPaid > 0) {
        newStatus = 'Partial';
      }

      const payload = {
        commissionPayments: updatedPayments,
        commissionPaid: totalPaid,
        commissionStatus: newStatus
      };

      await apiService.updateRecord('invoices', invoice._id || invoice.id, payload);
      toast.success('Commission settlement payment recorded');
      
      setCommAmount('');
      setCommNote('');
      setCommDate(new Date().toISOString().split('T')[0]);

      await loadData();
    } catch (err) {
      console.error('Failed to record commission payment:', err);
      toast.error('Failed to record commission payment');
    }
  };

  const handleDeleteCommissionPayment = async (indexToDelete) => {
    if (!confirm('Are you sure you want to delete this commission settlement?')) return;

    try {
      const currentPayments = invoice.commissionPayments || [];
      const updatedPayments = currentPayments.filter((_, idx) => idx !== indexToDelete);
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

      let newStatus = 'Unpaid';
      if (totalPaid >= totalHiddenCharges) {
        newStatus = 'Paid';
      } else if (totalPaid > 0) {
        newStatus = 'Partial';
      }

      const payload = {
        commissionPayments: updatedPayments,
        commissionPaid: totalPaid,
        commissionStatus: newStatus
      };

      await apiService.updateRecord('invoices', invoice._id || invoice.id, payload);
      toast.success('Commission settlement deleted');
      await loadData();
    } catch (err) {
      console.error('Failed to delete commission payment:', err);
      toast.error('Failed to delete commission settlement');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest animate-pulse">Analyzing Financial Log...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <ShieldAlert size={48} className="text-rose-500 mb-4" />
          <h2 className="text-lg font-black text-emerald-950 uppercase tracking-wider">Report Not Found</h2>
          <p className="text-xs font-bold text-slate-400 mt-2 mb-6">We could not load the financial split for invoice {id}.</p>
          <Link href="/dashboard/invoices" className="btn-primary">
            <ArrowLeft size={16} />
            <span>Return to Ledger</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate Aggregates
  const totalCharges = invoice.totalCharges !== undefined && invoice.totalCharges !== null
    ? Number(invoice.totalCharges)
    : jobsWithDrivers.reduce((sum, j) => sum + Number(j.amount || 0), 0);

  const totalHiddenCharges = invoice.totalHiddenCharges !== undefined && invoice.totalHiddenCharges !== null
    ? Number(invoice.totalHiddenCharges)
    : jobsWithDrivers.reduce((sum, j) => sum + Number(j.serviceCommission || 0), 0);

  const netExpected = invoice.netPayable !== undefined && invoice.netPayable !== null
    ? Number(invoice.netPayable)
    : (invoice.totalCharges !== undefined && invoice.totalCharges !== null
        ? Number(invoice.totalCharges)
        : jobsWithDrivers.reduce((sum, j) => sum + Number(j.amount || 0), 0));

  const paidAmount = Number(invoice.paid || 0);
  const dueBalance = Math.max(0, netExpected - paidAmount);

  // Commission aggregates
  const commissionPaid = Number(invoice.commissionPaid || 0);
  const commissionDue = Math.max(0, totalHiddenCharges - commissionPaid);

  // Group by Driver
  const driverSummary = {};
  jobsWithDrivers.forEach(job => {
    const driver = job.driver || 'Unassigned';
    const gross = Number(job.amount || 0);
    const comm = Number(job.serviceCommission || 0);
    const actual = Math.max(0, gross - comm);
    const driverShare = actual * 0.10;
    const companyShare = actual * 0.90;

    if (!driverSummary[driver]) {
      driverSummary[driver] = {
        name: driver,
        count: 0,
        gross: 0,
        commission: 0,
        actual: 0,
        driverShare: 0,
        companyShare: 0
      };
    }
    driverSummary[driver].count += 1;
    driverSummary[driver].gross += gross;
    driverSummary[driver].commission += comm;
    driverSummary[driver].actual += actual;
    driverSummary[driver].driverShare += driverShare;
    driverSummary[driver].companyShare += companyShare;
  });

  const driverSummaryList = Object.values(driverSummary);

  return (
    <div className={styles.container}>
      <div className={`${styles.toolbar} no-print`}>
        <Link href={`/dashboard/invoices/${id}`} className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Back to Invoice</span>
        </Link>
        <div className={styles.toolbarActions}>
          <button onClick={handlePrint} className={styles.actionBtn}>
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className={styles.paper}>
        {/* Header Block */}
        <header className={styles.reportHeader}>
          <div className={styles.headerTitleArea}>
            <div className={styles.pillBadge}>
              <Sparkles size={12} />
              <span>Internal Audit Log</span>
            </div>
            <h1>Invoice Commission & Revenue Split</h1>
            <p className={styles.reportSubtitle}>Detailed driver commission breakdown & company share audit</p>
          </div>
          <div className={styles.metaBox}>
            <div className={styles.metaRow}>
              <span>Invoice #</span>
              <strong>{invoice.id}</strong>
            </div>
            <div className={styles.metaRow}>
              <span>Issue Date</span>
              <strong>{shortDate(invoice.date)}</strong>
            </div>
            <div className={styles.metaRow}>
              <span>Customer</span>
              <strong>{invoice.customer}</strong>
            </div>
            {invoice.companyName && (
              <div className={styles.metaRow}>
                <span>Company</span>
                <strong>{invoice.companyName}</strong>
              </div>
            )}
          </div>
        </header>

        {/* Overview Stats Cards */}
        <section className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.cardBilled}`}>
            <span className={styles.statLabel}>Gross Billed (Subtotal)</span>
            <span className={styles.statValue}>{currency(totalCharges)}</span>
            <div className={styles.statFooter}>Total customer billing value</div>
          </div>
          <div className={`${styles.statCard} ${styles.cardCommission}`}>
            <span className={styles.statLabel}>Hidden Commission</span>
            <span className={styles.statValue}>{currency(commissionPaid)}</span>
            <div className={styles.statFooter}>
              Outstanding: {currency(commissionDue)} (Status: {invoice.commissionStatus || 'Unpaid'})
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.cardNet}`}>
            <span className={styles.statLabel}>Net Billed (Expected)</span>
            <span className={styles.statValue}>{currency(netExpected)}</span>
            <div className={styles.statFooter}>Expected return from company</div>
          </div>
          <div className={`${styles.statCard} ${styles.cardPaid}`}>
            <span className={styles.statLabel}>Paid Collections</span>
            <span className={styles.statValue}>{currency(paidAmount)}</span>
            <div className={styles.statFooter}>
              Status: {invoice.status || 'Unpaid'} (Expected: {currency(netExpected)})
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.cardDue}`}>
            <span className={styles.statLabel}>Outstanding Balance</span>
            <span className={styles.statValue}>{currency(dueBalance)}</span>
            <div className={styles.statFooter}>Remaining dues to collect</div>
          </div>
        </section>

        {/* Section: Driver Splitting Totals */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Award size={18} className="text-emerald-700" />
            <h2>Driver Revenue Split Summary (10% / 90%)</h2>
          </div>
          <p className={styles.sectionInstructions}>
            Driver Share is calculated as <strong>10%</strong> of the Actual Tow Price (Gross Billed - Hidden Commission). The remaining <strong>90%</strong> belongs to the Company.
          </p>

          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Driver Name</th>
                <th style={{ textAlign: 'center' }}>Total Jobs</th>
                <th style={{ textAlign: 'right' }}>Gross Amount</th>
                <th style={{ textAlign: 'right' }}>Hidden Commission</th>
                <th style={{ textAlign: 'right' }}>Actual Price (Net)</th>
                <th style={{ textAlign: 'right' }} className={styles.highlightHeader}>Driver Share (10%)</th>
                <th style={{ textAlign: 'right' }} className={styles.highlightHeaderAlt}>Company Share (90%)</th>
              </tr>
            </thead>
            <tbody>
              {driverSummaryList.map((drv) => (
                <tr key={drv.name}>
                  <td>
                    <div className={styles.driverNameCell}>
                      <User size={14} className="text-slate-400" />
                      <span>{drv.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }} className="font-bold">{drv.count}</td>
                  <td style={{ textAlign: 'right' }}>{currency(drv.gross)}</td>
                  <td style={{ textAlign: 'right' }} className="text-rose-600">-{currency(drv.commission)}</td>
                  <td style={{ textAlign: 'right' }} className="font-bold text-slate-800">{currency(drv.actual)}</td>
                  <td style={{ textAlign: 'right' }} className={styles.highlightCell}>{currency(drv.driverShare)}</td>
                  <td style={{ textAlign: 'right' }} className={styles.highlightCellAlt}>{currency(drv.companyShare)}</td>
                </tr>
              ))}
              {driverSummaryList.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No driver records associated with this invoice.
                  </td>
                </tr>
              )}
            </tbody>
            {driverSummaryList.length > 0 && (
              <tfoot>
                <tr>
                  <td>Total Split</td>
                  <td style={{ textAlign: 'center' }}>{jobsWithDrivers.length}</td>
                  <td style={{ textAlign: 'right' }}>{currency(totalCharges)}</td>
                  <td style={{ textAlign: 'right' }} className="text-rose-700">-{currency(totalHiddenCharges)}</td>
                  <td style={{ textAlign: 'right' }} className="font-bold">{currency(totalCharges - totalHiddenCharges)}</td>
                  <td style={{ textAlign: 'right' }} className={styles.highlightTotal}>{currency(driverSummaryList.reduce((sum, d) => sum + d.driverShare, 0))}</td>
                  <td style={{ textAlign: 'right' }} className={styles.highlightTotalAlt}>{currency(driverSummaryList.reduce((sum, d) => sum + d.companyShare, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>

        {/* Section: Payment Ledger Logs */}
        <section className={`${styles.section} no-print`} style={{ marginTop: '40px' }}>
          <div className={styles.ledgerGrid}>
            
            {/* Left Box: Client Company Payments */}
            <div className={styles.ledgerBox}>
              <div className={styles.sectionHeader}>
                <History size={18} className="text-emerald-700" />
                <h2>Company Invoice Payments (Money In)</h2>
              </div>

              {/* Live Balance Summary Form Fields */}
              <div className={styles.liveFormRow}>
                <div className={styles.formGroup}>
                  <label className={styles.brandLabel}>Expected (Billed)</label>
                  <input type="text" readOnly value={currency(netExpected)} className={styles.readOnlyInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.brandLabel}>Total Paid Now</label>
                  <input type="text" readOnly value={currency(paidAmount)} className={`${styles.readOnlyInput} text-emerald-600 font-bold`} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.brandLabel}>Ending Dues (Balance)</label>
                  <input type="text" readOnly value={currency(dueBalance)} className={`${styles.readOnlyInput} text-rose-600 font-bold`} />
                </div>
                {Number(payAmount) > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.brandLabelPreview}>New Ending Dues</label>
                    <input type="text" readOnly value={currency(Math.max(0, dueBalance - Number(payAmount)))} className={`${styles.readOnlyInput} text-emerald-700 font-bold`} style={{ borderColor: '#059669', boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)' }} />
                  </div>
                )}
              </div>
              
              {/* Payment Input Form */}
              <form onSubmit={handleAddCompanyPayment} className={styles.ledgerForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.brandLabel}>Date</label>
                    <input 
                      type="date" 
                      value={payDate} 
                      onChange={(e) => setPayDate(e.target.value)} 
                      required 
                      disabled={dueBalance <= 0}
                      className={styles.activeInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.brandLabel}>Amount (QAR)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 500" 
                      value={payAmount} 
                      onChange={(e) => setPayAmount(e.target.value)} 
                      required 
                      disabled={dueBalance <= 0}
                      className={styles.activeInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.brandLabel}>Note / Method</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cash / Bank Transfer" 
                      value={payNote} 
                      onChange={(e) => setPayNote(e.target.value)} 
                      disabled={dueBalance <= 0}
                      className={styles.activeInput}
                    />
                  </div>
                </div>
                <button type="submit" disabled={dueBalance <= 0} className={styles.recordBtn}>Record Payment</button>
              </form>

              {/* Payments History Table */}
              <table className={styles.ledgerTable}>
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Date</th>
                    <th>Note / Method</th>
                    <th style={{ textAlign: 'right' }}>Amount (QAR)</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.invoicePayments || []).map((p, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{shortDate(p.date)}</td>
                      <td>{p.note || 'Invoice Payment'}</td>
                      <td style={{ textAlign: 'right' }} className="font-bold text-emerald-700">{currency(p.amount)}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteCompanyPayment(idx)} 
                          className={styles.deleteBtnIcon}
                          title="Delete Payment Entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(invoice.invoicePayments || []).length === 0 && (
                    <tr>
                      <td colSpan="5" className={styles.emptyTableTd}>No client payments recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right Box: Commission Settlement Payments */}
            <div className={styles.ledgerBox}>
              <div className={styles.sectionHeader}>
                <History size={18} className="text-emerald-700" />
                <h2>Company Commission Settlement (Money Out)</h2>
              </div>

              {/* Live Balance Summary Form Fields */}
              <div className={styles.liveFormRow}>
                <div className={styles.formGroup}>
                  <label className={styles.brandLabel}>Total Commission</label>
                  <input type="text" readOnly value={currency(totalHiddenCharges)} className={styles.readOnlyInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.brandLabel}>Total Settled Now</label>
                  <input type="text" readOnly value={currency(commissionPaid)} className={`${styles.readOnlyInput} text-emerald-600 font-bold`} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.brandLabel}>Ending Dues (Balance)</label>
                  <input type="text" readOnly value={currency(commissionDue)} className={`${styles.readOnlyInput} text-rose-600 font-bold`} />
                </div>
                {Number(commAmount) > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.brandLabelPreview}>New Ending Dues</label>
                    <input type="text" readOnly value={currency(Math.max(0, commissionDue - Number(commAmount)))} className={`${styles.readOnlyInput} text-emerald-700 font-bold`} style={{ borderColor: '#059669', boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)' }} />
                  </div>
                )}
              </div>
              
              {/* Commission Input Form */}
              <form onSubmit={handleAddCommissionPayment} className={styles.ledgerForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.brandLabel}>Date</label>
                    <input 
                      type="date" 
                      value={commDate} 
                      onChange={(e) => setCommDate(e.target.value)} 
                      required 
                      disabled={commissionDue <= 0}
                      className={styles.activeInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.brandLabel}>Amount (QAR)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 500" 
                      value={commAmount} 
                      onChange={(e) => setCommAmount(e.target.value)} 
                      required 
                      disabled={commissionDue <= 0}
                      className={styles.activeInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.brandLabel}>Note / Method</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cash / Bank Transfer" 
                      value={commNote} 
                      onChange={(e) => setCommNote(e.target.value)} 
                      disabled={commissionDue <= 0}
                      className={styles.activeInput}
                    />
                  </div>
                </div>
                <button type="submit" disabled={commissionDue <= 0} className={styles.recordBtn}>Record Settlement</button>
              </form>

              {/* Commission History Table */}
              <table className={styles.ledgerTable}>
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Date</th>
                    <th>Note / Method</th>
                    <th style={{ textAlign: 'right' }}>Amount (QAR)</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.commissionPayments || []).map((p, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{shortDate(p.date)}</td>
                      <td>{p.note || 'Commission Settlement'}</td>
                      <td style={{ textAlign: 'right' }} className="font-bold text-rose-700">{currency(p.amount)}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteCommissionPayment(idx)} 
                          className={styles.deleteBtnIcon}
                          title="Delete Settlement Entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(invoice.commissionPayments || []).length === 0 && (
                    <tr>
                      <td colSpan="5" className={styles.emptyTableTd}>No commission settlements recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </section>

        {/* Section: Individual Job Log */}
        <section className={styles.section} style={{ marginTop: '40px' }}>
          <div className={styles.sectionHeader}>
            <TrendingUp size={18} className="text-emerald-700" />
            <h2>Individual Tow Job Logs</h2>
          </div>
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>SL</th>
                <th>Date</th>
                <th>Job ID</th>
                <th>Driver</th>
                <th>Vehicle / Plate</th>
                <th>Route</th>
                <th style={{ textAlign: 'right' }}>Gross</th>
                <th style={{ textAlign: 'right' }}>Commission</th>
                <th style={{ textAlign: 'right' }}>Actual</th>
                <th style={{ textAlign: 'right' }}>Driver (10%)</th>
                <th style={{ textAlign: 'right' }}>Company (90%)</th>
              </tr>
            </thead>
            <tbody>
              {jobsWithDrivers.map((job, index) => {
                const gross = Number(job.amount || 0);
                const comm = Number(job.serviceCommission || 0);
                const actual = Math.max(0, gross - comm);
                const drvShare = actual * 0.10;
                const compShare = actual * 0.90;

                return (
                  <tr key={index}>
                    <td style={{ color: '#94a3b8' }}>{(index + 1).toString().padStart(2, '0')}</td>
                    <td>{shortDate(job.date)}</td>
                    <td><span className={styles.jobIdPill}>{job.jobId || 'N/A'}</span></td>
                    <td className="font-semibold text-emerald-950">{job.driver}</td>
                    <td>
                      <span className="block font-bold text-xs">{job.vehicleName || 'Towing'}</span>
                      <span className="block text-[10px] text-slate-400 font-bold">{job.vehiclePlate || 'N/A'}</span>
                    </td>
                    <td style={{ maxWidth: '180px', whiteSpace: 'normal', fontSize: '11px' }}>{job.route || 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>{currency(gross)}</td>
                    <td style={{ textAlign: 'right' }} className="text-rose-600">-{currency(comm)}</td>
                    <td style={{ textAlign: 'right' }} className="font-semibold text-slate-800">{currency(actual)}</td>
                    <td style={{ textAlign: 'right' }} className="text-emerald-700 font-bold">{currency(drvShare)}</td>
                    <td style={{ textAlign: 'right' }} className="text-slate-700 font-medium">{currency(compShare)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
