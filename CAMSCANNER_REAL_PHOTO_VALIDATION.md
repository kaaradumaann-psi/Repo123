# CAMSCANNER-STYLE REAL PHOTO VALIDATION — Mühendislik Kayıt Dosyası

| Alan | Değer |
|---|---|
| Repo | `kaaradumaann-psi/Repo123` |
| Branch | `arena/01a0bb36-repo123` |
| Başlangıç commit | `42839b318898ecc44b328a2cc64205e444e78f6c` (main) |
| Tarih | 2026-09-19 |
| Amaç | Mevcut scanner sistemini **önce ölçmek**, kanıtsız "çalışıyor" dememek; varsa gerçek bug'ı minimal yamayla düzeltmek |
| Kural | Erken aşamalarda kod değişikliği YOK; değişiklik yalnızca AŞAMA 8'de, kanıtlanmış bug'a minimal müdahale |
| Kısıt | `src/omr/**`, `src/scoring/**`, `src/form/**` değişmemeli; yeni dependency yok |

---

## HEDEF TAKİP TABLOSU (her hedef tek tek güncellenir)

| # | Hedef | Durum | Aşama |
|---|---|---|---|
| G1 | Gerçek telefon fotoğraflarını bul ve envanterini çıkar | ✅ DONE — **32 görsel `docs/TestGorselleri/` altında** (ilk turda görevin öncelik listesinde `docs/` yoktu; kullanıcı yönlendirmesiyle bulundu) | AŞAMA 1 (rev.2) |
| G2 | Repo'daki sentetik/görsel varlıkları fotoğraftan ayırt et | ✅ DONE — `omrSynthetic.ts` sentetik; `docs/TestGorselleri` gerçek çekimler + 1 uygulama ekran görüntüsü | AŞAMA 1 (rev.2) |
| G3 | Canlı kameranın gerçek 4 köşe mi bounding box mı ürettiğini koddan kesin belirle | ✅ DONE — **ONLY BOUNDING BOX** | AŞAMA 2 |
| G4 | `detectPageBox()` vb. fonksiyonların döndürdüğü veri yapısını doğrula | ✅ DONE — `{x,y,width,height}`; köşeler koddan türetiliyor | AŞAMA 2 |
| G5 | Gerçek fotoğraflarda TL/TR/BR/BL karşılaştırma tablosu üret | 🔄 IN PROGRESS — 31 foto üzerinde otomatik ölçüm + görsel GT alt kümesi | AŞAMA 3 (rev.2) |
| G6 | Sentetik fallback ile köşe tespiti davranışını ölç | ✅ DONE — 7 senaryo, ölçüm scripti ile | AŞAMA 3 |
| G7 | Manuel 4 köşe editörünü 10 kriterde doğrula | ⚠️ DONE-WITH-FINDING — 10/10 mekanizma var; **köşe sırası semantiği 90°-kadrajda kırılıyor** (AŞAMA 8 adayı BUG-1) | AŞAMA 4 |
| G8 | Manuel warp'ı 4 senaryoda test et (hafif/orta/güçlü perspektif, döndürülmüş) | ✅ DONE — sentetik 4/4 PASS; gerçek foto 4 senaryo: 3 PASS + 1 FAIL (en güçlü perspektif + statik GTAŞ hatası) | AŞAMA 4 |
| G9 | Enhancement modlarını koddan açıkla | ✅ DONE — 6 mod doğrulandı | AŞAMA 5 |
| G10 | SHADOW kontrolü | ⚠️ DONE-WITH-FINDING — flattening var ama yalnız önizlemede; `shadowNormalization.ts`'in üretim çağıranı YOK | AŞAMA 5 |
| G11 | CONTRAST kontrolü | ✅ DONE — gerçek 1–99 percentile stretch | AŞAMA 5 |
| G12 | BW kontrolü | ✅ DONE — gerçek Sauvola (integral image, k=0.2, pencere 31) | AŞAMA 5 |
| G13 | SHARPEN kontrolü | ✅ DONE — 3×3 unsharp (amount 0.3/0.4); halo ölçümü AŞAMA 6'da | AŞAMA 5 |
| G14 | OMR modu birlikte mi | ✅ DONE — flattenShadowsFast + gamma 0.85 + unsharp 0.4 zinciri | AŞAMA 5 |
| G15 | Filtreleri gerçek fotoğraflarda 6 kriterde ölç | ⚠️ DONE-WITH-FINDING — OMR/BW/GRAY/ORIGINAL PASS; CONTRAST gölgede zayıf; **ENHANCED gerçek fotolarda noise ×8 + bantlama = FAIL** (AŞAMA 8 adayı BUG-2) | AŞAMA 6 |
| G16 | Tam akışı uçtan uca doğrula; overlay sorusunu kesinleştir | ✅ DONE — otomatik pipeline 4/8 gerçek fotoğrafta okudu; overlay kesin olarak **bbox dikdörtgeni**; kısıtlar tabloya işlendi | AŞAMA 7 |
| G17 | Kanıtlanan bug varsa minimal düzeltme uygula | ✅ DONE — 2 fix (manualWarp.ts, enhancement.ts), doğrulandı | AŞAMA 8 |
| G18 | Regresyon: typecheck / test / build + yasak-yol kontrolü | ✅ DONE — typecheck PASS · **236/236 PASS** · build PASS · `src/omr+scoring+form` diff=0 | AŞAMA 9 |
| G19 | Son raporu zorunlu formatta (A–J) üret | ✅ DONE | SON |

**Durum lejantı:** ⬜ PENDING · 🔄 IN PROGRESS · ✅ DONE · ⚠️ DONE-WITH-FINDING · 🚫 BLOCKED/NOT-TESTABLE

---

## AŞAMA 1 — SADECE GERÇEK FOTOĞRAFLARI BUL ✅

**Tarih:** 2026-09-19 · **Kod değişikliği:** YOK

### Tarama kapsamı (yalnızca izin verilen öncelikli konumlar; tüm repo taranmadı)

| Konum | Durum | Görsel bulundu mu |
|---|---|---|
| `test/` | mevcut değil | — |
| `tests/` | ✅ tarandı | 0 |
| `fixtures/` | mevcut değil | — |
| `public/` | mevcut değil | — |
| `assets/` | mevcut değil | — |
| `src/` | ✅ recursive tarandı | 0 |
| repo kökü | ✅ tarandı | 0 (yalnız PDF/HTML/MD/TS/JSON) |

Aranan uzantılar: `.jpg .jpeg .png .webp .heic` → **hiçbiri yok.**

### Fotoğraf olmayan görsel-benzeri varlıklar

| Dosya | Tür | Gerçek fotoğraf mı? |
|---|---|---|
| `MMPI-566-optik-cevap-formu.pdf` (repo kökü) | PDF vektörel form şablonu | ❌ |
| `optik-form.html` (4.3 MB, repo kökü) | HTML | ❌ |
| `tests/fixtures/omrSynthetic.ts` | Kod içi raster üreteci | ❌ — dosya başlığı: *"SYNTHETIC raster fixtures only. No real-camera, photocopy, handwriting or print accuracy claim."* |

### AŞAMA 1 ilk karar (rev.1 — GEÇERSİZ, düzeltildi)

* Öncelik listesindeki konumlarda **0** görsel bulundu; `docs/` görevin öncelik listesinde **yoktu** → ilk sonuç "BULUNAMADI" idi. Kullanıcı yönlendirmesiyle `docs/TestGorselleri/` bulundu. Revizyon geçmişi kayıt altında.

