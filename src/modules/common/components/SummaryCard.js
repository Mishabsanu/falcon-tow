export default function SummaryCard({ label, value, icon: Icon, color = "emerald" }) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100"
  };

  return (
    <div className="glass-card flex items-center gap-6 p-6 transition-all hover:scale-[1.02] active:scale-95 group">
      {Icon && (
        <div className={`p-4 rounded-2xl ${colorMap[color] || colorMap.emerald} border transition-all group-hover:shadow-lg`}>
          <Icon size={24} />
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <strong className="text-2xl font-black text-emerald-950 tracking-tight">{value}</strong>
      </div>
    </div>
  );
}
