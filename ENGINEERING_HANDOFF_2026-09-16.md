# ENGINEERING HANDOFF — 2026-09-16

**Repo:** `kaaradumaann-psi/Repo123` (MMPI-566 optik cevap formu tarayıcı)
**Branch:** `arena/01a0a9d7-repo123` (baz commit `06425c8`)
**Amaç:** Bu dosya, 2026-09-16 oturumunun mühendislik durumunu eksiksiz ve dürüstçe özetler; yarın başka bir mühendis buradan devam edebilsin. "Çözüldü" yazılan her şey bu oturumda doğrulanmıştır; doğrulanmamış olanlar açıkça işaretlidir.

---

## 1. Projenin amacı ve mevcut genel durum

Proje, MMPI-566 optik cevap formunun (566 madde, 4 sayfa, sayfa başına 144 madde, D/Y balonları) tarayıcıda yüklendiği telefon fotoğrafı / PDF görüntülerinden yanıtı okuyan bir OMR hattı: `analyzePage()` → sayfa izolasyonu → QR kimlik okuma → 4× 5mm hizalama karesi tespiti → perspektif warp (kanonik 8 px/mm) → balon halka röfinesi → madde madde karar (`reliable/single/multiple/blank/ambiguous/invalid`).

**Mevcut durum (bu oturum sonunda, doğrulanmış):**

- Önceki oturumun kod değişiklikleri bu oturumun başında ağaçta **değildi** (hiç commit edilmemişti). `Örnek Telefon Görüntüleri/son yapılanlar - yapılması gerekenler.md` (önceki oturumun tam logu) referansıyla **yeniden uygulandı** ve önceki oturumun son durumu birebir tekrarlandı (test + 11 foto karşılaştırması).
- 11 gerçek telefon fotoğrafından **9'u uçtan uca okunuyor** (1a, 2a, 3a, 4a, 7a, c1, c2, c3, c4).
- **5a**: QR okunamıyor — fotoğraf kalitesi (hareket bulanıklığı/ghosting); yeniden çekme mesajı doğru davranış. Kod sorunu değil.
- **6a**: hâlâ `ALIGNMENT_MISSING` — yalnız sol alt hizalama karesi. **Açık problem.**
- **c1–c4**: hâlâ 22–29 ambiguous/madde var (başlangıçta 70–83 idi). Kök neden bulundu, kalıcı düzeltme **yapılmadı**. **Açık problem.**
- **Not:** Kullanıcının "önce 123.md dosyasına göre devam et" dediği `123.md` dosyası çalışma alanında **yok** (tüm dosya sistemi tarandı). İş, önceki oturum log dosyasından yürütüldü. Yarın, 123.md'nin içeriğinin farklı bir yön verip vermediği kullanıcıdan sorulmalı.

## 2. Başlangıçtaki ana problem

Kullanıcı şikâyeti (Türkçe): *"Arkadaki çizgilerle çakışıyor; mesela düz çizgi varsa belirsiz diyor"* — telefon fotoğraflarında 'belirsiz' (ambiguous) seli. Başlangıç hattında (bu değişiklikler olmadan) 11 foto sonucuydu:

- 1a: 26, 2a: 43, 4a: 43, 7a: 37, c1: 70, c2: 74, c3: 83, c4: 77 ambiguous
- 3a, 5a: `QR_UNREADABLE` (3a landscape saklı fotoğraf — dönüştürülmeksizin QR bulunamadı)
- 6a: `ALIGNMENT_MISSING`

Kabul kriteri: Örnek Telefon Görüntüleri'ndeki 11 fotoğraf, tarayıcının beslediği şekilde (uzun kenar 2800'e sabit, RGBA) gerçek hat üzerinden uçtan uca işlenebilmeli. 5a'nın yeniden çekme mesajıyla kalması kabul edilebilir (doğru çekim değil). Tamamlayınca **doğrudan PR açılacak**.

## 3. Şimdiye kadar yapılan değişiklikler

Aşağıdakilerin tümü bu oturumda yeniden uygulandı ve ağaçta mevcut (`git status` ile doğrulandı).

