"use client";

import { useState, useSyncExternalStore } from "react";
import { History } from "lucide-react";
import { getRecentSearches, clearRecentSearches } from "@/lib/recentSearches";
import { useI18n } from "@/lib/i18n/context";

// hasMounted flips true only once hydration is done, letting us read
// localStorage directly in render (client-only, safe post-mount) without a
// useEffect+setState pair — see lib/i18n/context.tsx for why.
function subscribeNoop() {
  return () => {};
}
function getMountedTrue() {
  return true;
}
function getMountedFalse() {
  return false;
}

export function RecentSearchesList({ onSelect }: { onSelect: (players: string[]) => void }) {
  const { t } = useI18n();
  const hasMounted = useSyncExternalStore(subscribeNoop, getMountedTrue, getMountedFalse);
  // Bumping this forces a re-render (and therefore a fresh getRecentSearches()
  // read) after "Clear" — the list itself isn't kept in React state.
  const [, forceRerender] = useState(0);

  const items = hasMounted ? getRecentSearches() : [];
  if (items.length === 0) return null;

  return (
    <div className="mt-8 fade-in" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-t3 flex items-center gap-2">
          <History className="w-3.5 h-3.5" /> {t("recent.title")}
        </span>
        <button
          onClick={() => {
            clearRecentSearches();
            forceRerender((v) => v + 1);
          }}
          className="text-[10px] font-black uppercase tracking-widest text-t3 hover:text-t1 transition-colors"
        >
          {t("recent.clear")}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => onSelect(it.players)}
            className="px-4 py-2 rounded-xl bg-black/30 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs font-bold text-t2 hover:text-t1 transition-all"
          >
            {it.names.join(" vs ")}
          </button>
        ))}
      </div>
    </div>
  );
}
