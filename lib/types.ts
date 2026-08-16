// Shared types for player data returned by /api/steam and consumed by app/page.tsx
// and (from Faz 2 onward) app/player/[steamid]. Keeping these in one place avoids
// the `any` drift between the API route and the frontend.

export interface WeaponStat {
  name: string;
  kills: number;
}

export interface MapStat {
  name: string;
  wins: number;
  rounds: number;
  wr: number;
}

export interface ClutchStat {
  pistolWins: number;
  dominations: number;
  revenges: number;
  lm: {
    k: number;
    d: number;
    mvp: number;
    dmg: number;
    w: number;
    r: number;
  };
}

export interface Badge {
  id: string;
  label: string;
  color: string;
}

export interface PlayerStats {
  kd: number;
  hsPct: number;
  winR: number;
  acc: number;
  mvpM: number;
  dpr: number;
  awpR: number;
  kills: number;
  deaths: number;
  wins: number;
  rounds: number;
  played: number;
  weapons: WeaponStat[];
  maps: MapStat[];
  clutch: ClutchStat;
}

export interface SteamPlayerSummary {
  steamId: string;
  name: string;
  avatar: string;
  country: string;
  state: number;
  game?: string;
}

export interface Skin {
  name: string;
  color: string;
  image: string;
}

export interface FaceitInfo {
  level: number;
  elo: number | null;
  url?: string;
}

export interface PlayerData {
  player: SteamPlayerSummary;
  hours: number;
  skins: Skin[];
  badges: Badge[];
  faceit: FaceitInfo | null;
  stats: PlayerStats | null;
  error?: string;
}
