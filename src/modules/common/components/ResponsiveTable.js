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
        <div className="overflow-x-auto custom-scrollbar">
          <table className="data-table min-w-[1100px]">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={h.style}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {headers.map((_, j) => (
                      <td key={j} className="px-10 py-7">
                        <div className="h-4 bg-slate-100 rounded-md w-full skeleton"></div>
                      </td>
                    ))}
                  </tr>
                ))
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
        </div>
        
        {pagination && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-t border-emerald-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {data.length} of {pagination.total} Ledger Entries
            </span>
            <div className="page-controls flex items-center gap-1.5">
              <button 
                className="page-btn mr-2" 
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                let end = Math.min(pagination.totalPages, start + maxVisible - 1);
                
                if (end - start + 1 < maxVisible) {
                  start = Math.max(1, end - maxVisible + 1);
                }

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={`page-btn ${pagination.page === i ? 'active' : ''}`}
                      onClick={() => onPageChange(i)}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}

              <button 
                className="page-btn ml-2" 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE CARD VIEW (Visible only on mobile) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 border-l-4 border-l-slate-100 animate-pulse">
               <div className="h-4 bg-slate-100 rounded-md w-3/4 skeleton mb-4"></div>
               <div className="h-3 bg-slate-100 rounded-md w-1/2 skeleton mb-2"></div>
               <div className="h-3 bg-slate-100 rounded-md w-1/4 skeleton"></div>
            </div>
          ))
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
