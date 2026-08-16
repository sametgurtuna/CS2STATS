"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, Link as LinkIcon, Target, Download, Languages } from "lucide-react";
import type { PlayerData } from "@/lib/types";
import { isValidPlayerInput } from "@/lib/validation";
import { parsePlayersParam, buildPlayersUrl } from "@/lib/comparePlayers";
import { addRecentSearch } from "@/lib/recentSearches";
import { MIN_PLAYERS, MAX_PLAYERS } from "@/lib/colors";
import { useI18n } from "@/lib/i18n/context";
import { Dashboard } from "./components/Dashboard";
import { SearchForm } from "./components/SearchForm";
import { RecentSearchesList } from "./components/RecentSearchesList";
import { FeaturedComparisons } from "./components/FeaturedComparisons";
import { SupportButton } from "./components/SupportButton";
import { ProBadge } from "./components/ProBadge";

async function fetchPlayer(input: string): Promise<PlayerData> {
  const r = await fetch("/api/steam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: input }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d;
}

function Main() {
  const sp = useSearchParams();
  const { t, locale, setLocale } = useI18n();

  const [inputs, setInputs] = useState<string[]>(() => {
    const fromUrl = parsePlayersParam(sp);
    return fromUrl.length >= MIN_PLAYERS ? fromUrl : ["", ""];
  });
  const [results, setResults] = useState<(PlayerData | null)[]>(inputs.map(() => null));
  const [loadingFlags, setLoadingFlags] = useState<boolean[]>(inputs.map(() => false));
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const loading = loadingFlags.some(Boolean);
  const hasAnyResult = results.some(Boolean);
  const isCentered = !hasAnyResult && !loading;

  const fetchOne = (input: string, idx: number): Promise<PlayerData | null> => {
    return fetchPlayer(input)
      .then((d) => {
        setResults((prev) => {
          const next = [...prev];
          next[idx] = d;
          return next;
        });
        return d;
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : String(e));
        return null;
      })
      .finally(() => {
        setLoadingFlags((prev) => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
      });
  };

  const compare = async (list?: string[]) => {
    const target = (list || inputs).map((x) => x.trim());
    if (target.length < MIN_PLAYERS || target.some((x) => !x)) {
      setErr(t("search.error.minPlayers"));
      return;
    }
    if (target.some((x) => !isValidPlayerInput(x))) {
      setErr(t("search.error.invalid"));
      return;
    }

    window.history.pushState({}, "", buildPlayersUrl(target));
    setInputs(target);
    setErr("");
    setResults(target.map(() => null));
    setLoadingFlags(target.map(() => true));

    const settled = await Promise.all(target.map((x, i) => fetchOne(x, i)));
    if (settled.every((d): d is PlayerData => d !== null)) {
      addRecentSearch(target, settled.map((d) => d.player.name));
    }
  };

  useEffect(() => {
    const fromUrl = parsePlayersParam(sp);
    if (fromUrl.length >= MIN_PLAYERS) compare(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPlayerSlot = () => {
    if (inputs.length >= MAX_PLAYERS) return;
    setInputs([...inputs, ""]);
    setResults([...results, null]);
    setLoadingFlags([...loadingFlags, false]);
  };

  const removePlayerSlot = (idx: number) => {
    if (inputs.length <= MIN_PLAYERS) return;
    setInputs(inputs.filter((_, i) => i !== idx));
    setResults(results.filter((_, i) => i !== idx));
    setLoadingFlags(loadingFlags.filter((_, i) => i !== idx));
  };

  const exportPng = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(dashboardRef.current, { backgroundColor: "#0B0E14", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `cs2stats-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setErr("Could not export image.");
    } finally {
      setExporting(false);
    }
  };

  const readyPlayers = results.filter((r): r is PlayerData => r !== null && r.stats !== null);
  const anyPrivate = results.some((r) => r !== null && r.stats === null);
  const allSettled = results.every(Boolean) && !loading;

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 md:py-12 relative overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-player1/5 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-player2/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1280px] mx-auto relative z-10">
        {!isCentered && (
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 fade-in gap-4" style={{ animationDelay: "0ms" }}>
            <h1
              className="text-3xl font-black text-t1 tracking-tighter drop-shadow-lg flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                setResults(inputs.map(() => null));
                window.history.pushState({}, "", "/");
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-player1 to-player2 flex items-center justify-center shadow-lg shadow-player1/20 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-[#0B0E14] drop-shadow-sm" />
              </div>
              <div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">CS2</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-player1 to-amber-400">STATS</span>
              </div>
            </h1>
            <div className="flex items-center gap-3">
              <ProBadge />
              <SupportButton />
              <button
                onClick={() => setLocale(locale === "en" ? "tr" : "en")}
                aria-label={t("lang.toggle")}
                title={t("lang.toggle")}
                className="flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-black tracking-widest text-t1 transition-all active:scale-95 shadow-md"
              >
                <Languages className="w-4 h-4 text-t2" /> {locale.toUpperCase()}
              </button>
              {readyPlayers.length >= MIN_PLAYERS && (
                <button
                  onClick={exportPng}
                  disabled={exporting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-black tracking-widest text-t1 transition-all active:scale-95 shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-t2" />
                  {exporting ? t("export.exporting") : t("export.png")}
                </button>
              )}
              {hasAnyResult && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-black tracking-widest text-t1 transition-all active:scale-95 shadow-md"
                >
                  <LinkIcon className="w-4 h-4 text-t2" />
                  {copied ? t("share.copied") : t("share.copy")}
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`transition-all duration-1000 ease-out ${isCentered ? "max-w-4xl mx-auto mt-[15vh] scale-100" : "max-w-[1280px] scale-100 mb-12"}`}>
          {isCentered && (
            <div className="text-center mb-16 fade-in flex flex-col items-center">
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 flex items-center gap-3">
                <ProBadge />
                <SupportButton />
                <button
                  onClick={() => setLocale(locale === "en" ? "tr" : "en")}
                  aria-label={t("lang.toggle")}
                  title={t("lang.toggle")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-black tracking-widest text-t1 transition-all active:scale-95 shadow-md"
                >
                  <Languages className="w-4 h-4 text-t2" /> {locale.toUpperCase()}
                </button>
              </div>
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-player1 to-player2 flex items-center justify-center shadow-[0_0_40px_rgba(255,123,0,0.3)] mb-8 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <Target className="w-12 h-12 text-[#0B0E14]" />
              </div>
              <h1 className="text-6xl sm:text-7xl font-black text-t1 tracking-tighter mb-6 drop-shadow-2xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">CS2</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-player1 to-amber-400 filter drop-shadow-[0_0_20px_rgba(255,123,0,0.4)]">STATS</span>
              </h1>
              <p className="text-t2 text-lg sm:text-lg max-w-2xl mx-auto font-bold leading-relaxed">{t("hero.subtitle")}</p>
            </div>
          )}
          <SearchForm
            inputs={inputs}
            onChange={(i, v) => setInputs((prev) => prev.map((x, idx) => (idx === i ? v : x)))}
            onAdd={addPlayerSlot}
            onRemove={removePlayerSlot}
            onSubmit={() => compare()}
            loading={loading}
            centered={isCentered}
          />
          {isCentered && <FeaturedComparisons onSelect={(players) => setInputs(players.length >= MIN_PLAYERS ? players : [...players, ""])} />}
          {isCentered && <RecentSearchesList onSelect={(players) => setInputs(players.length >= MIN_PLAYERS ? players : [...players, ""])} />}
        </div>

        {err && (
          <div className="card p-5 mb-8 flex items-center justify-center gap-3 text-red-400 bg-red-950/20 border-red-900/50 text-sm font-bold fade-in">
            <AlertTriangle className="w-5 h-5" />
            {err}
          </div>
        )}

        {loading && (
          <div className="space-y-6 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-40 shimmer rounded-3xl border border-white/5"></div>
              <div className="h-40 shimmer rounded-3xl border border-white/5"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="h-32 shimmer rounded-3xl border border-white/5"></div>
              <div className="h-32 shimmer rounded-3xl border border-white/5"></div>
              <div className="h-32 shimmer rounded-3xl border border-white/5"></div>
              <div className="h-32 shimmer rounded-3xl border border-white/5"></div>
            </div>
          </div>
        )}

        {!loading && readyPlayers.length >= MIN_PLAYERS && (
          <>
            {anyPrivate && (
              <div className="card p-4 mb-6 flex items-center justify-center gap-3 text-orange-400 bg-orange-950/10 border-orange-900/40 text-xs font-bold fade-in">
                <AlertTriangle className="w-4 h-4" />
                {t("profile.unavailable.desc")}
              </div>
            )}
            <div ref={dashboardRef}>
              <Dashboard players={readyPlayers} onRemovePlayer={undefined} />
            </div>
          </>
        )}

        {allSettled && anyPrivate && readyPlayers.length < MIN_PLAYERS && (
          <div className="card p-12 text-center flex flex-col items-center justify-center fade-in border-orange-500/30 bg-orange-500/5">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 shadow-inner">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-black text-t1 mb-2">{t("profile.unavailable.title")}</h3>
            <p className="text-t2 max-w-md font-medium">{t("profile.unavailable.desc")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-player1 to-player2 flex items-center justify-center shadow-[0_0_40px_rgba(255,123,0,0.3)] animate-pulse">
              <Target className="w-10 h-10 text-[#0B0E14]" />
            </div>
            <Loader2 className="w-6 h-6 text-t3 animate-spin" />
          </div>
        </div>
      }
    >
      <Main />
    </Suspense>
  );
}
