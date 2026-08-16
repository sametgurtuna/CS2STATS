# Faz 0 — Altyapı Temeli: Kurulum Rehberi

Bu fazda kod tarafı (Redis/DB client'ları, ortak tipler, şema tasarımı) hazır. Bunun **çalışır** hale gelmesi için Upstash ve Supabase'te gerçek hesap/proje açman ve `.env.local`'i doldurman gerekiyor. Aşağıdaki adımları sırayla takip et.

> Not: Bu adımlar tamamlanmadan uygulama yine çalışır (build/dev bozulmaz) — Redis/DB sadece Faz 1/2'den itibaren gerçekten kullanılmaya başlanacak. Ama sonraki fazlara geçebilmemiz için bu kurulumun şimdi yapılması gerekiyor.

## 1. Upstash Redis kurulumu

1. https://console.upstash.com adresine git, hesap oluştur (GitHub ile giriş yapılabilir).
2. **Create Database** butonuna tıkla.
   - İsim: `cs2stats` (istediğin bir isim olabilir)
   - Type: **Regional** (Global'e gerek yok, tek bölge yeterli)
   - Region: sana/Vercel deploy bölgene en yakın olanı seç (örn. `eu-west-1` Frankfurt gibi Avrupa bölgesi Türkiye için mantıklı)
   - **Eco** (ücretsiz) plan seçili kalsın.
3. Database oluşunca detay sayfasına gel, **REST API** sekmesine tıkla.
4. Orada gördüğün iki değeri kopyala:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 2. Supabase kurulumu

1. https://supabase.com/dashboard adresine git, hesap oluştur.
2. **New Project** ile yeni proje oluştur.
   - İsim: `cs2stats`
   - Database Password: güçlü bir şifre belirle ve **bir kenara not et** (Supabase bunu bir daha tam göstermez, connection string'de lazım olacak).
   - Region: yine sana yakın bir bölge seç.
3. Proje oluşunca (1-2 dakika sürebilir) sol menüden **Project Settings > Data API** sekmesine git:
   - `Project URL` → bu senin `SUPABASE_URL` değerin.
   - `anon` `public` key → bu senin `SUPABASE_ANON_KEY` değerin.
   - `service_role` `secret` key → bu senin `SUPABASE_SERVICE_ROLE_KEY` değerin. **Bu anahtarı asla client tarafına/tarayıcıya sızdırma, sadece sunucu tarafında kullanılacak.**
4. Sol menüden **Project Settings > Database** sekmesine git:
   - **Connection string** bölümünde **URI** sekmesini seç, **Transaction pooler** (veya "Connection pooling") modunu seç (serverless/Vercel için önerilen budur).
   - Gösterilen string'deki `[YOUR-PASSWORD]` yazan yeri adım 2'de belirlediğin şifreyle değiştir.
   - Bu tam string senin `SUPABASE_DB_URL` değerin (örn. `postgresql://postgres.xxxx:SIFREN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`).

## 3. `.env.local` dosyasını doldur

Proje kökünde `.env.local` dosyası yoksa oluştur (Git'e gitmez, `.gitignore`'da zaten hariç tutuluyor) ve `.env.example`'daki tüm alanları doldur:

```bash
STEAM_API_KEY=...           # zaten sende olmalı
FACEIT_API_KEY=...          # opsiyonel

UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_DB_URL=...
```

## 4. Bağlantıları doğrula

Terminalde proje kökünde:

```bash
npm run health-check
```

Beklenen çıktı:

```
✅ Redis: reachable.
✅ Supabase DB: reachable.
```

Eğer `❌` görürsen — en sık nedenler:
- Redis: URL/token'ı kopyalarken boşluk/satır sonu kalmış olabilir, tekrar kontrol et.
- DB: şifreyi connection string'e yazmayı unutmuş olabilirsin, ya da pooler yerine "Session" modunu kopyalamış olabilirsin (Transaction pooler'ı kullan).

## 5. (Opsiyonel, ama önerilir) Şema tablolarını Supabase'e uygula

Faz 0'da tablo şeması (`db/schema.ts`) tasarlandı ama henüz Supabase'e migrate edilmedi — gerçek kullanım Faz 2'de başlayacak. Şimdiden hazır olsun istersen:

```bash
npm run db:generate   # db/schema.ts'ten SQL migration dosyası üretir (db/migrations/ altına)
npm run db:migrate    # üretilen migration'ı Supabase'e uygular
```

Bu adımı atlarsan sorun değil, Faz 2'ye başlarken tekrar hatırlatılacak.

## 6. Vercel'e deploy ediyorsan

Vercel dashboard'unda projenin **Settings > Environment Variables** kısmına yukarıdaki 6 değişkenin hepsini (Production + Preview için) eklemen gerekiyor — `.env.local` sadece yerel makinende çalışır, Vercel'e otomatik taşınmaz.

---

✅ Bu adımları tamamladıktan sonra Faz 0 senin tarafında da tam olarak kullanılabilir durumda demektir. Bir sonraki fazda (Faz 1) bu Redis/DB bağlantıları gerçek trafik için devreye girecek.
