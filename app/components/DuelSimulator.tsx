"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Swords, Crosshair, Info } from "lucide-react";
import type { PlayerData, MapStat } from "@/lib/types";
import { DUEL_MAPS, WEAPONS, getMap, getSite, simulateDuel, type Side } from "@/lib/duel";
import { colorFor } from "@/lib/colors";
import { useI18n } from "@/lib/i18n/context";
import { DuelMapSchematic } from "./DuelMapSchematic";

/** Steam map-stat names are display labels ("Dust II"); DUEL_MAPS keys off the
 * raw stat key ("de_dust2"). This bridges the two so a player's real win rate
 * on the selected map can feed the simulation. */
function findMapWinRate(player: PlayerData, mapLabel: string): number | undefined {
  return player.stats?.maps.find((m: MapStat) => m.name === mapLabel)?.wr;
}

export function DuelSimulator({ players, onClose }: { players: PlayerData[]; onClose: () => void }) {
  const { t } = useI18n();
  const [mapId, setMapId] = useState(DUEL_MAPS[0].id);
  const [siteId, setSiteId] = useState(DUEL_MAPS[0].sites[0].id);
  const [weapons, setWeapons] = useState<[string, string]>(["ak47", "m4a4"]);
  const [sides, setSides] = useState<[Side, Side]>(["T", "CT"]);

  const map = getMap(mapId);
  // getSite falls back to the map's first site, so a stale siteId left over
  // from a previous map resolves safely without a sync effect.
  const site = getSite(map, siteId);

  const selectMap = (id: string) => {
    setMapId(id);
    setSiteId(getMap(id).sites[0].id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const duo = players.slice(0, 2);
  const colors: [string, string] = [colorFor(0), colorFor(1)];

  const result = useMemo(() => {
    if (duo.length < 2 || !duo[0].stats || !duo[1].stats) return null;
    return simulateDuel({
      mapId,
      siteId: site.id,
      players: [
        { name: duo[0].player.name, stats: duo[0].stats, weaponId: weapons[0], side: sides[0], mapWinRatePct: findMapWinRate(duo[0], map.label) },
        { name: duo[1].player.name, stats: duo[1].stats, weaponId: weapons[1], side: sides[1], mapWinRatePct: findMapWinRate(duo[1], map.label) },
      ],
    });
  }, [duo, mapId, site.id, weapons, sides, map.label]);

  if (!result) return null;

  const winnerIdx: 0 | 1 | null = result.winProbability[0] === result.winProbability[1] ? null : result.winProbability[0] > result.winProbability[1] ? 0 : 1;

  const setWeapon = (i: number, v: string) => setWeapons((prev) => (i === 0 ? [v, prev[1]] : [prev[0], v]));
  const toggleSide = (i: number) =>
    setSides((prev) => {
      const flipped: Side = prev[i] === "T" ? "CT" : "T";
      // Keep the two players on opposite sides — it's a 1v1 duel, not a teammate check.
      return i === 0 ? [flipped, flipped === "T" ? "CT" : "T"] : [flipped === "T" ? "CT" : "T", flipped];
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in" role="dialog" aria-modal="true" aria-label={t("duel.title")}>
      <button aria-label={t("duel.close")} onClick={onClose} className="absolute inset-0 cursor-default" tabIndex={-1} />

      <div className="card relative z-10 w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-t1 uppercase tracking-widest flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner">
              <Swords className="w-4 h-4 text-t1" />
            </div>
            {t("duel.title")}
          </h3>
          <button onClick={onClose} aria-label={t("duel.close")} className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 hover:bg-white/10 border border-white/10 text-t2 hover:text-t1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: schematic */}
          <div>
            <div className="aspect-square w-full bg-black/30 rounded-2xl border border-white/5 p-2">
              <DuelMapSchematic map={map} site={site} sides={sides} colors={colors} names={[duo[0].player.name, duo[1].player.name]} />
            </div>
            <div className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-t3">
              {map.label} · {site.label} · {t(`duel.range.${result.engagementRange}`)}
            </div>
          </div>

          {/* Right: controls + result */}
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-t3 block mb-2">{t("duel.map")}</label>
              <select
                value={mapId}
                onChange={(e) => selectMap(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-t1 outline-none focus:border-player1/50"
              >
                {DUEL_MAPS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-t3 block mb-2">{t("duel.site")}</label>
              <div className="flex flex-wrap gap-2">
                {map.sites.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSiteId(s.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-widest border transition-all ${
                      s.id === site.id ? "bg-player1/15 border-player1/50 text-player1" : "bg-black/40 border-white/10 text-t2 hover:text-t1 hover:bg-white/5"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {duo.map((p, i) => (
              <div key={i} className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="text-xs font-black truncate" style={{ color: colors[i] }}>
                    {p.player.name}
                  </span>
                  <button
                    onClick={() => toggleSide(i)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest border transition-colors shrink-0 ${
                      sides[i] === "CT" ? "bg-blue-500/15 border-blue-500/40 text-blue-300" : "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {sides[i]}
                  </button>
                </div>
                <select
                  value={weapons[i]}
                  onChange={(e) => setWeapon(i, e.target.value)}
                  aria-label={t("duel.weaponFor", { name: p.player.name })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-t1 outline-none focus:border-player1/50"
                >
                  {WEAPONS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Result */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <Crosshair className="w-3.5 h-3.5 text-t3" />
                <span className="text-[10px] font-black uppercase tracking-widest text-t3">{t("duel.result")}</span>
              </div>
              <div className="space-y-3">
                {duo.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-black mb-1.5">
                      <span className="text-t1 truncate">{p.player.name}</span>
                      <span style={{ color: colors[i] }}>{result.winProbability[i]}%</span>
                    </div>
                    <div className="h-2.5 bg-black/50 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${result.winProbability[i]}%`, backgroundColor: colors[i], boxShadow: `0 0 8px ${colors[i]}60` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {winnerIdx !== null && (
                <div className="mt-5 text-center">
                  <div className="text-[10px] font-black uppercase text-t3 tracking-widest mb-1">{t("duel.likelyWinner")}</div>
                  <div className="text-2xl font-black tracking-tighter" style={{ color: colors[winnerIdx], textShadow: `0 0 20px ${colors[winnerIdx]}60` }}>
                    {duo[winnerIdx].player.name}
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                {result.factors.map((f) => (
                  <div key={f.key}>
                    <div className="text-[9px] font-black uppercase tracking-widest text-t3 mb-1">{t(f.key)}</div>
                    <div className="flex gap-1 h-1.5">
                      {f.values.map((v, i) => (
                        <div key={i} className="rounded-full transition-all duration-500" style={{ width: `${v}%`, backgroundColor: colors[i], opacity: 0.75 }}></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 flex items-start gap-2 text-[10px] text-t3 leading-relaxed">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {t("duel.disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
