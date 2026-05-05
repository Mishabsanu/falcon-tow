import SalarySlipView from '@/components/SalarySlipView';

export default async function SalarySlipPage({ params }) {
  const { id } = await params;
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <SalarySlipView id={id} />
    </div>
  );
}
