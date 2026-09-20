# Benchmark + Kod Audit + Kök Neden Analizi Raporu

Tarih: 2026-09-20 · Branch `arena/01a0bb86-repo123` · Durum: **RESEARCH ONLY — kod değişikliği yok**

Korumak zorunda olduğumuz taban: **CURRENT 21 OK / 10 FAIL**; regressyon kümesi
`1a,2a,3a,4a,6a,7a,c1,c2,c3,c4` (c1=30, c2=32, c3=26, c4=26) birebir korunacak.

Yöntem: Bu rapordaki her ampirik iddia, bu turda çalıştırılan gerçek koşuculardan gelir:
`scripts/validation/ladder-e2e.mts` (strateji merdiveni + gerçek `analyzePage`),
`scripts/validation/failure-diag.mts` (analyzePage iç adımlarının replikasyonu:
QR → kimlik → tahmin → hizalama → geometri → QR-tutarlılık, konfigürasyon başına),
`scripts/validation/qr-variants.mts` (QR-krop ön-işleme varyant deneyi).
GitHub kodu **kopyalanmadı**; yalnızca algoritmik karşılaştırma yapıldı.

---

## 1. Mevcut sistem özeti (15 sorunun cevabı)

1. **Quad nasıl bulunuyor?** `detectDocumentQuad` (documentDetection.ts v4): gri görüntüde
   kenar-bariyerli bölge büyütme ile kâğıt adayı; `inkMask` (yerel parlak arka plan koşullu
   mürekkep) adayın mürekkebi kapsamasını, kenar destekleri dört doğrunun varlığını skorlar.
2. **Candidate nasıl oluşur?** Bölge büyütme → konveks hull → `orderCorners` → kenar başına
   `lineSupport` örnekleme; skor = coverage × rectilinearity × ink × edge-support.
3. **Skorlama:** yukarıdaki çarpım; `detect-quads.mts` çıktısı `cov/rect/ink/sup/score`.
4. **Refinement ne zaman?** `refineQuadEdges` her kenarı ±0.2·diagonal kaydırarak dener;
   **kapılı**: `bestSupport ≥ max(0.3, coarseSupport+0.15)` ise benimsenir. `lineSupport`
   gradyan percentil'i geçemezse imzalı parlaklık adımına bakar (`iç−dış ≥ 12`, kâğıt yanı aydınlık).
5. **Full-bleed:** dört köşe de çerçeve köşelerine ≤%5 bantta **VEYA** (alan oranı ≥0.88 **VE**
   maks. eksen eğimi ≤1.5°) → "zaten düz tarama".
6. **Passthrough:** full-bleed **VE** `pixelsPerMm===undefined` **VE** `clean==='full'` → ham gri
   görüntü OMR'a geçer (C serisi bit-bit korunur). Açık çözünürlük/temizlik override'ları warp yapar.
7. **Warp çözünürlüğü:** quad kenar uzunluklarından yerel px/mm ×1.15, [4.6, 8] bantına sıkıştırılır,
   8M px tavanı. (Not: 12 px/mm isteği 8M tavanını aştığı için `warpPerspective` fırlatır ve
   diag'da "X12" konfigürleri aslında **ham** görüntüyü ölçtü — bu kaza, ham geometrinin tutarlı
   olduğunu gösteren kritik veriyi üretti.)
8. **S0/S1/S2:** S0 adaptif + full temizlik (gölge→beyaz→kontrast→keskin); S1 8 ppm + yalnız gölge;
   S2 8 ppm + ham. İlk OK kazanır; algılama bir kez, sonrası köşe yeniden kullanımı.
   `PAGE_CROPPED` dönerse quad %3 genişletilip aynı strateji bir kez yeniden denenir.
