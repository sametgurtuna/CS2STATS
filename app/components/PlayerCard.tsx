"use client";

import Image from "next/image";
import Link from "next/link";
import { X, UserCircle2 } from "lucide-react";
import type { PlayerData } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

// N-player generalization of the old fixed-slot PlayerInfo component.

export function PlayerCard({ data, color, index, onRemove, canRemove }: { data: PlayerData; color: string; index: number; onRemove?: () => void; canRemove?: boolean }) {
  const { t } = useI18n();
  const { player: p, hours, badges, faceit } = data;
  const states = ["Offline", "Online", "Busy", "Away", "Snooze", "Trade", "Play"];
  const dots = ["bg-t3", "bg-green", "bg-red", "bg-player1", "bg-yellow-700", "bg-player2", "bg-blue"];

  return (
    <div className="card relative overflow-hidden p-6 flex items-center gap-6 group hover:border-white/20">
      <div className="absolute -top-16 -right-16 w-48 h-48 blur-[64px] opacity-10 transition-opacity duration-700 group-hover:opacity-30 pointer-events-none" style={{ background: color }}></div>
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          aria-label={t("search.removePlayer", { n: index + 1 })}
          title={t("search.removePlayer", { n: index + 1 })}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-md flex items-center justify-center bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/40 text-t3 hover:text-red-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="relative shrink-0 mt-2">
        <div className="absolute -inset-2 rounded-full blur-xl opacity-30 group-hover:opacity-75 transition-opacity duration-700" style={{ backgroundColor: color }}></div>
        <div className="w-20 h-20 rounded-full overflow-hidden relative border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 bg-black" style={{ borderColor: color }}>
          <Image src={p.avatar} alt={p.name} width={80} height={80} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>
      <div className="min-w-0 flex-1 z-10">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-black uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5" style={{ color }}>
              #{index + 1}
            </div>
            {faceit && (
              <a href={faceit.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#FF5500]/10 border border-[#FF5500]/30 hover:bg-[#FF5500]/20 px-2 py-1 rounded transition-colors text-[#FF5500]">
                <span className="text-[10px] font-black tracking-widest uppercase">Lv {faceit.level}</span>
                {faceit.elo && <span className="text-[9px] font-mono font-bold opacity-80">{faceit.elo} ELO</span>}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/player/${p.steamId}`} title={t("profile.viewFull")} aria-label={t("profile.viewFull")} className="w-7 h-7 rounded-md flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 text-t2 hover:text-t1 transition-colors">
              <UserCircle2 className="w-4 h-4" />
            </Link>
            <div className="text-[10px] font-mono font-bold bg-white/5 px-2 py-1 rounded shadow-inner text-t2 border border-white/5">
              {hours.toLocaleString()}h <span className="opacity-50">Played</span>
            </div>
          </div>
        </div>
        <div className="text-3xl font-black text-t1 truncate tracking-tighter drop-shadow-md mb-1">{p.name}</div>
        <div className="flex items-center gap-2 text-xs font-bold text-t2">
          <span className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5 shadow-sm">
            <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${dots[p.state] || dots[0]}`}></span>
            {states[p.state] || "Offline"}
          </span>
          {p.country && p.country !== "XX" && (
            <span className="bg-black/30 px-2 py-1.5 rounded-lg border border-white/5 shadow-sm flex items-center hover:bg-white/10 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/20x15/${p.country.toLowerCase()}.png`} alt={p.country} className="w-4 h-3 rounded-[2px]" />
            </span>
          )}
        </div>
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {badges.map((b) => (
              <span key={b.id} className={`px-2 py-1 rounded-md border text-[9px] uppercase font-black tracking-widest shadow-inner relative overflow-hidden ${b.color}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
