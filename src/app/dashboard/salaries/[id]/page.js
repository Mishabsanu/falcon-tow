'use client';
import { use } from 'react';
import SalarySlipView from '@/components/SalarySlipView';
import { apiService } from '@/services/apiService';
import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function SalaryDetail({ params }) {
  const { id } = use(params);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSalary() {
      try {
        const result = await apiService.getRecord('salaries', id);
        setSalary(result);
      } catch (error) {
        console.error('Failed to load salary:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSalary();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-bold text-emerald-900 animate-pulse">Synchronizing with ledger...</div>;
  if (!salary) return <div className="p-20 text-center font-bold text-rose-600">Entry not found in system architecture.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-4 md:px-0">
        <Link href="/dashboard/salaries" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">
          <ArrowLeft size={14} />
          Return to Ledger
        </Link>
        <div className="flex items-center gap-4">
          <Link 
            href={`/dashboard/salaries/${id}/edit`}
            className="px-6 py-2.5 bg-white border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-50 transition-all"
          >
            Modify Entry
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-900/5 overflow-hidden border border-emerald-100/50">
        <SalarySlipView salary={salary} />
      </div>
    </div>
  );
}
