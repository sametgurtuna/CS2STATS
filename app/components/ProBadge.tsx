"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

// Faz 5: UI-only "Pro" teaser. Deliberately not wired to any real
// entitlement check — there's no auth/payment system yet (that's a separate
// future decision per the roadmap), so this only communicates what's planned
// and funnels interest toward the Ko-fi link. Never gate real functionality
// behind this without an actual entitlement check on the server.
export function ProBadge() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const kofiUrl = process.env.NEXT_PUBLIC_KOFI_URL;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("pro.badge")}
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-amber-500/10 to-amber-400/10 hover:from-amber-500/20 hover:to-amber-400/20 border border-amber-500/30 rounded-xl text-[10px] font-black tracking-widest text-amber-400 transition-all active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5" /> PRO
      </button>
      {open && (
        <>
          <button aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" tabIndex={-1} />
          <div className="absolute right-0 mt-2 w-72 card p-5 z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">{t("pro.title")}</span>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-t3 hover:text-t1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="text-xs text-t2 space-y-2 mb-4 list-disc list-inside">
              <li>{t("pro.feature1")}</li>
              <li>{t("pro.feature2")}</li>
              <li>{t("pro.feature3")}</li>
            </ul>
            <p className="text-[10px] text-t3 mb-3">{t("pro.comingSoon")}</p>
            {kofiUrl && (
              <a
                href={kofiUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-amber-500 hover:bg-amber-400 text-black font-black text-xs tracking-widest py-2.5 rounded-xl transition-colors"
              >
                {t("support.button")}
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
