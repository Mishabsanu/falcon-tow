import { Edit3, Eye, FileText, MapPin, CalendarDays, Truck, User, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ResponsiveTable from '@/modules/common/components/ResponsiveTable';
import styles from '@/app/dashboard/tows/page.module.css';

export default function TowTable({ tows, loading, pagination, onPageChange, onDelete, isWorker }) {
  const headers = [
    { label: "Job ID" },
    { label: "Fleet Asset" },
    { label: "Customer" },
    { label: "Towed Vehicle" },
    { label: "Route" },
    { label: "Service Date" },
    { label: "Charges" },
    { label: "Status" },
    { label: "Created By" },
    { label: "Actions", style: { textAlign: 'right' } }
  ];

  const cleanVehicle = (v) => {
    if (!v) return '';
    // Removes anything in [] or () to simplify the display
    return v.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
  };

  const renderRow = (tow) => (
    <tr key={tow._id || tow.id}>
      <td>
        <span className={styles.towId}>{tow?.id || 'N/A'}</span>
      </td>
      <td>
        <div className={styles.jobCell}>
          <div className={styles.iconBox}><Truck size={18} /></div>
          <div>
            <div className="text-[11px] font-black text-emerald-950 uppercase tracking-tight">{cleanVehicle(tow?.vehicle)}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="px-2 py-0.5 bg-emerald-100/50 border border-emerald-200 rounded-md flex items-center gap-1.5">
                <User size={10} className="text-emerald-700" />
                <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">{tow?.driver || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        </div>
      </td>
      <td>
        <div className={styles.customerCell}>
          <User size={16} />
          <div>
            <span className={styles.nameText}>{tow?.customer || 'Unknown'}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.1em]">{tow?.customerData?.id || 'WALK-IN'}</span>
              <span className="text-[8px] text-slate-300">•</span>
              <span className="text-[9px] font-bold text-slate-400">{tow?.customerPhone || tow?.customerData?.phone || tow?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </td>
      <td>
        <div>
          <div className="text-[11px] font-black text-emerald-950 uppercase tracking-tight leading-tight">{tow.customerPlate || 'N/A'}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{tow.customerVehicle || 'N/A'}</div>
        </div>
      </td>
      <td>
        <div className={styles.routeCell}>
          <MapPin size={16} />
          <span>{tow?.pickup || 'Unknown'} to {tow?.dropoff || 'Unknown'}</span>
        </div>
      </td>
      <td>
        <div className={styles.dateCell}>
          <CalendarDays size={16} />
          <span>{tow?.date ? new Date(tow.date).toLocaleDateString() : 'N/A'}</span>
        </div>
      </td>
      <td className={styles.amountText}>QAR {Number(tow.amount ?? 0).toLocaleString()}</td>
      <td>
        <span className={`badge ${
          tow?.status === 'Completed' ? 'badge-success' :
          ['In Progress', 'Pending'].includes(tow?.status) ? 'badge-warning' : 'badge-danger'
        }`}>
          {tow?.status || 'Pending'}
        </span>
      </td>
      <td>
        <div className="text-[10px] font-bold text-emerald-950 uppercase tracking-tight">{tow.createdBy || 'System'}</div>
        <div className="text-[9px] font-bold text-slate-400 mt-1">{tow.createdAt ? new Date(tow.createdAt).toLocaleDateString('en-GB') : 'Automated Log'}</div>
      </td>
      <td>
        <div className={styles.actionCell}>
          {!isWorker && tow.status === 'Completed' && (
            <Link 
              href={`/dashboard/invoices/new?jobId=${tow.id}`} 
              className={styles.invoiceBtn} 
              title="Create Invoice"
            >
              <FileText size={16} />
            </Link>
          )}
          <Link href={`/dashboard/tows/${tow.id}`} className={styles.viewBtn} title="View"><Eye size={16} /></Link>
          {!isWorker && <Link href={`/dashboard/tows/${tow.id}/edit`} className={styles.moreBtn} title="Edit"><Edit3 size={16} /></Link>}
          {!isWorker && (
            <button className={styles.moreBtn} title="Delete" onClick={() => onDelete(tow.id || tow._id)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  const renderMobileCard = (tow) => (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg"><Truck size={16} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">REF #{tow?.id || 'N/A'}</p>
            <p className="text-sm font-black text-emerald-950">{cleanVehicle(tow?.vehicle)}</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5 uppercase tracking-tight">{tow?.driver || 'Unassigned'}</p>
          </div>
        </div>
        <span className={`badge text-[10px] ${
          tow?.status === 'Completed' ? 'badge-success' :
          ['In Progress', 'Pending'].includes(tow?.status) ? 'badge-warning' : 'badge-danger'
        }`}>
          {tow?.status || 'Pending'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-emerald-50">
        <div className="col-span-1">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Customer</p>
          <p className="text-xs font-bold text-emerald-950">{tow?.customer || 'Unknown'}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">{tow?.customerData?.phone || tow?.phone || 'N/A'}</p>
        </div>
        <div className="col-span-1">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Amount</p>
          <p className="text-xs font-black text-emerald-600">QAR {Number(tow.amount ?? 0).toLocaleString()}</p>
        </div>
        <div className="col-span-2 pt-3 border-t border-emerald-50/50">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Towed Vehicle</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-700">{tow?.customerVehicle || 'N/A'}</span>
            <span className="text-[8px] text-slate-300">•</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tow?.customerPlate || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        <MapPin size={14} className="text-emerald-500" />
        <span className="text-[10px] font-medium truncate">{tow.pickup} → {tow.dropoff}</span>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
           <Link href={`/dashboard/tows/${tow.id}`} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Eye size={18} /></Link>
           {!isWorker && <Link href={`/dashboard/tows/${tow.id}/edit`} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Edit3 size={18} /></Link>}
           {!isWorker && (
             <button onClick={() => onDelete(tow.id || tow._id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl">
               <Trash2 size={18} />
             </button>
           )}
        </div>
        {!isWorker && tow.status === 'Completed' && (
           <Link href={`/dashboard/invoices/new?jobId=${tow.id}`} className="btn-primary px-4 py-2 text-[10px]">Create Invoice</Link>
        )}
      </div>
    </div>
  );

  return (
    <ResponsiveTable
      headers={headers}
      data={tows}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
      renderRow={renderRow}
      renderMobileCard={renderMobileCard}
      emptyMessage="No tow jobs matching your criteria."
    />
  );
}
