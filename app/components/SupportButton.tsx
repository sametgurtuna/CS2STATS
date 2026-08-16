"use client";

import { Coffee } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

// Faz 5: Ko-fi/Buy Me a Coffee link. Hidden entirely when NEXT_PUBLIC_KOFI_URL
// isn't set (see .env.example) rather than pointing at a placeholder/dead link.
export function SupportButton() {
  const { t } = useI18n();
  const url = process.env.NEXT_PUBLIC_KOFI_URL;
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-black tracking-widest text-t1 transition-all active:scale-95 shadow-md"
    >
      <Coffee className="w-4 h-4 text-amber-400" /> {t("support.button")}
    </a>
  );
}
