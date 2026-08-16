"use client";

import { Flame } from "lucide-react";
import { FEATURED_COMPARISONS } from "@/lib/featuredPlayers";
import { useI18n } from "@/lib/i18n/context";

export function FeaturedComparisons({ onSelect }: { onSelect: (players: string[]) => void }) {
  const { t } = useI18n();
  if (FEATURED_COMPARISONS.length === 0) return null;

  return (
    <div className="mt-8 fade-in" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Flame className="w-3.5 h-3.5 text-t3" />
        <span className="text-[10px] font-black uppercase tracking-widest text-t3">{t("featured.title")}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {FEATURED_COMPARISONS.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.players)}
            className="px-4 py-2 rounded-xl bg-black/30 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs font-bold text-t2 hover:text-t1 transition-all"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
