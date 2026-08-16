"use client";

import { useState } from "react";
import { TrendingUp, Crosshair, Target, Swords } from "lucide-react";
import type { PlayerData, WeaponStat } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { useI18n } from "@/lib/i18n/context";
import { DuelSimulator } from "./DuelSimulator";
import { PlayerCard } from "./PlayerCard";
import { Ring } from "./Ring";
import { StatBox } from "./StatBox";
import { StatRow } from "./StatRow";
import { RadarSection } from "./RadarSection";
import { WinProbability } from "./WinProbability";
import { ClutchAwpSection } from "./ClutchAwpSection";
import { WeaponPie } from "./WeaponPie";
import { MapWinRates } from "./MapWinRates";
import { SkinsSection } from "./SkinsSection";

export function Dashboard({ players, onRemovePlayer }: { players: PlayerData[]; onRemovePlayer?: (index: number) => void }) {
  const { t } = useI18n();
  const colors = players.map((_, i) => colorFor(i));
  const [duelOpen, setDuelOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* The simulator is a strict 1v1 — with 3+ players it would need a
          pair picker, so it's only offered for the two-player case. */}
      {players.length === 2 && (
        <div className="flex justify-center fade-in">
          <button
            onClick={() => setDuelOpen(true)}
            className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-player1/15 to-player2/15 hover:from-player1/25 hover:to-player2/25 border border-white/10 hover:border-white/25 rounded-2xl text-xs font-black tracking-widest text-t1 transition-all active:scale-95 shadow-lg"
          >
            <Swords className="w-4 h-4" /> {t("duel.open")}
          </button>
        </div>
      )}
      {duelOpen && <DuelSimulator players={players} onClose={() => setDuelOpen(false)} />}
      <div className={`grid grid-cols-1 ${players.length > 1 ? "md:grid-cols-2" : ""} gap-6 fade-in`} style={{ animationDelay: "50ms" }}>
        {players.map((p, i) => (
          <PlayerCard key={p.player.steamId + i} data={p} color={colors[i]} index={i} onRemove={onRemovePlayer ? () => onRemovePlayer(i) : undefined} canRemove={players.length > 2} />
        ))}
      </div>

      <div className={`grid grid-cols-1 ${players.length > 1 ? "md:grid-cols-2" : ""} gap-6 fade-in`} style={{ animationDelay: "150ms" }}>
        {players.map((p, i) => (
          <div key={i} className="card p-8 flex justify-around items-center relative overflow-hidden group hover:border-white/20">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to right, ${colors[i]}0d, transparent)` }}></div>
            <Ring value={p.stats!.kd} label={t("stat.kd")} color={colors[i]} max={2} />
            <Ring value={`${p.stats!.hsPct}%`} label={t("stat.headshot")} color={colors[i]} max={100} />
            <Ring value={`${p.stats!.winR}%`} label={t("stat.winRate")} color={colors[i]} max={100} />
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-2 ${players.length > 2 ? "lg:grid-cols-4" : "md:grid-cols-4"} gap-6 fade-in`} style={{ animationDelay: "250ms" }}>
        {players.map((p, i) => (
          <StatBox key={i} icon={<Target className="w-5 h-5" style={{ color: colors[i] }} />} value={`${p.stats!.acc}%`} label={t("stat.accuracy")} sub={p.player.name} color={colors[i]} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 fade-in" style={{ animationDelay: "350ms" }}>
        <div className="card p-6 flex flex-col xl:col-span-1 border-t-4 border-t-transparent hover:border-t-white/20 hover:border-white/20 group transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-4 h-4 text-t1" />
            </div>
            <h3 className="text-sm font-black text-t1 uppercase tracking-widest">{t("section.performanceRadar")}</h3>
          </div>
          <RadarSection players={players} colors={colors} />
        </div>

        <div className="xl:col-span-1">
          <WinProbability players={players} colors={colors} />
        </div>

        <div className="flex flex-col gap-6 xl:col-span-1">
          <ClutchAwpSection players={players} colors={colors} />
        </div>
      </div>

      <div className="card p-8 hover:border-white/20 transition-colors duration-300 fade-in" style={{ animationDelay: "400ms" }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner">
            <Crosshair className="w-4 h-4 text-t1" />
          </div>
          <h3 className="text-sm font-black text-t1 uppercase tracking-widest">Head to Head</h3>
        </div>
        <div className="space-y-1">
          <StatRow label={t("stat.kd")} values={players.map((p) => p.stats!.kd)} colors={colors} />
          <StatRow label={t("stat.headshot")} values={players.map((p) => p.stats!.hsPct)} colors={colors} format={(v) => `${v}%`} />
          <StatRow label={t("stat.winRate")} values={players.map((p) => p.stats!.winR)} colors={colors} format={(v) => `${v}%`} />
          <StatRow label={t("stat.accuracy")} values={players.map((p) => p.stats!.acc)} colors={colors} format={(v) => `${v}%`} />
          <StatRow label={t("stat.adr")} values={players.map((p) => p.stats!.dpr)} colors={colors} />
          <StatRow label={t("stat.mvpMatch")} values={players.map((p) => p.stats!.mvpM)} colors={colors} />
          <StatRow label={t("stat.totalKills")} values={players.map((p) => p.stats!.kills)} colors={colors} format={(v) => v.toLocaleString()} />
          <StatRow label={t("stat.matches")} values={players.map((p) => p.stats!.played)} colors={colors} />
        </div>
      </div>

      <div className="card p-8 hover:border-white/20 transition-colors duration-300 fade-in" style={{ animationDelay: "450ms" }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner">
            <Crosshair className="w-4 h-4 text-t1" />
          </div>
          <h3 className="text-sm font-black text-t1 uppercase tracking-widest">{t("section.deadliestWeapons")}</h3>
        </div>
        <div className={`grid grid-cols-1 ${players.length > 1 ? "sm:grid-cols-2" : ""} ${players.length > 2 ? "xl:grid-cols-4" : ""} gap-10`}>
          {players.map((p, i) => (
            <div key={i}>
              <WeaponPie weapons={p.stats!.weapons} baseColor={colors[i]} />
              <div className="mt-6 space-y-3">
                {p.stats!.weapons.slice(0, 4).map((w: WeaponStat) => (
                  <div key={w.name} className="flex justify-between items-center text-sm group bg-black/20 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                    <span className="text-t2 group-hover:text-t1 font-bold transition-colors truncate">{w.name}</span>
                    <span className="font-mono font-black shrink-0 ml-2" style={{ color: colors[i] }}>
                      {w.kills.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-8 hover:border-white/20 transition-colors duration-300 fade-in" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner">
            <Target className="w-4 h-4 text-t1" />
          </div>
          <h3 className="text-sm font-black text-t1 uppercase tracking-widest">{t("section.mapWinRates")}</h3>
        </div>
        <MapWinRates players={players} colors={colors} />
      </div>

      <div className={`grid grid-cols-1 ${players.length > 1 ? "md:grid-cols-2" : ""} gap-6 fade-in`} style={{ animationDelay: "550ms" }}>
        {players.map((p, i) => (
          <SkinsSection key={i} player={p} color={colors[i]} />
        ))}
      </div>
    </div>
  );
}
