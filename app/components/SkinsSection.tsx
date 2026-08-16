"use client";

import type { PlayerData, Skin } from "@/lib/types";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function SkinsSection({ player, color }: { player: PlayerData; color: string }) {
  const { t } = useI18n();
  return (
    <div className="card p-6 w-full hover:border-white/20 transition-colors duration-300">
      <h3 className="text-sm font-black text-t1 uppercase tracking-widest mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner">
          <Sparkles className="w-4 h-4" style={{ color }} />
        </div>
        {t("section.notableSkins")} <span className="text-t3 ml-2 text-[10px] bg-black/40 px-2 py-1 rounded border border-white/5">{player.player.name}</span>
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {player.skins?.length > 0 ? (
          player.skins.map((s: Skin, i: number) => (
            <div key={i} className="flex-shrink-0 w-[140px] bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center shadow-inner relative overflow-hidden group hover:border-white/20 transition-all cursor-crosshair">
              <div className="absolute top-0 left-0 right-0 h-1 transition-all" style={{ backgroundColor: `#${s.color}`, boxShadow: `0 0 10px #${s.color}80` }}></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.name} className="w-24 h-24 object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500" />
              <span className="text-[10px] text-t3 font-bold text-center mt-3 leading-tight w-full truncate">{s.name.split("|")[0]}</span>
              <span className="text-[11px] font-black w-full truncate text-center drop-shadow-md" style={{ color: `#${s.color}` }}>
                {s.name.split("|")[1]?.trim() || s.name}
              </span>
            </div>
          ))
        ) : (
          <div className="text-xs text-t3 opacity-50 p-8 border border-dashed border-white/10 rounded-xl w-full text-center font-mono">{t("skins.empty")}</div>
        )}
      </div>
    </div>
  );
}
