"use client";

import type { MapStat, PlayerData } from "@/lib/types";

export function MapWinRates({ players, colors }: { players: PlayerData[]; colors: string[] }) {
  const allMapNames = Array.from(new Set(players.flatMap((p) => p.stats?.maps.map((m: MapStat) => m.name) || []))).slice(0, 6);

  return (
    <div className="space-y-6">
      {allMapNames.map((name) => {
        const wrs = players.map((p) => p.stats?.maps.find((m: MapStat) => m.name === name)?.wr || 0);
        const max = Math.max(...wrs, 1);
        return (
          <div key={name}>
            <div className="text-[11px] font-black tracking-widest uppercase mb-3 text-t1 text-center bg-black/40 py-1.5 rounded-md border border-white/5">{name}</div>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0,1fr))` }}>
              {wrs.map((wr, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black" style={{ color: colors[i] }}>
                    {wr}%
                  </span>
                  <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full rounded-full grow-bar" style={{ width: `${(wr / max) * 100}%`, backgroundColor: colors[i], boxShadow: `0 0 8px ${colors[i]}60` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
