"use client";

// N-player generalization of the old fixed-2-player CmpRow: renders one bar
// per player instead of two opposing bars, highlighting whichever player
// leads (or none, on a tie).

export function StatRow({ label, values, colors, higherIsBetter = true, format }: { label: string; values: number[]; colors: string[]; higherIsBetter?: boolean; format?: (v: number) => string }) {
  const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
  const leaders = values.filter((v) => v === best).length;
  const max = Math.max(...values, 0.0001);

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="text-[10px] font-black text-t2 uppercase tracking-widest mb-2.5 text-center">{label}</div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0,1fr))` }}>
        {values.map((v, i) => {
          const isLeader = leaders < values.length && v === best;
          const width = Math.max((v / max) * 100, 2);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="text-sm font-black font-mono tracking-tight" style={{ color: isLeader ? colors[i] : "#94A3B8" }}>
                {format ? format(v) : v}
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${width}%`, backgroundColor: isLeader ? colors[i] : "#475569", boxShadow: isLeader ? `0 0 8px ${colors[i]}80` : undefined }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
