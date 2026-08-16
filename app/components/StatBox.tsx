"use client";

export function StatBox({ icon, value, label, sub, color }: { icon: React.ReactNode; value: string | number; label: string; sub?: string; color?: string }) {
  return (
    <div className="card p-5 flex flex-col relative overflow-hidden group hover:border-white/20">
      {color && <div className="absolute -inset-2 opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700 blur-2xl" style={{ backgroundColor: color }}></div>}
      <div className="flex items-start justify-between mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">{icon}</div>
        {sub && <div className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-black/40 border border-white/5 text-t3 group-hover:text-t2 transition-colors max-w-[100px] truncate">{sub}</div>}
      </div>
      <div className="z-10 mt-2">
        <div className="text-3xl font-black text-t1 tracking-tighter">{value}</div>
        <div className="text-xs text-t2 uppercase font-black tracking-widest mt-1 opacity-80">{label}</div>
      </div>
    </div>
  );
}
