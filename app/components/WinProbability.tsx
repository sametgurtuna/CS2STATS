"use client";

import { Crown } from "lucide-react";
import type { PlayerData } from "@/lib/types";
import { computeWinProbability } from "@/lib/stats";
import { useI18n } from "@/lib/i18n/context";

export function WinProbability({ players, colors }: { players: PlayerData[]; colors: string[] }) {
  const { t } = useI18n();
  const scores = computeWinProbability(players.map((p) => p.stats!));
  const maxScore = Math.max(...scores);
  const leaders = scores.filter((s) => s === maxScore).length;
  const winnerIdx = leaders === 1 ? scores.indexOf(maxScore) : -1;

  return (
    <div className="card p-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner">
          <Crown className="w-4 h-4 text-t1" />
        </div>
        <h3 className="text-sm font-black text-t1 uppercase tracking-widest">{t("section.winProbability")}</h3>
      </div>
      <div className="space-y-5 flex-1">
        {players.map((p, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs font-black mb-1.5">
              <span className="text-t1 truncate">{p.player.name}</span>
              <span style={{ color: colors[i] }}>{scores[i]}%</span>
            </div>
            <div className="h-2.5 bg-black/40 rounded-full overflow-hidden shadow-inner">
              <div className="h-full rounded-full grow-bar" style={{ width: `${scores[i]}%`, backgroundColor: colors[i], boxShadow: `0 0 8px ${colors[i]}60` }}></div>
            </div>
          </div>
        ))}
      </div>
      {winnerIdx >= 0 && (
        <div className="mt-8 pt-6 border-t border-white/5 relative overflow-hidden rounded-2xl group">
          <div className="absolute inset-0 opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-500" style={{ background: colors[winnerIdx] }}></div>
          <div className="relative text-center z-10">
            <div className="text-[10px] font-black uppercase text-t2 tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" /> {t("section.overallWinner")}
            </div>
            <div className="text-3xl font-black tracking-tighter" style={{ color: colors[winnerIdx], textShadow: `0 0 20px ${colors[winnerIdx]}60` }}>
              {players[winnerIdx].player.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
