"use client";

import type { DuelMap, DuelSite, Side } from "@/lib/duel";

// Abstract top-down schematic, NOT a real radar image. Site/spawn coordinates
// come from lib/duel.ts's DUEL_MAPS (0..100 space). Deliberately stylized —
// shipping real map radars would mean bundling Valve assets, and a rough
// schematic communicates "which site, which side, who's pushing where" just
// as well for this feature.

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function DuelMapSchematic({
  map,
  site,
  sides,
  colors,
  names,
}: {
  map: DuelMap;
  site: DuelSite;
  sides: [Side, Side];
  colors: [string, string];
  names: [string, string];
}) {
  // Each player advances from their own side's spawn toward the contested site.
  const markers = sides.map((side, i) => {
    const spawn = side === "T" ? map.tSpawn : map.ctSpawn;
    return {
      x: lerp(spawn.x, site.x, 0.5),
      y: lerp(spawn.y, site.y, 0.5),
      spawn,
      color: colors[i],
      name: names[i],
      side,
    };
  });

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label={`${map.label} — ${site.label}`}>
      <defs>
        <radialGradient id="duel-site-glow">
          <stop offset="0%" stopColor="#FF7B00" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF7B00" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="2" y="2" width="96" height="96" rx="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />

      {/* Unselected sites, for context */}
      {map.sites
        .filter((s) => s.id !== site.id)
        .map((s) => (
          <g key={s.id}>
            <rect x={s.x - 8} y={s.y - 6} width="16" height="12" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
            <text x={s.x} y={s.y + 1.5} textAnchor="middle" fontSize="4" fontWeight="800" fill="#475569">
              {s.label.split(" ")[0]}
            </text>
          </g>
        ))}

      {/* Approach lines from each spawn to the contested site */}
      {markers.map((m, i) => (
        <line key={i} x1={m.spawn.x} y1={m.spawn.y} x2={site.x} y2={site.y} stroke={m.color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.35" />
      ))}

      {/* Contested site */}
      <circle cx={site.x} cy={site.y} r="18" fill="url(#duel-site-glow)" />
      <rect x={site.x - 10} y={site.y - 7} width="20" height="14" rx="2.5" fill="rgba(255,123,0,0.12)" stroke="#FF7B00" strokeWidth="0.8" />
      <text x={site.x} y={site.y + 1.8} textAnchor="middle" fontSize="5" fontWeight="900" fill="#FF7B00">
        {site.label.split(" ")[0]}
      </text>

      {/* Spawns */}
      <text x={map.tSpawn.x} y={map.tSpawn.y + 5} textAnchor="middle" fontSize="3.5" fontWeight="800" fill="#475569">
        T SPAWN
      </text>
      <text x={map.ctSpawn.x} y={map.ctSpawn.y - 3} textAnchor="middle" fontSize="3.5" fontWeight="800" fill="#475569">
        CT SPAWN
      </text>

      {/* Players */}
      {markers.map((m, i) => (
        <g key={`m-${i}`}>
          <circle cx={m.x} cy={m.y} r="3.6" fill={m.color} opacity="0.25" />
          <circle cx={m.x} cy={m.y} r="2.2" fill={m.color} />
          <text x={m.x} y={m.y - 4.5} textAnchor="middle" fontSize="3.6" fontWeight="900" fill={m.color}>
            {m.side}
          </text>
        </g>
      ))}
    </svg>
  );
}