### AŞAMA 1 revizyonu (rev.2 — GEÇERLİ) — `docs/TestGorselleri/`

**31 JPEG + 1 PNG = 32 dosya.** EXIF tüm JPEG'lerde soyulmuş (Make/Model/Orientation yok — messenger/WhatsApp/Telegram aktarımına tipik); "gerçek fotoğraf" kararı **görsel incelemeyle** verildi (read_file ile temsilî dosyalar görüntülendi).

| Grup | Dosyalar | Çözünürlük | İçerik (görsel doğrulama) | Gerçek çekim mi |
|---|---|---|---|---|
| `1a.jpg`–`2a.jpg` | 2 | 2205×3300 / 2177×3300 portre | MMPI sayfası kareyi dolduruyor, temiz (tarama-benzeri) | ⚠️ tarama/krop olabilir |
| `3a.jpg`–`7a.jpg` | 5 | 2550×~1500–1880 yatay | `5a.jpg`: sayfa **90° döndürülmüş**, kareyi dolduruyor | ⚠️ tarama/krop olabilir |
| `c1.jpg`–`c4.jpg` | 4 | 1240×~1720–1778 portre | `c1.jpg`: hafif eğik sayfa, köşelerde zemin görünüyor | ✅ foto benzeri |
| `5870….jpg` ×19 | 19 | 960×1280 (12 adet) ve 1280×960 (7 adet) | `…522`, `…526`: **gerçek telefon çekimi** — masa, kablo, laptop zemini; sayfa karede ~90° yatık | ✅ gerçek telefon |
| `kutucukSolUstteKaldıSorun.PNG` | 1 | 775×489 | **Uygulama ekran görüntüsü**: canlı kamerada overlay kutusu sol üstte yapışık, sayfa olmayan parlak içerikte "Sayfa algılandı" — **saha bug kanıtı** | ❌ ekran görüntüsü (pipeline girdisi değil, kanıt) |

* Gerçek telefon fotoğrafı (zemini görünen, perspektifli): **19+4 = 23 adet** (5870 serisinin tamamı + c-serisi)
* Tarama-benzeri (kareyi dolduran): ~8 adet (na/nb serisi)
* Görüntülenen örnekler: `1a.jpg`, `5a.jpg`, `c1.jpg`, `5870…522.jpg`, `5870…526.jpg`, `kutucukSolUstteKaldıSorun.PNG`

`AŞAMA 1 TAMAMLANDI (rev.2)`

---

## AŞAMA 2 — MEVCUT KAMERA TESPİTİNİ İNCELE ✅

**Tarih:** 2026-09-19 · **Kod değişikliği:** YOK

### İncelenen dosyalar

| Dosya | Satır | Rol |
|---|---:|---|
| `src/scanner/cameraAdvisor.ts` | 166 | Canlı önizleme analizi + sayfa tespiti + köşe üretimi |
| `src/components/CameraOverlay.tsx` | 42 | SVG overlay (polygon çizer) |
| `src/components/CameraCapture.tsx` | 167 | Kamera akışı + çekim |
| `tests/cameraAdvisor.test.ts` | — | Mevcut testler (doğrulama kanıtı) |

### Kanıt zinciri (koddan, satır satır)

1. **Veri yapısı** — `cameraAdvisor.ts` → `CameraAdvice.pageBox?: { x: number; y: number; width: number; height: number }`. JSDoc açıkça: *"Bounding box of the detected paper in source-pixel coordinates."* Tip tanımında TL/TR/BR/BL nokta çifti YOK.
2. **Tespit fonksiyonu** — `detectPageBox(image): { x, y, width, height } | null`. Algoritma: stride-2 downscale → histogram-percentile paper threshold → BFS ile en büyük parlak bağlı bileşen → takip edilen tek geometri `minX/minY/maxX/maxY` → alan filtresi (%18–%92) → A4 aspect filtresi (portrait 0.50–0.92, landscape 1.09–2.0). **Çizgi tespiti, kontur köşe regresyonu, dörtgen fit YOK.**
3. **"Köşe" üretimi** — `pageBoxCorners(box)`: `TL=(x,y)`, `TR=(x+w,y)`, `BR=(x+w,y+h)`, `BL=(x,y+h)` — köşeler **cebirsel olarak kutudan türetiliyor**; geometrik olarak daima eksenlere paralel dikdörtgen. Rotasyon/perspektif temsil edemez.
4. **Overlay** — `CameraOverlay.tsx` `<polygon>` çiziyor (SVG keyfi dörtgen çizebilir) ama girdi her zaman dikdörtgen → ekranda eğik dörtgen **asla** görünmez.
5. **Çekim yolu** — `CameraCapture.capture()` → `capturePixels(video, fullW, fullH)`: tüm kare alınır, `pageBox` çekimde **hiç kullanılmıyor**. UI metni de bunu itiraf ediyor: *"Çerçeve yalnızca rehberdir; görüntü kırpılmaz."* Kod yorumu: *"the actual page alignment is still decided by the OMR pipeline's alignment squares"*.
6. **Mevcut test** — `tests/cameraAdvisor.test.ts:50`: `pageBoxCorners returns the four corners in TL/TR/BR/BL order` testi, dönen köşelerin kutu köşeleriyle **birebir aynı** olduğunu assert ediyor (TL=`{x:10,y:20}` = box.x/box.y). "TL/TR/BR/BL" adlandırması var ama bu kutunun köşeleri, **kağıdın köşeleri değil**.

### Soru: Canlı görüntüde 4 ayrı perspektif köşesi hesaplanıyor mu?

> **HAYIR.** `detectPageBox()` yalnızca `x, y, width, height` döndürüyor. Görev kuralı gereği ("Eğer yalnızca x, y, width, height dönüyorsa bunu 4 köşe tespiti olarak kabul etme") bu **4 köşe tespiti değildir.**

### AŞAMA 2 kararı: `ONLY BOUNDING BOX`

* TRUE 4-CORNER: ❌
* Overlay'de çizilen şekil: daima axis-aligned dikdörtgen (rotasyon/perspektif takibi imkânsız)
* Not: Bu mimaride kamera overlay'i "rehber" olarak tasarlanmış; gerçek hizalama `src/omr/` tarafındaki alignment-square + `fitHomography` ile yapılıyor. Yani bu bir **özellik sınırı** (tasarım kararı gibi dokümante edilmiş), gizli bir bug değil — ama "CamScanner tarzı canlı 4 köşe takibi" hedefi açısından **mevcut DEĞİL**.

`AŞAMA 2 TAMAMLANDI`

## AŞAMA 3 — GERÇEK FOTOĞRAFLARDA 4 KÖŞE TESTİ ⚠️

**Tarih:** 2026-09-19 · **Kod değişikliği:** YOK (ölçüm scriptleri: `scripts/validation/stage3-cornerDetection.ts`, `scripts/validation/stage3-realPhotos.ts` — ürün koduna dokunmaz)

