# Faz 1 — Yayın Öncesi Sertleştirme: Kurulum Rehberi

Bu fazda eklenenler: rate limiting, kalıcı (Redis) cache, Sentry monitoring, dinamik paylaşım kartı (OG image), input validasyonu, ve `lib/stats.ts` için birim testleri.

## ⚠️ Önce oku: güvenlik notu

Bu fazın geliştirilmesi sırasında `.env.example` dosyasına (yanlışlıkla, bizim dışımızda) gerçek API anahtarları/token'lar girilip GitHub'a push edilmişti. Bunu fark edip dosyayı placeholder'lara geri döndürdük, ama **sen o anahtarları rotate ettiysen bu bölümü atlayabilirsin — etmediysen mutlaka şimdi yap**:

- Steam API key, FACEIT API key, Upstash Redis token, Supabase anon/service_role key ve DB şifresi — hepsi yenilenmeli.
- Kural: `.env.example`'a **asla gerçek değer girme**, sadece placeholder/boş. Gerçek değerler yalnızca `.env.local`'de (git'e gitmiyor) olmalı.

## 1. Redis rate limiting + kalıcı cache — ekstra kurulum yok

Faz 0'da kurduğun Upstash Redis zaten bu fazda devreye girdi. `.env.local`'deki `UPSTASH_REDIS_REST_URL`/`TOKEN` doluysa ekstra bir şey yapmana gerek yok. Doğrulamak için:

```bash
npm run dev
```

Ardından aynı IP'den `/api/steam`'e 11 kez arka arkaya istek at (örn. formu 11 kez "ANALYZE"'a bas) — 11. istekte "Too many requests" hatası almalısın. Bu, dakikada 10 istek sınırının çalıştığını gösterir.

## 2. Sentry kurulumu (opsiyonel ama önerilir)

Sentry DSN'i olmadan da uygulama sorunsuz çalışır (Sentry çağrıları sessizce no-op olur). Hata takibini aktif etmek istersen:

1. https://sentry.io adresinde hesap aç, **Create Project** ile bir Next.js projesi oluştur.
2. Proje oluşunca sana verilen **DSN**'i kopyala (Settings > Client Keys (DSN) sayfasında da bulabilirsin).
3. `.env.local`'e ekle:
   ```bash
   SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
   NEXT_PUBLIC_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
   ```
   (Aynı DSN'i her ikisine de yazabilirsin — biri sunucu, biri tarayıcı tarafı hatalar için.)
4. (Opsiyonel) Source map upload istersen `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` da doldur — Sentry dashboard'unda Settings > Auth Tokens'tan token alabilirsin. Bunlar boşsa build yine sorunsuz çalışır, sadece source map yüklenmez (stack trace'ler minify edilmiş halde görünür).
5. Doğrulamak için: `app/api/steam/route.ts` içinde bilerek bir hata tetikleyip (örn. Steam API'yi geçici olarak kapat) Sentry dashboard'unda görünüp görünmediğine bak.

## 3. Dinamik paylaşım kartı (OG image)

Ekstra kurulum gerekmiyor, kodda hazır. Doğrulamak için:

```bash
curl "http://localhost:3000/api/og?player1=gaben&player2=gaben" --output og-test.png
```

`og-test.png`'yi açtığında iki oyuncunun avatarı/ismi ile "VS" görselini görmelisin (1200x630 PNG).

Gerçek paylaşımlarda (Discord, Twitter/X) doğru görünmesi için **production'a deploy ettiğinde** `.env` içine gerçek domain'i eklemen gerekiyor:

```bash
NEXT_PUBLIC_SITE_URL=https://senin-domainin.vercel.app
```

Bu olmadan OG image linkleri `http://localhost:3000/...` gibi üretilir ve dışarıdan erişilemez — sosyal medya paylaşımlarında görsel görünmez.

## 4. Input validasyonu — ekstra kurulum yok

Kod tarafında hazır, hem formda (anlık hata mesajı) hem API'de (400 hatası) çalışıyor. Geçersiz bir değer (örn. `!!invalid!!`) girip "ANALYZE"'a basarak deneyebilirsin.

## 5. Testler

```bash
npm run test
```

22 test hepsi geçmeli. Yeni bir istatistik hesaplaması eklediğinde `lib/stats.ts`'e fonksiyon ekleyip `lib/stats.test.ts`'e karşılık gelen testi de eklemen bekleniyor.

## 6. Vercel'e deploy ediyorsan

Yukarıdaki Sentry ve `NEXT_PUBLIC_SITE_URL` değişkenlerini (doldurduysan) Vercel dashboard'unda **Settings > Environment Variables** kısmına da eklemen gerekiyor (Faz 0'daki Redis/Supabase değişkenleriyle birlikte).

---

✅ Bu adımları tamamladıktan sonra Faz 1 tam olarak devrede: her IP dakikada 10 karşılaştırmayla sınırlı, sonuçlar Redis'te 5 dakika önbelleklenir, hatalar (Sentry kurduysan) izlenir, paylaşılan linkler sosyal medyada görsel önizlemeyle çıkar, ve geçersiz girişler API'ye gitmeden yakalanır.
