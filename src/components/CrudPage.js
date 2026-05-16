'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  ShieldCheck,
  Download
} from 'lucide-react';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';
import styles from './CrudPage.module.css';

export default function CrudPage({ moduleKey }) {
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
  const isAdmin = user?.role?.toLowerCase() === 'administrator';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [status, setStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const config = {
    customers: { title: 'Customers', path: '/dashboard/customers' },
    users: { title: 'User Management', path: '/dashboard/users' },
    vehicles: { title: 'Vehicles', path: '/dashboard/vehicles' },
    invoices: { title: 'Invoices', path: '/dashboard/invoices' },
    quotations: { title: 'Quotations', path: '/dashboard/quotations' },
    expenses: { title: 'Expenses', path: '/dashboard/expenses' },
    salaries: { title: 'Salaries', path: '/dashboard/salaries' },
    tows: { title: 'Tow Jobs', path: '/dashboard/tows' }
  }[moduleKey];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords(moduleKey, { q: search, page, status });
      setRecords(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [moduleKey, search, page, status]);

  useEffect(() => {
    setPage(1);
  }, [status, search, moduleKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record? This action is irreversible.')) return;

    const toastId = toast.loading('Initiating purge protocol...');
    try {
      await apiService.deleteRecord(moduleKey, id);
      toast.success('Record purged successfully from the node.', { id: toastId });
      fetchData();
    } catch (error) {
      toast.error('Purge failed: Access denied or network interruption.', { id: toastId });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">All Records</span>
          </div>
          <h1 className="text-4xl font-black text-emerald-950 tracking-tight flex items-center gap-4">
            {config.title}
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/50 border border-emerald-200 rounded-full">
                <ShieldCheck size={12} className="text-emerald-700" />
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Admin Mode</span>
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage your {config.title.toLowerCase()} here.</p>
        </div>
        <Link href={`${config.path}/new`} className="btn-primary">
          <Plus size={18} />
          <span>Add New</span>
        </Link>
      </header>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 mb-8">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold text-emerald-950 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-xl shadow-slate-200/40"
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
            <span>{showFilters ? 'Hide Filter' : 'Show Filter'}</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-emerald-100 rounded-[2rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Entity Filter Matrix</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="filter-group-premium">
                <Filter size={14} className="text-emerald-600" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="All">All Entities</option>
                  <option value="Pending">Pending Review</option>
                  <option value="In Progress">Active Process</option>
                  <option value="Completed">Completed Task</option>
                  <option value="Cancelled">Terminated</option>
                  <option value="Active">System Active</option>
                  <option value="Inactive">System Inactive</option>
                  <option value="Paid">Cleared Ledger</option>
                  <option value="Unpaid">Pending Balance</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block glass-card !p-0 overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>ID</th>
                <th>Details</th>
                {isAdmin && <th>Created By</th>}
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records found.</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                          {moduleKey === 'vehicles' ? `${record?.name ?? 'Unknown'} [${record?.modelRef || 'N/A'}]` :
                            moduleKey === 'tows' ? (record?.customer ?? 'Unknown Client') :
                              (record?.name || record?.customer || record?.worker || record?.title || record?.id || 'No Name')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {moduleKey !== 'users' && <span className="text-[10px] font-bold text-emerald-600/40 uppercase tracking-widest">{record.id}</span>}
                          {record.role && moduleKey !== 'users' && <span className="h-1 w-1 rounded-full bg-emerald-200"></span>}
                          {record.role && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{record.role}</span>}
                          {moduleKey === 'tows' && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              • {record.customerVehicle} [{record.customerPlate}]
                            </span>
                          )}
                          {record?.createdAt && (
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                              • {new Date(record.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-emerald-950">
                          {moduleKey === 'tows' && (
                            <div className="flex flex-col gap-0.5">
                              <span>{record?.driver || 'No Driver'} • {record?.vehicle || 'No Truck'}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {record?.pickup || 'Unknown'} → {record?.dropoff || 'Unknown'}
                              </span>
                            </div>
                          )}
                          {moduleKey === 'expenses' && `${record.amount || 0} QAR`}
                          {moduleKey === 'invoices' && `${record.total || 0} QAR`}
                          {moduleKey === 'salaries' && `${record.amount || 0} QAR`}
                          {moduleKey === 'quotations' && `${record.amount || 0} QAR`}
                          {moduleKey === 'vehicles' && (
                            <div className="flex flex-col gap-0.5">
                              <span>{record.plate} • {record.modelRef}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.year || 'N/A'}</span>
                            </div>
                          )}
                          {moduleKey === 'users' && record.phone}
                          {moduleKey === 'customers' && record.phone}
                        </p>
                      </div>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-900">{record.createdBy || 'System'}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Operational User</span>
                        </div>
                      </td>
                    )}
                    <td>
                      <div className={`badge ${record.status === 'Completed' || record.status === 'Paid' || record.status === 'Active' ? 'badge-success' :
                        ['In Progress', 'Pending'].includes(record.status) ? 'badge-warning' : 'badge-neutral'
                        }`}>
                        <div className={`h-1 w-1 rounded-full ${record.status === 'Completed' || record.status === 'Paid' || record.status === 'Active' ? 'bg-emerald-600' : 'bg-emerald-400'}`}></div>
                        {record.status || 'Active'}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`${config.path}/${record.id}`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title={moduleKey === 'salaries' ? "View Salary Slip" : "View"}>
                          {moduleKey === 'salaries' ? <Download size={16} /> : <Eye size={16} />}
                        </Link>
                        <Link href={`${config.path}/${record.id}/edit`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Edit">
                          <Edit2 size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Loading Intelligence...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records found.</div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="glass-card p-6 border-l-4 border-l-emerald-600 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{record.id}</p>
                    <p className="text-sm font-black text-emerald-950 uppercase">
                      {moduleKey === 'vehicles' ? `${record?.name ?? 'Unknown'}` :
                        moduleKey === 'tows' ? (record?.customer ?? 'Unknown Client') :
                          (record?.name || record?.customer || record?.worker || record?.title || record?.id || 'No Name')}
                    </p>
                  </div>
                  <div className={`badge ${record.status === 'Completed' || record.status === 'Paid' || record.status === 'Active' ? 'badge-success' :
                    ['In Progress', 'Pending'].includes(record.status) ? 'badge-warning' : 'badge-neutral'
                    }`}>
                    {record.status || 'Active'}
                  </div>
                </div>

                <div className="py-3 border-y border-emerald-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Principal Data</span>
                    <span className="text-xs font-bold text-emerald-950">
                      {moduleKey === 'expenses' || moduleKey === 'invoices' || moduleKey === 'salaries' || moduleKey === 'quotations' ? `${record.amount || record.total || 0} QAR` :
                        moduleKey === 'vehicles' ? record.plate : record.phone || '-'}
                    </span>
                  </div>
                  {moduleKey === 'vehicles' && (
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registry</span>
                      <span className="text-[9px] font-bold text-emerald-600">{record.modelRef}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`${config.path}/${record.id}`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                    {moduleKey === 'salaries' ? <Download size={14} /> : <Eye size={14} />}
                    <span>View</span>
                  </Link>
                  <Link href={`${config.path}/${record.id}/edit`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </Link>
                  <button onClick={() => handleDelete(record.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pagination-container">
        <p className="pagination-info">
          Showing {records.length} of {pagination.total || 0} records
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="pagination-btn"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5">
            {(() => {
              const pages = [];
              const maxVisible = 5;
              const totalPages = pagination.totalPages || 1;
              let start = Math.max(1, page - Math.floor(maxVisible / 2));
              let end = Math.min(totalPages, start + maxVisible - 1);

              if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
              }

              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`pagination-btn ${page === i ? "pagination-btn-active" : ""}`}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}
          </div>

          <button
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => setPage(p => p + 1)}
            className="pagination-btn"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
