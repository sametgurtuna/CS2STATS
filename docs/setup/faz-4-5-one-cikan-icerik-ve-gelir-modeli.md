# Faz 4 + Faz 5 — Öne Çıkan İçerik & Gelir Modeli: Kurulum Rehberi

Bu ikisi küçük kapsamlı olduğu için birlikte yapıldı. Faz 4'ün kod tarafı ekstra kurulum gerektirmiyor ama **bir veri girmen lazım**; Faz 5 tamamen opsiyonel bir env var'a bağlı.

## Faz 4 — Öne Çıkan Karşılaştırmalar

### ⚠️ Neden boş geldi

Plan, ana sayfanın boş halinde tanınmış pro oyuncuların (`s1mple`, `ZywOo` gibi) karşılaştırmasını "öne çıkan" olarak göstermeyi öngörüyordu. Bunu yazarken **gerçek Steam API'ye karşı canlı test ettim** — hafızamdan tahmin ettiğim vanity isimlerin çoğu (`s1mple`, `zywoo`, `niko`, `device`, `donk`, `sh1ro`, `electronic`, `ropz`) **tamamen alakasız, rastgele Steam hesaplarına** çözümlendi (örn. `s1mple` → "plastic" adında biri, `niko` → "Drakk" adında biri). Yani bunları koda gömseydim, ünlü bir oyuncunun ismiyle etiketlenmiş ekranda rastgele bir yabancının verisi görünürdü — hem yanlış hem de o kişi için ufak bir gizlilik sorunu.

Bu yüzden `lib/featuredPlayers.ts` **bilerek boş bir liste** ile geldi (`FEATURED_COMPARISONS = []`), ilgili bölüm (`FeaturedComparisons` component'i) liste boşken hiç render olmuyor — ana sayfada şu an bir şey eksik görünmüyor, sadece o bölüm yok.

### Nasıl doldurursun

`lib/featuredPlayers.ts` dosyasını aç, doğruladığın (kendi hesabın, arkadaşların, ya da profilini açıp gerçekten o kişi olduğunu gördüğün pro oyuncular) SteamID64/vanity çiftlerini ekle:

```ts
export const FEATURED_COMPARISONS: FeaturedComparison[] = [
  { id: "example", players: ["76561197960287930", "76561197960287931"], label: "Player A vs Player B" },
];
```

Doğrulama yöntemi: her ismi kendi uygulamanla test et (`npm run dev` açıkken):

```bash
curl -X POST http://localhost:3000/api/steam -H "Content-Type: application/json" -d '{"player":"vanity_adi"}'
```

Dönen `player.name` beklediğin kişiyle eşleşmiyorsa o vanity yanlış — SteamID64'ü doğrudan kullan (profilin URL'inden veya [steamid.io](https://steamid.io) gibi bir araçtan alabilirsin).

### Hero metni

`hero.subtitle` metni (ana başlığın altındaki açıklama) "gerçek zamanlı" ve "tek linkle paylaşım" farkını vurgulayacak şekilde güncellendi — `lib/i18n/messages.ts` içinde, TR/EN ikisi de değişti. Ekstra kurulum gerekmiyor.

## Faz 5 — Gelir Modeli (Ko-fi + Pro placeholder)

### Ko-fi / Buy Me a Coffee butonu

1. https://ko-fi.com (veya buymeacoffee.com) üzerinden bir hesap aç.
2. Profil linkini kopyala (örn. `https://ko-fi.com/kullaniciadin`).
3. `.env.local`'e ekle:
   ```bash
   NEXT_PUBLIC_KOFI_URL=https://ko-fi.com/kullaniciadin
   ```
4. `npm run dev` ile aç — header'da (hem ana sayfa hem `/player/...` sayfası) artık bir **"Support"/"Destek Ol"** butonu görünecek. Bu değişken boşken buton tamamen gizli kalıyor (ölü link göstermek yerine).

Vercel'e deploy ederken aynı değeri **Settings > Environment Variables**'a da eklemen gerekiyor. `NEXT_PUBLIC_` prefix'i olduğu için build-time'da tarayıcıya gömülüyor — gizli bir değer değil, herkese açık bir link, sorun değil.

### "PRO" rozeti — gerçek bir kısıtlama DEĞİL

Header'daki amber renkli **PRO** rozetine tıklayınca planlanan Pro özelliklerini (tam trend geçmişi, sınırsız oyuncu takibi, rate limit yok) listeleyen bir kutu açılıyor + Ko-fi linkine yönlendiriyor. **Bunun arkasında gerçek bir yetkilendirme/ödeme sistemi yok** — roadmap'te bilerek böyle bırakıldı çünkü gerçek freemium ayrımı auth (kim giriş yapmış, kim ödemiş) gerektiriyor ve bu proje şu an authsuz. Bu rozet sadece "bu geliyor, destek olursan hızlanır" mesajı veriyor.

### Tek gerçek kısıtlama: 7 günlük trend geçmişi

`/player/[steamid]` sayfasındaki trend grafiği artık **herkes için** son 7 güne kısıtlandı (önceden DB'de biriken tüm geçmişi gösteriyordu). 7 günden fazla veri varsa grafiğin altında "Son 7 gün gösteriliyor" notu çıkıyor. Bu, gerçek bir Pro/Free ayrımını simüle ediyor ama şu an **herkes free tier'da** — gerçek bir Pro kullanıcı sınıfı olmadığı için tam geçmişi açacak bir mekanizma yok. Bu, ileride auth eklenince (Faz 5'in "ayrı bir karar" olarak bıraktığı kısım) `player_snapshots` sorgusundaki `.slice(-7)`'nin kullanıcının planına göre koşullu hale getirilmesiyle tamamlanacak.

---

✅ `npm run test` (26/26), `npx tsc --noEmit`, `npm run lint` (0 sorun), `npm run build` hepsi temiz. Ana sayfa ve `/player/[steamid]` üzerinde PRO rozeti, hero metni, ve Ko-fi butonunun (env var set edilmeden) gizli kaldığı canlı test edildi.