| Dosya | Değişiklik | Nedeni |
|---|---|---|
| `src/omr/orientation.ts` **(yeni)** | `rotateGray90` (0–3 saat yönü çeyrek dönüş), `quarterTurnsToUpright` (QR köşe sırasından dik konuma gereken dönüş), `unrotatePoint` | Telefonlar sayfayı 90°/180° döndürülü saklıyor (EXIF 1 — piksel gerçekten döndü). Aşağıdaki tüm aşamalar dik pozisyonun küçük sapmaları için yazılmış. |
| `src/omr/analyzePage.ts` | (a) Pipeline başında yön normalizasyonu: 0–3 dönüşlerde QR decode denemesi → `quarterTurnsToUpright` ile dik konuma çevirme → yeniden izole + decode. (b) `detectAlignmentMarks`'a salvage köşeleri (`{mm: qr.innerCorners, px: decoded.corners}`). (c) Sıra değişti: halka röfinesi **kaliteden önce**; `assessImageQuality` artık röfine merkezleri alıyor | 3a/4a/7a decode sorunu; 6a köşe kurtarma; kalite outline kontrolünün gerçek halka konumunda yapılması |
| `src/omr/perspectiveCorrection.ts` | `fitHomographyLeastSquares` eklendi (N≥4, normalize DLT, 8×8 normal denklemler). **Yalnız tahmin için** (salvage); sayfa dönüşü hâlâ 4 tespit merkeziyle 4 nokta fit | 3 kare bulunduğunda dördüncüyü doğru tahmin etmek için projektif yeniden fit |
| `src/omr/alignmentDetector.ts` | (a) Arama yarıçapı `scale*(8+d*0.09)` → `scale*(8+d*0.22)` (üst sınır 500px). (b) `detectAlignmentMarks` iki geçişli: ilk geçiş (QR homography + similarity tahminleri) başarısız kareler varsa, bulunan kareler + QR köşeleriyle en-küçük-kare projektif refit ve eksik kareler için **salvage** geçişi. Sonuç, tanım sırasına göre döner | Güçlü perspektifte QR tek başına uzak köşeyi yüzlerce px yanlış tahmin eder (6a: homography sol altı görüntü dışına -574,3572 taşır) |
| `src/omr/bubbleRingRefinement.ts` | İki aşamalı balon merkez röfinesi: **Aşama 1** — 1.6mm diskte öteleme araması (aday halka merkezleri 0.25/0.5/0.75/1/1.3/1.6mm halkalarda; 24 sektör × 1.2–2.05mm radyal bantta argmax; sektör, karanlık≥0.28 ve \|r−1.60\|≤0.30 ise "hit"; skor = **dairesel tamamlık**, karanlık değil). **Aşama 2** — bulunan merkez çevresinde (1.05–2.05mm annulus) r(θ)=R+dx·cosθ+dy·sinθ için Huber IRLS (arama kazananından başlatılır, sapma 0.35mm ile sınırlandırılır). Kapılar: yarıçap ±0.32mm, RMS ≤0.28mm, tamamlık ≥%60, nominden iyileşme. `maxOffsetMm` 0.55→**1.6**, `maxResidualMm` 0.18→**0.28** | Bükük kâğıtta planar homography'nin lokal ~1mm'lik hataları basılı halkeyi ölçüm pencerelerine sokuyordu; her balon kendi basılı halkasına oturtuluyor (OMRChecker `auto_align` felsefesi, balon granülaritesinde) |
| `src/omr/imageQuality.ts` | `assessImageQuality` opsiyonel `centreOffsets` parametresi; outline/kontrast kontrolleri röfine merkezlerde | Bükük fotoğraflarda "halka eksik/hasarlı" uyarısının gerçeği yansıtması |
| `scripts/` (diagnostik, test değil) | `run-photos.mts` (11 fotoyu tarayıcı beslemesine birebir koşan harness), `dump-items.mts` (madde-madde kanıtlar + balon balon fit durumu), `dump-crops.mts` (foto & normalize kırpma), `probe2.mts` (ham piksel ızgarası), `probe3.mts` (doğru eşli istatistik), `probe-offsets.mts` (geniş arama tanısı + overlay), `dbg-span.mts` (mm→foto px eşleme) | Aşağıdaki bulguların tümü bunlarla üretildi |

> ⚠️ `scripts/probe.mts` **arızi/ölü** kod: `stats()` fonksiyonu Kartezyen çarpım yapar (disk yerine ızgara ortalama). Yerini `probe3.mts` / `probe2.mts` aldı. Yarın `probe.mts` çıktısına güvenmeyin.

## 4. Önemli teknik bulgular

1. **"Düz çizgi" şikâyetinin kökü çizgi DEĞİL.** Ayraç çizgileri satırlar arası boşlukta, balon kenarına 0.375mm — geometrik olarak ölçüm pencerelerine (merkez 0.9mm, çevre 0.9–1.15mm) giremez. Gerçek mekanizma: planar homography'nin bükük kâğıtta kalan **lokal hata** basılı halkeyi merkezden uzaklaştırıyor; halka yayı merkez diskine giriyor → boş balon `cd≈0.22, cc≈0.28` okunuyor → iki seçenek de kanıt veriyor → `ambiguous`. (Piksel probuyla doğrulandı: temiz satırlar `disc0.9≈255`, kötü bantta `≈192–199`; 1.6mm halka "koyu piksel fraksiyonu" temiz satırda 0.32–0.41, kötü bantta 0.12–0.24.)
2. **c4'te kötü bantta gerçek halka kayması ~1.7–2.0mm.** Geniş arama tanısı (`probe-offsets.mts`, 2.2mm bütçe): dx≈−0.6…−0.95, dy≈+1.1…+2.0mm; tamamım %71–83 (kaba ızgara — değerler ±0.4mm kuantizasyonlu); şiddet satırlar aşağı indikçe azalıyor (2.02 → 1.13). Bandın hemen üstü (madde 96) küçük ve **farklı yönlü** kayma (0.40, −0.24). Yorum: bükülme/kırışık olasılığında; blok düzeyi basım kayması tam uymuyor (yön değişiyor). Kesin fiziksel neden **belirsiz** — yarın foto üzerinde teyit edilmeli.
3. **Fotoğraflarda halkalar sağlam ve yuvarlak** (c4 kötü bant bölgesi hem foto hem normalize kırpmasıyla görsel olarak doğrulandı). Sorun basım kayması ya da warp hatası — ikisi de geometrik; hangisi olduğu henüz ayırt edilemedi.
4. **c4'te etkilenen bantta kâğıt zemini ≈200–215 gri** (dengesiz ışık; temiz satırlarda bile `disc2.4≈200–215`). Referans seviye lokal olduğu için ambiguity'nin doğrudan nedeni değil, ama eşik işlerinde önemli.
5. **jsQR 90° döndürülmüş QR'ı da çözebiliyor**; QR köşe sıralaması (symbol kendi çerçevesinde) yönü veriyor → `quarterTurnsToUpright` mekanizması doğru ve yeterli (3a/4a/7a kanıtı).
6. **5a'nın QR'ı fiziksel olarak okunamaz:** hareket bulanıklığı ghosting modül ızgarasını çift pozluyor. (Önceki oturumda: binarizasyon t=100/130/160, adaptif box-mean r=4/8, 4 dönüş — tümü başarısız.)
7. **6a landscape saklanması bir hata DEĞİL:** 3a–7a'nın tümü landscape saklı (EXIF 1). Pipeline'ın yapması gereken budur ve artık yapıyor. 6a'nın yönü normalizasyon sonrası dik (1507×2550); QR ve 4 karenin 3'ü bulunuyor; **yalnız sol alt kare** eksik.

