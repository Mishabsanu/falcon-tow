export default function PageContainer({
  title,
  children,
  description,
  action,
}: {
  title: string;
  children: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 border-b border-[#d8dee6] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#263238]">{title}</h2>
          {description && <p className="mt-1 text-sm font-medium text-[#64748b]">{description}</p>}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-[#d8dee6] bg-white shadow-[0_18px_45px_rgba(38,50,56,0.07)]">
        <div className="p-2 sm:p-3 lg:p-5">
           {children}
        </div>
      </div>
    </div>
  );
}
