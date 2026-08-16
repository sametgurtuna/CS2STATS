"use client";

import { Search, Loader2, Crosshair, Plus, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/colors";

export function SearchForm({
  inputs,
  onChange,
  onAdd,
  onRemove,
  onSubmit,
  loading,
  centered,
}: {
  inputs: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onSubmit: () => void;
  loading: boolean;
  centered: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className={`card p-4 sm:p-5 flex flex-col gap-4 ${centered ? "shadow-2xl shadow-black ring-1 ring-white/5 backdrop-blur-2xl bg-black/40 fade-in" : "bg-black/20 fade-in"}`}>
      <div className="flex flex-col md:flex-row items-stretch gap-4 flex-wrap">
        {inputs.map((val, i) => (
          <div key={i} className="flex-1 relative group w-full min-w-[200px] flex items-center gap-2">
            <div className="relative flex items-center bg-black/60 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-player1/50 focus-within:ring-1 focus-within:ring-player1/50 transition-all shadow-inner hover:bg-black/80 flex-1">
              <Search className="w-5 h-5 text-t3 mr-3 group-focus-within:text-player1 transition-colors" />
              <input
                value={val}
                onChange={(e) => onChange(i, e.target.value)}
                placeholder={t("search.placeholder", { n: i + 1 })}
                className="flex-1 bg-transparent text-sm sm:text-base font-bold text-t1 placeholder:text-t3/70 outline-none w-full"
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
            </div>
            {inputs.length > MIN_PLAYERS && (
              <button
                onClick={() => onRemove(i)}
                aria-label={t("search.removePlayer", { n: i + 1 })}
                title={t("search.removePlayer", { n: i + 1 })}
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-black/40 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-t3 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {inputs.length < MAX_PLAYERS && (
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black/40 hover:bg-white/10 border border-dashed border-white/15 hover:border-white/30 rounded-2xl text-xs font-black tracking-widest text-t2 hover:text-t1 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> {t("search.addPlayer")}
          </button>
        )}
        <button
          disabled={loading || inputs.some((x) => !x.trim())}
          onClick={onSubmit}
          className="flex-1 bg-t1 hover:bg-white text-black font-black tracking-widest text-sm px-10 py-4 rounded-2xl disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
          {t("search.analyze")}
        </button>
      </div>
    </div>
  );
}