## 5. Çözülen sorunlar

- **3a, 4a, 7a (landscape fotoğraflar):** `QR_UNREADABLE` → tamamen okunuyor (3a: reliable 17 + single 4 + multiple 2 + blank 120 + 1 gerçek silik madde; 4a ve 7a benzeri; warnings=0).
- **1a/2a "belirsiz" seli:** 26/43 ambiguous → **0**; 3a/4a/7a'da 37–43 → **1** (kalan 1 = madde 90'daki gerçekten silik işaret — önceki oturumda görsel olarak doğrulandı; hatalı okuma değil).
- **9/11 fotoğraf uçtan uca okunuyor.** Önceki oturumun son durumu bu oturumda birebir tekrarlandı (regresyon yok).
- Halka röfinesi + yön normalizasyonu + salvage mekanizmaları ağaçta ve test altında (35/35 OMR testi geçiyor).

## 6. Kısmen çözülen sorunlar

- **C-serisi ambiguity (22–29):** Kök neden doğrulandı (1.6mm arama bütçesini aşan lokal kayma); 70–83 → 22–29'a indi ancak sıfırlanmadı. Kalıcı düzeltme tasarımı yapılmadı (bkz. §9, §11).
- **6a sol alt kare:** Salvage mekanizması kuruldu ve çalışıyor (refit geçişi koşuyor), pencere artık kareyi kapsıyor; ama aday, boyut/squareFill/instability filtrelerinde reddediliyor. Nedeni ölçülmedi (kullanıcının talimatıyla önce veri raporu — bkz. §10).

## 7. Hâlâ devam eden sorunlar

1. C-serisi 22–29 ambiguous (kullanıcının ana şikâyetinin artığı).
2. 6a sol alt hizalama karesi → `ALIGNMENT_MISSING`.
3. **Tam test paketi ve build bu oturumda çalıştırılmadı** (yalnız OMR alt kümesi + tsc). PR öncesinde şart.
4. PR açılmadı (kullanıcı talimatı: tamamlayınca direkt aç).
5. `123.md` dosyası çalışma alanında yok — içeriği kullanıcıdan alınmalı.

## 8. Son test sonuçları (bu oturumda doğrulandı)

- `npx tsc --noEmit` → **temiz**.
- OMR alt kümesi: `npx tsx --test tests/bubbleRing.test.ts tests/omrEngine.test.ts tests/handheldBleed.test.ts tests/omrPeripheralIsolation.test.ts tests/omrSafety.test.ts` → **# pass 35 / # fail 0**.
- **Gerçek telefon görüntüleriyle sonuç** (`npx tsx scripts/run-photos.mts`; tam liste `run-photos.mts` çıktısında):

| Foto | Sonuç |
|---|---|
| 1a | sayfa 2: blank 130, multiple 3, single 4, reliable 7 — warnings 0 |
| 2a | sayfa 2: blank 130, multiple 3, single 4, reliable 7 — warnings 0 |
| 3a | sayfa 1: reliable 17, single 4, blank 120, multiple 2, ambiguous 1 — warnings 0 |
| 4a | sayfa 1: reliable 12, single 9, blank 120, multiple 2, ambiguous 1 — warnings 0 |
| 5a | **FAIL QR_UNREADABLE** (fotoğraf kalitesi; doğrulandı) |
| 6a | **FAIL ALIGNMENT_MISSING** — yalnız sol alt kare |
| 7a | sayfa 1: single 21, blank 120, multiple 2, ambiguous 1 — warnings 1 |
| c1 | sayfa 1: single 17, blank 97, multiple 3, **ambiguous 27** — warnings 2 |
| c2 | sayfa 1: single 16, blank 95, multiple 4, **ambiguous 29** — warnings 2 |
| c3 | sayfa 1: single 17, blank 99, multiple 3, **ambiguous 25** — warnings 2 |
| c4 | sayfa 1: single 18, blank 101, multiple 3, **ambiguous 22** — warnings 2 |

