import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ 
  headers, 
  data, 
  loading, 
  pagination, 
  onPageChange, 
  renderRow,
  emptyMessage = "No records found."
}) {
  return (
    <div className="table-container glass-card !p-0">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={h.style}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
                Synchronizing Ledger Data...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, i) => renderRow(item, i))
          )}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination p-6 border-t border-emerald-50 bg-emerald-50/10">
          <span className="page-info text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {data.length} of {pagination.total} entries (Page {pagination.page} of {pagination.totalPages})
          </span>
          <div className="page-controls">
            <button 
              className="page-btn" 
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`page-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                  onClick={() => onPageChange(i + 1)}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, pagination.page - 3), Math.min(pagination.totalPages, pagination.page + 2))}
            </div>
            <button 
              className="page-btn" 
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