9. **QR hangi çözünürlükte okunuyor?** `decodePageQr`: tam görüntü ölçekleri
   [full(≤4M px), 0.62·full, ≤900px] + inversiyon + 4 rotasyon + upright re-decode.
   **Asla upscale etmez, asla bölge kropu yapmaz** → küçük ama sağlam QR'ı büyük rasterde kaçırır
   (531 kanıtı: aynı görüntünün 336×336 QR-kropu çözüyor, tam görüntü çözemiyor).
10. **QR fallback'leri:** rotasyon/inversiyon/ölçek yinelemesi var; krop+upscale yok (GAP-1).
11. **Alignment araması:** QR köşelerinden iki tahmin (projektif + benzerlik); pencere
    `min(500, ppm·(8+0.22·dist_mm))`; 3 eşik (bg·0.55, bg·0.70, otsu); reddetmeler:
    boyut/dolgunluk, karelik, iç doluluk, uzaklık, "gölgeye/çizgiye bağlı" (unstable),
    "koyu bölgeyle birleşik" (blob); ≥2 kare bulunursa salvage least-squares refit.
12. **INVALID_GEOMETRY koşulları:** (a) QR köşelerinden tahmin oturmayınca throw;
    (b) `inspectPageGeometry` "Extreme perspective" (maxScale/minScale > 2.5) throw;
    (c) QR-tutarlılık: hata > `clamp(3mm·ppm, 4, 24)` px.
13. **PAGE_CROPPED retry:** yalnızca bu koda özgü, %3 dışa genişletme, yalnız OK ise kabul.
14. **Gereksiz coupling:** QR = tek kimlik + tek orientasyon + tek tahmin kaynağı;
    `decodePageQr` ölçek stratejisi tam görüntü boyutuna bağlı; warp aracı, yakalama düz olsa bile
    quad kalitesine bağlı projektif bozulma enjekte eder (522/525/526 kanıtı).
15. **Bilgi kaybı:** (i) gürültülü quad→8 ppm warp, hamda tutarlı olan geometriyi bozar;
    (ii) full temizlik düşük çözünürlükte QR modüllerini ezer; (iii) izotropik olmayan hiçbir
    upscale yok — ya warp (bozucu) ya hiçbir şey.

---

## 2-3. İncelenen GitHub projeleri ve teknik özetleri (şablon)

### P1 andrewdcampbell/OpenCV-Document-Scanner
Problem: foto→tarama. Detection: Canny+contour. Corner: approxPolyDP 4 nokta + manuel
`polygon_interacter.py` (sürükle-bırak köşe UI). Perspective: four-point transform.
Preprocessing: sharpen + adaptif renk eşiği. Resolution: yok. QR: yok. Alignment: yok.
Fallback: manuel köşe editörü. Bizdeki karşılık: `detectDocumentQuad` + `ManualCornerEditor`.
Bizde eksik: yok (manuel fallback bizde var). Uyarlanabilir mi: gerek yok — akış doğrulaması.

### P2 samy1406/document-scanner-cv
Resize→gray→blur→Canny→contour→4-point→warp→adaptiveThreshold. Ders: **algılama küçültülmüş
görüntüde, warp tam çözünürlükte**. Bizde eksik: küçültülmüş-piramit algılama (yalnız hız için;
doğruluk değil). Uyarlanabilir mi: EVET (performans, kategori A-değil/B-not).