- Çalıştırılmayan: tüm `tests/*.test.ts` paketi (19 dosya), `npm run build`.

## 9. C-serisi ambiguity problemi (C-serisi ile 6a AYRI problemlerdir)

- **Ambiguous maddeler (c4):** 50, 51, 52, 90, 98–115. Etkilenen bantlar: blok 2'nin 49–52. satırları (Y sütunu) ve blok 3'ün 97–115. satırları (D+Y). c1/c2/c3'ün madde listeleri dump edilmedi (sadece c4 tanımlandı — yarın aynı `dump-items.mts` komutuyla alınımalı).
- **c4 fit istatistikleri (288 alan):** 240 ok / 31 "halka bulunamadı" (arama tamamlığı <%70) / 12 "kayma çok büyük" (>1.6mm) / 5 "kayma çok küçük".
- **Mekanizma:** Bantta gerçek halka nominal merkezden ~1.7–2.0mm uzaktayken arama bütçesi 1.6mm → fit nominalde kalıyor → halka yayı merkez diskini kesiyor → iki seçenekte de merkez+çevre kanıtı → ambiguous.
- **Doğrulanmamış hipotez:** Bantta ~2mm'lik warp hatasının kaynağı (kâğıt bükülmesi vs blok basım kayması) belirsiz — §4.2'deki yön değişimi basit blok kaymasını zayıflatıyor ama kesin değil.
- **Güvenlik notu (yarın dikkatli ol):** satır aralığı 4.25mm → yarım aralık **2.125mm**. Kalıcı düzeltmede arama bütçesi ~2.0–2.1mm'yi aşarsa komşu satır halkasına yapışma riski doğar; 2.2mm'lik geniş tanısı tam bu yüzden kalıcı değere doğrudan alınamaz — ya daha sıkı tamamlık (örn. ≥%85) ya daha ince ızgara gerekir.
- **Denenmemiş alternatif:** Sayfa dönüşünü 4 kare yerine 4 kare + 4 QR köşesiyle `fitHomographyLeastSquares` ile sarmak (lokal hatayı küçültme hipotezi). Risk: `evaluateQrConsistency` kontrolüyle etkileşimi — test edilmeden uygulanmamalı.
- **c1–c4'teki warnings=2:** hangisinin (kontrast vs "halka eksik") kaldığı röfine merkezlerden sonra yeniden ölçülmedi.

## 10. 6a alignment problemi ve landscape durumu

