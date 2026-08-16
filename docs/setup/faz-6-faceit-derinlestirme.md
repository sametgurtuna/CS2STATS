# Faz 6 (FACEIT Derinleştirme): Kurulum Rehberi

Bu fazda **yeni bir env var/hesap gerekmiyor** — mevcut `FACEIT_API_KEY` (Faz 0'dan beri `.env.local`'de olması gereken, opsiyonel) yeterli. Anahtar yoksa bu bölüm hiç görünmez (mevcut fail-soft davranışla aynı).

## Ne eklendi

`/player/[steamid]` sayfasına **"FACEIT Performance"** bölümü eklendi — sadece oyuncunun FACEIT hesabı varsa görünür:

- Lifetime özet: maç sayısı, kazanma oranı, ortalama K/D, güncel/en uzun galibiyet serisi
- Harita bazlı performans (üst 5 harita, kazanma oranı bar'ı)
- Son 6 maç: galibiyet/mağlubiyet, skor, tarih — FACEIT'e tıklanabilir link

## Neden önce araştırma yapıldı

FACEIT'in resmi dokümantasyon sitesi (docs.faceit.com) bir SPA ve otomatik metne çevirme araçlarıyla düzgün okunamıyor — bu yüzden kodu yazmadan önce **kendi `FACEIT_API_KEY`'inle gerçek API'ye karşı canlı test ettim**:

- `GET /players/{player_id}/stats/{game_id}` → `lifetime` (flat string-value dict) + `segments[]` (harita bazlı) — doğrulandı
- `GET /players/{player_id}/history?game=cs2&limit=N` → maç geçmişi, **ama harita bilgisi YOK** (harita sadece `/matches/{id}`'de var, her maç için ayrı çağrı gerektirir) — bilerek atlandı, maç listesi haritasız
- Rate limit: **saniyede 20 istek** (`ratelimit-limit` header'ından okundu)

## Cache stratejisi

FACEIT lifetime stats ve maç geçmişi, Steam verisinden ayrı olarak Redis'te **10 dakika** cache'leniyor (`cs2stats:faceit:stats:*` / `cs2stats:faceit:history:*` — bkz. `app/player/[steamid]/page.tsx`). Steam tarafındaki 5 dakikalık cache'den bağımsız, çünkü FACEIT verisi daha az sıklıkla değişiyor ve rate limit'e karşı ekstra güvenlik payı sağlıyor.

## Nasıl deneyeceksin

`.env.local`'de `FACEIT_API_KEY` doluysa:

```bash
npm run dev
```

FACEIT hesabı olduğunu bildiğin bir SteamID64 ile dene (kendi hesabın veya bir arkadaşınınki):

```
http://localhost:3000/player/<steamid64>
```

Profil kartının altında "FACEIT Performance" bölümü çıkmalı. FACEIT hesabı olmayan/gizli bir profil (örn. `http://localhost:3000/player/gaben`) denersen bölüm hiç görünmemeli — bu doğru davranış, hata değil.

## Bilinen kapsam sınırları

- Maç listesinde **harita bilgisi yok** (yukarıda açıklanan rate-limit/karmaşıklık tradeoff'u nedeniyle bilerek atlandı). İstersen ileride her maç için `/matches/{id}` çağrısı eklenip Redis'te ayrıca cache'lenerek doldurulabilir.
- Bu bölüm FACEIT verisi CS2 için `games.cs2` alanı olmayan (yalnızca CS:GO'da aktif) hesaplarda düşük ihtimalle eksik/0 gösterebilir — mevcut kodda zaten `games.cs2 ?? games.csgo` fallback'i var, stats/history endpoint'leri özel olarak test edilmedi bu senaryoda.

---

✅ `npm run test` (26/26), `npx tsc --noEmit`, `npm run lint` (0 sorun), `npm run build` hepsi temiz. Gerçek bir FACEIT hesabına karşı (`/player/76561198012265533`) canlı doğrulandı — lifetime stats, harita segmentleri, ve galibiyet/mağlubiyet etiketli maç geçmişi doğru render oluyor.
