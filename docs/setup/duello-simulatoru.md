# 1v1 Düello Simülatörü: Kullanım Rehberi

Yeni özellik (roadmap dışı, senin isteğin üzerine eklendi). **Ekstra kurulum/env var gerekmiyor.**

## Ne yapıyor

İki oyuncuyu karşılaştırdıktan sonra dashboard'un en üstünde **"DÜELLO SİMÜLATÖRÜ"** butonu çıkıyor. Tıklayınca açılan popup'ta:

- **Harita** seç (Dust II, Mirage, Inferno, Nuke, Ancient, Anubis, Overpass, Train)
- **Bölge** seç (A Site / B Site / Mid — haritaya göre değişiyor)
- Her oyuncu için **T/CT tarafı** (birine tıklayınca diğeri otomatik karşı tarafa geçiyor — bu bir 1v1 düello, ikisi aynı takımda olamaz)
- Her oyuncu için **silah** (AK-47, M4, AWP, Scout, Deagle, Galil/FAMAS, MP9/MAC-10, P90, tabanca)

Sonuç anında güncelleniyor: kazanma yüzdeleri, muhtemel kazanan, ve sonucu neyin belirlediğini gösteren 3 faktör barı (Nişan & İstikrar / Silah Eşleşmesi / Konum & Taraf).

Solda seçilen haritanın **şematik görseli** var: seçili bölge turuncu vurgulanıyor, iki oyuncu kendi spawn'larından o bölgeye doğru ilerlerken gösteriliyor, diğer bölgeler soluk şekilde bağlam için duruyor.

## Model nasıl çalışıyor (ve ne DEĞİL)

Simülasyon 3 girdiyi çarpıyor:

1. **Nişan puanı** — oyuncunun *gerçek* Steam istatistiklerinden (K/D, headshot %, isabet, ADR). Ağırlık K/D ve headshot'a kaydırılmış çünkü "birebir düelloda ne kadar iyi" sorusuna en çok bunlar cevap veriyor.
2. **Silah puanı** — silahın seçilen bölgenin mesafesindeki (yakın/orta/uzun) etkinliği × öldürücülüğü. AWP uzun mesafede çok güçlü, yakında zayıf; MP9 tam tersi. Headshot'çu bir oyuncu Deagle/AK ile AWP'den daha fazla verim alıyor (`hsLeverage`).
3. **Konum puanı** — bölgenin temel CT avantajı (açı tutan taraf genelde avantajlı) × oyuncunun o haritadaki *gerçek* Steam kazanma oranı. Haritayı hiç oynamamışsa nötr (%50) sayılıyor.

⚠️ **Bu bir sezgisel eğlence modeli, gerçek bir motor simülasyonu değil.** Silah ve bölge katsayıları elle ayarlanmış tasarım tercihleri — ölçülmüş değerler değil. Modalın altında bu uyarı kullanıcıya da gösteriliyor. Çıktıyı "kesin tahmin" diye sunmamak lazım.

Model tamamen **deterministik** (rastgelelik yok) — aynı seçimler her zaman aynı sonucu verir, böylece biri ekran görüntüsü paylaştığında başkası aynı sonucu görebilir.

## Nasıl test edersin

```bash
npm run dev
```

**Önemli:** Buton sadece **iki oyuncunun da Steam istatistikleri herkese açıksa** görünür (dashboard zaten sadece o durumda render oluyor). Geliştirirken elimdeki örnek hesapların hepsi gizli profildi, bu yüzden modalı uçtan uca ancak sen kendi hesabınla test edebilirsin:

1. Ana sayfada kendi Steam ID'ni ve istatistikleri açık bir arkadaşınınkini gir, ANALİZ ET.
2. Dashboard'un en üstündeki "DÜELLO SİMÜLATÖRÜ" butonuna bas.
3. Harita/bölge/taraf/silah değiştirdikçe sağdaki yüzdelerin ve soldaki şemanın anlık değiştiğini gör.
4. `Esc` tuşu veya X ile kapan.

Steam'de istatistiklerin görünmesi için: Steam profili → Düzenle → Gizlilik Ayarları → **Oyun Detayları: Herkese Açık**.

## Bilinen sınırlar

- Sadece **2 oyuncu** karşılaştırmasında çıkıyor. 3-4 oyuncu karşılaştırırsan buton görünmüyor, çünkü hangi ikilinin düello yapacağını seçtirmek ayrı bir UI gerektirir.
- Harita görseli **gerçek radar değil**, soyut bir şema — gerçek radar görselleri Valve'ın asset'lerini projeye gömmeyi gerektirirdi.
- Silah listesi temsili (9 silah), CS2'deki tüm silahları kapsamıyor.

---

✅ Simülasyon motoru (`lib/duel.ts`) için **16 birim testi** yazıldı ve geçiyor (toplam 42 test): eşit oyuncularda %50/%50, güçlü oyuncunun kazanması, CT avantajlı bölgede CT'nin öne geçmesi, AWP'nin uzun mesafede/MP9'un yakında öne geçmesi, harita kazanma oranının tiebreaker olması, determinizm. `npx tsc --noEmit`, `npm run lint` (0 sorun), `npm run build` hepsi temiz.