**Yöntem:** 31 JPEG'in tamamı `CameraCapture.frameToGray` akışının aynısıyla (stride-2 → yarı çözünürlük gri) mevcut `adviseCameraFrame`/`detectPageBox`'a beslendi. GT köşeler: (a) görsel olarak incelenen 4 fotoğrafta manuel GT (±12 px, overlay ile doğrulandı), (b) diğerlerinde Otsu-blob diyagonal ekstremumları (beyaz-masa birleşenlerde GT kare kenarına yapışabildiği için o satırlar "göstergelik", karar satırı değil). Overlay kanıtları: `scripts/validation/out/*-overlay.png` (yeşil=GT, kırmızı=detectPageBox). Üç kompozit gözle doğrulandı: `…526`, `…539`, `c1` — yeşil quad kağıdı sarıyor.

### Tam sonuç tablosu (31 foto)

| Fotoğraf | Boyut | hint | pageDetected | box kapsama/aspect | GT köşe hatası ort/max (önizleme px) | IoU(GT,box) |
|---|---|---|---|---|---|---|
| 1a.jpg | 2205×3300 | too-bright | hayır | — | — (kutu yok) [manuel GT] | — |
| 2a.jpg | 2177×3300 | too-bright | hayır | — | — | — |
| 3a.jpg–7a.jpg (5 ad.) | 2550×… | too-bright | hayır | — | — | — |
| c1.jpg | 1240×1778 | too-bright | hayır | — | — (kutu yok) [manuel GT] | — |
| c2.jpg–c4.jpg (3 ad.) | 1240×… | too-bright | hayır | — | — | — |
| …522.jpg | 960×1280 | **no-page** | hayır | — | — (kutu yok) [manuel GT] | — |
| …523.jpg | 960×1280 | page-detected | evet | **100%** / 0.75 | 72.9 / 155.0 (blob, göstergelik) | 0.698 |
| …524.jpg | 960×1280 | page-detected | evet | **100%** / 0.75 | — | — |
| …525.jpg | 960×1280 | no-page | hayır | — | — (kutu yok) | — |
| …526.jpg | 1280×960 | page-detected | evet | **100%** / 1.33 | **56.0 / 60.4 [manuel GT]** | **0.735** |
| …527.jpg | 1280×960 | page-detected | evet | 87.5% / 1.52 | 20.8 / 36.0 (blob) | 0.918 |
| …528/…531/…532/…533.jpg | 960×1280 | page-detected | evet | **100%** / 0.75 | — | — |
| …529.jpg | 1280×960 | page-detected | evet | 87.1% / 1.53 | 39.8 / 78.0 (blob) | 0.847 |
| …530.jpg | 1280×960 | page-detected | evet | 83.3% / 1.60 | 34.9 / 95.0 (blob) | 0.886 |
| …534.jpg | 1280×960 | page-detected | evet | 92.5% / 1.44 | 20.4 / 56.2 (blob) | 0.925 |
| …535.jpg | 1280×960 | page-detected | evet | 81.7% / 1.63 | 26.4 / 94.2 (blob) | 0.855 |
| …536.jpg | 1280×960 | page-detected | evet | **100%** / 1.33 | 24.5 / 80.6 (blob) | 0.881 |
| …537.jpg | 1280×960 | page-detected | evet | 96.3% / 1.39 | 32.6 / 79.1 (blob) | 0.857 |
| …538.jpg | 1280×960 | page-detected | evet | 82.1% / 1.62 | 27.9 / 76.0 (blob) | 0.900 |
| …539.jpg | 1280×960 | page-detected | evet | 86.3% / 1.55 | 9.1 / 18.1 (blob) | 0.962 |
| …540.jpg | 960×1280 | page-detected | evet | 91.3% / 0.68 | 19.0 / 44.0 (blob) | 0.915 |

**Tablonun yapısal özeti (31/31):** çıkan kutu `pageBoxCorners` ile her zaman axis-aligned dikdörtgen → TL/TR/BR/BL `NOT IMPLEMENTED`. 19 telefon fotoğrafının **10'unda kutu = karenin tamamı** (%100 kapsama), geri kalanında %82–96 — yani overlay pratikte "karenin çerçevesini" çiziyor, kağıdın köşelerini değil.

### Görev kontrol sorularının GERÇEK fotoğraflarla cevapları

