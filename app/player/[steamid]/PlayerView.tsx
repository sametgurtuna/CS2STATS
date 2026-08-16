"use client";

import Link from "next/link";
import Image from "next/image";
import { Target, Crosshair, Zap, TrendingUp, AlertTriangle, ArrowLeft, Swords } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import type { PlayerData, WeaponStat, MapStat } from "@/lib/types";
import type { SnapshotPoint } from "@/lib/snapshots";

const ACCENT = "#FF7B00";

function Ring({ value, label, size = 110 }: { value: number | string; label: string; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const numVal = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const pct = Math.min(Math.max((numVal / (label === "K/D Ratio" ? 2 : label === "Damage / RD" ? 150 : 100)) * 100, 0), 100);
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center group relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ACCENT} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1500 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${ACCENT}80)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-black tracking-tighter text-t1">{value}</span>
        </div>
      </div>
      <span className="text-[11px] text-t2 mt-4 font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="card p-5 flex flex-col relative overflow-hidden group hover:border-white/20">
      <div className="flex items-start justify-between mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
      </div>
      <div className="z-10 mt-2">
        <div className="text-3xl font-black text-t1 tracking-tighter">{value}</div>
        <div className="text-xs text-t2 uppercase font-black tracking-widest mt-1 opacity-80">{label}</div>
      </div>
    </div>
  );
}

