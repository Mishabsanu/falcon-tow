'use client';
import ResponsiveTable from '@/modules/common/components/ResponsiveTable';
import SummaryCard from '@/modules/common/components/SummaryCard';
import { apiService } from '@/services/apiService';
import {
  Activity,
  Edit3,
  FileText,
  Filter,
  Plus,
  Search,
  Trash2,
  UserSquare2
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords('users', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        status: status
      });
      setUsers(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this user?')) {
      try {
        await apiService.deleteRecord('users', id);
        toast.success('User removed successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
             <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">Staff List</span>
          </div>
          <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">User <span className="text-emerald-600">Management</span></h1>
          <p className="text-slate-500 text-sm font-medium">Manage your employees, roles, and payroll.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Link href="/dashboard/users/new" className="btn-primary">
            <Plus size={18} />
            <span>Register New Staff</span>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-10">
        <SummaryCard 
          label="Staff Count" 
          value={pagination.total} 
          icon={UserSquare2} 
          color="emerald" 
        />
        <SummaryCard 
          label="Active Duty" 
          value={users.filter(u => u.status === 'Active').length} 
          icon={Activity} 
          color="blue" 
        />
        <SummaryCard 
          label="Monthly Payroll Pool" 
          value={`QAR ${users.reduce((sum, u) => sum + Number(u.salary || 0), 0).toLocaleString()}`} 
          icon={Plus} 
          color="amber" 
        />
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 mb-8">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
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
            <span>{showFilters ? 'System Active' : 'Filter Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {status !== 'All' && (
        <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2">Filters:</span>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">
            <span>Status: {status}</span>
            <button onClick={() => setStatus('All')} className="hover:text-rose-500 transition-colors"><Plus size={12} className="rotate-45" /></button>
          </div>
          <button 
            onClick={() => setStatus('All')}
            className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 ml-2"
          >
            Reset
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

            <div className="flex flex-wrap items-center gap-4">
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
                  <option value="Active">Active Duty</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Terminated</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResponsiveTable
        headers={[
          { label: "User Name" },
          { label: "Phone" },
          { label: "Role" },
          { label: "Salary" },
          { label: "Status" },
          { label: "Created By" },
          { label: "Actions", style: { textAlign: 'right' } }
        ]}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        renderRow={(u) => (
          <tr key={u.id}>
            <td>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-emerald-900/10">
                  {u?.name?.charAt(0) ?? 'U'}
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-950">
                    {u?.name ?? 'Unknown'} <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{u?.id || 'NO_ID'}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{u?.email || 'NO_EMAIL'}</div>
                </div>
              </div>
            </td>
            <td className="text-sm font-bold text-slate-600">{u?.phone || 'N/A'}</td>
            <td>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                {u?.role || 'User'}
              </span>
            </td>
            <td>
              <p className="text-sm font-bold text-emerald-950">QAR {Number(u?.salary || 0).toLocaleString()}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Base Monthly</p>
            </td>
            <td>
              <span className={`badge ${u?.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                <div className={`h-1 w-1 rounded-full ${u?.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-400'}`}></div>
                {u?.status || 'Active'}
              </span>
            </td>
            <td>
              <div className="text-[10px] font-bold text-emerald-950 uppercase tracking-tight">{u?.createdBy || 'System'}</div>
              <div className="text-[9px] font-bold text-slate-400 mt-1">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Pre-Migration'}</div>
            </td>
            <td className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Link href={`/dashboard/users/${u.id}/edit`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Edit">
                  <Edit3 size={16} />
                </Link>
                <Link href={`/dashboard/users/${u.id}`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="View">
                  <FileText size={16} />
                </Link>
                <button
                  className="p-2.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  title="Delete"
                  onClick={() => handleDelete(u.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(u) => (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
                  {u?.name?.charAt(0) ?? 'U'}
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-950 uppercase">{u.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                </div>
              </div>
              <span className={`badge ${u?.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                {u?.status || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-emerald-50">
               <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-xs font-bold text-emerald-950">{u.phone || 'N/A'}</p>
               </div>
               <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salary</p>
                  <p className="text-xs font-black text-emerald-600">QAR {u.salary || 0}</p>
               </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Link href={`/dashboard/users/${u.id}`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                <FileText size={16} />
                <span>View</span>
              </Link>
              <Link href={`/dashboard/users/${u.id}/edit`} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                <Edit3 size={16} />
                <span>Edit</span>
              </Link>
              <button onClick={() => handleDelete(u.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