* **sayfa döndürülmüş mü?** → Evet, 5870 serisinin çoğunda sayfa karede ~90° yatık. Portre karede yatık sayfa aspect≈0.75 *kutuyla* ölçülünce filtreden geçebiliyor ama `…522.jpg`'de tespit tamamen yok (**no-page**); sentetik S3/S4'teki 35°+ kaybı gerçekte de var.
* **perspektif var mı / telefon açısı eğik mi?** → Evet (`…526`, `…539` trapez belirgin). Kutu perspektifi temsil edemiyor; manuel-GT satırında köşe hatası **56 px** (480×640 önizlemede = genişliğin %12'si).
* **sayfanın bir köşesi karanlık mı?** → `…523`: gölgeyle birlikte beyaz masa bileşenine dahil → kutu kareyi kapladı (karanlık köşelerde BFS bölünmesi/aşması).
* **arka plan sayfaya benziyor mu?** → **Kritik bulgu:** beyaz/masa zemini Otsu ve paper-threshold altında sayfayla **birleşiyor**; en büyük parlak bileşen = sayfa + masa → kutu karenin tamamı oluyor (10/19). Ekran görüntüsündeki saha bug'ının (`kutucukSolUstteKaldıSorun.PNG`: kutu sol üstte yapışık, parlak kumaşta "Sayfa algılandı") kök nedeniyle aynı mekanizma.
* **sayfa kadrajın tamamında mı?** → 1a/2a/c1–c4 ve 3a–7a (11 adet) sayfa kareyi dolduran çekimlerde: `hint=too-bright`, **hiç kutu yok** (>%92 + parlaklık>240). Yani en iyi kadrajlanmış sayfada bile canlı overlay "sayfa yok / çok parlak" diyor.

### Sentetik ölçüm (rev.1'den, geçerliliğini koruyor)

| Senaryo | Tespit | IoU | Ort./Max köşe hatası |
|---|---|---|---|
| S0 axis-aligned (kontrol) | ✅ | 0.994 | 1.6 / 2.2 px |
| S1 8° | ✅ | 0.775 | 72.1 / 85.4 px |
| S2 25° | ✅ | 0.563 | 216.0 / 257.7 px |
| S3 35° | ❌ no-page | — | — |
| S4 45° | ❌ no-page | — | — |
| S5 hafif persp. | ✅ | 0.899 | 22.6 / 72.0 px |
| S6 güçlü persp. | ✅ | 0.774 | 49.5 / 175.8 px |

**Karar:** Gerçek 4 köşe → **NOT IMPLEMENTED** (kod kanıtı AŞAMA 2 + sentetik ölçüm + 31 gerçek fotoğraf ölçümü üçlü kanıt). PASS verilebilen tek durum "sayfa kareyle hizalıysa kutu kabaca sayfayı kapsar" (S0 kontrolü ve `…527`-tipi satırlar); bu 4 köşe tespiti değildir.

`AŞAMA 3 TAMAMLANDI (rev.2)`

## AŞAMA 4 — MANUEL 4 KÖŞE SİSTEMİ ⚠️

**Tarih:** 2026-09-19 · **Kod değişikliği:** YOK · **Ölçüm:** `scripts/validation/stage4-manualWarp.ts`, `stage4b-refineCorners.ts` · **Mevcut testler:** `manualWarp`, `realPdfManualWarp`, `omrPerspective`, `cameraAdvisor` → **23/23 PASS**

### 10 kriter tablosu (koddan doğrulandı)

| # | Kriter | Sonuç | Kanıt |
|---|---|---|---|
| 1 | 4 köşe bağımsız hareket | ✅ | `ManualCornerEditor.onPointerMove`: yalnızca `drag.current` indeksi güncellenir; her `<circle>` kendi `onPointerDown(index)` |
| 2 | Pointer Events | ✅ | `onPointerDown/Move/Up/Cancel/Leave` + `setPointerCapture` |
| 3 | Touch cihaz | ✅ | Pointer Events birleşik + `src/styles/scanner-enhancements.css:159` `.manual-corner-canvas { touch-action: none }` |
| 4 | Köşe sırası TL→TR→BR→BL | ✅ mekanizma / ⚠️ semantik | `LABELS=['Sol üst','Sağ üst','Sağ alt','Sol alt']`; `physicalDestinations` (0,0)(W,0)(W,H)(0,H) — **ama sıra "kadraj görseli"ne göre; fiziksel sayfa üstüne göre değil** → bulgu aşağıda |
| 5 | self-intersection engeli | ✅ | `manualWarp.validateCorners`: ardışık kenar cross işareti değişimi → bowtie reddi (canlı test: reddedildi) |
| 6 | coincident points engeli | ✅ | çiftler arası <4px reddi + non-finite reddi (canlı test: reddedildi) |
| 7 | out-of-bounds kontrolü | ✅ | UI `pointerToImage` klamplı + `applyManualCorners` projeksiyon-sınırı reddi (EPS=1e-6) (canlı test: reddedildi) |
| 8 | `fitHomography()` | ✅ | `src/omr/perspectiveCorrection`'dan import, mm→piksel fit |
| 9 | `warpPerspective()` gerçekten çalışıyor | ✅ | sentetik 4/4 PASS (aşağıda) + `realPdfManualWarp` testi PASS |
| 10 | "Bu Köşeleri Kullan" → OMR pipeline | ✅ | `handleConfirm` → `applyManualCorners` (üretim çözünürlüğü) → `onConfirm(warped)` → `ScannerWorkspace` `grayToRgba` → **aynı `run()` → aynı `analyzePage`** (paralel OMR yolu yok); canlı kanıt: B1/B2/B3 okudu |

### Sentetik 4 senaryo (Bölüm A) — geri kazanım kalitesi

| Senaryo | RMSE | %\|Δ\|>25 | karar |
|---|---|---|---|
| A1 hafif perspektif | 13.81 | 2.81% | PASS |
| A2 orta perspektif | 13.84 | 2.82% | PASS |
| A3 güçlü perspektif | 14.04 | 2.96% | PASS |
| A4 döndürülmüş 20° | 14.43 | 3.21% | PASS |

(RMSE ~14 ≈ yeniden örnekleme bulanıklığı; geometri doğru.) Negatif senaryolar (Bölüm C): coincident / bowtie / ters sıra / out-of-bounds → **4/4 doğru Türkçe hata ile reddedildi.**

### Gerçek fotoğraf 4 senaryo (Bölüm B + rafine tarama)

| Senaryo | warp | `analyzePage` | sonuç |
|---|---|---|---|
| B1 hafif persp. — `c1.jpg` (1240×1778, kağıt kadrajlı) | ✅ | ✅ **ok · sayfa 1 · 19 işaretli madde** | **PASS** (rectified çıktı görsel olarak doğrulandı: `out/stage4-B1-recovered.png`) |
| B2 orta persp. — `…539.jpg` | ✅ | rot0 ❌ → **doğru fiziksel sırada ✅ ok · sayfa 2 · 11 işaretli** | **PASS*** |
| B3 döndürülmüş ~90° — `…526.jpg` | ✅ | rot0 ❌ → **rot1'de ✅ ok · sayfa 2 · 11 işaretli** | **PASS*** |
| B4 güçlü persp.+döndürülmüş — `…522.jpg` | ✅ | 4 rotasyonda da ❌ (ALIGNMENT_MISSING / INVALID_GEOMETRY) | **FAIL** — güçlü keystone + 960px kaynak + tek-atım GTAŞ köşe hassasiyeti (±25px) yetersiz; editörün canlı önizleme nudge döngüsü bu testte yok |

*B2/B3 "PASS*" notu: kağıt kenarları doğru seçildiğinde pipeline okuyor; **aynı fiziksel sayfa 2, iki ayrı fotoğraftan (539 ve 526) aynı 11 işaretle okundu** → çapraz doğrulama.

### 🐞 BUG-1 (AŞAMA 8 adayı) — Manuel köşe sırası 90°-kadrajda kırılıyor

* **Üretim:** editör başlangıç köşeleri kadraj-görsel inset kutusu (`ScannerWorkspace` ~L176: pad %6, TL/TR/BR/BL) ve etiketler kadraj-görsel; `applyManualCorners` görsel-TL→(0,0), görsel-TR→(210,0) mapler.
* **Senaryo:** sayfa kadrajda ~90° yatık (telefon dikey, kağıt yatay — test setinin çoğu böyle) → görsel TL→TR kenarı **fiziksel uzun kenar (297)** ama kanonik kısa kenara (210) maplenir → çıktı anamorfik sıkışmış → hizalama kareleri "kare"likten çıkar → `analyzePage` yine ALIGNMENT_MISSING. Kullanıcı manuel fallback'i tam da ihtiyaç duyduğunda ikinci kez başarısız olur.
* **Kanıt:** `…526` manuel GT rot0 ❌ / rot1 ✅ (aynı köşeler, yalnız sıra döndürülmüş); `…539` aynı desen. B1 (kağıt dik) rot0'da ✅ → geriye uyumlu.
* **Minimal fix fikri (AŞAMA 8):** `manualWarp.applyManualCorners` içinde köşe sırasını normalize et — `|TL→BL| < |TL→TR|` ise diziyi 1 döndür ([TR,BR,BL,TL]); CCW alan işareti korunur, portre A4 için deterministik. UI/metin/validation değişmez.

`AŞAMA 4 TAMAMLANDI`

## AŞAMA 5 — CAMSCANNER BENZERİ GÖRÜNTÜ İŞLEME ✅ (kod incelemesi; ölçümler AŞAMA 6'da)

**Tarih:** 2026-09-19 · **Kod değişikliği:** YOK · **Mevcut testler:** `enhancement.test.ts` + `shadowNormalization.test.ts` → **12/12 PASS**

### Modların gerçekte yaptığı (koddan)

| Mod | Fonksiyon | Gerçek işlem | Not |
|---|---|---|---|
| ORIGINAL | `clone` | kimlik (defansif kopya) | ✅ |
| ENHANCED | `enhanceLocal` | 64px karo histogram eşitleme ("CLAHE-lite"), karolar arası bilinear dikiş | ⚠️ kontrast klip limiti YOK → düz karolarda noise amplifikasyonu olabilir (AŞAMA 6'da ölçülecek) |
| GRAY | `clone` | kimlik — zaten gri; yalnız UI etiketi | ✅ (dürüst dokümantasyon) |
| BW | `binarize` | **gerçek Sauvola**: T = m·(1 + k·(σ/128 − 1)), k=0.2, pencere 31, integral görüntü ile O(1)/px | ✅ adaptif eşik kanıtlı |
| CONTRAST | `stretchContrast` | **gerçek 1–99 yüzdelik** lineer germe | ✅ |
| OMR | `flattenShadowsFast → applyGamma(0.85) → unsharp(0.4)` | gölge flattening + gamma + keskinleştirme **birlikte** | ✅ zincir doğru |

### Görev soruları

* **SHADOW:** gölge azaltma VAR — büyük yarıçaplı (uzun kenarın %6'sı) separable box-blur ile zemin tahmini çıkarılıyor (uneven illumination düzeltme ✓). **AMA kritik bulgu:** `src/scanner/shadowNormalization.ts`'teki asıl modülün (`normalizeShadows`, gated: minLongSide 320 / minBackgroundContrast 12, referans=MEDYAN) **üretimde hiç çağıranı yok** (yalnız `tests/shadowNormalization.test.ts`). Üretimdeki tek gölge flattening, `enhancement.ts` içindeki sadeleştirilmiş kopya `flattenShadowsFast` (referans=ORTALAMA) — o da yalnızca OMR **önizleme** modunda.
* **OMR hattına etkisi:** YOK — `enhancement.ts` başlığı açıkça "visual-only … do NOT feed back into OMR; mark detection keeps using the unmodified normalized" diyor. Tasarım kararı, dokümante; ama "gölge düzeltme OMR okumasına yardım ediyor" denilemez (yalnız insan önizlemesi).
* **CONTRAST:** percentile stretch evet (yukarıda).
* **BW:** Sauvola evet (yukarıda).
* **SHARPEN:** unsharp 3×3, radius 1, amount 0.3 (varsayılan) / 0.4 (OMR modu); kenar-kapısı yok → güçlü kenarlarda halo + düz alanda noise kaldırma riski sınırlı ama ölçülmeli (AŞAMA 6).
* **Bağlantı:** `ScanResultPreview` (varsayılan mod `'omr'`) ve `comparison.ts` yan-yana render `applyEnhancement` kullanıyor; mod seçici `ImageEnhancer`.

`AŞAMA 5 TAMAMLANDI`

## AŞAMA 6 — GERÇEK FOTOĞRAFLARDA FİLTRE TESTİ ⚠️

**Tarih:** 2026-09-19 · **Kod değişikliği:** YOK · **Ölçüm:** `scripts/validation/stage6-filters.ts` (6 mod × 3 sayfa, gerçekten çalıştırıldı; görsel kanıt: `out/stage6-P1/P2/P3-modes.png` — üç sheet de gözle incelendi) · **Mevcut testler:** 12/12 PASS (AŞAMA 5)

**Test sayfaları:** P1 = `c1.jpg` warp (temiz gerçek sayfa) · P2 = `…526.jpg` warp (gerçek telefon, doğal gölge) · P3 = P1 + enjekte diyagonal gölge (kontrollü)

### Nicel sonuç tablosu

| Sayfa | Metrik | original | enhanced | gray | bw | contrast | omr |
|---|---|---|---|---|---|---|---|
| P1 | geometri | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| P1 | kadran spread | 5.4 | 2.4 | 5.4 | 3.8 | 5.6 | 4.0 |
| P1 | zemin noise σ | 0.03 | **3.61 (×120)** | 0.03 | 0.00 | 0.03 | 2.62 |
| P1 | halo (omr/unsharp) | — | — | — | — | — | 2.21 |
| P2 | kadran spread (gölge) | 39.2 | **51.6 (kötüleşti)** | 39.2 | **2.6** | **62.4 (kötüleşti)** | **3.0 (−92%)** |
| P2 | zemin noise σ | 9.88 | **80.73 (×8.2)** | 9.88 | 0.00 | 15.82 | **5.91 (↓)** |
| P2 | halka koyuluğu | 83 | 121 | 83 | — | **45 (soluk halka aşındı)** | **102 (↑)** |
| P3 | kadran spread (enjekte gölge) | 47.4 | 41.5 | 47.4 | 4.0 | 47.4 | **0.5 (−99%)** |
| P3 | zemin noise σ | 1.71 | **65.07 (×38)** | 1.71 | 0.00 | 1.71 | 2.52 |

Ölçüm sınırlaması (dürüstlük): P1'de "halka koyuluğu" tüm modlarda 0 çıktı — warp GT köşelerindeki sub-mm ofset 12px örnekleme çemberini halka çizgisinden kaydırdı; metrik yalnız aynı sayfa içi mod-karşılaştırmasında (P2) anlamlı. P1 halka bütünlüğü sheet'ten **görsel** doğrulandı.

### 6 kriter kararı

1. **Sayfa geometrisi:** 18/18 mod çıktısı girişle aynı boyut → **PASS (hepsi)**
2. **Metin okunabilirliği:** enhanced P2/P3'te metnin üzerine bant/siyah leke bindiriyor → enhanced **FAIL**; diğerleri PASS
3. **Gölge:** omr −92…−99% → **PASS**; bw arka plan tekdüze → **PASS**; contrast gölgeyi korur/kötüleştirir → zayıf; enhanced **gölgeyi büyütür** → **FAIL**
4. **Gürültü:** enhanced kliplenmemiş karo eşitleme (AŞAMA 5'teki öngörü doğrulandı) gerçek foto noise'unu **×8** katlıyor → **FAIL**; omr/bw noise azaltır → PASS
5. **Sharpening halo:** omr unsharp(0.4) halo oranı 0.92–2.21 → sheet'te görünür halo YOK → **PASS**
6. **OMR baloncuk kenarları:** omr modu halka koyuluğunu korur/güçlendirir (83→102) → **PASS**; bw halkalar sheet'te sağlam → PASS; contrast soluk halkaları aşındırıyor (83→45) → ⚠️

### Görev formatında mod tablosu

| Fotoğraf | ORIGINAL | ENHANCED | GRAY | BW | CONTRAST | OMR |
|---|---|---|---|---|---|---|
| P1 (temiz) | PASS | ⚠️ noise (3.6σ, okunur ama kirli) | PASS | PASS | PASS | PASS |
| P2 (gölgeli gerçek foto) | PASS | **FAIL** (noise ×8, bantlama) | PASS | PASS | ⚠️ (spread 39→62, halka 83→45) | **PASS** |
| P3 (enjekte gölge) | PASS | **FAIL** (moiré bantlama) | PASS | PASS (küçük köşe artefaktı) | ⚠️ (gölge aynen kalıyor) | **PASS** |

### 🐞 BUG-2 (AŞAMA 8 adayı) — ENHANCED modu gerçek çekimlerde geriye gidiyor

* Kök neden: `enhanceLocal` karo-bazlı histogram eşitlemede **kontrast klip limiti yok** (CLAHE'nin clipLimit'i). Düz/gürültülü karolarda CDF dikleşiyor → noise ve bant sınırları patlıyor; gölge gradyanı siyah bantlara dönüşüyor. "Geliştirilmiş" etiketi gerçek fotoğrafta tersine çalışıyor (sheet kanıtı: P2/P3 enhanced panelleri).
* Minimal fix fikri: `enhanceLocal` içinde karo histogramına klip limiti (örn. karo piksel sayısının ~2–3× ortalama bin değeri) + fazlalığı binlere yeniden dağıtma. Tek dosya, dependency yok.

`AŞAMA 6 TAMAMLANDI`

## AŞAMA 7 — TAM KAMERA AKIŞI ✅

**Tarih:** 2026-09-19 · **Kod değişikliği:** YOK · **Kanıtlar:** `stage7-autoE2e.ts`, `stage7b-rotatedScan.ts` + önceki aşamalar · **İlgili mevcut testler:** captureGates + captureRobustness + omrSafety → **16/16 PASS**

### Akış doğrulama tablosu

| Adım | Durum | Kanıt |
|---|---|---|
| CAMERA (getUserMedia env, ≤2560×1920) | ✅ kod | `CameraCapture.start()` (headless kamera yok; UI ekran görüntüsü akışı doğruluyor) |
| LIVE PAGE DETECTION | ⚠️ **ONLY BOUNDING BOX** | AŞAMA 2 kod kanıtı + AŞAMA 3 sentetik 7 senaryo + 31 gerçek foto ölçümü |
| 4 CORNERS (canlı) | ❌ **NOT IMPLEMENTED** | `pageBoxCorners` köşeleri kutudan türetir |
| CAMERA OVERLAY | ⚠️ | **Soru cevabı:** overlay **dört perspektif köşesini TAKİP ETMİYOR** — SVG `<polygon>` yetenekli ama girdi her zaman eksen-hizalı bbox; beyaz zeminle birleşince kutu ≠ sayfa (10/19 kutu=kare); saha ekran görüntüsünde de kutu sol üstte yapışık |
| CAPTURE | ✅ kod | tam kare `capturePixels`; `pageBox` çekimde kullanılmıyor (itiraf yorumu mevcut) |
| ORIGINAL IMAGE | ✅ | `originalImage` önizlemeye ayrı taşınıyor |
| PERSPECTIVE CORRECTION (otomatik) | ✅ gerçek foto | 4/8 otomatik okuma (aşağıdaki tablo) |
| PERSPECTIVE CORRECTION (manuel) | ⚠️ | geometri 4/4 sentetik; gerçek foto 3/4; köşe-sırası BUG-1 |
| SHADOW NORMALIZATION | ⚠️ | yalnız önizleme (AŞAMA 5); `normalizeShadows` üretimsiz |
| ENHANCEMENT | ⚠️ | 6 mod ölçüldü; ENHANCED FAIL (BUG-2) |
| SHARPEN/CONTRAST | ✅ | halo yok (0.92–2.21); contrast gerçek 1–99 stretch |
| SCAN PREVIEW | ✅ kod | `ScanResultPreview` + `ImageEnhancer`, varsayılan `omr` |
| OMR (analyzePage) | ✅ gerçek foto | aşağıdaki tablo; aynı fiziksel sayfalar çapraz-tutarlı |

### Otomatik pipeline — gerçek fotoğraf uçtan uca (manuel köşe YOK)

| Fotoğraf | Boyut | Sonuç | Not |
|---|---|---|---|
| 1a.jpg | 2205×3300 | ✅ **sayfa 2 · 11 işaretli** | manuel-path okumalarıyla aynı 11 → tutarlı |
| c1.jpg | 1240×1778 | ✅ **sayfa 1 · 20 işaretli** | — |
| c2.jpg | 1240×1759 | ✅ **sayfa 1 · 20 işaretli** | c1 ile aynı fiziksel sayfa → aynı 20 ✓✓ |
| 3a.jpg | 2550×1863 | ✅ sayfa 1 · 21 işaretli | yatay kare bile okundu (kareyi dolduran sayfa + farklı fiziksel kopya) |
| 5a.jpg | 2550×1879 | ❌ QR_UNREADABLE | 4 rotasyonda da aynı → **src/omr yönelim bug'ı DEĞİL**; bu fiziksel baskının QR'ı çözülemiyor (veri/kalite vakası). `src/omr/**` değişiklik yasağı nedeniyle müdahale edilmedi. |
| …526.jpg | 1280×960 | ❌ LOW_RESOLUTION | kalite kapısı: kaynak ≈4.5px/mm < eşik |
| …539.jpg | 1280×960 | ❌ LOW_RESOLUTION | aynı kapı |
| …522.jpg | 960×1280 | ❌ LOW_RESOLUTION | aynı kapı |

### AŞAMA 7 tespitleri

1. **Otomatik yol, yeterli çözünürlük + tam kare sayfada üretim kalitesinde** (4/4 uygun fotoğrafta okudu; iki bağımsız fiziksel sayfa-sayısı/ işaret tutarlılığı kanıtlandı).
2. **Messenger-çözünürlüğü telefon çekimleri (960–1280px) otomatik kapıdan düşüyor** (`LOW_RESOLUTION`) ve bu kod `ALIGNMENT_MISSING` olmadığı için **manuel köşe fallback'i açılmıyor** → kullanıcı yolu kapanıyor. Oysa AŞAMA 4'te aynı fotoğraflar manuel köşeyle **okunabildi**. Bu bir ürün-kararı boşluğu olarak raporlanır (akış değişikliği gerektiğinden AŞAMA 8 kapsamı dışı; minimal müdahale kuralı).
3. **Overlay sorusunun kesin cevabı:** `CameraOverlay`'deki çerçeve **gerçek 4 perspektif köşeyi takip ETMİYOR; yalnızca bbox dikdörtgeni.** (AŞAMA 2/3 kanıtları + saha ekran görüntüsü.)

`AŞAMA 7 TAMAMLANDI`

## AŞAMA 8 — BUG VARSA MİNİMAL DÜZELTME ✅ (2 minimal fix uygulandı)

**Tarih:** 2026-09-19 · **Kurallara uyum:** yeni dependency YOK · mimari değişiklik YOK · `src/omr/**` `src/scoring/**` `src/form/**` DOKUNULMADI · her fix tek dosya, tek fonksiyon · GitHub'dan kod kopyalama YOK

### FIX-1 — BUG-1: manuel köşe sırası 90°-kadrajda anamorfik sıkışma

* **Dosya:** `src/scanner/manualWarp.ts`
* **Neden:** kullanıcı köşeleri kadraj-görsel sırayla işaretliyor; yatık A4'te görsel TL→TR fiziksel uzun kenara denk geliyor, kanonik 210mm kenara maplenince sayfa sıkışıyor → OMR yeniden okuması ALIGNMENT_MISSING.
* **Değişiklik:** yeni saf yardımcı `normalizeCornerOrder(corners, w, h)` — portre sayfada `|TL→BL| < |TL→TR|` ise diziyi 1 döndür; `applyManualCorners` homografiyi normalize edilmiş köşelerle kurar. CCW yön korunur (validation etkilenmez), dik seçimlerde no-op.
* **Doğrulama (önce → sonra):**
  * `…526.jpg` manuel GT rot0: ❌ ALIGNMENT_MISSING → ✅ **ok sayfa=2, 11 işaretli**
  * `…526.jpg` + `…539.jpg`: 4 rotasyonun tamamı artık ✅ ve tutarlı (hepsi sayfa 2, aynı 11 işaret)
  * `…522.jpg`: beklendiği gibi hâlâ ❌ (güçlü perspektif + tek-atım GTAŞ köşe hassasiyeti; regresyon yok — fix öncesi de FAIL idi)
  * Mevcut testler (manualWarp + realPdfManualWarp + omrPerspective): full-suite'te doğrulandı (AŞAMA 9).

### FIX-2 — BUG-2: ENHANCED modu gerçek çekimlerde noise/bantlama

* **Dosya:** `src/scanner/enhancement.ts` (`enhanceLocal`)
* **Neden:** karo bazlı histogram eşitlemede CLAHE klip limiti yok; düz karolarda CDF dikleşip noise ×8 katlanıyor, gölge gradyanı siyah bantlara dönüşüyordu.
* **Değişiklik:** karo histogramına klip limiti (`clipFactor=3` × düz-bin kütlesi) + fazlalığın binlere tekdüze yeniden dağıtımı. 3 parametreli geriye-dönük uyumlu imza (`tileSize` varsayılanı aynı).
* **Doğrulama (önce → sonra), `stage6-filters.ts` yeniden koştu:**
  * P2 zemin noise σ: 80.73 → **21.78** (×8.2 → ×2.2)
  * P2 gölge spread: 51.6 → **28.2** (artık orijinalin 39.2'sinin de altında)
  * P3 zemin noise σ: 65.07 → **2.71**
  * P1 zemin noise σ: 3.61 → **0.07**
  * P2 halka koyuluğu: 83 → 75 (orijinalin %90'ı ≥ %85 kriteri ✓); P2/P3 sheet'leri görsel doğrulandı: bant/siyah leke yok, sayfa okunur
  * Mevcut testler: `enhancement.test.ts` + `shadowNormalization.test.ts` → 12/12 PASS

### Ele alınmayan tespitler (kasıtlı)

* **5a.jpg QR_UNREADABLE:** 4 rotasyonda da aynı — pipeline yönelim bug'ı değil, fiziksel baskıya özgü QR kalite vakası. `src/omr/**` müdahale yasağı → dokunulmadı.
* **LOW_RESOLUTION kapısı messenger çözünürlüğünü reddediyor ve manuel fallback açılmıyor** (fallback yalnız ALIGNMENT_MISSING'de). Aynı fotoğraflar manuel köşeyle okunabildiğinden bu bir ürün-kararı boşluğu; akış değişikliği gerektirir → minimal-müdahale kuralı gereği fix yapılmadı, öneri olarak bırakıldı.
* **Canlı overlay bbox'u:** tasarım gereği "rehber" niteliğinde; gerçek 4-köşe canlı tespit bir **özellik eksikliği** (yeni algoritma gerektirir) → bu görevin "minimal fix" kapsamı dışında, son raporda kayıtlı.

### FIX-3 — LOW_RESOLUTION'da manuel 4-köşe fallback (kullanıcı onaylı akış genişletmesi)

* **Dosya:** `src/components/ScannerWorkspace.tsx` (tek koşul + neden cümlesi; `src/omr/**`/`src/scoring/**` `src/form/**` diff=0)
* **Kural:** yeni algoritma YOK · yeni dependency YOK · manuel akış (**ManualCornerEditor → manualWarp → fitHomography → warpPerspective → analyzePage → OMR**) aynen kullanılıyor · otomatik OMR'da LOW_RESOLUTION yine başarısız/uygunsuz
* **Koşul değişikliği (önce → sonra):**
  ```ts
  // ÖNCE:  if (!result.ok && result.code === 'ALIGNMENT_MISSING') {
  // SONRA: if (!result.ok && (result.code === 'ALIGNMENT_MISSING' || result.code === 'LOW_RESOLUTION')) {
  ```
  Neden cümlesi LOW_RESOLUTION'da "Çözünürlük otomatik okuma için yetersiz." — ALIGNMENT_MISSING metinleri birebir aynı.
* **Kanıt (`scripts/validation/stage8-lowresFallback.ts`):**

  | Fotoğraf | 1) otomatik | 2) koşul | 3-4) manualWarp | 5-6) manuel analyzePage |
  |---|---|---|---|---|
  | `…526` | ❌ LOW_RESOLUTION (semantik korundu) | fallback açılır ✅ | 1680×2376 ✅ | ✅ **sayfa 2 · 11 işaretli** |
  | `…539` | ❌ LOW_RESOLUTION (semantik korundu) | fallback açılır ✅ | 1680×2376 ✅ | ✅ **sayfa 2 · 11 işaretli** |

* **Regresyon (bu fix sonrası):** typecheck PASS · **236/236 PASS** · build PASS · yasak yol diff=0

`AŞAMA 8 TAMAMLANDI`

## AŞAMA 9 — REGRESYON ✅

**Tarih:** 2026-09-19

| Kontrol | Sonuç |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | ✅ PASS |
| `npm test` (`tsx --test tests/*.test.ts` — tam paket, MMPI OMR dahil) | ✅ **236/236 PASS** (18 suite, 116s) |
| `npm run build` (`tsc --noEmit && node scripts/build.mjs`) | ✅ PASS |
| `src/omr/**` değişikliği | ✅ YOK (`git diff --name-only HEAD -- src/omr` → 0 dosya) |
| `src/scoring/**` değişikliği | ✅ YOK (0 dosya) |
| `src/form/**` değişikliği | ✅ YOK (0 dosya) |
| auth sistemi (`src/auth/**`, `tests/authStorage.test.ts`) | ✅ dokunulmadı; auth testleri full-suite içinde PASS |
| kayıt sistemi (`tests/draftStorage`, `recordProfile`, `savedPage` vb.) | ✅ dokunulmadı; full-suite PASS |
| Değişen dosyalar | `src/scanner/manualWarp.ts` (FIX-1), `src/scanner/enhancement.ts` (FIX-2), `optik-form.html` (**repo'nun kendi build scriptinin çıktısı** — kaynak fix'leri içeren yeniden üretilmiş bundle; manuel edit yok) |
| Yeni dosyalar (ürün kodu değil) | `CAMSCANNER_REAL_PHOTO_VALIDATION.md`, `scripts/validation/*.ts` + `scripts/validation/out/*.png` (ölçüm kanıtları) |

`AŞAMA 9 TAMAMLANDI`

---

## SON RAPOR — CAMSCANNER-STYLE REAL PHOTO VALIDATION (A–J)

### A. Gerçek fotoğraflar

* **bulunan fotoğraf sayısı:** 32 (`docs/TestGorselleri/`: 31 JPEG gerçek çekim + 1 PNG uygulama ekran görüntüsü/saha-bug kanıtı)
* **test edilen fotoğraf sayısı:** 31/31 (AŞAMA 3 canlı-tespit taraması) · 8 (otomatik pipeline E2E) · 4 (manuel warp E2E) · 3 sayfa (6 mod × filtre testi; 2 gerçek + 1 türetilmiş)

### B. Canlı kamera 4 köşe

* Gerçek 4 köşe tespiti: **NO**
* Bounding box mı: **YES** (`detectPageBox` → `{x,y,width,height}`; köşeler kutudan cebirsel türetiliyor; overlay her zaman eksen-hizalı dikdörtgen)
* TL: **FAIL** (NOT IMPLEMENTED) · TR: **FAIL** · BR: **FAIL** · BL: **FAIL**
* Ek: 19 telefon fotoğrafının 10'unda kutu = karenin tamamı (beyaz masa birleşimi); sayfa kareyi doldurunca (11 fotoğraf) `too-bright` + kutu yok; saha ekran görüntüsü (`kutucukSolUstteKaldıSorun.PNG`) aynı mekanizmanın kullanıcıdaki tezahürü

### C. Manuel 4 köşe

* Mekanizma (10 kriter): **PASS** (fix sonrası sıra semantiği dahil)
* Perspective correction: **PASS** — sentetik 4/4 (hafif/orta/güçlü/20°-döndürülmüş, RMSE≈14) · gerçek fotoğraf uçtan uca 3/4 (c1 ✅, …526 ✅, …539 ✅ — aynı sayfa 2 iki fotoğraftan aynı 11 işaretle; …522 ❌: güçlü keystone + statik GTAŞ hassasiyeti, dökümante)

### D. Filtreler (fix SONRASI, gerçek fotoğraflarda çalıştırılıp ölçüldü)

* ORIGINAL: **PASS**
* ENHANCED: **PASS** (fix öncesi FAIL idi: noise ×8, bantlama → fix sonrası noise ×2.2'e indi, spread orijinalin altında; sheet görsel doğrulandı)
* GRAY: **PASS**
* BW: **PASS** (gerçek Sauvola; tekdüze arka plan; küçük aşırı-gölge köşe artefaktı not edildi)
* CONTRAST: **PASS (uyarıyla)** — gerçek 1–99 stretch; ama gölgede spread 39→62 ve soluk halka 83→45 aşındırması var
* OMR: **PASS** (gölge −92…−99%, noise ↓, halka 83→102, halo yok)

### E. Shadow

* **PASS** — OMR önizleme modunda flattening gerçek ve ölçülü (P2: 39.2→3.0; P3: 47.4→0.5). Not: gölge düzeltme **OMR okuma hattına girmiyor** (yalnız insan önizlemesi; tasarımsal, dokümante) ve `shadowNormalization.ts`'in üretim çağıranı yok.

### F. Sharpening

* **PASS** — unsharp 3×3 amount 0.4 (OMR modu)
* Halo problemi: **NO** (oran 0.92–2.21; sheet'lerde görünür halo yok)
* Noise problemi: **NO** (OMR modu noise'u düşürüyor: 9.88→5.91)

### G. OMR

* Baloncuk geometrisi korunuyor mu: **YES** (warp + modlar halka bütünlüğünü koruyor; omr modunda koyuluk ↑; contrast'ta soluk halkalar aşınabiliyor — uyarı kayıtlı)
* Mevcut OMR testleri: **236/236** (tam paket; `omrEngine`, `omrPerspective`, `omrSafety`, `omrBackwardCompatibility`, `omrPeripheralIsolation`, `bubbleRing`, `mmpi*` dahil)

### H. Build

* TypeScript: **PASS**
* Tests: **236/236**
* Build: **PASS**

### I. Bulunan gerçek problemler (yalnız gözlenenler)

1. **[FIX EDİLDİ]** Manuel köşe sırası kadraj-görsel → 90°-yatık sayfada anamorfik sıkışma, manuel fallback ikinci kez başarısız oluyordu (gerçek fotoğraflarla reproduce edildi).
2. **[FIX EDİLDİ]** ENHANCED modu kliplenmemiş CLAHE → gerçek fotoğrafta noise ×8 + gölge bantlaması; "Geliştirilmiş" etiketi tersine çalışıyordu.
3. **[KAYITLI — düzeltilmedi]** Canlı kamera tespiti yalnızca bbox: gerçek 4 köşe/perspektif takibi yok; parlak zeminde kutu kadrajı kaplıyor ya da sol üstte takılı kalıyor; >%92 dolulukta (en iyi kadraj) bilinçli reddedilip `too-bright` deniyor.
4. **[FIX EDİLDİ — FIX-3]** Messenger çözünürlüğü (960–1280px) telefon çekimleri `LOW_RESOLUTION` kapısına takılıyor ve bu kod manuel köşe fallback'ini AÇMIYORDU; koşul genişletildi (otomatik semantik aynı), `…526`/`…539` manuel yoldan sayfa 2 · 11 işaretle okunuyor.
5. **[KAYITLI — veri vakası]** `5a.jpg`'nin QR kodu 4 rotasyonda da çözülemiyor (bu fiziksel baskıya özgü kalite; pipeline yönelim bug'ı değil).
6. **[KAYITLI]** `normalizeShadows()` üretimde çağrılmıyor (ölü kod); üretimde yalnızca önizleme OMR modundaki sade kopya çalışıyor. Birleştirme/etkinleştirme ürün kararı.

### J. Yapılan kod değişiklikleri

| Dosya | İçerik |
|---|---|
| `src/scanner/manualWarp.ts` | FIX-1: `normalizeCornerOrder()` + `applyManualCorners`'da kullanımı (portre sayfa, kısa-kenar hizalaması) |
| `src/scanner/enhancement.ts` | FIX-2: `enhanceLocal()` içine CLAHE klip limiti (`clipFactor=3`) + tekdüze yeniden dağıtım |
| `src/components/ScannerWorkspace.tsx` | FIX-3: fallback koşuluna `LOW_RESOLUTION` eklendi + kod-bazlı neden cümlesi (tek koşul; başka davranış değişmedi) |
| `optik-form.html` | repo'nun **kendi build scriptinin** çıktısı olarak yeniden üretildi (manuel edit yok) |
| `scripts/validation/` (yeni) | 8 ölçüm scripti + overlay/sheet kanıt PNG'leri (ürün kodu değil) |
| `CAMSCANNER_REAL_PHOTO_VALIDATION.md` (yeni) | bu mühendislik dosyası |

`SON RAPOR TAMAMLANDI`

---

## DEĞİŞİKLİK GÜNLÜĞÜ

| Tarih | Aşama | Değişiklik |
|---|---|---|
| 2026-09-19 | Dosya oluşturuldu | Hedef tablosu (G1–G19) + AŞAMA 1 sonuçları işlendi |
| 2026-09-19 | AŞAMA 1 rev.2 | Kullanıcı yönlendirmesi: `docs/TestGorselleri/` (32 görsel) envanteri işlendi; rev.1 "BULUNAMADI" kaydı geçersiz işaretlendi |
| 2026-09-19 | AŞAMA 2 | G3/G4 ✅ — ONLY BOUNDING BOX kanıt zinciri işlendi |
| 2026-09-19 | AŞAMA 3 | G5/G6 ✅ — sentetik 7 senaryo + 31 gerçek fotoğraf ölçüm tablosu + overlay kanıtları |
| 2026-09-19 | AŞAMA 4 | G7/G8 ✅ — 10 kriter + sentetik 4/4 + gerçek 3/4 + BUG-1 tespiti |
| 2026-09-19 | AŞAMA 5 | G9–G14 ✅ — 6 mod açıklandı; `normalizeShadows` üretimsiz tespiti |
| 2026-09-19 | AŞAMA 6 | G15 ⚠️ — 6 mod × 3 sayfa nicel + 3 sheet görsel; ENHANCED FAIL → BUG-2 |
| 2026-09-19 | AŞAMA 7 | G16 ✅ — otomatik E2E 4/8; overlay sorusu kesinleşti; LOW_RESOLUTION boşluğu + 5a QR vakası kayıtlı |
| 2026-09-19 | AŞAMA 8 | G17 ✅ — FIX-1 (manualWarp) + FIX-2 (enhancement) uygulandı ve ölçüm/testle doğrulandı |
| 2026-09-19 | AŞAMA 9 + SON | G18/G19 ✅ — typecheck PASS · 236/236 · build PASS · yasak yollar 0 diff; A–J raporu yazıldı |
| 2026-09-19 | Devam (FIX-3) | Kullanıcı onayıyla LOW_RESOLUTION fallback genişletmesi (`ScannerWorkspace.tsx` tek koşul) · kanıt: …526/…539 manuel yol sayfa 2 · 11 işaret · regresyon typecheck PASS · 236/236 · build PASS (2. kez) |
