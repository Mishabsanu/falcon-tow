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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-white border border-emerald-100/50 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-xl group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by vehicle name or plate..." 
            className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-emerald-100/50 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-600/50 transition-all outline-none text-emerald-950 font-semibold text-sm placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800/40">Vehicle Status</label>
          <select 
            className="filter-select" 
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

      <div className="table-container glass-card !p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle Details</th>
              <th>License Plate</th>
              <th>Last Service</th>
              <th>Status</th>
              <th className="text-right">Action Interface</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scanning fleet database...</td></tr>
            ) : vehicles.map((v) => (
              <tr key={v.id}>
                <td>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Truck size={20} />
                    </div>
                    <span className="text-sm font-bold text-emerald-950">{v.name}</span>
                  </div>
                </td>
                <td>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">{v.plate}</span>
                </td>
                <td>
                  <span className="text-xs font-semibold text-slate-400">{v.lastService || 'N/A'}</span>
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
              <tr><td colSpan="5" className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No fleet nodes detected.</td></tr>
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
