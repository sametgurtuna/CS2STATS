"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, Loader2, AlertTriangle, Link as LinkIcon, Crosshair, Zap, Target, Swords, TrendingUp, Crown, Sparkles } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

function Ring({ value, label, color, size = 110 }: { value: number | string; label: string; color: string; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const numVal = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  const pct = Math.min(Math.max(numVal / (label === "K/D Ratio" ? 2 : label === "Damage / RD" ? 150 : 100) * 100, 0), 100);
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center group relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} 
            className="transition-all duration-1500 ease-out" 
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col transition-transform duration-500 group-hover:scale-110">
          <span className="text-2xl font-black tracking-tighter" style={{ color: '#F8FAFC' }}>{value}</span>
        </div>
      </div>
      <span className="text-[11px] text-t2 mt-4 font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}

function StatBox({ icon, value, label, sub, color }: { icon: React.ReactNode; value: string | number; label: string; sub?: string; color?: string }) {
  return (
    <div className="card p-5 flex flex-col relative overflow-hidden group hover:border-white/20">
      {color && (
        <div className="absolute -inset-2 opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700 blur-2xl" style={{ backgroundColor: color }}></div>
      )}
      <div className="flex items-start justify-between mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        {sub && <div className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-black/40 border border-white/5 text-t3 group-hover:text-t2 transition-colors max-w-[100px] truncate">{sub}</div>}
      </div>
      <div className="z-10 mt-2">
        <div className="text-3xl font-black text-t1 tracking-tighter">{value}</div>
        <div className="text-xs text-t2 uppercase font-black tracking-widest mt-1 opacity-80">{label}</div>
      </div>
    </div>
  );
}

