"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type ListPaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function ListPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: ListPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="pagination-container">
      <p className="pagination-info">
        Displaying {start}-{end} of {total} nodes
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="pagination-btn"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-20 text-center text-[10px] font-bold text-emerald-950 uppercase tracking-widest">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="pagination-btn"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
