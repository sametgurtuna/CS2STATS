# Faz 2 — Tekil Oyuncu Sayfası + Trend Takibi: Kurulum Rehberi

Bu fazda eklenenler: `/player/[steamid]` SSR sayfası (dinamik SEO ile), `player_snapshots`/`follows` tablolarının gerçek migration'ı, günlük Vercel Cron ile otomatik anlık görüntü (snapshot) alma, ve sayfada trend grafiği (recharts).

## ⚠️ Önce oku: Supabase DB şifresi hâlâ hatalı

Bu fazı geliştirirken `npm run health-check` çalıştırdım ve **Supabase bağlantısı hâlâ "password authentication failed for user postgres" hatası veriyor** — Faz 0'daki sorun henüz çözülmemiş. Bu, Faz 2'nin kod tarafını **etkilemiyor** (her DB çağrısı `isDbConfigured()`/try-catch ile korumalı, hata olursa sessizce boş sonuç döner, sayfa yine render olur) ama **migration çalıştırılamıyor ve trend takibi/cron gerçek veriye yazamıyor** demek. Aşağıdaki adım 1'i tamamlamadan trend özelliği canlıda işe yaramaz.

## 1. Supabase DB şifresini düzelt ve migration'ı çalıştır

1. https://supabase.com/dashboard → projen → **Project Settings > Database**.
2. **Reset database password** ile yeni bir şifre oluştur (mevcut şifre bir önceki oturumda yanlışlıkla terminale yazdırılmıştı, güvenlik için zaten sıfırlanmalıydı).
3. Aynı sayfadan **Connection string > Transaction pooler** sekmesindeki URI'yi kopyala, `.env.local`'deki `SUPABASE_DB_URL` değerini bununla **tamamen değiştir** (elle şifre yapıştırma, tüm string'i kopyala).
4. Doğrula:
   ```bash
   npm run health-check
   ```
   `✅ Supabase DB: reachable.` görmelisin (artık 10 saniyede timeout olup net hata veriyor, eskisi gibi sonsuza kadar takılı kalmıyor).
5. Migration'ı uygula (tabloları gerçekten oluşturur — `players`, `player_snapshots`, `follows`):
   ```bash
   npm run db:migrate
   ```
   SQL dosyası zaten `db/migrations/0000_gigantic_shadow_king.sql` içinde hazır (`npm run db:generate` ile bu oturumda üretildi), bu komut sadece Supabase'e uygular.

## 2. CRON_SECRET oluştur

Cron route'unu (`/api/cron/snapshot`) sadece Vercel'in tetikleyebilmesi için rastgele bir secret gerekiyor:

```bash
# herhangi bir rastgele 32+ karakterlik string üretir
openssl rand -hex 32
```

Çıkan değeri `.env.local`'e ekle:

```bash
CRON_SECRET=<üretilen-değer>
```

Vercel'e deploy ederken aynı değeri **Settings > Environment Variables**'a da eklemen gerekiyor — Vercel Cron, isteklerine otomatik olarak `Authorization: Bearer <CRON_SECRET>` header'ı ekler, route bunu doğrular.

## 3. Vercel Cron zamanlaması

`vercel.json` günlük 03:00 UTC'de `/api/cron/snapshot`'ı tetikleyecek şekilde ayarlandı:

```json
{ "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 3 * * *" }] }
```

**Not:** Vercel'in ücretsiz (Hobby) planında cron job'lar günde en fazla 1 kez çalışabiliyor — bu yüzden günlük aralık seçildi. Cron sadece Vercel'e deploy edildiğinde otomatik çalışır; yerelde (`npm run dev`) tetiklenmez.

## 4. Nasıl çalışıyor (özet)

- Biri `/player/<steamid>` sayfasını ziyaret ettiğinde, sayfa Steam'den verisini çeker **ve** arka planda (`next/server`'ın `after()`'ı ile, sayfa render'ını bloklamadan) o oyuncuyu `players`/`follows` tablolarına ekler.
- Cron job her gün `follows` tablosundaki tüm steamId'leri gezip her biri için güncel istatistik çekip `player_snapshots`'a bir satır yazıyor (özel/private profiller atlanıyor).
- Bir oyuncunun sayfasında en az 2 snapshot birikince trend grafiği (K/D ve Win Rate zaman içinde) otomatik görünüyor; öncesinde "Henüz trend verisi yok" mesajı gösteriliyor.

## 5. Manuel test

Migration + `CRON_SECRET` tamamlandıktan sonra:

```bash
npm run dev
# ayrı bir terminalde:
curl -H "Authorization: Bearer <CRON_SECRET_DEĞERİN>" http://localhost:3000/api/cron/snapshot
```

`{"total":N,"written":N,"skipped":0,"failed":0}` gibi bir cevap almalısın (N = o ana kadar en az bir `/player/...` sayfası ziyaret edilmiş oyuncu sayısı — henüz kimse ziyaret etmediyse `total:0`). Bir oyuncu sayfasını (`/player/<steamid>`) bir kez açıp tekrar dene, `total` artmalı.

## 6. Ana sayfadan bağlantı

Karşılaştırma sonrası her oyuncu kartındaki küçük profil ikonu artık `/player/<steamid>`'e gidiyor — ekstra kurulum gerekmiyor, kod hazır.

---

✅ Bu adımlar tamamlandığında: her oyuncu sayfası kendi SEO/OG meta'sıyla paylaşılabilir, ziyaret edilen oyuncular otomatik takibe alınır, ve günlük cron ile zaman içindeki performans trendleri birikmeye başlar.
