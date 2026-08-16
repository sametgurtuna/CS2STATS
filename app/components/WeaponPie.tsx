"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Target } from "lucide-react";
import type { WeaponStat } from "@/lib/types";

// Declared at module scope (not inside Dashboard, unlike Faz 1's PieSection)
// so it doesn't trip react-hooks/static-components.

function lighten(hex: string, amt: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + Math.round((255 - (num >> 16)) * amt));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round((255 - ((num >> 8) & 0xff)) * amt));
  const b = Math.min(255, (num & 0xff) + Math.round((255 - (num & 0xff)) * amt));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function WeaponPie({ weapons, baseColor }: { weapons: WeaponStat[]; baseColor: string }) {
  const top = weapons.slice(0, 5);
  const colors = top.map((_, i) => lighten(baseColor, i * 0.18));

  return (
    <div className="h-44 w-full relative drop-shadow-2xl">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={top} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="kills" nameKey="name" stroke="none" paddingAngle={4} cornerRadius={6}>
            {top.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "rgba(11,14,20,0.95)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 13, fontWeight: "bold" }} itemStyle={{ color: "#F8FAFC" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Target className="w-8 h-8 text-t3/30" />
      </div>
    </div>
  );
}
