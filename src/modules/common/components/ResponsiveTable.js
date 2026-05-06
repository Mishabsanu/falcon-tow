import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ResponsiveTable({ 
  headers, 
  data, 
  loading, 
  pagination, 
  onPageChange, 
  renderRow,
  renderMobileCard, // New: Function to render a card on mobile
  emptyMessage = "No records found."
}) {
  return (
    <div className="w-full">
      {/* DESKTOP TABLE VIEW (Visible on tablets and desktops) */}
      <div className="hidden md:block table-container glass-card !p-0 overflow-hidden">
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
        
        {pagination && (
          <div className="pagination">
            <span className="page-info">
              Showing {data.length} of {pagination.total} Ledger Entries
            </span>
            <div className="page-controls">
              <button 
                className="page-btn" 
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button className="page-btn active">{pagination.page}</button>
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

      {/* MOBILE CARD VIEW (Visible only on mobile) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
            Loading Intelligence...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            {emptyMessage}
          </div>
        ) : (
          <>
            {data.map((item, i) => (
              <div key={i} className="glass-card p-6 border-l-4 border-l-emerald-600">
                {renderMobileCard(item, i)}
              </div>
            ))}
            
            {pagination && (
              <div className="pagination mt-6">
                <div className="page-controls w-full justify-between">
                  <button 
                    className="page-btn" 
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange(pagination.page - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-emerald-800">Page {pagination.page}</span>
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
          </>
        )}
      </div>
    </div>
  );
}