### P3 LiteObject/doc-scanner
Contour + min-area; **bölge çok küçükse full-frame fallback**; **7 işleme varyantı + içerik
skoruyla otomatik seçim** (`--prefer auto`, tablo/metin bias); gölgeli sayfa için adaptif yöntem.
Bizdeki karşılık: full-bleed passthrough ≈ full-frame fallback; strateji merdiveni ≈ varyantlar
(biz seçimini downstream OMR'a yaptırıyoruz — daha güvenilir). Bizde eksik: içerik-bazlı varyant
skoru gerekmiyor (OMR zaten seçici). Uyarlanabilir mi: kısmen, gerek yok.

### P4 AnshumaanDash/OpenCV-Document-Scanner
pyimagesearch klasiği: 500px'e resize, Canny 75/200, top-5 kontur, approxPolyDP 0.02,
order_points (sum/diff), four_point_transform, **`threshold_local(11)` yerel adaptif binarizasyon**.
Bizde eksik: yerel adaptif eşik bizde Sauvola olarak `binarize()` mevcut ama boru hattında
kullanılmıyor (deneylerde QR'a zararı faydasından çok). Uyarlanabilir mi: HAYIR (bizde bölme
tabanlı beyaz filtre daha yumuşak; binarizasyon QR/OMR halkalarına zarar verebilir).

### P5 FarzamFattahi/document-scanner
Canny+contour+warp+adaptif; **düz görüntüde warp'ı atla**; **düşük çözünürlüğü OCR öncesi
otomatik upscale et**; EasyOCR (ML). Bizdeki karşılık: passthrough + S1 upscale.
**Bizde eksik olanın bağımsız teyidi**: onların upscale'i *yeniden warp* değil, düz ölçekleme —
bizim S1'imiz quad-warp ile upscale ediyor; düz yakalamada bu yanlış araç (bkz. kök neden 522/525/526).
Uyarlanabilir mi: **EVET — geometriyi koruyan izotropik upscale (kategori A).**

### P6 mythrex/OMR-Scanner
B/W+blur→kenar→warp→binarize→seçenek konturları→beyaz piksel sayısı skor. Resolution: yok;
QR: yok; alignment: sabit şablon (warp sonrası kontur sıralama). Bizden zayıf her eksende.

### P7 sakethbachu/OMR-scanner — P6 ile aynı soy (pyimagesearch); batch→excel. Yeni teknik yok.

### P8 srivasPankhuri/OMR-Scanner — "açı toleransı" iddiası aynı edge/contour/perspective zinciri.
Yeni teknik yok.

### P9 samanjoy2/OMR-Scan-OpenCV — scan+bubble+streamlit; doğruluk yüzdesi UI'ı. Yeni teknik yok.

### P10 Practical-CV/OMR-Scanner-and-Test-Grader
Varsayımlar: OMR en büyük dikdörtgen, 4 kenar görünür; Otsu; kabarcık aspect≈1; maskeleme.
Bizde karşılık: `markDetector`/`bubbleRingRefinement` zaten daha güçlü (halka-IRLS). Yeni yok.

**Genel:** OMR repolarının hiçbiri QR, düşük çözünürlük veya marker fallback'i çözmüyor;
hepsi "iyi fotoğraf + en büyük kontur" varsayıyor. Document-scanner repolarının ayırt edici
fallback'leri: full-frame fallback (bizde var), düz-ölçek upscale (bizde **yok**), manuel köşe
(bizde var), varyant üretimi (bizde merdiven olarak var).

### Dış literatür (QR kurtarma)
* qr-decoder.com yaklaşımı [1]: 3 geçiş — adaptif eşik → perspektif → **küçük ölçekli
  süper-çözünürlük upscale** (sıkıştırılmış ekran görüntüleri için).
* StackOverflow [2]: iyi **binarizasyon** (kraken nlbin gibi doğrusal-olmayan) yardımcı;
  Otsu+blur; **ölçek iki yönde** önemli (4000×3000 başarısız, 1600×1200 başarılı);
  QReader (YOLO tespit + ayrı decode) — ML, constraint dışı.
* PeerJ CS-2841 [3][5]: EDSR/VDSR/ESPCN/SRCNN QR SR; **Jin 2023 kör keskinleştirme**
  (yerel max/min önceliklendirme + binarizasyon) bulanık QR'da MAP'e +%5-15 — klasik, TS'de uygulanabilir.
* [4]: düşük-karmaşıklık ön-işleme: binarizasyon → QR extraction → perspektif + **resample** → ECC.

---

## 4. Karşılaştırma ve 5. Gap analysis

| Problem | Bizim yöntem | Benchmark/literatür | Eksik/risik | Öneri |
|---|---|---|---|---|
| Quad detection | bölge büyütme+skor (v4) | Canny+contour+approxPolyDP (hepsi) | hız (tam çözünürlükte) | küçültülmüş piramit (B, perf) |
| Quad refinement | kapılı kaydırma | yok (çoğunda yok) | — | korunmalı |
| Full-bleed | köşe/alan+eğim kuralı | full-frame fallback (LiteObject) | — | korunmalı |
| Perspective | quad→A4 homografi | four-point (hepsi) | **düz yakalamada quad-warp bozucu** | düz ise warp'sız upscale (A) |
| Low resolution | S1 8 ppm **warp** | **düz upscale** (FarzamFattahi, qr-decoder) | **GAP-2: izotropik upscale yok** | yeni strateji (A) |
| Upscale | bilinear warp | bilinear/INTER_CUBIC | warp kaynaklı projektif bozulma | resample-only (A) |
| Shadow | normalizeShadows | adaptif/`threshold_local` | — | korunmalı |
| White filter | bölme-tabanlı | adaptif eşik | — | korunmalı |
| Threshold | stretchContrast | Otsu/adaptif/Sauvola | Sauvola hattın dışında | QR için değil; dokunma (C) |
| QR | tam görüntü çok-ölçek | **krop+upscale** (qr-decoder, [2]), binarizasyon, kör keskinleştirme | **GAP-1: krop/upscale yok** | QR-krop decode geçişi (B) |
| Alignment | tahmin+pencere+salvage | sabit şablon (zayıf) | fotometrik reddetmeler (unstable/blob) | varyant-ayrık marker geçişi (B) |
| Invalid geometry | 3 koşullu katı koruma | yok (kimse doğrulamıyor!) | — | **gevşetme (C — tehlikeli)** |
| OMR | halka-IRLS + QR tutarlık | maskeleme (zayıf) | — | korunmalı |

**Pipeline'da gerçekten eksik olan iki teknik:** (GAP-2) geometriyi koruyan izotropik upscale;
(GAP-1) QR bölge-kropu + yerel upscale ile decode denemesi. İkisi de saf TS, bağımlılıksız.

---

## 6-7. Kalan 10 dosya — kök neden (ampirik, failure-diag'dan)

| Dosya | RAW'da QR | RAW'da marker | RAW geometri | Warp-8'de | Kök neden | Kurtarma |
|---|---|---|---|---|---|---|
| 522 | Y | Y | agree 0.6px **OK**, ppm 2.14 | marks unstable / extreme-persp | **yalnız LOW_RESOLUTION**; warp bozuyor | izotropik upscale (A) |
| 525 | Y | Y | agree 2.1px OK, ppm 2.57 | marks miss / extreme | aynı | izotropik upscale (A) |
| 526 | Y | Y | agree 1.3-2.7px OK, ppm 2.96 | bottom-right unstable | aynı | izotropik upscale (A) |
| 524 | Y | **MISS (raw'da bile)**: top-left unstable/blob | — | marks miss | kare gölge/katlamayla birleşik; fotometrik | marker-ön-işleme varyantı (B, belirsiz) |
| 529 | Y | Y (raw) | **extreme-perspective throw** | top-left unstable | raw'da bile bir marker muhtemelen yanlış eşleşmiş | marker doğrulama (B, belirsiz) |
| 528 | yalnız warp-8 | Y | — | agree 29.7px > lim 18.5, overshoot 6.7mm | gevşek quad (cov 0.73) → ölçek/hiza yanlış; koruma haklı | quad iyileştirme (B, riskli) |
| 531 | **krop'ta Y, tamda N** | (krop decode sonrası test gerekli) | — | tam-görüntü decode kaçırıyor | **GAP-1**: decodePageQr krop/upscale yapmıyor | QR-krop decode (B, umutlu) |
| 523 | N (her yerde) | — | — | N | QR modülleri yok olmuş | yok (C) / kimlik-fallback (B-uzun) |
| 533 | N | — | — | N | aynı | yok (C) |
| 535 | N | — | — | N | aynı | yok (C) |

523/533/535 için qr-variants (x2-x4, nearest, unsharp, Jin-kör-keskinleştirme, beyaz, gölge,
Sauvola, CLAHE, full-clean) **tümü n** → klasik yöntemlerle QR kurtarılamaz; yalnız ML-SR
(constraint dışı) veya QR-bağımsız kimlik + quad-tahminli marker arama.

---

## 8. QR_UNREADABLE seçenekleri (A-M) değerlendirmesi

* A 8 ppm: mevcut S1 — 531'de tam görüntüde yetmiyor (krop çözüyor).
* B 10-12 ppm: 12 ppm 8M tavanını aşıyor (warp throw); 10 ppm denendi (diag) — katkı yok.
* C Lanczos/bicubic: interp farkı jsQR sonucunu değiştirmedi (x2bil≈x2near).
* D unsharp / E deblur / F lokal kontrast / G CLAHE / H illumination / I adaptif: 523/533/535'te
  **hiçbiri çözmedi**; 531'de gereksiz (krop_raw zaten Y).
* **J/K QR-krop + upscale: 531'i çözen tek müdahale** (crop_raw=Y). Uygulanabilir (B).
* L çoklu-ön-işleme decode: yalnız krop ile anlam kazanıyor.
* M süper-çözünürlük: ML → constraint gereği şimdi HAYIR.

## 9. ALIGNMENT_MISSING seçenekleri (1-10)

524/529'da sorun pencere boyutu değil (pencere zaten ≤500px ve tahminli); reddetmeler
**fotometrik** (unstable/blob). Dolayısıyla 4/5 (pencere genişletme) çözüm değil.
Umutlu olanlar: 6 (marker aramayı beyaz-filtreli/gölge-temizli varyantta çalıştırma),
8 (bağlı bileşen ön-analizi ile gölge-katlama ayrımı), 2 (quad-tahmini — QR yoksa gerekli).
1/3 zaten mevcut mimari. 5/9/10 katkısız. → Kategori B deney.

## 10. INVALID_GEOMETRY (522/528)

* 522: warp-8'de extreme-perspective; **raw'da geometri mükemmel** → sorun eşik değil, warp.
  Upscale (A) 522'yi zaten kurtarır; eşik gevşetmeye gerek yok.
* 528: agree 29.7px (lim 18.5) + overshoot 6.7mm → en az bir marker/quad gerçekten yanlış;
  **gevşetme yanlış OMR üretir → HAYIR (C)**. Quad refinement iyileştirmesi (B, riskli).

## 11. QR-bağımsız kimlik

Form sabitleri: başlık "0X / 04", footer "Sayfa X / 4", madde numaraları. OCR'sız: form
PDF'inden rasterize rakam şablonlarıyla normalize korelasyon teknik olarak mümkün; ancak
**yanlış sayfa = klinik hata** → çift bölge uzlaşısı (başlık∧footer) + yüksek güven eşiği +
uyuşmazlıkta FAIL şartıyla. Yalnız 523/533/535 (+531 yedeği) için değerli. Kategori B-uzun;
bu turda uygulanmadı.

## 12. Ablation test planı (onay sonrası)

1. `CURRENT` (21/10) — referans.
2. `CURRENT + A` (merdivene S3: raw isolate → ×2.5-3 izotropik bilinear + gölge-opsiyonel;
   yalnız önceki stratejiler başarısızsa): beklenen +3 (522,525,526) → 24/10→24 OK/7 FAIL...
   (523,524,528,529,531,533,535 kalır → 24 OK / 7 FAIL).
3. `CURRENT + A + B1` (QR-krop decode geçişi, decodePageQr'a ek deneme): beklenen +1 (531) → 25/6.
4. `CURRENT + A + B1 + B2` (marker varyant geçişi): 524/529 belirsiz; kazanım 0-2.
Her adımda rapor: grup bazında OK/FAIL (regressyon 10 / 5a / başarılı 9 / kalan 10) ve
C sayımları (30/32/26/26) değişmez-kontrolü. Regressyon kümesinde herhangi bir değişiklik =
yöntem otomatik RED.

## 13. Regresyon riskleri

* A: yalnızca başarısız zincirin SONUNA eklenir → regressyon dosyaları hiç ulaşmaz; risk ≈0.
  Tek risk: upscale stratejisinin yanlışlıkla önce çalışması (uygulamada sıra kilitli).
* B1: decodePageQr'a ek deneme — mevcut OK'lerde QR zaten ilk denemede çözülür; ek deneme
  yalnız başarısızlarda çalışırsa risk 0; her görüntüde çalıştırılırsa sahte-pozitif riski
  (krop decode yanlış metin üretebilir) → parse+kimlik doğrulaması zaten kapıda. Düşük risk.
* B2: marker arama görüntüsü değişirse mevcut OK'lerde eşleşme değişebilir → **yalnızca
  başarısız zincirinde** çalıştırılmalı. Orta risk, kapılı.
* C (eşik gevşetme, ML, global binarizasyon): regressyon tehlikesi → uygulanmaz.

## 14. Karar kategorileri

**A — Hemen uygulanmalı:** geometriyi koruyan izotropik upscale stratejisi (S3).
Neden: 3 dosyada tek engel LOW_RESOLUTION; raw geometri kanıtla tutarlı; saf TS; regressyonsuz.
**B — Deney olarak:** B1 QR-krop decode (531); B2 marker-ön-işleme varyantları (524/529);
B3 küçültülmüş-piramit algılama (yalnız hız). Her biri kapılı + ablation ile.
**C — Uygulanmamalı:** QR-tutarlılık/geometri eşik gevşetme (yanlış OMR riski); ML süper-çözünürlük
(yeni bağımlılık); global Sauvola/binarize hattı (QR/halka zararı gözlendi); 12 ppm (8M tavanı).

## 15. Beklenen kazanım

A: 21→24 OK. A+B1: →25 OK. A+B1+B2 (iyi senaryo): →27 OK. Kalıcı FAIL adayları: 523/533/535
(QR fiziksel olarak yok; yalnız kimlik-fallback + marker yoluna bağlı) ve 528 (quad/marker
doğruluğu gerekir).

## 16. Sonraki implementasyon planı (onay bekliyor)

1. `scanAndAnalyze.ts`'e S3 ekle: `isolatePaper(raw)` → hedef ppm≥4.2 için izotropik bilinear
   upscale → opsiyonel `normalizeShadows` → `analyzePage`. Sıra: S0,S1,S2,S3.
2. `qrDecoder.ts`'e kapılı ek deneme: tam görüntü çözemezse, form tanımı qrArea'sini quad-warp
   ile kaynak piksellere eşleyip krop + ×2-3 upscale + jsQR (kimlik parse doğrulamalı).
   (Not: plan maddesi; kod yazılmadı.)
3. Ablation koşuları + regressyon gate + `npm test/typecheck/build`.
4. B2 marker varyantları kapılı dene; C kategorisine dokunma.

---

## Ek: dürüst sınırlamalar

* failure-diag replikasyonu ile `analyzePage` arasındaki iki görünüşlü çelişki incelendi:
  (i) rotasyon-görünümünde sahte QR çözümleri — `analyzePage`'in upright re-decode kapısı bunları
  doğru şekilde QR_UNREADABLE'a çeviriyor (522-S0, 535-S2); (ii) "Extreme perspective" throw'u
  analyzePage'de INVALID_GEOMETRY olarak yüzeye çıkıyor. İkisi de hata değil, koruma kapısı.
* 529'un raw'daki extreme-perspective throw'u, dört marker "bulunmuş" görünse bile en az birinin
  yanlış olduğunu düşündürüyor; bu yüzden 529 kurtarması B (belirsiz) kategorisinde.

---

# EK A — Uygulama (onay sonrası, yalnızca Kategori A)

## Implementation
* `src/scanner/documentScan.ts`: `isotropicUpscale(image, scale)` — saf TS bilinear,
  X=Y aynı faktör, aspect korunur; mevcut `warpPerspective` interpolasyon ailesiyle uyumlu;
  yeni dependency yok.
* `src/scanner/scanAndAnalyze.ts`: `ScanStrategy.upscale?: boolean`; merdivenin SONUNA
  `S3 {upscale, clean:'shadow'}` ve `S4 {upscale, clean:'none'}` eklendi.
  S0→S1→S2 başarısız olmadan asla çalışmaz; ilk OK'de kısa devre (override yok).
* Ölçek türetimi: `base = min(3, sqrt(9_000_000 / px))` (analyzePage 12M giriş tavanının
  güvenlik paylı bütçesi); faktör kümesi `[round1(base), 2, 3]` — jsQR'ın tam-raster
  örnekleme salınımına karşı (×2.70 çözer / ×2.71 çözemez ölçüldü). 960×1280 → ×2.7
  (2592×3456); gerçek yoğunluk ≈5.3–7.9 px/mm.
* Quad-warp YOK: ham gri → uniform scale → (opsiyonel normalizeShadows) → analyzePage.

## Ablation (30 dosya)
Baseline (S0-S2): 20 OK / 10 FAIL
Candidate (S0-S4): 26 OK / 4 FAIL
Delta: +6 (522, 524, 525, 526, 528, 529)
Kalan FAIL: 523 (QR_MISMATCH), 531/533/535 (QR_UNREADABLE) — QR modülleri klasik
yöntemlerle kurtarılamaz (audit §8).

## Target files
522: FAIL(INVALID_GEOMETRY) → OK p2 m15 (S3)
525: FAIL(ALIGNMENT_MISSING) → OK p1 m26 (S3)
526: FAIL(ALIGNMENT_MISSING) → OK p2 m16 (S3)
Ek: 524 → OK p2 m14; 529 → OK p1 m24; 528 → OK p2 m14 (meşruiyet: başlık "02/04",
145–288, QR görünür; kimlik QR-parse, 4 marker ölçümü ve QR-tutarlılık korumaları S3'te
geçti; m14 oturum p2 modu ile uyumlu).

## Regression (birebir)
1a p2 m14 · 2a p2 m14 · 3a p1 m24 · 4a p1 m24 · 5a p1 m31 · 6a p1 m24 · 7a p1 m24 ·
c1 p1 m30 · c2 p1 m32 · c3 p1 m26 · c4 p1 m26 — tümü S0'da, değişmedi.
Mevcut 587 başarıları değişmedi: 527 m24, 530 m23, 532 m14, 534 m14, 536 m14,
537 m14, 538 m14, 539 m14, 540 m15.

## Tests
typecheck: PASS · tests: 236/236 PASS · build: PASS

## Safety
src/omr/* , src/scoring/** , documentDetection eşikleri, QR kimlik kuralları,
alignment detector, geometry tolerance'ları, C-passthrough: DEĞİŞMEDİ
(git diff ile doğrulandı: yalnızca documentScan.ts + scanAndAnalyze.ts).

## Dürüst not
587 oturumunda sayım saçılımı (p1: 23-26, p2: 14-16) A'dan önce de vardı
(S1 sonuçları 540 m15 vs 532 m14); A yeni saçılım getirmedi, aynı motor davranışı.
