'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiService } from '@/services/apiService';
import { 
  User, 
  Truck, 
  Receipt, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  History,
  Download,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './view.module.css';

export default function UserDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tows, setTows] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Advance Payment State
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [advanceRemark, setAdvanceRemark] = useState('');
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [uData, tData, eData] = await Promise.all([
          apiService.getRecord('users', id),
          apiService.getAllRecords('tows'),
          apiService.getAllRecords('expenses')
        ]);

        setUser(uData);
        
        // Filter tows and expenses for this user
        const userName = uData?.name;
        
        setTows(tData.filter(t => t.driver === userName || t.driver === id || t.driverId === id));
        setExpenses(eData.filter(e => e.worker === userName || e.worker === id || e.workerId === id));
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const salaryBreakup = useMemo(() => {
    if (!user) return null;

    const baseSalary = Number(user.salary || 0);
    
    // Tows filtering
    const cashTows = tows.filter(t => t.paymentMethod === 'Cash');
    const creditTows = tows.filter(t => t.paymentMethod !== 'Cash');
    
    const totalCashCollected = cashTows.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalCreditRevenue = creditTows.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalRevenue = totalCashCollected + totalCreditRevenue;
    
    const totalCommission = totalRevenue * 0.10;
    const cashRetentionByWorker = totalCashCollected * 0.90;
    
    const advanceExpenses = expenses.filter(e => e.expenseType === 'Worker Advance');
    const totalAdvances = advanceExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    
    // Net Salary = Base + 10% of Credit - 90% of Cash - Advances
    const netSalary = baseSalary + (totalCreditRevenue * 0.10) - (totalCashCollected * 0.90) - totalAdvances;

    return {
      baseSalary,
      totalRevenue,
      totalCashCollected,
      totalCreditRevenue,
      totalCommission,
      cashRetentionByWorker,
      totalAdvances,
      netSalary,
      totalTows: tows.length
    };
  }, [user, tows, expenses]);

  const [activeTab, setActiveTab] = useState('overview');
  const [expenseMonth, setExpenseMonth] = useState(new Date().getMonth());
  const [expenseYear, setExpenseYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === expenseMonth && d.getFullYear() === expenseYear;
    });
  }, [expenses, expenseMonth, expenseYear]);

  const handleGrantAdvance = async () => {
    try {
      setIsSubmittingAdvance(true);
      await apiService.createRecord('expenses', {
        date: new Date(advanceDate).toISOString(),
        amount: Number(advanceAmount),
        expenseType: 'Worker Advance',
        description: advanceRemark || `Advance Payment to ${user.name}`,
        worker: user.name,
        workerId: user._id || user.id
      });
      toast.success('Advance payment granted successfully');
      setAdvanceAmount('');
      setAdvanceRemark('');
      // refresh expenses data
      const eData = await apiService.getAllRecords('expenses');
      setExpenses(eData.filter(e => e.worker === user.name || e.worker === user.id || e.workerId === user.id));
    } catch (err) {
      toast.error('Failed to grant advance: ' + err.message);
    } finally {
      setIsSubmittingAdvance(false);
    }
  };


  if (loading) return <div className={styles.loading}>Loading User Profile...</div>;
  if (!user) return <div className={styles.error}>User not found</div>;

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Directory</span>
        </button>
        <div className={styles.headerActions}>
          <button className="btn-primary">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      <div className="flex gap-1 mb-8 bg-white/50 p-1 rounded-2xl border border-emerald-100 w-fit">
        {['overview', 'settlement', 'services', 'expenses', 'advances'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4">
          {/* Left Col: Info & Salary Slip */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-6 pb-8 border-b border-emerald-50 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-500/20">
                  {user.name?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-emerald-950">{user.name}</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Employee ID: {user.id}</p>
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600">
                    <FileText size={18} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">{user.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right Col: Stats & Highlights */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-6 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Truck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tows</p>
                  <h3 className="text-3xl font-black text-emerald-950 mt-1">{salaryBreakup.totalTows}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-6 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                  <h3 className="text-3xl font-black text-emerald-950 mt-1">94%</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Truck size={16} />
                  </div>
                  <h3 className="text-sm font-black text-emerald-950">Vehicle Usage</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(tows.reduce((acc, t) => {
                    acc[t.vehicle] = (acc[t.vehicle] || 0) + 1;
                    return acc;
                  }, {})).map(([vehicle, count]) => (
                    <div key={vehicle} className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
                      <span className="font-bold text-slate-500">{vehicle}</span>
                      <strong className="font-black text-emerald-700">{count} jobs</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <h3 className="text-sm font-black text-emerald-950">Top Customers</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(tows.reduce((acc, t) => {
                    acc[t.customer] = (acc[t.customer] || 0) + 1;
                    return acc;
                  }, {})).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([customer, count]) => (
                    <div key={customer} className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
                      <span className="font-bold text-slate-500">{customer}</span>
                      <strong className="font-black text-emerald-700">{count} jobs</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4">
          <div className="w-full max-w-2xl bg-gradient-to-b from-white to-slate-50 p-10 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-emerald-950">Monthly Settlement Logic</h2>
                <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Calculated for current fiscal period</p>
              </div>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center text-base p-4 bg-white rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Base Monthly Salary</span>
                <span className="font-black text-emerald-950 text-lg">QAR {salaryBreakup.baseSalary.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-base p-4 bg-white rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Total Tow Revenue</span>
                <span className="font-black text-emerald-950 text-lg">QAR {salaryBreakup.totalRevenue.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-base p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                 <span className="font-bold text-emerald-700 uppercase tracking-widest text-[10px]">Worker Commission (10%)</span>
                 <span className="font-black text-emerald-600 text-lg">+QAR {salaryBreakup.totalCommission.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-base p-4 bg-rose-50 rounded-xl border border-rose-100">
                <span className="font-bold text-rose-700 uppercase tracking-widest text-[10px]">Cash Already Taken (100%)</span>
                <span className="font-black text-rose-600 text-lg">-QAR {salaryBreakup.totalCashCollected.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-base p-4 bg-rose-50 rounded-xl border border-rose-100">
                <span className="font-bold text-rose-700 uppercase tracking-widest text-[10px]">Worker Advances Issued</span>
                <span className="font-black text-rose-600 text-lg">-QAR {salaryBreakup.totalAdvances.toLocaleString()}</span>
              </div>

              <div className="h-0.5 bg-emerald-100 my-8 rounded-full w-full"></div>
              
              <div className="flex justify-between items-center bg-emerald-950 p-6 rounded-2xl text-white shadow-xl shadow-emerald-900/20">
                <span className="font-black uppercase tracking-[0.2em] text-xs text-emerald-400">Net Payout Due</span>
                <span className="text-3xl font-black">QAR {salaryBreakup.netSalary.toLocaleString()}</span>
              </div>
            </div>
            
            <button className="w-full mt-8 bg-emerald-600 text-white font-black text-sm uppercase tracking-widest py-5 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 relative z-10 shadow-lg shadow-emerald-600/20">
              <Receipt size={20} />
              <span>Generate Official Slip</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-emerald-50 flex justify-between items-center">
            <h2 className="text-xl font-black text-emerald-950">Service Transaction Ledger</h2>
            <div className="flex gap-4">
               <div className="px-4 py-2 bg-emerald-50 rounded-xl text-[10px] font-black text-emerald-600 uppercase">
                  Cash: QAR {salaryBreakup.totalCashCollected.toLocaleString()}
               </div>
               <div className="px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600 uppercase">
                  Credit: QAR {salaryBreakup.totalCreditRevenue.toLocaleString()}
               </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-emerald-50/50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-emerald-900/40">Date / ID</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-emerald-900/40">Vehicle / Customer</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-emerald-900/40">Method</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-emerald-900/40">Revenue</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-emerald-900/40 text-center">Split (10% | 90%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {tows.map(tow => (
                  <tr key={tow.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-8 py-6">
                      <span className="block text-sm font-black text-emerald-950">#{tow.id}</span>
                      <span className="block text-[10px] font-bold text-slate-400 mt-1">{tow.date}</span>
                    </td>
                    <td className="px-8 py-6">
                       <span className="block text-sm font-bold text-emerald-900">{tow.vehicle}</span>
                       <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{tow.customer}</span>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${(tow.paymentMethod || 'Credit') === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {tow.paymentMethod || 'Credit'}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-sm font-black text-emerald-950">QAR {Number(tow.amount || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center gap-2">
                          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-black text-emerald-600">
                             {Math.round(Number(tow.amount || 0) * 0.1)}
                          </div>
                          <div className="w-4 h-px bg-emerald-100"></div>
                          <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-500">
                             {Math.round(Number(tow.amount || 0) * 0.9)}
                          </div>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-8 rounded-3xl border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-emerald-950">Expense Analysis</h2>
              <p className="text-slate-500 text-sm font-medium">Monthly breakdown of worker-related expenditures.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-emerald-50 p-2 rounded-2xl">
              <select 
                value={expenseMonth} 
                onChange={(e) => setExpenseMonth(parseInt(e.target.value))}
                className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-emerald-950 px-4 py-2 cursor-pointer"
              >
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select 
                value={expenseYear} 
                onChange={(e) => setExpenseYear(parseInt(e.target.value))}
                className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-emerald-950 px-4 py-2 cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Monthly Total</p>
                <h3 className="text-3xl font-black text-rose-600 mt-2">QAR {filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString()}</h3>
             </div>
             <div className="bg-emerald-950 md:col-span-2 p-8 rounded-3xl text-white relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Expense Intensity</p>
                   <h3 className="text-3xl font-black mt-2">{filteredExpenses.length} Logged Items</h3>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Receipt size={100} />
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Description</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Vehicle</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-600">{exp.date}</span>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-sm font-black text-emerald-950">{exp.description}</span>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{exp.vehicle || 'General'}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className="text-sm font-black text-rose-500">QAR {Number(exp.amount || 0).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-8 py-12 text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No expenses recorded for this period.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advances' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <DollarSign size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-emerald-950">Issue Cash Advance</h2>
                <p className="text-slate-500 text-xs font-medium">Direct deduction from next salary payout.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount (QAR)</label>
                <input 
                  type="number" 
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(e.target.value)}
                  className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm placeholder:text-slate-400"
                  placeholder="Enter amount..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Issue Date</label>
                <input 
                  type="date" 
                  value={advanceDate}
                  onChange={e => setAdvanceDate(e.target.value)}
                  className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Remark / Reason</label>
                <input 
                  type="text" 
                  value={advanceRemark}
                  onChange={e => setAdvanceRemark(e.target.value)}
                  className="block w-full px-1 py-4 bg-transparent border-b-2 border-emerald-100 focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm placeholder:text-slate-400"
                  placeholder="Enter optional remark..."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleGrantAdvance}
                disabled={isSubmittingAdvance || !advanceAmount}
                className="bg-emerald-600 text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmittingAdvance ? 'Processing...' : 'Confirm Advance Payment'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-emerald-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-emerald-50">
               <h3 className="text-lg font-black text-emerald-950">Advance Payment History</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Previously issued advances</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Date Issued</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Remark / Reason</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Amount Deducted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {expenses.filter(e => e.expenseType === 'Worker Advance').sort((a,b) => new Date(b.date) - new Date(a.date)).map(exp => (
                    <tr key={exp.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-600">{new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-sm font-black text-emerald-950">{exp.description}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className="text-sm font-black text-amber-600">QAR {Number(exp.amount || 0).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                  {expenses.filter(e => e.expenseType === 'Worker Advance').length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-8 py-12 text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No advances issued to this worker.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

