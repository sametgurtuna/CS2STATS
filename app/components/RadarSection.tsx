"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { PlayerData, PlayerStats } from "@/lib/types";

const DIMENSIONS: { label: string; max: number; get: (s: PlayerStats) => number }[] = [
  { label: "K/D", max: 2, get: (s) => s.kd },
  { label: "HS%", max: 100, get: (s) => s.hsPct },
  { label: "Win%", max: 100, get: (s) => s.winR },
  { label: "Acc", max: 100, get: (s) => s.acc },
  { label: "MVP", max: 3, get: (s) => s.mvpM },
  { label: "ADR", max: 150, get: (s) => s.dpr },
];

export function RadarSection({ players, colors }: { players: PlayerData[]; colors: string[] }) {
  const data = DIMENSIONS.map((d) => {
    const row: Record<string, number | string> = { s: d.label };
    players.forEach((p, i) => {
      row[`p${i}`] = Math.min((d.get(p.stats!) / d.max) * 100, 100);
    });
    return row;
  });

  return (
    <div className="h-80 w-full flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="s" tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 800 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {players.map((p, i) => (
            <Radar key={i} name={p.player.name} dataKey={`p${i}`} stroke={colors[i]} fill={colors[i]} fillOpacity={0.2} strokeWidth={3} style={{ filter: `drop-shadow(0 0 10px ${colors[i]}80)` }} />
          ))}
          <Tooltip contentStyle={{ background: "rgba(11,14,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, fontWeight: 700 }} itemStyle={{ fontWeight: "bold" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
