'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Truck, Activity, User, UserCircle, CreditCard, Calendar } from 'lucide-react';
import { towService } from '@/modules/tows/services/towService';
import TowTable from '@/modules/tows/components/TowTable';
import SummaryCard from '@/modules/common/components/SummaryCard';
import CsvImport from '@/components/CsvImport';
import ExportCsvButton from '@/components/ExportCsvButton';
import styles from './page.module.css';
import { toast } from 'sonner';

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
          apiService.getAllRecords('users'),
          apiService.getAllRecords('vehicles'),
          apiService.getAllRecords('customers')
        ]);
        setFilterOptions({
          drivers: u.filter(user => user.role === 'Worker'),
          vehicles: v,
          customers: c
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
    if (confirm('Permanently decommission this job record from the ledger?')) {
      try {
        await towService.deleteTow(id);
        toast.success('Job record purged successfully');
        fetchTows();
      } catch (error) {
        toast.error(error.message || 'Purge operation failed');
      }
    }
  };

  const activeJobsCount = towJobs.filter((tow) => ['Pending', 'In Progress'].includes(tow.status)).length;
  const pageRevenue = towJobs.reduce((sum, tow) => sum + Number(tow.amount ?? 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tow Service <span style={{ color: 'var(--primary)' }}>Operations</span></h1>
          <p className={styles.subtitle}>{isWorker ? 'Manage your assigned operational routes and job status.' : 'Global monitoring of fleet deployment and service execution.'}</p>
        </div>
        <div className="flex gap-4 items-center">
          {!isWorker && <CsvImport moduleKey="tows" onComplete={fetchTows} />}
          {!isWorker && <ExportCsvButton moduleKey="tows" filename="Tow_Jobs_Ledger" />}
          <Link href="/dashboard/tows/new" className="btn-primary">
            <Plus size={18} />
            <span>New Dispatch</span>
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="search-wrapper flex-1 relative">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search job ID, customer, vehicle or operator..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
            showFilters 
              ? 'bg-emerald-950 text-emerald-400 border-emerald-800 shadow-emerald-900/40' 
              : 'bg-white text-emerald-700 border border-emerald-100 hover:bg-emerald-50 shadow-emerald-900/5'
          }`}
        >
          <Filter size={18} />
          <span>{showFilters ? 'Hide Filters' : 'Filter View'}</span>
        </button>
      </div>

      {/* Active Filter Chips */}
      {(status !== 'All' || filters.driver !== 'All' || filters.vehicle !== 'All' || filters.customer !== 'All' || filters.paymentMethod !== 'All' || filters.startDate || filters.endDate) && (
        <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2">Active Filters:</span>
          
          {status !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Status: {status}</span>
              <button onClick={() => setStatus('All')} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {filters.driver !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Driver: {filters.driver}</span>
              <button onClick={() => setFilters(f => ({ ...f, driver: 'All' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {filters.vehicle !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Vehicle: {filters.vehicle}</span>
              <button onClick={() => setFilters(f => ({ ...f, vehicle: 'All' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {filters.customer !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Customer: {filters.customer}</span>
              <button onClick={() => setFilters(f => ({ ...f, customer: 'All' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {filters.paymentMethod !== 'All' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Payment: {filters.paymentMethod}</span>
              <button onClick={() => setFilters(f => ({ ...f, paymentMethod: 'All' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          {(filters.startDate || filters.endDate) && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
              <span>Date: {filters.startDate || '...'} to {filters.endDate || '...'}</span>
              <button onClick={() => setFilters(f => ({ ...f, startDate: '', endDate: '' }))} className="hover:text-rose-500 transition-colors"><MoreHorizontal size={12} className="rotate-45" /></button>
            </div>
          )}

          <button 
            onClick={() => {
              setStatus('All');
              setFilters({ driver: 'All', vehicle: 'All', customer: 'All', paymentMethod: 'All', startDate: '', endDate: '' });
            }}
            className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 ml-2"
          >
            Reset All
          </button>
        </div>
      )}

      {showFilters && (
        <div className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Advanced Query Engine</span>
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">Audit Period</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Select temporal range</span>
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
