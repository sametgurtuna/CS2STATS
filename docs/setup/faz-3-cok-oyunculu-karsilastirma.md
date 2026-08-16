# Faz 3 — Çoklu Oyuncu Karşılaştırma + UX İyileştirmeleri: Kurulum Rehberi

Bu fazda **yeni bir hesap/env var gerekmiyor** — hepsi mevcut altyapı üzerine kod tarafında yapıldı. Aşağıdakiler kurulum değil, "ne değişti ve nasıl deneyeceksin" rehberi.

## Ne değişti

1. **2'den fazla oyuncu karşılaştırma** (en fazla 4): Ana sayfada artık "Oyuncu Ekle" butonuyla 3. ve 4. oyuncu eklenebiliyor, her kartın yanındaki X ile kaldırılabiliyor (en az 2 oyuncu kalmak zorunda).
2. **URL şeması değişti**: eskiden `?player1=x&player2=y`, şimdi `?players=x,y,z`. **Eski linkler hâlâ çalışıyor** (geriye dönük uyumluluk kodlandı ve test edildi) — sadece yeni paylaşımlar yeni formatta üretiliyor.
3. **Kısmi yükleme**: her oyuncu artık bağımsız fetch ediliyor; biri yavaş/hatalıysa diğerleri beklemeden görünüyor.
4. **Ağırlıklı "Kazanma Olasılığı"**: eski "kim daha çok kategoride önde" sayımının yerini `lib/stats.ts`'teki `computeWinProbability` aldı — K/D ve Win Rate'e daha yüksek ağırlık verilmiş, normalize edilmiş bir kompozit skor (`%` toplamı 100).
5. **Son Aramalar**: tarayıcının localStorage'ında (cihaz bazlı, sunucuya gitmiyor) son 8 karşılaştırma tutuluyor, ana sayfada (boş ekranda) tıklanabilir chip'ler olarak çıkıyor.
6. **PNG olarak indirme**: sonuç ekranının sağ üstünde "EXPORT PNG" — tüm dashboard'ı `html-to-image` ile PNG'ye çevirip indiriyor.
7. **TR/EN dil değiştirme**: sağ üstteki dil butonuyla değiştirilebiliyor, seçim localStorage'da kalıcı, ilk açılışta tarayıcı diline göre otomatik seçiliyor (next-intl gibi ağır bir framework yerine basit bir dictionary kullanıldı — bkz. `lib/i18n/`).
8. **Component split**: `app/page.tsx` tek dosyaydı, artık `app/components/*.tsx` altında ~12 parçaya bölündü (PlayerCard, StatRow, RadarSection, WinProbability, WeaponPie, MapWinRates, ClutchAwpSection, SkinsSection, SearchForm, RecentSearchesList, Dashboard, Ring, StatBox). Bu arada Faz 1'den kalan 5 pre-existing lint sorunu da (PieSection'ın render içinde tanımlanması) bu bölünme sırasında düzeldi.
9. **Erişilebilirlik**: `prefers-reduced-motion` sistem ayarı açıksa tüm animasyonlar/geçişler kapanıyor; `:focus-visible` için görünür outline eklendi; ikon-only butonlara (kaldır, dil değiştir, export, profil linki) `aria-label` eklendi.

## Nasıl deneyeceksin

```bash
npm run dev
```

- Ana sayfada iki oyuncu gir, **Oyuncu Ekle**'ye bas, 3. (istersen 4.) oyuncuyu da gir, ANALİZ ET'e bas — dashboard'ın her bölümü (ring'ler, radar, kazanma olasılığı, silah/harita, skinler) otomatik N oyuncuya göre genişliyor.
- Sonuç ekranında sağ üstteki **PNG İndir**'e bas — indirilen dosyayı aç, dashboard'ın tamamının görüntüsü olmalı.
- Sağ üstteki dil butonuna (EN/TR) bas — tüm arayüz metni (başlıklar, buton yazıları, hata mesajları) değişmeli. Sayfayı yenile — seçim kalıcı olmalı.
- Bir karşılaştırma yaptıktan sonra ana sayfaya dön (logoya tıkla) — "Son Karşılaştırmalar" altında az önceki karşılaştırma bir chip olarak görünmeli, tıklayınca formu dolduruyor.
- Eski link formatını dene: `http://localhost:3000/?player1=gaben&player2=gaben` — hâlâ çalışmalı (yeni format: `?players=gaben,gaben`).
- İşletim sisteminde "Reduce Motion"/"Hareketi Azalt" ayarını açık dene — animasyonlar durmalı ama içerik kaybolmamalı.

## Bilinen kapsam sınırları (bilerek ertelendi)

- Dil desteği ana karşılaştırma sayfasının (`/`) arayüz metnini kapsıyor; Faz 2'nin tekil oyuncu sayfası (`/player/[steamid]`) henüz çevrilmedi (İngilizce sabit kaldı) — bir sonraki i18n turunda eklenebilir.
- PNG export sadece karşılaştırma dashboard'ında var, tekil oyuncu sayfasında yok.
- Maksimum 4 oyuncu ile sınırlı (`lib/colors.ts`'teki `MAX_PLAYERS`) — palet ve grid düzenleri bu sayı için tasarlandı, artırmak istersen önce yeni renkler eklemen ve grid class'larını gözden geçirmen gerekir.

---

✅ `npm run test` (26/26), `npx tsc --noEmit`, `npm run lint` (0 sorun), `npm run build` hepsi temiz.
