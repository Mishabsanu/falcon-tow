'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Truck, Activity, User, UserCircle, CreditCard, Calendar, X } from 'lucide-react';
import { towService } from '@/modules/tows/services/towService';
import TowTable from '@/modules/tows/components/TowTable';
import SummaryCard from '@/modules/common/components/SummaryCard';
import CsvImport from '@/components/CsvImport';
import ExportCsvButton from '@/components/ExportCsvButton';
import styles from './page.module.css';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';

export default function Tows() {
  const [towJobs, setTowJobs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // New Filters
  const [filters, setFilters] = useState({
    driver: 'All',
    vehicle: 'All',
    customer: 'All',
    paymentMethod: 'All',
    startDate: '',
    endDate: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    drivers: [],
    vehicles: [],
    customers: []
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));

    // Load Filter Options
    async function loadOptions() {
      try {
        const [u, v, c] = await Promise.all([
          apiService.getRecords('users', { limit: 200, extraParams: { select: 'id,name,role' } }),
          apiService.getRecords('vehicles', { limit: 200, extraParams: { select: 'id,name,plate' } }),
          apiService.getRecords('customers', { limit: 300, extraParams: { select: 'id,name' } })
        ]);
        setFilterOptions({
          drivers: (u.data || []).filter(user => user.role === 'Worker'),
          vehicles: v.data || [],
          customers: c.data || []
        });
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    }
    loadOptions();
  }, []);

  const isWorker = user?.role === 'Worker';

  const fetchTows = useCallback(async () => {
    setLoading(true);
    try {
      const extraParams = {};
      if (filters.driver !== 'All') extraParams.driver = filters.driver;
      if (filters.vehicle !== 'All') extraParams.vehicle = filters.vehicle;
      if (filters.customer !== 'All') extraParams.customer = filters.customer;
      if (filters.paymentMethod !== 'All') extraParams.paymentMethod = filters.paymentMethod;
      if (filters.startDate) extraParams.startDate = filters.startDate;
      if (filters.endDate) extraParams.endDate = filters.endDate;

      const result = await towService.getTows({
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        status: status,
        extraParams
      });
      setTowJobs(result.data || []);
      if (result.pagination) setPagination(result.pagination);
    } catch (error) {
      toast.error('Failed to sync tow service data');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit, status, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchTows, 300);
    return () => clearTimeout(timer);
  }, [fetchTows]);

  const handleDelete = async (id) => {
    if (isWorker) return;
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        await towService.deleteTow(id);
        toast.success('Job deleted');
        fetchTows();
      } catch (error) {
        toast.error(error.message || 'Failed to delete');
      }
    }
  };

  const activeJobsCount = towJobs.filter((tow) => ['Pending', 'In Progress'].includes(tow.status)).length;
  const pageRevenue = towJobs.reduce((sum, tow) => sum + Number(tow.amount ?? 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tow Jobs</h1>
          <p className={styles.subtitle}>{isWorker ? 'Manage your assigned jobs and status.' : 'View all tow jobs and fleet activity.'}</p>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-4 items-center">
          {!isWorker && <CsvImport moduleKey="tows" onComplete={fetchTows} />}
          {!isWorker && <ExportCsvButton moduleKey="tows" filename="Tow_Jobs_Ledger" />}
          <Link href="/dashboard/tows/new" className="btn-primary">
            <Plus size={18} />
            <span>New Tow</span>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-10">
        <SummaryCard 
          label={isWorker ? "My Total Dispatches" : "Total Fleet Jobs"} 
          value={pagination.total} 
          icon={Truck} 
          color="emerald" 
        />
        <SummaryCard 
          label="Active Deployments" 
          value={activeJobsCount} 
          icon={Activity} 
          color="amber" 
        />
        {!isWorker && (
          <SummaryCard 
            label="Page Ledger Value" 
            value={`QAR ${pageRevenue.toLocaleString()}`} 
            icon={Plus} 
            color="blue" 
          />
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 mb-8">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search jobs (ID, Plate, Name)..."
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold text-emerald-950 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-xl shadow-slate-200/40"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
              showFilters 
                ? 'bg-emerald-950 text-emerald-400 shadow-emerald-900/40 border-transparent' 
                : 'bg-white text-emerald-700 border border-slate-100 hover:bg-emerald-50 shadow-slate-200/40'
            }`}
          >
            <Filter size={18} className={showFilters ? 'animate-pulse' : ''} />
            <span>{showFilters ? 'Filtering' : 'Filter'}</span>
          </button>
        </div>
      </div>

      {/* Active System Filters */}
      {(status !== 'All' || filters.driver !== 'All' || filters.vehicle !== 'All' || filters.customer !== 'All' || filters.paymentMethod !== 'All' || filters.startDate || filters.endDate) && (
        <div className="flex flex-wrap items-center gap-3 mb-10 p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100/50">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40">Active Filters</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {status !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg shadow-emerald-600/20 hover:bg-rose-600 transition-all cursor-default">
                <span>Status: {status}</span>
                <button onClick={() => setStatus('All')} className="p-0.5 hover:bg-white/20 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {filters.driver !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Driver: {filters.driver}</span>
                <button onClick={() => setFilters(f => ({ ...f, driver: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {filters.vehicle !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Vehicle: {filters.vehicle}</span>
                <button onClick={() => setFilters(f => ({ ...f, vehicle: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {filters.customer !== 'All' && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Customer: {filters.customer}</span>
                <button onClick={() => setFilters(f => ({ ...f, customer: 'All' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {(filters.startDate || filters.endDate) && (
              <div className="group flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-bold border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-default">
                <span>Period: {filters.startDate || '...'} / {filters.endDate || '...'}</span>
                <button onClick={() => setFilters(f => ({ ...f, startDate: '', endDate: '' }))} className="p-0.5 hover:bg-rose-100 rounded-md transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setStatus('All');
              setFilters({ driver: 'All', vehicle: 'All', customer: 'All', paymentMethod: 'All', startDate: '', endDate: '' });
            }}
            className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2"
          >
            Clear Filters
          </button>
        </div>
      )}

      {showFilters && (
        <div className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Filter Options</span>
            </div>

            <div className="flex flex-wrap gap-4">
               {/* Status Filter */}
              <div className="filter-group-premium">
                <Activity size={14} className="text-emerald-600" />
                <select 
                  value={status} 
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Worker Filter */}
              {!isWorker && (
                <div className="filter-group-premium">
                  <UserCircle size={14} className="text-emerald-600" />
                  <select 
                    value={filters.driver} 
                    onChange={(e) => setFilters(f => ({ ...f, driver: e.target.value }))}
                  >
                    <option value="All">All Workers</option>
                    {filterOptions.drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              )}

              {/* Vehicle Filter */}
              <div className="filter-group-premium">
                <Truck size={14} className="text-emerald-600" />
                <select 
                  value={filters.vehicle} 
                  onChange={(e) => setFilters(f => ({ ...f, vehicle: e.target.value }))}
                >
                  <option value="All">All Vehicles</option>
                  {filterOptions.vehicles.map(v => <option key={v.id} value={`${v.name} - ${v.plate}`}>{v.name} - {v.plate}</option>)}
                </select>
              </div>

              {/* Customer Filter */}
              <div className="filter-group-premium">
                <User size={14} className="text-emerald-600" />
                <select 
                  value={filters.customer} 
                  onChange={(e) => setFilters(f => ({ ...f, customer: e.target.value }))}
                >
                  <option value="All">All Customers</option>
                  {filterOptions.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Payment Filter */}
              <div className="filter-group-premium">
                <CreditCard size={14} className="text-emerald-600" />
                <select 
                  value={filters.paymentMethod} 
                  onChange={(e) => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
                >
                  <option value="All">All Payments</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-emerald-50 w-full">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/20">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">Date Range</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Search by date</span>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border-2 border-emerald-100 rounded-2xl overflow-hidden focus-within:border-emerald-500/50 transition-all shadow-sm">
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-xs font-bold text-emerald-950 p-4 outline-none cursor-pointer"
                      value={filters.startDate}
                      onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                    />
                    <div className="flex items-center justify-center px-2">
                      <div className="w-6 h-[2px] bg-emerald-100 rounded-full"></div>
                    </div>
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-xs font-bold text-emerald-950 p-4 outline-none cursor-pointer"
                      value={filters.endDate}
                      onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>

                  {(filters.startDate || filters.endDate) && (
                    <button 
                      onClick={() => setFilters(f => ({ ...f, startDate: '', endDate: '' }))}
                      className="h-14 px-6 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      Clear Range
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      <TowTable 
        tows={towJobs}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        onDelete={handleDelete}
        isWorker={isWorker}
      />
    </div>
  );
}
