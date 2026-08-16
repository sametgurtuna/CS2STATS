"use client";

// Generalized from HomeClient's old label-string-matched max hint — now takes
// `max` explicitly so it isn't tied to English label text (needed once labels
// are translated, see lib/i18n).

export function Ring({ value, label, color, max = 100, size = 110 }: { value: number | string; label: string; color: string; max?: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const numVal = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const pct = Math.min(Math.max((numVal / max) * 100, 0), 100);
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center group relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-1500 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col transition-transform duration-500 group-hover:scale-110">
          <span className="text-2xl font-black tracking-tighter text-t1">{value}</span>
        </div>
      </div>
      <span className="text-[11px] text-t2 mt-4 font-black uppercase tracking-widest text-center">{label}</span>
    </div>
  );
}
