const fs = require('fs');

const garageCss = fs.readFileSync('../garage/src/app/globals.css', 'utf8');
const appended = `
@layer components {
  .btn-primary {
    @apply flex items-center gap-3 px-6 py-4 bg-[#263238] text-white rounded-md font-black text-xs uppercase italic tracking-tighter hover:bg-[#64748b] transition-all shadow-xl shadow-[#263238]/20;
  }
  .glass-card, .dashboard-card {
    @apply bg-white rounded-md border border-[#d8dee6] shadow-[0_20px_50px_rgba(38,50,56,0.04)] overflow-hidden p-6;
  }
  .table-container.glass-card {
    @apply p-0;
  }
  .data-table {
    @apply w-full text-left divide-y divide-[#d8dee6]/30;
  }
  .data-table thead tr {
    @apply bg-[#f7f4ef]/50 border-b border-[#d8dee6] text-[10px] font-black uppercase tracking-[0.25em] text-[#64748b];
  }
  .data-table th {
    @apply px-8 py-5 whitespace-nowrap;
  }
  .data-table td {
    @apply px-8 py-6 text-sm font-bold text-[#263238];
  }
  .data-table tbody tr {
    @apply hover:bg-[#f7f4ef]/30 transition-colors cursor-pointer;
  }
  .badge {
    @apply inline-flex items-center gap-2 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest border transition-all;
  }
  .badge-success {
    @apply bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20;
  }
  .badge-warning {
    @apply bg-[#263238]/10 text-[#263238] border-[#263238]/20;
  }
  .badge-danger {
    @apply bg-[#e11d48]/10 text-[#e11d48] border-[#e11d48]/20;
  }
  .badge-neutral {
    @apply bg-[#64748b]/10 text-[#64748b] border-[#64748b]/20;
  }
  .search-wrapper {
    @apply relative w-full md:max-w-2xl;
  }
  .search-input {
    @apply block w-full pl-12 pr-6 py-4 bg-white border border-[#d8dee6] rounded-md focus:ring-8 focus:ring-[#f59e0b]/5 focus:border-[#f59e0b]/50 transition-all outline-none text-[#263238] font-bold text-sm shadow-sm;
  }
  .search-icon {
    @apply absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]/40;
  }
  .list-header {
    @apply flex flex-col md:flex-row md:items-center gap-4 mb-6;
  }
  .filter-group {
    @apply flex gap-3;
  }
  .filter-btn {
    @apply px-6 py-3.5 border border-[#d8dee6] bg-white text-[#263238] font-bold text-xs uppercase tracking-widest rounded-md hover:bg-[#f7f4ef] flex items-center gap-3 cursor-pointer h-full;
  }
  .pagination {
    @apply flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5 border-t border-[#d8dee6]/60 bg-[#f7f4ef]/30;
  }
  .page-info {
    @apply text-[10px] font-black uppercase tracking-[0.25em] text-[#64748b];
  }
  .page-controls {
    @apply flex items-center gap-2;
  }
  .page-btn {
    @apply w-8 h-8 flex items-center justify-center rounded border border-[#d8dee6] bg-white text-[#263238] hover:border-[#f59e0b] hover:text-[#f59e0b] transition-all disabled:opacity-50 disabled:pointer-events-none;
  }
  .page-btn.active {
    @apply bg-[#f59e0b] text-[#263238] border-[#f59e0b];
  }
  
  [class*="header"] {
    @apply flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8;
  }
  [class*="title"] {
    @apply text-3xl font-extrabold text-[#263238] tracking-tight uppercase italic;
  }
  [class*="subtitle"] {
    @apply text-[#64748b]/70 text-sm font-medium mt-2;
  }
}
`;
fs.writeFileSync('src/app/globals.css', garageCss + '\n' + appended, 'utf8');

let md = fs.readFileSync('src/lib/moduleData.js', 'utf8');
md = md.replace(/\\'/g, "'");
fs.writeFileSync('src/lib/moduleData.js', md, 'utf8');

let cp = fs.readFileSync('src/components/CrudPage.js', 'utf8');
cp = cp.replace(/\\'/g, "'");
fs.writeFileSync('src/components/CrudPage.js', cp, 'utf8');