export default function PlayerView({ data, snapshots }: { data: PlayerData; snapshots: SnapshotPoint[] }) {
  const { player, stats, badges, faceit, hours, skins } = data;
  const states = ["Offline", "Online", "Busy", "Away", "Snooze", "Trade", "Play"];
  const dots = ["bg-t3", "bg-green", "bg-red", "bg-player1", "bg-yellow-700", "bg-player2", "bg-blue"];

  const trendData = snapshots.map((s) => ({
    date: new Date(s.capturedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
    kd: s.kd,
    winR: s.winR,
    hsPct: s.hsPct,
  }));

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 md:py-12 relative overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-player1/5 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-player2/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1000px] mx-auto relative z-10 space-y-6">
        <div className="flex items-center justify-between fade-in">
          <Link href="/" className="flex items-center gap-2 text-t2 hover:text-t1 text-xs font-black uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> CS2STATS
          </Link>
          <Link href={`/?player1=${encodeURIComponent(player.steamId)}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-black tracking-widest text-t1 transition-all active:scale-95 shadow-md">
            <Swords className="w-4 h-4 text-t2" /> COMPARE
          </Link>
        </div>

        <div className="card relative overflow-hidden p-6 flex items-center gap-6 fade-in">
          <div className="absolute -top-16 -right-16 w-48 h-48 blur-[64px] opacity-10 pointer-events-none" style={{ background: ACCENT }}></div>
          <div className="relative shrink-0">
            <div className="absolute -inset-2 rounded-full blur-xl opacity-30" style={{ backgroundColor: ACCENT }}></div>
            <div className="w-20 h-20 rounded-full overflow-hidden relative border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 bg-black" style={{ borderColor: ACCENT }}>
              <Image src={player.avatar} alt={player.name} width={80} height={80} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="min-w-0 flex-1 z-10">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              {faceit && (
                <a href={faceit.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#FF5500]/10 border border-[#FF5500]/30 hover:bg-[#FF5500]/20 px-2 py-1 rounded transition-colors text-[#FF5500]">
                  <span className="text-[10px] font-black tracking-widest uppercase">Lv {faceit.level}</span>
                  {faceit.elo && <span className="text-[9px] font-mono font-bold opacity-80">{faceit.elo} ELO</span>}
                </a>
              )}
              <div className="text-[10px] font-mono font-bold bg-white/5 px-2 py-1 rounded shadow-inner text-t2 border border-white/5">
                {hours.toLocaleString()}h <span className="opacity-50">Played</span>
              </div>
            </div>
            <div className="text-3xl font-black text-t1 truncate tracking-tighter drop-shadow-md mb-1">{player.name}</div>
            <div className="flex items-center gap-2 text-xs font-bold text-t2">
              <span className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5 shadow-sm">
                <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${dots[player.state] || dots[0]}`}></span>
                {states[player.state] || "Offline"}
              </span>
              {player.country && player.country !== "XX" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://flagcdn.com/20x15/${player.country.toLowerCase()}.png`} alt={player.country} className="w-4 h-3 rounded-[2px]" />
              )}
            </div>
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {badges.map((b) => (
                  <span key={b.id} className={`px-2 py-1 rounded-md border text-[9px] uppercase font-black tracking-widest shadow-inner ${b.color}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {!stats && (
          <div className="card p-12 text-center flex flex-col items-center justify-center fade-in border-orange-500/30 bg-orange-500/5">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 shadow-inner">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-black text-t1 mb-2">Profile Data Unavailable</h3>
            <p className="text-t2 max-w-md font-medium">This profile is private or hasn&apos;t played enough Competitive matches. Make sure Game Details are public on Steam.</p>
          </div>
        )}

        {stats && (
          <>
            <div className="card p-8 flex flex-wrap justify-around items-center gap-6 fade-in">
              <Ring value={stats.kd} label="K/D Ratio" />
              <Ring value={`${stats.hsPct}%`} label="Headshot" />
              <Ring value={`${stats.winR}%`} label="Win Rate" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 fade-in">
              <StatBox icon={<Target className="w-5 h-5" style={{ color: ACCENT }} />} value={`${stats.acc}%`} label="Accuracy" />
              <StatBox icon={<Zap className="w-5 h-5" style={{ color: ACCENT }} />} value={stats.dpr || "N/A"} label="Damage / RD" />
              <StatBox icon={<Crosshair className="w-5 h-5" style={{ color: ACCENT }} />} value={stats.mvpM} label="MVP / Match" />
              <StatBox icon={<Target className="w-5 h-5" style={{ color: ACCENT }} />} value={`${stats.awpR}%`} label="AWP Kill Ratio" />
            </div>

            <div className="card p-8 fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner"><TrendingUp className="w-4 h-4 text-t1" /></div>
                <h3 className="text-sm font-black text-t1 uppercase tracking-widest">Performance Trend</h3>
              </div>
              {trendData.length >= 2 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 700 }} />
                      <YAxis tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 700 }} />
                      <Tooltip contentStyle={{ background: "rgba(11,14,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, fontWeight: 700 }} />
                      <Line type="monotone" dataKey="kd" name="K/D" stroke={ACCENT} strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="winR" name="Win %" stroke="#00F0FF" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-xs text-t3 opacity-70 p-8 border border-dashed border-white/10 rounded-xl w-full text-center font-mono">
                  Henüz trend verisi yok — günlük anlık görüntüler biriktikçe burada grafik görünecek.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in">
              <div className="card p-6">
                <h3 className="text-sm font-black text-t1 uppercase tracking-widest mb-6">Top Weapons</h3>
                <div className="space-y-3">
                  {stats.weapons.slice(0, 5).map((w: WeaponStat) => (
                    <div key={w.name} className="flex justify-between items-center text-sm bg-black/20 px-4 py-2.5 rounded-xl border border-white/5">
                      <span className="text-t2 font-bold">{w.name}</span>
                      <span className="font-mono text-t1 font-black">{w.kills.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-black text-t1 uppercase tracking-widest mb-6">Map Win Rates</h3>
                <div className="space-y-4">
                  {stats.maps.slice(0, 5).map((m: MapStat) => (
                    <div key={m.name}>
                      <div className="flex justify-between text-[11px] font-black tracking-widest uppercase mb-2">
                        <span className="text-t1">{m.name}</span>
                        <span className="font-mono" style={{ color: ACCENT }}>{m.wr}%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full grow-bar" style={{ width: `${m.wr}%`, backgroundColor: ACCENT }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {skins?.length > 0 && (
              <div className="card p-6 fade-in">
                <h3 className="text-sm font-black text-t1 uppercase tracking-widest mb-6">Notable Skins</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {skins.map((s, i) => (
                    <div key={i} className="flex-shrink-0 w-[140px] bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: `#${s.color}`, boxShadow: `0 0 10px #${s.color}80` }}></div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} alt={s.name} className="w-24 h-24 object-contain drop-shadow-xl" />
                      <span className="text-[10px] text-t3 font-bold text-center mt-3 leading-tight w-full truncate">{s.name.split("|")[0]}</span>
                      <span className="text-[11px] font-black w-full truncate text-center" style={{ color: `#${s.color}` }}>{s.name.split("|")[1]?.trim() || s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
