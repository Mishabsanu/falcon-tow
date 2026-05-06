'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiService } from '@/services/apiService';
import { 
  Truck, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Settings
} from 'lucide-react';
import styles from './page.module.css';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getRecords('vehicles', {
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        status: status
      });
      setVehicles(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchVehicles]);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to decommission this vehicle?')) {
      try {
        await apiService.deleteRecord('vehicles', id);
        fetchVehicles();
      } catch (error) {
        alert('Failed to delete vehicle');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
             <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-bold text-emerald-800/60 uppercase tracking-[0.2em]">Fleet Monitor</span>
          </div>
          <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">Fleet <span className="text-emerald-600">Management</span></h1>
          <p className="text-slate-500 text-sm font-medium">Track service status, vehicle assignments, and real-time fleet health.</p>
        </div>
        <Link href="/dashboard/vehicles/new" className="btn-primary">
          <Plus size={18} />
          <span>Add New Vehicle</span>
        </Link>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="search-wrapper flex-1 relative">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by vehicle name or plate..." 
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
      {status !== 'All' && (
        <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2">Fleet Filters:</span>
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
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40">Fleet Query Engine</span>
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
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container glass-card !p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle Asset</th>
              <th>Fleet Specs</th>
              <th>Technical Identity</th>
              <th>Compliance Audit</th>
              <th>Status</th>
              <th>Administrative Audit</th>
              <th className="text-right">Interface</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scanning fleet database...</td></tr>
            ) : vehicles.map((v) => (
              <tr key={v.id}>
                <td>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                      <Truck size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-emerald-950 leading-tight">{v.name}</div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">UUID: {v.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="text-sm font-bold text-slate-700">{v.modelRef || 'N/A'}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Year: {v.year || 'N/A'}</div>
                </td>
                <td>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 w-12">Plate:</span>
                      <span className="text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{v.plate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 w-12">Chassis:</span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter">{v.chassisRef || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${new Date(v.insuranceExpiry) < new Date() ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <div>
                        <div className="text-[10px] font-black text-slate-800 uppercase leading-none">Insurance</div>
                        <div className="text-[9px] font-bold text-slate-400 mt-1">{v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString('en-GB') : 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${new Date(v.registrationExpiry) < new Date() ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <div>
                        <div className="text-[10px] font-black text-slate-800 uppercase leading-none">Registration</div>
                        <div className="text-[9px] font-bold text-slate-400 mt-1">{v.registrationExpiry ? new Date(v.registrationExpiry).toLocaleDateString('en-GB') : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    v.status === 'Available' ? 'badge-success' : 
                    v.status === 'In Use' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    <div className={`h-1 w-1 rounded-full ${v.status === 'Available' ? 'bg-emerald-600' : 'bg-emerald-400'}`}></div>
                    {v.status}
                  </span>
                </td>
                <td>
                  <div className="text-[10px] font-bold text-emerald-950 uppercase tracking-tight">{v.createdBy || 'System'}</div>
                  <div className="text-[9px] font-bold text-slate-400 mt-1">{v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-GB') : 'Pre-Migration'}</div>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/vehicles/${v.id}/edit`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Edit Parameters">
                      <Edit3 size={16} />
                    </Link>
                    <Link href={`/dashboard/vehicles/${v.id}`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Fleet Reports">
                      <Settings size={16} />
                    </Link>
                    <button 
                      className="p-2.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm" 
                      title="Decommission"
                      onClick={() => handleDelete(v.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && vehicles.length === 0 && (
              <tr><td colSpan="6" className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No fleet nodes detected.</td></tr>
            )}
          </tbody>
        </table>
        
        <div className="pagination">
          <span className="page-info">
            Displaying {vehicles.length} of {pagination.total} vehicles
          </span>
          <div className="page-controls">
            <button 
              className="page-btn" 
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              <button className="page-btn active">{pagination.page}</button>
            </div>
            <button 
              className="page-btn" 
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
