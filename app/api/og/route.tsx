import { ImageResponse } from 'next/og';
import * as Sentry from '@sentry/nextjs';
import { fetchSteamSummary, resolveSteamId, type SteamSummary } from '@/lib/steam';
import { isValidPlayerInput } from '@/lib/validation';
import { getRedis, isRedisConfigured } from '@/lib/redis';

export const runtime = 'nodejs';

const CACHE_TTL_SECONDS = 3600; // OG images change rarely relative to stats; cache longer.

async function getSummary(player: string): Promise<SteamSummary | null> {
  const cacheKey = `cs2stats:og-summary:${player.trim().toLowerCase()}`;
  if (isRedisConfigured()) {
    try {
      const cached = await getRedis().get<SteamSummary>(cacheKey);
      if (cached) return cached;
    } catch (e) {
      Sentry.captureException(e);
    }
  }

  const steamId = await resolveSteamId(player);
  if (!steamId) return null;
  const summary = await fetchSteamSummary(steamId);
  if (!summary) return null;

  if (isRedisConfigured()) {
    try {
      await getRedis().set(cacheKey, summary, { ex: CACHE_TTL_SECONDS });
    } catch (e) {
      Sentry.captureException(e);
    }
  }
  return summary;
}

function PlayerCard({ summary, color }: { summary: SteamSummary | null; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 420 }}>
      {summary ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={summary.avatar}
          width={140}
          height={140}
          style={{ borderRadius: '50%', border: `4px solid ${color}` }}
          alt=""
        />
      ) : (
        <div style={{ width: 140, height: 140, borderRadius: '50%', border: `4px solid ${color}`, display: 'flex' }} />
      )}
      <div style={{ fontSize: 40, fontWeight: 900, color: '#F8FAFC', display: 'flex', maxWidth: 400, textAlign: 'center' }}>
        {summary?.name || 'Unknown Player'}
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const player1 = searchParams.get('player1') || '';
    const player2 = searchParams.get('player2') || '';

    const [s1, s2] = await Promise.all([
      player1 && isValidPlayerInput(player1) ? getSummary(player1) : Promise.resolve(null),
      player2 && isValidPlayerInput(player2) ? getSummary(player2) : Promise.resolve(null),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom, #0d1118, #0B0E14)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
            <PlayerCard summary={s1} color="#FF7B00" />
            <div style={{ fontSize: 48, fontWeight: 900, color: '#F8FAFC', display: 'flex' }}>VS</div>
            <PlayerCard summary={s2} color="#00F0FF" />
          </div>
          <div style={{ marginTop: 56, fontSize: 32, fontWeight: 900, letterSpacing: 4, display: 'flex' }}>
            <span style={{ color: '#F8FAFC' }}>CS2</span>
            <span style={{ color: '#FF7B00' }}>STATS</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e) {
    Sentry.captureException(e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