- **6a bilinçli olarak landscape çekilmiştir** (sayfa tepe kenarı sol tarafta; saklanan boyut 2550×1507; EXIF orientation 1). **Bu kendinde bir hata olarak değerlendirilmez** — 3a–7a'nın tamamı landscape saklı ve pipeline bunları normalleştirmekle yükümlü; 3a/4a/7a bunu doğruladı. 6a'da asıl problem **orientation normalization + sol alt hizalama karesi tespiti** zincirinin son halkasıdır.
- **Yön durumu (doğrulandı):** 6a'da QR, `rotateGray90(gray, 1)` (1 saat yönü) sonrasında decode oluyor; dik görüntü 1507×2550. Bu oturumda uçtan uca aynı durum üretildi: 6a `ALIGNMENT_MISSING` ile duruyor, yani QR + 3 kare (sol üst, sağ üst, sağ alt) sorunsuz.
- **Öngörüler (önceki oturum ölçümleri, bu oturumda aynı hata metinleri tekrarlandı):** homography → sol alt (−574, 3572) = görüntü dışında; similarity → (9, 2133); karenin gerçek konumu ≈ (110–125, 2350–2385) (piksel probu: ~24×36px koyu blob, değerler 14–51, çevre 255). → similarity hatası ≈257px; yeni yarıçap (~400px) kareyi kapsıyor ama **aday filtrelerde reddediliyor**.
- **Güncel ret nedenleri (bu oturumun çalıştırmasından):** similarity: "36 aday boyut veya dolgunluk ölçütünü geçmedi; 130 aday gölgeye veya çizgiye bağlıydı" · salvage: "20 aday boyut veya dolgunluk ölçütünü geçmedi; 114 aday gölgeye veya çizgiye bağlıydı".
- **Hipotez (enstrümanla doğrulanmadı):** anizotropik perspektif kareyi 24w×36h yapmış → squareFill ≈0.81 < 0.84 eşiği. Doğrulanmadı, varsayım.
- **Standart talimat (kullanıcı, hâlâ geçerli):** Ölçülmüş veri raporu üretilmeden **eşik değiştirilmeyecek, ek fallback eklenmeyecek**. Rapor şunları içermeli: orijinal boyut, orijinal yön, uygulanan dönüş, final dik boyut; sol alt bölgedeki gerçek koyu-kare adaylarının merkezleri, bbox'ları, boyutları, stabilite skorları; similarity ve salvage öngörülerine olan mesafeler; her adayın neden reddedildiği. Ayrıca landscape→dik koordinat dönüşümü **matematiksel olarak** (tahminle değil) doğrulanmalı.
- **6a'da tam olarak nerede kaldık:** Rapor başlanmadı. Bu oturumda `dbg-span.mts` (mm→foto px eşleme doğrulayıcısı) yazıldı ve **c4 üzerinde** doğrulandı (madde 97 D → foto (927,439); blok 3 D sütunu y 439→1515). 6a'ya uygulanması (rotateGray90'un `convert -rotate 90` ile eşlenmesi + aday sayımı) bir sonraki adımdır. `probe-offsets.mts`'nin c4 overlay çıktısı gösterimde **kanıtsız** (ince çizgiler küçültmede kayboldu; nokta kümesi toplanmış görünüyor) — bu görüntüye güvenmeyin, yazdırılan sayılara ve `dbg-span` eşlemesine bakın.

## 11. Sıradaki teknik adımlar (sıra önemli)

1. **6a — veri raporu** (kullanıcının zorunlu listesi, §10):
   a. Dönüşün matematiksel doğrulaması: `rotateGray90` vs ImageMagick `-rotate 90` (ikisi de saat yönü) küçük bir yama üzerinde birebir karşılaştırma; 2550×1507 → 1507×2550; dört görünür kare için saklanan→dik koordinat eşlemesinin formülle teyidi.
   b. Dik görüntünün sol alt bölgesinde çok-eşikli bileşen sayımı: her aday için merkez, bbox, boyut, eşikler arası stabilite, squareFill (en iyi yönde), margin mürekkebi; similarity (9,2133) ve **salvage refit öngörüsüne** (refit tahmin noktası enstrümanlanarak) mesafe.
   c. Sonra karar: squareFill/boyut eşiği vs gölge ayrıştırma vs yeniden çekme mesajının kabulü.
2. **C-serisi:**
   a. c1–c4 için kalan ambiguity'nin ne kadarının "bütçe aşıldı" (kayma çok büyük / halka bulunamadı) vs başka kanıt olduğunu `dump-items.mts` ile say.
   b. Güvenli bütçe tasarımı: ~2.0–2.1mm ya da 2.2mm + tamamlık ≥%85; sentetik testler (bubbleRing, handheldBleed) + 11 foto üzerinde doğrula.
   c. Opsiyonel: 4 kare + 4 QR köşesi ile sayfa dönüşü denemesi (§9 notu).
   d. Düzeltme sonrası kalan quality warnings'ını kontrol et.
3. **Tam test paketi + build:** `npx tsx --test tests/*.test.ts` (19 dosya) ve `npm run build`.
4. **PR** — kullanıcı talimatıyla tamamlanınca direkt açılacak.
5. Repo dokümantasyonu (`DOGRULAMA.md`, `MIMARI-ANALIZ.md`) yeni mekanizmaları (yön normalizasyonu, iki aşamalı röfiye, salvage) karşılaştırıldığında güncel tutulmalı — şu an eski.
6. Kullanıcıdan `123.md` dosyasını iste.

## 12. Bugün denenip başarısız olan / doğrulanmamış yaklaşımlar (gereksiz tekrarlanmasın)

- **5a:** binarizasyon (t=100/130/160) + adaptif box-mean (r=4, r=8) + 4 dönüş → okunamadı. QR ızgarası ghosting'de fiziksel olarak yok; tekrar denemeye değmez.
- **6a:** similarity arama penceresini büyütme (0.09→0.22) pencereyi kareye ulaştırıyor ama aday yine filtrelerde reddediliyor → **pencere büyütmek 6a'yı çözmez**; sorun filtre düzeyinde (squareFill/boyut/margin). Salvage refit de kuruldu; aynı retler.
- **C-serisi:** `maxResidualMm` 0.18→0.28 düşük çözünürlükteki halka RMS jitter'ı için **gerekliydi** (c4 fit'i 77→240 ok yaptı) ama kalan ambiguity RMS değil, **arama bütçesi** (1.6mm) — RMS'i daha da açmak fayda etmez (kalın annulus güvenliğine yaklaşılır).
- **2.2mm arama bütçesi** yarım satır aralığını (2.125mm) aşıyor — kalıcı değer olarak güvenlik analizi yapmadan kullanılmaz.
- `probe.mts` (Kartezyen çarpım istatistik bug'ı) → `probe3.mts`/`probe2.mts` kullan.
- `probe-offsets.mts` c4 overlay görüntüsü gösterimsel olarak kanıtsız; yazdırılan offset sayıları geçerli (±0.4mm ızgara kuantizasyonu).

## 13. Dosya haritası ve komutlar

- Fotoğraflar: `Örnek Telefon Görüntüleri/1a..7a.jpg, c1..c4.jpg`
- Önceki oturum tam logu: `Örnek Telefon Görüntüleri/son yapılanlar - yapılması gerekenler.md`
- Python referans (OMRChecker tarzı): `Örnek Telefon Görüntüleri/bu sistemden örnek alabilirsin referans olabilir/`
- Kesik/görsel çıktılar (git DIŞINDA): `/home/user/prev/*.png`
- Hızlı komutlar:
  - `npx tsx scripts/run-photos.mts` (11 foto, özet + anomali listesi)
  - `npx tsx scripts/dump-items.mts c4.jpg 1 999` (kanıtlar + fit durumu)
  - `npx tsx scripts/probe3.mts c4.jpg 97 100 115` (disk/halka istatistikleri)
  - `npx tsx scripts/probe-offsets.mts c4.jpg 97 104 117` (geniş arama tanısı)
  - `npx tsx scripts/dbg-span.mts` (mm→foto px eşleme doğrulaması)
  - `npx tsx --test tests/*.test.ts` ve `npm run build` (PR öncesi)

---

# OTURUM GÜNLÜĞÜ — 2026-09-16 (ikinci oturum)

> Bu bölüm aşağıya doğru büyür. Her adımda güncellenir ve commit edilir.
> Kural: yalnızca **ölçülmüş** olan "doğrulandı" yazılır; olmayan "hipotez"/"açık" kalır.

## A. Ortam ve devralma (ADIM 0) — DOĞRULANDI

**Repo durumu (ölçüldü):**

- Bu oturumun branch'i: `arena/01a0aa23-repo123`, taban commit `06425c8` (= `main`).
- Handoff'ın branch'i: `arena/01a0a9d7-repo123`, tek commit `46edee1`, `main`'in **doğrudan torunu**.
- `git log origin/main..origin/arena/01a0a9d7-repo123` → **tek commit, tek ebeveyn**. Yani önceki oturumun işi kayıp değil, tek commit'te duruyor ve `main`'den yalnızca bir fast-forward uzakta.
- Devralma: `git merge --ff-only arena/01a0a9d7-repo123` → **temiz fast-forward**, çakışma yok, kayıp yok. Ağaç şimdi `46edee1`.
- Devralınan diff (§3 tablosuyla birebir): 15 dosya, +1270/−85 (`src/omr/orientation.ts` yeni, `alignmentDetector`, `analyzePage`, `bubbleRingRefinement`, `imageQuality`, `perspectiveCorrection`, 8 diagnostik script, handoff).
- `node_modules` **yoktu** → `npm ci` ile kuruldu (74 paket, 0 zafiyet).
- 11 fotoğrafın tamamı ve `son yapılanlar - yapılması gerekenler.md` yerinde.

**§3 tablosunun bağımsız doğrulaması (bu oturumda):**

| §8'de iddia edilen | Bu oturumda ölçülen | Sonuç |
|---|---|---|
| `npx tsc --noEmit` temiz | çıkış kodu 0, hata yok | ✅ doğrulandı |
| 1a: blank 130, multiple 3, single 4, reliable 7, w=0 | **birebir aynı** | ✅ |
| 2a: blank 130, multiple 3, single 4, reliable 7, w=0 | **birebir aynı** | ✅ |
| 3a: reliable 17, single 4, blank 120, multiple 2, ambiguous 1, w=0 | **birebir aynı** | ✅ |
| 4a: reliable 12, single 9, blank 120, multiple 2, ambiguous 1, w=0 | **birebir aynı** | ✅ |
| 5a: FAIL `QR_UNREADABLE` | **birebir aynı** | ✅ |
| 6a: FAIL `ALIGNMENT_MISSING`, yalnız sol alt | **birebir aynı** | ✅ |
| 7a: single 21, blank 120, multiple 2, ambiguous 1, w=1 | **birebir aynı** | ✅ |
| c1: single 17, blank 97, multiple 3, ambiguous 27, w=2 | **birebir aynı** | ✅ |
| c2: single 16, blank 95, multiple 4, ambiguous 29, w=2 | **birebir aynı** | ✅ |
| c3: single 17, blank 99, multiple 3, ambiguous 25, w=2 | **birebir aynı** | ✅ |
| c4: single 18, blank 101, multiple 3, ambiguous 22, w=2 | **birebir aynı** | ✅ |

**Sonuç:** Önceki oturumun son durumu **birebir** tekrarlandı. Regresyon yok. Başlangıç çizgisi güvenilir; §8 tablosu referans alınabilir.

**6a'nın bu oturumdaki tam hata metni (kanıt):**
`ALIGNMENT_MISSING … Bulunamayan 1 kare var — sol alt kare: karenin bulunması gereken alan görüntünün dışında · 36 aday boyut veya dolgunluk ölçütünü geçmedi; 130 aday gölgeye veya çizgiye bağlıydı · 20 aday boyut veya dolgunluk ölçütünü geçmedi; 114 aday gölgeye veya çizgiye bağlıydı.`

→ İlk cümle similarity tahmininin (`(9,2133)`) pencere kenarını görüntü dışına taşırdığını, sonraki iki grup ise similarity + salvage refit geçişlerinin ret sayılarını gösterir. **Bu, §10'daki ret dağılımıyla birebir aynıdır** (36/130 ve 20/114).

## B. Durum özeti (bu oturumun başında)

| Konu | Durum |
|---|---|
| Önceki oturumun kodu | **doğrulandı** — fast-forward ile devralındı, çalışıyor |
| 9/11 foto uçtan uca | **doğrulandı** |
| 5a `QR_UNREADABLE` | **doğrulandı** — foto kalitesi, kod sorunu değil |
| 6a `ALIGNMENT_MISSING` | **açık** — veri raporu başlanmadı |
| C-serisi 22–29 ambiguous | **açık** — kök neden doğrulanmış, kalıcı düzeltme yok |
| Tam test paketi + build | **açık** — bu oturumda henüz koşulmadı |
| PR | **açık** |
| `123.md` | **açık** — çalışma alanında yok |

## C. 6a — VERİ RAPORU (kullanıcının zorunlu listesi, §10)

**Durum: TAMAMLANDI. Ölçüm yapıldı, kök neden kanıtlandı. Bu bölümde hiçbir eşik değiştirilmedi, hiçbir fallback eklenmedi.**
Ham çıktı: `6A-OLCUM-RAPORU.txt` (üretici: `scripts/report-6a.mts`, üretikten sonra hiçbir production modülü değiştirilmedi).

### C.1 Kullanıcının istediği alanlar

| İstenen | Ölçülen |
|---|---|
| **Orijinal boyut** | **2550×1507** (JPEG'in kendi boyutu; tarayıcı beslemesi de aynı, çünkü 2550 < `SCAN_LIMITS.longSide`=2800 → küçültme yok) |
| **Orientation** | `identify`: **EXIF Orientation = Undefined** (etiket yok) — piksel gerçekten landscape saklanmış. EXIF ile düzeltilemez; boru hattının çevirmesi şart. |
| **Uygulanan rotation** | `rotateGray90(gray, 1)` = **1 saat yönü çeyrek dönüş**. (QR, döndürülmemiş görüntüde de decode oluyor çünkü jsQR 90° döndürülmüş sembolü çözebiliyor; yön `quarterTurnsToUpright(corners)` ile bulunuyor: `turns=0`, `quarterTurnsToUpright=1`, `totalTurns=1`. `turns` = 0 ama sonuç dik — kullanıcı talimatındaki "6a bilinçli landscape, bu hata değil" ile tutarlı.) |
| **Final dik boyut** | **1507×2550** (`isolatePaper` origin 0,0 — kırpma yok) |

### C.2 Rotation koordinat dönüşümünün matematiksel doğrulaması — DOĞRULANDI

| Test | Sonuç |
|---|---|
| A1: `rotateGray90(1)` eşleme yasası | Destek (stored) `(xs,ys)` → dik `(xu, yu) = (H−1−ys, xs)`; **28/28 piksel** birebir, `7×4 → 4×7` |
| A2: `unrotatePoint` tersliği | Tüm 28 pikselde ileri yasanın tersini veriyor → **YES** |
| A3: Yön (siyah köşe probu) | `rotateGray90(1)` → `(1,0),(1,3)`; **ImageMagick `-rotate 90` → aynı**; `-transpose` → farklı (kontrol). İkisi de **saat yönü**. |
| A4: Gerçek 6a üzerinde birebir karşılaştırma (PGM, kayıpsız, renk profili yok) | 1507×2550 vs 1507×2550 → **farklı piksel 0, max |Δ| = 0 → BIT-EXACT** |
| A5: Diğer üç dönüş | 90° / 180° / 270° üçü de ImageMagick'e karşı **BIT-EXACT** |
| A6: `quarterTurnsToUpright` dört kardinal poz | +x→k=0, +y→k=3, −x→k=2, −y→k=1 → **hepsi doğru** |

> Not: ilk denemede A6 beklentilerim yanlıştı (+y için k=1 sanmıştım); doğrusu **k=3**'tür çünkü bir saat yönü dönüş y-down koordinatta vektör açısına **+90° ekler**. Hata testteydi, kodda değil; düzeltildi ve doğrulandı.
> Not: ilk karşılaştırma PNG üzerinden yapıldığında 172 594 piksel fark çıktı; sebebi ImageMagick'in renk yönetimi round-trip'i. PGM (ham 8-bit) ile karşılaştırıldığında fark **0**.

### C.3 Sol-alt aday census'u (production'ın gördüğüyle birebir)

**Enstrüman doğrulaması (kritik):** `scripts/report-6a.mts`, `alignmentDetector.ts` filtrelerini sabitleriyle birebir kopyalar. Ürettiği ret sayıları, production'ın canlı hata mesajındaki sayılarla **tıpatıp aynı**:

| Geçiş | Enstrüman | Production mesajı | |
|---|---|---|---|
| similarity, son eşik | size 36, unstable 130 (window 129 + margin 1) | "36 aday boyut veya dolgunluk…; 130 aday gölgeye veya çizgiye bağlıydı" | ✅ |
| salvage refit, son eşik | size 20, unstable 114 (window 113 + margin 1) | "20 aday boyut…; 114 aday gölgeye…" | ✅ |

→ Enstrüman production'ın gördüğünü görüyor; aşağıdaki aday ölçümleri güvenilir.

**Tahminler (dik çerçevede):**

| Tahmin | Merkez (px) | Örtük kare alanı | Ölçek | Gerçek kareye uzaklık |
|---|---|---|---|---|
| homography (QR) | (−573.7, 3572.5) | 5794 px² | 15.22 px/mm | **1392 px** (pencere görüntü dışı → "karenin bulunması gereken alan görüntünün dışında") |
| similarity (QR) | (9.2, 2132.7) | 1301 px² | 7.21 px/mm | **258 px** |
| **salvage refit** (4 QR köşesi + 3 bulunan kare) | **(79.0, 2417.6)** | 1506 px² | 7.76 px/mm | **66 px** |

**İlk geçişte bulunan kareler:** sol üst (138.1, 170.8) · sağ üst (1357.4, 185.0) · sağ alt (1339.2, 2345.2). Eksik olan **sol alt** (fiziksel merkez 12.5, 284.5 mm).

**Gerçek sol-alt karesi (filtresiz flood fill, x≤400 y≥2200 thr 140):** merkez **(120, 2366)**, bbox **33×41 px**, mürekkep **1328 px** (thr 174'te 1363). Eşikler arası **stabil**: thr 100 → 33×40/1254, thr 140 → 33×41/1328, thr 175 → 34×41/1368 (bbox ±1 px).

**Adayın filtre yolculuğu (component containing the true centre):**

| Ölçüt | Değer | Bütçe | Sonuç |
|---|---|---|---|
| head ink | 1089 | [area·0.5, area·1.8] = [651, 2342] | ✅ |
| windowFill | **1.000** | ≥ 0.43 | ✅ |
| clipped | false | değil | ✅ |
| boyut/şekil (bbox oranı) | 33×33 pencerede tam dolu | ≥ 0.85 | ✅ |
| squareFill (en iyi yönelim) | **1.000** | ≥ **0.84** | ✅ **(bu testi GEÇİYOR)** |
| solid | 1.000 | ≥ 0.92 | ✅ |
| dPred | 258 px (similarity) / 66 px (refit) | ≤ 450 px | ✅ |
| **margin ink** | **%40** (thr 174) / %24 (thr 140) | ≤ %15 | ❌ **RED** |
| `isPrintedSquare` kurtarması | — | dPred ≤ 0.25·500 = 125 px **ve** head ≥ 0.8·area = 1205 | ❌ similarity: 258 > 125 · refit: 1089 < 1205 |

**Red nedeni tek bir satırda:** `reject-margin` → "unstable: margin ink 40% > 15% and not the unmistakable printed square".

### C.4 Kök neden (ölçümle kanıtlandı)

`squareWindow()` **kare** bir pencere kurar; kenarı `side = max(span·0.8, min(box, span·2.2))` ve `box = min(bboxW, bboxH)` = bileşenin **kısa** kenarı. Bileşen **anizotropik** olduğunda pencere uzun ekseni **kaçınılmaz olarak keser**.

Ölçülen kanıt (adım adım):

1. **Bileşen** bbox x 104..136 (33 px) × y 2346..2386 (41 px).
2. **Seçilen kare pencere** x 104..136 (33 px) × y 2350..2382 (33 px) → bileşenin **8 satırı pencerenin dışında** kalıyor (üstten 4, alttan 4); kolon taşması 0.
3. Bu 8 satır, 4 px'lik **margin çerçevesine** düşüyor. Çerçeve: 84 örnek, 34 koyu → **21'i bu işaretin KENDİ pikseli**, 13'ü kendi kenar anti-aliasing'i (v142–175, `threshold·1.25`'in altında kaldığı için "foreign" sayılıyor).
4. Yani **ortada kapatan bir çizgi/gölge YOK**; ret, işaretin kendi kesilmiş satırlarından doğuyor. Görsel doğrulama: kare, tertemiz beyaz zeminde, izole (6× zoom kırpması).
5. Kurtarma yolu da bu yüzden çalışmıyor: kesme sonucu `head.count` = 1089 = 33×33, ama kurtarma ≥ 0.8·area = 1205 istiyor → **kesilmiş pencere kendi kurtarmasını da engelliyor.**

**Anizotropi sistematik (tesadüf değil).** Dört karenin de bbox'ı dikeyde ~1.2 uzun: sol üst 35×42, sağ üst 32×39, sağ alt 34×40, sol alt 33×41. Bağımsız teyit: **QR sembolü de** dik çerçevede 138.7 × 170.6 px = **1.23** oranı. QR fiziksel olarak 26×26 mm karedir, yani bu, sayfanın **global ~%21 dikey anizotropik gerilmesi**dir (tutulan telefonun öne/arkaya eğimi). Bütün kareler kesiliyor; diğer üçü margin testinden **şans eseri** geçiyor (marj sırasıyla %0, %8, %11 — pencerenin seçtiği ±0.3·side offsetine bağlı).

**Çürütülen hipotez:** §10'daki "anizotropik perspektif kareyi 24w×36h yapmış → squareFill ≈ 0.81 < 0.84" **YANLIŞ**. Ölçülen: squareFill = **1.000** (testi geçiyor), gerçek bbox 33×41 (24×36 değil). Başarısızlık squareFill'de değil, **margin**'da.

**Doğrulananlar (özet):** 6a'nın landscape saklanması hata değil ✅ · yön normalizasyonu matematiksel ve ampirik olarak doğru ✅ · salvage refit mekanizması **tasarlandığı gibi çalışıyor** (66 px'e iniyor) ✅ · sorun **filtre düzeyinde** ve tam olarak `squareWindow`'un izotropik olmasında ✅ · arama yarıçapını büyütmek çözmez (§12'de doğru tahmin edilmiş; kare artık pencerenin içinde ve yine de reddediliyor) ✅
