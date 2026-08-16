import { ImageResponse } from 'next/og';

export const alt = 'CS2STATS - Head-to-head Counter-Strike 2 player comparison';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Static fallback used whenever a page doesn't set its own OG image (e.g. the
// homepage with no ?player1=&player2= yet). The live comparison image lives
// at /api/og and is wired up per-request in app/page.tsx's generateMetadata.
export default function Image() {
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
        <div style={{ display: 'flex', fontSize: 96, fontWeight: 900, letterSpacing: 4 }}>
          <span style={{ color: '#F8FAFC' }}>CS2</span>
          <span style={{ color: '#FF7B00' }}>STATS</span>
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 32, fontWeight: 700, color: '#94A3B8' }}>
          Head-to-head Counter-Strike 2 player comparison
        </div>
      </div>
    ),
    { ...size }
  );
}
