# FEATURES.md

CS2STATS'ı geliştirmek ve yayına almak için fikir listesi. Öncelik sırası kabaca yukarıdan aşağıya; her bölüm kendi içinde de önem sırasına göre.

## 1. Yayına almadan önce yapılması gereken temel işler

- **Rate limiting**: `/api/steam` şu an herkese açık ve sınırsız. Steam API key günlük kotaya sahip (100k/gün) ama tek bir kötü niyetli kullanıcı ya da bot bunu tüketebilir. IP başına basit bir rate limit (örn. Vercel Edge Config / Upstash Redis ile 10 istek/dakika) şart.
- **Kalıcı cache**: Şu anki 5 dakikalık cache `Map` içinde, process bazlı — serverless'ta her cold start'ta sıfırlanıyor ve instance'lar arası paylaşılmıyor. Upstash Redis / Vercel KV'ye taşınırsa hem Steam API kotası korunur hem yanıt hızlanır.
- **Hata/monitoring**: Şu an başarısız isteklerde kullanıcıya mesaj dönüyor ama sunucu tarafında loglama/monitoring yok. Sentry veya Vercel Analytics + basit log eklenmeli, özellikle Steam API 403/429 durumlarını takip etmek için.
- **SEO ve paylaşım kartları**: `layout.tsx`'te sadece `title`/`description` var. Open Graph + Twitter Card meta'ları (dinamik OG image ile — karşılaştırılan iki oyuncunun adı/avatarı) eklenirse `?player1=...&player2=...` linkleri Discord/Twitter'da paylaşıldığında görsel önizleme çıkar. "SHARE ANALYSIS" butonunun asıl gücü burada ortaya çıkar.
- **Input validasyonu**: Steam ID / vanity URL parse'ı frontend'de hiç doğrulanmıyor, boş/geçersiz girişte doğrudan API'ye gidiyor. Basit client-side format kontrolü UX'i hızlandırır.

## 2. Ürünü büyütecek yeni özellikler

- **Tekil oyuncu profil sayfası**: Şu an sadece karşılaştırma var. `/player/[steamid]` gibi bir route ile tek oyuncu istatistik sayfası, kendi başına paylaşılabilir/indekslenebilir içerik üretir (SEO trafiği için de önemli).
- **Zaman içinde istatistik takibi**: Steam API anlık toplam istatistik veriyor, geçmiş yok. Kullanıcı bir kez "takip et" dediğinde günlük/haftalık snapshot alıp DB'de saklarsan (Postgres/Supabase), trend grafikleri (K/D zaman içinde, oynama sıklığı) sunabilirsin — rakiplerin sunmadığı bir özellik.
- **Çoklu oyuncu karşılaştırma (2'den fazla)**: Şu anki UI sıkı şekilde 1v1'e kilitli. 3-5 oyuncuyu aynı radar/tabloda karşılaştırma (takım analizi) doğal bir genişleme.
- **Takım/5v5 modu**: Bir Steam grubu veya 5 SteamID girilerek takım ortalaması, en iyi/en kötü performans, rol tahmini (entry fragger / support / awper) gibi analiz.
- **Maç geçmişi entegrasyonu**: Steam'in resmi API'si maç bazlı detay vermiyor ama `leetify`/`csstats.gg` benzeri servislerin public API'leri veya CS2 demo parse (community projeleri var, örn. `demoinfocs-golang`) ile son maçların round-by-round analizi eklenebilir — bu, mevcut ürünü "toplu istatistik" seviyesinden "gerçek analiz aracı" seviyesine taşır.
- **FACEIT tarafını derinleştirme**: Şu an sadece level/ELO gösteriliyor. FACEIT'in kendi public API'sinde maç geçmişi, harita bazlı FACEIT istatistikleri de var — Steam verisiyle yan yana FACEIT karşılaştırması eklenebilir.
- **"Kim kazanır?" tahmin skoru**: Mevcut ağırlıksız "5 kategoriden kim önde" mantığı yerine, ağırlıklı bir composite skor (örn. impact rating benzeri) ve bunu görselleştiren tek bir "win probability" barı — şu anki "Overall Winner" kutusunu daha ikna edici hale getirir.
- **Rastgele/öne çıkan karşılaştırmalar**: Ana sayfada "Popüler pro oyuncu karşılaştırmaları" (s1mple vs ZywOo gibi, public SteamID'leri bilinen pro oyuncular) — boş state'te kullanıcıyı ürüne ısındırmak için düşük efor, yüksek etki.

## 3. UX / arayüz iyileştirmeleri

- **Mobil optimizasyon kontrolü**: Grid'ler `md:`/`xl:` breakpoint'lerine göre kurulmuş, ama dar ekranda pie chart + tablo yoğunluğu sıkışabilir; gerçek cihazda test edilmeli.
- **Skeleton/loading state iyileştirmesi**: Zaten shimmer var, iyi. Eklenebilecek: kısmi yükleme — iki oyuncudan biri hazır olur olmaz göstermek (şu an `Promise.all` ile ikisi birden bekleniyor).
- **Geçmiş aramalar**: LocalStorage'da son karşılaştırılan oyuncu çiftlerini tutup hızlı erişim listesi sunmak.
- **Karşılaştırma sonucunu görsel olarak indirme**: Dashboard'ı PNG/kart olarak export etme (html-to-image gibi bir kütüphaneyle) — sosyal medyada paylaşım için "SHARE ANALYSIS" linkten daha viral bir format.
- **Dil desteği**: Şu an tamamen İngilizce metin. Türkçe/İngilizce toggle, özellikle TR CS2 topluluğu hedefleniyorsa büyüme için değerli.
- **Erişilebilirlik**: Çok sayıda özel renk kontrastı ve küçük font (`text-[9px]` vb.) var; kontrast/okunabilirlik açısından bir geçiş gerekebilir.

## 4. Gelir modeli / sürdürülebilirlik fikirleri

- **Steam API kota koruması bir iş modeli meselesi de olabilir**: Yoğun trafik olursa günlük 100k istek limiti aşılabilir. Ücretsiz kullanım + "Pro" katmanında geçmiş takip/trend grafikleri gibi bir freemium ayrımı düşünülebilir.
- **Reklamsız/destekleyici model**: Basit bir "Buy Me a Coffee" / Ko-fi linki; agresif reklam bu tarz araç sitelerinde kullanıcı deneyimini bozar, tercihen kaçınılmalı.

## 5. Teknik borç / dayanıklılık

- **Tip güvenliği**: `page.tsx` içinde `any` kullanımı yaygın (`p: any`, `d1: any` vb.). API response için ortak bir TypeScript tipi (`PlayerStats`, `PlayerData`) tanımlayıp hem route hem sayfa arasında paylaşmak, ileride yeni alan eklerken hata riskini azaltır.
- **Testler**: Şu an hiç test yok. En azından `route.ts` içindeki türetilmiş istatistik hesaplamaları (kd, hsPct, acc, dpr...) için birim testleri, API şeklinin bozulmasını erken yakalar.
- **Rakip yorumları**: `csstats.gg`, `leetify.com` gibi mevcut ürünlerin sunmadığı net bir "neden bizi kullanmalı" farkı (örn. "gerçek zamanlı 1v1 karşılaştırma + paylaşılabilir link" zaten güçlü bir konumlandırma) — pazarlama metninde/ana sayfada bu net şekilde vurgulanmalı.