function PlayerInfo({ p, hours, color, tag, badges, faceit }: { p: any; hours: number; color: string; tag: string; badges?: any[]; faceit?: any }) {
  const states = ["Offline", "Online", "Busy", "Away", "Snooze", "Trade", "Play"];
  const dots = ["bg-t3", "bg-green", "bg-red", "bg-player1", "bg-yellow-700", "bg-player2", "bg-blue"];
  return (
    <div className="card relative overflow-hidden p-6 flex items-center gap-6 group hover:border-white/20">
      <div className="absolute -top-16 -right-16 w-48 h-48 blur-[64px] opacity-10 transition-opacity duration-700 group-hover:opacity-30 pointer-events-none" style={{ background: color }}></div>
      <div className="relative shrink-0 mt-2">
        <div className="absolute -inset-2 rounded-full blur-xl opacity-30 group-hover:opacity-75 transition-opacity duration-700" style={{ backgroundColor: color }}></div>
        <div className="w-20 h-20 rounded-full overflow-hidden relative border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 bg-black" style={{ borderColor: color }}>
          <Image src={p.avatar} alt={p.name} width={80} height={80} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>
      <div className="min-w-0 flex-1 z-10">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-black uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5" style={{ color }}>{tag}</div>
            {faceit && (
              <a href={faceit.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#FF5500]/10 border border-[#FF5500]/30 hover:bg-[#FF5500]/20 px-2 py-1 rounded transition-colors text-[#FF5500]">
                 <span className="text-[10px] font-black tracking-widest uppercase">Lv {faceit.level}</span>
                 {faceit.elo && <span className="text-[9px] font-mono font-bold opacity-80">{faceit.elo} ELO</span>}
              </a>
            )}
          </div>
          <div className="text-[10px] font-mono font-bold bg-white/5 px-2 py-1 rounded shadow-inner text-t2 border border-white/5">
            {hours.toLocaleString()}h <span className="opacity-50">Played</span>
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
              <img src={`https://flagcdn.com/20x15/${p.country.toLowerCase()}.png`} alt={p.country} className="w-4 h-3 rounded-[2px]" />
            </span>
          )}
        </div>
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {badges.map(b => (
               <span key={b.id} className={`px-2 py-1 rounded-md border text-[9px] uppercase font-black tracking-widest shadow-inner relative overflow-hidden ${b.color}`}>
                 <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                 {b.label}
               </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CmpRow({ label, v1, v2, higherIsBetter = true }: { label: string; v1: number | string; v2: number | string; higherIsBetter?: boolean }) {
  const n1 = typeof v1 === 'number' ? v1 : parseFloat(String(v1).replace(/[^0-9.-]+/g,"")) || 0;
  const n2 = typeof v2 === 'number' ? v2 : parseFloat(String(v2).replace(/[^0-9.-]+/g,"")) || 0;
  let p1Wins = n1 > n2; let p2Wins = n2 > n1;
  if (!higherIsBetter) { p1Wins = n1 < n2; p2Wins = n2 < n1; }
  const max = Math.max(n1, n2) || 1;
  const w1 = n1 === 0 && n2 === 0 ? 0 : (n1 / max) * 100;
  const w2 = n1 === 0 && n2 === 0 ? 0 : (n2 / max) * 100;

  return (
    <div className="py-3 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] px-3 -mx-3 rounded-xl transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className={`text-base font-black font-mono tracking-tight ${p1Wins ? 'text-player1 drop-shadow-[0_0_8px_rgba(255,123,0,0.5)]' : p2Wins ? 'text-t3 opacity-70' : 'text-t2'}`}>{v1}</div>
        <div className="text-[10px] font-black text-t2 uppercase tracking-widest">{label}</div>
        <div className={`text-base font-black font-mono tracking-tight ${p2Wins ? 'text-player2 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' : p1Wins ? 'text-t3 opacity-70' : 'text-t2'}`}>{v2}</div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-2 flex-1 bg-black/60 rounded-full overflow-hidden flex justify-end shadow-inner">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${p1Wins ? 'bg-player1 shadow-[0_0_10px_rgba(255,123,0,0.8)]' : 'bg-t3 opacity-50'}`} style={{ width: `${Math.max(w1, 2)}%` }}></div>
        </div>
        <div className="h-2 w-8 shrink-0"></div>
        <div className="h-2 flex-1 bg-black/60 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${p2Wins ? 'bg-player2 shadow-[0_0_10px_rgba(0,240,255,0.8)]' : 'bg-t3 opacity-50'}`} style={{ width: `${Math.max(w2, 2)}%` }}></div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ d1, d2 }: { d1: any; d2: any }) {
  const s1 = d1.stats, s2 = d2.stats;
  const p1Col = "#FF7B00", p2Col = "#00F0FF";
  const W_COLORS_P1 = ["#FF7B00", "#FFA940", "#FFC680", "#FFDFBE", "#FFF2E5"];
  const W_COLORS_P2 = ["#00F0FF", "#40F5FF", "#80FAFF", "#BFFCFF", "#E5FEFF"];

  const radarData = [
    { s: "K/D", a: Math.min((s1.kd / 2) * 100, 100), b: Math.min((s2.kd / 2) * 100, 100) },
    { s: "HS%", a: s1.hsPct, b: s2.hsPct },
    { s: "Win%", a: s1.winR, b: s2.winR },
    { s: "Acc", a: s1.acc, b: s2.acc },
    { s: "MVP", a: Math.min((s1.mvpM / 3) * 100, 100), b: Math.min((s2.mvpM / 3) * 100, 100) },
    { s: "ADR", a: Math.min((s1.dpr / 150) * 100, 100), b: Math.min((s2.dpr / 150) * 100, 100) },
  ];

  let w1 = 0, w2 = 0;
  if (s1.kd > s2.kd) w1++; else if (s2.kd > s1.kd) w2++;
  if (s1.hsPct > s2.hsPct) w1++; else if (s2.hsPct > s1.hsPct) w2++;
  if (s1.winR > s2.winR) w1++; else if (s2.winR > s1.winR) w2++;
  if (s1.acc > s2.acc) w1++; else if (s2.acc > s1.acc) w2++;
  if (s1.dpr > s2.dpr) w1++; else if (s2.dpr > s1.dpr) w2++;
  const winner = w1 > w2 ? d1.player.name : w2 > w1 ? d2.player.name : "Draw";

  const PieSection = ({ weapons, colors }: { weapons: any[]; colors: string[] }) => (
    <div className="h-44 w-full relative drop-shadow-2xl">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={weapons.slice(0, 5)} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="kills" nameKey="name" stroke="none" paddingAngle={4} cornerRadius={6}>
            {weapons.slice(0, 5).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: 'rgba(11,14,20,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, fontWeight: 'bold' }} itemStyle={{ color: '#F8FAFC' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Target className="w-8 h-8 text-t3/30" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in" style={{ animationDelay: '50ms' }}>
         <PlayerInfo p={d1.player} hours={d1.hours} color={p1Col} tag="Player 1" badges={d1.badges} faceit={d1.faceit} />
         <PlayerInfo p={d2.player} hours={d2.hours} color={p2Col} tag="Player 2" badges={d2.badges} faceit={d2.faceit} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in" style={{ animationDelay: '150ms' }}>
         <div className="card p-8 flex justify-around items-center relative overflow-hidden group hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-r from-player1/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Ring value={s1.kd} label="K/D Ratio" color={s1.kd >= s2.kd ? p1Col : "#475569"} />
            <Ring value={`${s1.hsPct}%`} label="Headshot" color={s1.hsPct >= s2.hsPct ? p1Col : "#475569"} />
            <Ring value={`${s1.winR}%`} label="Win Rate" color={s1.winR >= s2.winR ? p1Col : "#475569"} />
         </div>
         <div className="card p-8 flex justify-around items-center relative overflow-hidden group hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-l from-player2/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Ring value={s2.kd} label="K/D Ratio" color={s2.kd >= s1.kd ? p2Col : "#475569"} />
            <Ring value={`${s2.hsPct}%`} label="Headshot" color={s2.hsPct >= s1.hsPct ? p2Col : "#475569"} />
            <Ring value={`${s2.winR}%`} label="Win Rate" color={s2.winR >= s1.winR ? p2Col : "#475569"} />
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 fade-in" style={{ animationDelay: '250ms' }}>
         <StatBox icon={<Target className="w-5 h-5 text-player1" />} value={`${s1.acc}%`} label="Accuracy" sub={d1.player.name} color={p1Col} />
         <StatBox icon={<Zap className="w-5 h-5 text-player1" />} value={s1.dpr || "N/A"} label="Damage / RD" sub={d1.player.name} color={p1Col} />
         <StatBox icon={<Target className="w-5 h-5 text-player2" />} value={`${s2.acc}%`} label="Accuracy" sub={d2.player.name} color={p2Col} />
         <StatBox icon={<Zap className="w-5 h-5 text-player2" />} value={s2.dpr || "N/A"} label="Damage / RD" sub={d2.player.name} color={p2Col} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 fade-in" style={{ animationDelay: '350ms' }}>
         <div className="card p-6 flex flex-col xl:col-span-1 border-t-4 border-t-transparent hover:border-t-white/20 hover:border-white/20 group transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner"><TrendingUp className="w-4 h-4 text-t1" /></div>
              <h3 className="text-sm font-black text-t1 uppercase tracking-widest">Performance Radar</h3>
            </div>
            <div className="h-80 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="s" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 800 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={d1.player.name} dataKey="a" stroke={p1Col} fill={p1Col} fillOpacity={0.25} strokeWidth={3} style={{ filter: `drop-shadow(0 0 10px ${p1Col}80)` }} />
                  <Radar name={d2.player.name} dataKey="b" stroke={p2Col} fill={p2Col} fillOpacity={0.25} strokeWidth={3} style={{ filter: `drop-shadow(0 0 10px ${p2Col}80)` }} />
                  <Tooltip contentStyle={{ background: 'rgba(11,14,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, fontWeight: 700 }} itemStyle={{ fontWeight: 'bold' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="card p-8 xl:col-span-1 border-t-4 hover:border-x-white/20 hover:border-b-white/20 transition-all duration-300" style={{ borderTopColor: winner === d1.player.name ? p1Col : winner === d2.player.name ? p2Col : '#475569' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner"><Swords className="w-4 h-4 text-t1" /></div>
              <h3 className="text-sm font-black text-t1 uppercase tracking-widest">Head to Head</h3>
            </div>
            <div className="space-y-1">
              <CmpRow label="K/D Ratio" v1={s1.kd} v2={s2.kd} />
              <CmpRow label="Headshot %" v1={`${s1.hsPct}%`} v2={`${s2.hsPct}%`} />
              <CmpRow label="Win Rate" v1={`${s1.winR}%`} v2={`${s2.winR}%`} />
              <CmpRow label="Accuracy" v1={`${s1.acc}%`} v2={`${s2.acc}%`} />
              <CmpRow label="ADR" v1={s1.dpr} v2={s2.dpr} />
              <CmpRow label="MVP/Match" v1={s1.mvpM} v2={s2.mvpM} />
              <CmpRow label="Total Kills" v1={s1.kills.toLocaleString()} v2={s2.kills.toLocaleString()} />
              <CmpRow label="Matches" v1={s1.played} v2={s2.played} />
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 relative overflow-hidden rounded-2xl group">
               <div className="absolute inset-0 opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-500" style={{ background: winner === d1.player.name ? p1Col : winner === d2.player.name ? p2Col : '#475569' }}></div>
               <div className="relative text-center z-10">
                 <div className="text-[10px] font-black uppercase text-t2 tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                   <Crown className="w-4 h-4 text-amber-400" /> Overall Winner
                 </div>
                 <div className="text-3xl font-black tracking-tighter" style={{ color: winner === d1.player.name ? p1Col : winner === d2.player.name ? p2Col : '#F8FAFC', textShadow: `0 0 20px ${winner === d1.player.name ? p1Col : winner === d2.player.name ? p2Col : '#F8FAFC'}60` }}>
                    {winner}
                 </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-6 xl:col-span-1">
            <div className="card p-6 flex-1 hover:border-white/20 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner"><Crown className="w-4 h-4 text-t1" /></div>
                <h3 className="text-sm font-black text-t1 uppercase tracking-widest">Clutch Mastery</h3>
              </div>
              <div className="space-y-1 mb-8">
                 <CmpRow label="1vX Wins" v1={s1.clutch.pistolWins || 0} v2={s2.clutch.pistolWins || 0} />
                 <CmpRow label="Dominations" v1={s1.clutch.dominations || 0} v2={s2.clutch.dominations || 0} />
                 <CmpRow label="Revenges" v1={s1.clutch.revenges || 0} v2={s2.clutch.revenges || 0} />
              </div>
              
              <div className="pt-6 border-t border-white/5">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shadow-inner"><Target className="w-4 h-4 text-orange-500" /></div>
                   <h3 className="text-sm font-black text-t1 uppercase tracking-widest">AWP Statistics</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 rounded-xl p-5 border border-white/5 hover:border-player1/30 transition-all duration-300 shadow-inner group">
                      <div className="text-[10px] font-black tracking-widest uppercase text-player1 truncate mb-3">{d1.player.name}</div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[9px] text-t3 uppercase font-bold tracking-widest mb-1">Ratio</div>
                          <div className="text-2xl font-black font-mono text-t1 group-hover:text-white transition-colors">{s1.awpR}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-t3 uppercase font-bold tracking-widest mb-1">Acc</div>
                          <div className="text-sm font-black font-mono text-t2">{s1.acc}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-5 border border-white/5 hover:border-player2/30 transition-all duration-300 shadow-inner group">
                      <div className="text-[10px] font-black tracking-widest uppercase text-player2 truncate mb-3">{d2.player.name}</div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[9px] text-t3 uppercase font-bold tracking-widest mb-1">Ratio</div>
                          <div className="text-2xl font-black font-mono text-t1 group-hover:text-white transition-colors">{s2.awpR}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-t3 uppercase font-bold tracking-widest mb-1">Acc</div>
                          <div className="text-sm font-black font-mono text-t2">{s2.acc}%</div>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in" style={{ animationDelay: '450ms' }}>
          <div className="card p-8 hover:border-white/20 transition-colors duration-300">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner"><Crosshair className="w-4 h-4 text-t1" /></div>
                <h3 className="text-sm font-black text-t1 uppercase tracking-widest">Deadliest Weapons</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
               <div>
                  <PieSection weapons={s1.weapons} colors={W_COLORS_P1} />
                  <div className="mt-6 space-y-3">
                     {s1.weapons.slice(0, 4).map((w: any, idx: number) => (
                        <div key={`p1-${w.name}`} className="flex justify-between items-center text-sm group bg-black/20 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                           <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: W_COLORS_P1[idx % W_COLORS_P1.length], color: W_COLORS_P1[idx % W_COLORS_P1.length] }}></span>
                              <span className="text-t2 group-hover:text-t1 font-bold transition-colors">{w.name}</span>
                           </div>
                           <span className="font-mono text-player1 font-black">{w.kills.toLocaleString()}</span>
                        </div>
                     ))}
                  </div>
               </div>
               <div>
                  <PieSection weapons={s2.weapons} colors={W_COLORS_P2} />
                  <div className="mt-6 space-y-3">
                     {s2.weapons.slice(0, 4).map((w: any, idx: number) => (
                        <div key={`p2-${w.name}`} className="flex justify-between items-center text-sm group bg-black/20 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                           <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: W_COLORS_P2[idx % W_COLORS_P2.length], color: W_COLORS_P2[idx % W_COLORS_P2.length] }}></span>
                              <span className="text-t2 group-hover:text-t1 font-bold transition-colors">{w.name}</span>
                           </div>
                           <span className="font-mono text-player2 font-black">{w.kills.toLocaleString()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
          
          <div className="card p-8 hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner"><Target className="w-4 h-4 text-t1" /></div>
                <h3 className="text-sm font-black text-t1 uppercase tracking-widest">Map Win Rates</h3>
            </div>
            <div className="space-y-6">
               {(() => {
                  const allMaps = new Set([...s1.maps.map((m: any) => m.name), ...s2.maps.map((m: any) => m.name)]);
                  return Array.from(allMaps).slice(0, 6).map(name => {
                    const m1 = s1.maps.find((m: any) => m.name === name);
                    const m2 = s2.maps.find((m: any) => m.name === name);
                    const w1 = m1?.wr || 0;
                    const w2 = m2?.wr || 0;
                    return (
                      <div key={name} className="relative group">
                        <div className="flex justify-between text-[11px] font-black tracking-widest uppercase mb-3">
                           <span className="text-player1 font-mono">{w1}%</span>
                           <span className="text-t1 px-4 bg-black/40 py-1 rounded-md border border-white/5 group-hover:bg-white/10 transition-colors shadow-inner">{name}</span>
                           <span className="text-player2 font-mono">{w2}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 h-4 bg-black/30 p-0.5 rounded-full border border-white/5 shadow-inner">
                           <div className="flex-1 rounded-l-full overflow-hidden flex justify-end">
                              <div className="h-full bg-player1 grow-bar rounded-l-full shadow-[0_0_10px_rgba(255,123,0,0.6)]" style={{ width: `${w1}%` }}></div>
                           </div>
                           <div className="flex-1 rounded-r-full overflow-hidden">
                              <div className="h-full bg-player2 grow-bar rounded-r-full shadow-[0_0_10px_rgba(0,240,255,0.6)]" style={{ width: `${w2}%` }}></div>
                           </div>
                        </div>
                      </div>
                    );
                  });
               })()}
            </div>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in" style={{ animationDelay: '550ms' }}>
          <div className="card p-6 w-full hover:border-white/20 transition-colors duration-300">
            <h3 className="text-sm font-black text-t1 uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner"><Sparkles className="w-4 h-4 text-player1" /></div>
              Notable Skins <span className="text-t3 ml-2 text-[10px] bg-black/40 px-2 py-1 rounded border border-white/5">{d1.player.name}</span>
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {d1.skins?.length > 0 ? d1.skins.map((s:any, i:number) => (
                 <div key={i} className="flex-shrink-0 w-[140px] bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center shadow-inner relative overflow-hidden group hover:border-white/20 transition-all cursor-crosshair">
                    <div className="absolute top-0 left-0 right-0 h-1 transition-all" style={{backgroundColor: `#${s.color}`, boxShadow: `0 0 10px #${s.color}80`}}></div>
                    <img src={s.image} alt={s.name} className="w-24 h-24 object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500" />
                    <span className="text-[10px] text-t3 font-bold text-center mt-3 leading-tight w-full truncate">{s.name.split('|')[0]}</span>
                    <span className="text-[11px] font-black w-full truncate text-center drop-shadow-md" style={{color: `#${s.color}`}}>{s.name.split('|')[1]?.trim() || s.name}</span>
                 </div>
              )) : <div className="text-xs text-t3 opacity-50 p-8 border border-dashed border-white/10 rounded-xl w-full text-center font-mono">Private / Empty Inventory</div>}
            </div>
          </div>
          
          <div className="card p-6 w-full hover:border-white/20 transition-colors duration-300">
            <h3 className="text-sm font-black text-t1 uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shadow-inner"><Sparkles className="w-4 h-4 text-player2" /></div>
              Notable Skins <span className="text-t3 ml-2 text-[10px] bg-black/40 px-2 py-1 rounded border border-white/5">{d2.player.name}</span>
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {d2.skins?.length > 0 ? d2.skins.map((s:any, i:number) => (
                 <div key={i} className="flex-shrink-0 w-[140px] bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center shadow-inner relative overflow-hidden group hover:border-white/20 transition-all cursor-crosshair">
                    <div className="absolute top-0 left-0 right-0 h-1 transition-all" style={{backgroundColor: `#${s.color}`, boxShadow: `0 0 10px #${s.color}80`}}></div>
                    <img src={s.image} alt={s.name} className="w-24 h-24 object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500" />
                    <span className="text-[10px] text-t3 font-bold text-center mt-3 leading-tight w-full truncate">{s.name.split('|')[0]}</span>
                    <span className="text-[11px] font-black w-full truncate text-center drop-shadow-md" style={{color: `#${s.color}`}}>{s.name.split('|')[1]?.trim() || s.name}</span>
                 </div>
              )) : <div className="text-xs text-t3 opacity-50 p-8 border border-dashed border-white/10 rounded-xl w-full text-center font-mono">Private / Empty Inventory</div>}
            </div>
          </div>
      </div>
    </div>
  );
}

function Main() {
  const sp = useSearchParams();
  const [p1, setP1] = useState(sp.get("player1") || "");
  const [p2, setP2] = useState(sp.get("player2") || "");
  const [d1, setD1] = useState<any>(null);
  const [d2, setD2] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const fetch1 = async (input: string) => {
    const r = await fetch("/api/steam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: input }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    return d;
  };

  const compare = async (a?: string, b?: string) => {
    const x = a || p1, y = b || p2;
    if (!x || !y) return;
    const u = new URL(window.location.href);
    u.searchParams.set("player1", x); u.searchParams.set("player2", y);
    window.history.pushState({}, "", u.toString());
    setLoading(true); setErr(""); setD1(null); setD2(null);
    try {
      const [r1, r2] = await Promise.all([fetch1(x), fetch1(y)]);
      setD1(r1); setD2(r2);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };

  useEffect(() => {
    const a = sp.get("player1"), b = sp.get("player2");
    if (a && b) { setP1(a); setP2(b); compare(a, b); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCentered = !d1 && !d2 && !loading;

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 md:py-12 relative overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-player1/5 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-player2/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1280px] mx-auto relative z-10">
        {!isCentered && (
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 fade-in gap-4" style={{ animationDelay: '0ms' }}>
             <h1 className="text-3xl font-black text-t1 tracking-tighter drop-shadow-lg flex items-center gap-3 cursor-pointer group" onClick={() => { setD1(null); setD2(null); window.history.pushState({}, "", "/"); }}>
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-player1 to-player2 flex items-center justify-center shadow-lg shadow-player1/20 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-[#0B0E14] drop-shadow-sm" />
               </div>
               <div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">CS2</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-player1 to-amber-400">STATS</span>
               </div>
             </h1>
             {(d1 || d2) && (
               <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                 className="flex items-center gap-2 px-5 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-black tracking-widest text-t1 transition-all active:scale-95 shadow-md">
                 <LinkIcon className="w-4 h-4 text-t2" />{copied ? "COPIED TO CLIPBOARD" : "SHARE ANALYSIS"}
               </button>
             )}
          </div>
        )}

        <div className={`transition-all duration-1000 ease-out ${isCentered ? 'max-w-4xl mx-auto mt-[15vh] scale-100' : 'max-w-[1280px] scale-100 mb-12'}`}>
          {isCentered && (
             <div className="text-center mb-16 fade-in flex flex-col items-center">
               <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-player1 to-player2 flex items-center justify-center shadow-[0_0_40px_rgba(255,123,0,0.3)] mb-8 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                  <Target className="w-12 h-12 text-[#0B0E14]" />
               </div>
               <h1 className="text-6xl sm:text-7xl font-black text-t1 tracking-tighter mb-6 drop-shadow-2xl">
                 <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">CS2</span>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-player1 to-amber-400 filter drop-shadow-[0_0_20px_rgba(255,123,0,0.4)]">STATS</span>
               </h1>
               <p className="text-t2 text-lg sm:text-lg max-w-2xl mx-auto font-bold leading-relaxed">
                 The ultimate head-to-head Counter-Strike 2 player comparison. Enter Steam IDs or Custom URLs to analyze performance.
               </p>
             </div>
          )}
          <div className={`card p-4 sm:p-5 flex flex-col md:flex-row items-stretch gap-4 ${isCentered ? 'shadow-2xl shadow-black ring-1 ring-white/5 backdrop-blur-2xl bg-black/40 fade-in' : 'bg-black/20 fade-in'}`} style={{ animationDelay: isCentered ? '100ms' : '0ms' }}>
            <div className="flex-1 relative group w-full">
              <div className="absolute inset-0 bg-player1/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
              <div className="relative flex items-center bg-black/60 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-player1/50 focus-within:ring-1 focus-within:ring-player1/50 transition-all shadow-inner hover:bg-black/80">
                <Search className="w-5 h-5 text-t3 mr-3 group-focus-within:text-player1 transition-colors" />
                <input value={p1} onChange={e => setP1(e.target.value)} placeholder="Player 1 Steam ID or URL"
                  className="flex-1 bg-transparent text-sm sm:text-base font-bold text-t1 placeholder:text-t3/70 outline-none w-full"
                  onKeyDown={e => e.key === 'Enter' && compare()} />
              </div>
            </div>
            
            <div className="shrink-0 relative flex items-center justify-center w-14 h-14 self-center hidden md:flex">
               <div className="absolute inset-0 bg-gradient-to-br from-player1 to-player2 blur-xl opacity-40 rounded-full"></div>
               <div className="relative w-12 h-12 bg-black border border-white/10 rounded-full flex items-center justify-center shadow-xl pointer-events-none">
                  <span className="text-xs font-black text-t1 bg-clip-text text-transparent bg-gradient-to-br from-player1 to-player2">VS</span>
               </div>
            </div>

            <div className="flex-1 relative group w-full">
              <div className="absolute inset-0 bg-player2/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
              <div className="relative flex items-center bg-black/60 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-player2/50 focus-within:ring-1 focus-within:ring-player2/50 transition-all shadow-inner hover:bg-black/80">
                <Search className="w-5 h-5 text-t3 mr-3 group-focus-within:text-player2 transition-colors" />
                <input value={p2} onChange={e => setP2(e.target.value)} placeholder="Player 2 Steam ID or URL"
                  className="flex-1 bg-transparent text-sm sm:text-base font-bold text-t1 placeholder:text-t3/70 outline-none w-full"
                  onKeyDown={e => e.key === 'Enter' && compare()} />
              </div>
            </div>
            
            <button disabled={loading || !p1 || !p2} onClick={() => compare()}
              className="w-full md:w-auto bg-t1 hover:bg-white text-black font-black tracking-widest text-sm px-10 py-4 md:py-0 rounded-2xl disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
              ANALYZE
            </button>
          </div>
        </div>

        {err && <div className="card p-5 mb-8 flex items-center justify-center gap-3 text-red-400 bg-red-950/20 border-red-900/50 text-sm font-bold animate-pulse fade-in"><AlertTriangle className="w-5 h-5" />{err}</div>}

        {loading && (
          <div className="space-y-6 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="h-40 shimmer rounded-3xl border border-white/5"></div><div className="h-40 shimmer rounded-3xl border border-white/5"></div></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6"><div className="h-32 shimmer rounded-3xl border border-white/5"></div><div className="h-32 shimmer rounded-3xl border border-white/5"></div><div className="h-32 shimmer rounded-3xl border border-white/5"></div><div className="h-32 shimmer rounded-3xl border border-white/5"></div></div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6"><div className="h-[500px] shimmer rounded-3xl border border-white/5"></div><div className="h-[500px] shimmer rounded-3xl border border-white/5"></div><div className="h-[500px] shimmer rounded-3xl border border-white/5"></div></div>
          </div>
        )}

        {!loading && d1 && d2 && d1.stats && d2.stats && <Dashboard d1={d1} d2={d2} />}

        {!loading && d1 && d2 && (!d1.stats || !d2.stats) && (
          <div className="card p-12 text-center flex flex-col items-center justify-center fade-in border-orange-500/30 bg-orange-500/5">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 shadow-inner">
               <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-black text-t1 mb-2">Profile Data Unavailable</h3>
            <p className="text-t2 max-w-md font-medium">One or both profiles are private or haven't played enough Competitive matches. Make sure Game Details are public on Steam.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
        <div className="flex flex-col items-center gap-6">
           <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-player1 to-player2 flex items-center justify-center shadow-[0_0_40px_rgba(255,123,0,0.3)] animate-pulse">
              <Target className="w-10 h-10 text-[#0B0E14]" />
           </div>
           <Loader2 className="w-6 h-6 text-t3 animate-spin" />
        </div>
      </div>
    }>
      <Main />
    </Suspense>
  );
}
