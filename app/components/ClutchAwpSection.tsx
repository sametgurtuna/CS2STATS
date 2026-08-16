"use client";

import { Crown, Target } from "lucide-react";
import type { PlayerData } from "@/lib/types";
import { StatRow } from "./StatRow";
import { useI18n } from "@/lib/i18n/context";

export function ClutchAwpSection({ players, colors }: { players: PlayerData[]; colors: string[] }) {
  const { t } = useI18n();
  const stats = players.map((p) => p.stats!);

  return (
    <div className="card p-6 flex-1 hover:border-white/20 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner">
          <Crown className="w-4 h-4 text-t1" />
        </div>
        <h3 className="text-sm font-black text-t1 uppercase tracking-widest">{t("section.clutchMastery")}</h3>
      </div>
      <div className="space-y-1 mb-8">
        <StatRow label={t("clutch.pistolWins")} values={stats.map((s) => s.clutch.pistolWins || 0)} colors={colors} />
        <StatRow label={t("clutch.dominations")} values={stats.map((s) => s.clutch.dominations || 0)} colors={colors} />
        <StatRow label={t("clutch.revenges")} values={stats.map((s) => s.clutch.revenges || 0)} colors={colors} />
      </div>

      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shadow-inner">
            <Target className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-sm font-black text-t1 uppercase tracking-widest">{t("section.awpStats")}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {players.map((p, i) => (
            <div key={i} className="bg-black/40 rounded-xl p-5 border border-white/5 transition-all duration-300 shadow-inner group" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="text-[10px] font-black tracking-widest uppercase truncate mb-3" style={{ color: colors[i] }}>
                {p.player.name}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest mb-1">{t("clutch.ratio")}</div>
                  <div className="text-2xl font-black font-mono text-t1 group-hover:text-white transition-colors">{stats[i].awpR}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-t3 uppercase font-bold tracking-widest mb-1">{t("clutch.acc")}</div>
                  <div className="text-sm font-black font-mono text-t2">{stats[i].acc}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
