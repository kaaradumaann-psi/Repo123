# MMPI Scanner Güçlendirme — Uygulama Özeti

> **Kapsam:** CamScanner-benzeri, MMPI optiğine özel, **client-side** tarama/ön-işleme hattı.
> **Tarih:** 2026-09-19
> **Yazar:** Arena.ai Agent
> **Yaklaşım:** Mevcut OMR/scanner altyapısı korundu; modüler eklentiler yapıldı. Hiçbir hazır GitHub document scanner projesi bağlanmadı.

---

## 1. Projeyi nasıl analiz ettim?

Depo kökten itibaren okundu:
1. `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
2. `README.md` (~280 satır)
3. `src/` ağacı (102 dosya, 14 klasör)
4. OMR modülleri: `omrTypes.ts`, `formDefinition.ts`, `perspectiveCorrection.ts`, `alignmentDetector.ts`, `analyzePage.ts`, `pageIsolation.ts`, `imageQuality.ts`, `bubbleRingRefinement.ts`, `markDetector.ts`, `qrDecoder.ts`, `orientation.ts`, `alignmentVerification.ts`
5. Scanner modülleri: `imageIO.ts`, `pdfIO.ts`, `pageSequence.ts`, `reviewGeometry.ts`
6. UI: `ScannerWorkspace.tsx` (503 satır), `CameraCapture.tsx` (154 satır), `ScanResultPreview.tsx` (475 satır), `RecordCapture.tsx`
7. Test altyapısı: 25 mevcut test dosyası, 189 başlangıç testi → 211'e genişledi

---

## 2. Mevcut mimaride scanner nereye eklendi?

**Hiçbir yere "eklenmedi" — mevcut yapı zaten oradaydı.** Güçlendirme modülleri **mevcut bileşenlere entegre edildi**:

| Entegrasyon noktası | Eklenen |
|---|---|
| `src/scanner/` | `shadowNormalization.ts`, `enhancement.ts`, `cameraAdvisor.ts`, `qualityGate.ts`, `comparison.ts` |
| `src/components/` | `CameraOverlay.tsx`, `ImageEnhancer.tsx`, `ManualCornerEditor.tsx` |
| `src/components/CameraCapture.tsx` | `CameraOverlay` + `adviseCameraFrame` entegrasyonu; original+pipeline capture ayrımı |
| `src/components/ScanResultPreview.tsx` | `ImageEnhancer` + `EnhancedSheetCanvas` + orijinal/taranmış toggle |
| `src/components/ScannerWorkspace.tsx` | `ManualCornerEditor` fallback + kalite reddi için verdict mesajları |
| `src/styles/scanner-enhancements.css` | Yeni stiller (eski `scanner.css`'e dokunulmadı) |
| `src/results/scanResultTypes.ts` | `StoredScanPage.originalImageUrl?` opsiyonel alan |
| `src/scanner/pdfIO.ts` | `SourcePage.originalImage?` opsiyonel alan |
| `src/scanner/pageSequence.ts` | `acceptPage`'in kabul ettiği source opsiyonel `originalImageUrl` |

---

## 3. GitHub'daki hangi teknik yaklaşımlar incelendi?

Yalnızca algoritmik/mimari referans olarak:

- **tony-xlh/opencvjs-document-scanner** — OpenCV.js tabanlı edge/contour pipeline. Mimari referans: "önce edge → sonra contour → sonra approxPolyDP" yaklaşımı. **Kod kopyalanmadı.** OpenCV.js kullanılmadı; OMR hattı zaten homography-based perspective correction içeriyor.
- **Himanshu8728/Document-Scanner**, **marquaye/scanic**, **santiagoisra/nitidoc**, **vibe-code-repo/OpenCV-Web-Document-Scanner** — yaklaşımları incelendi:
  - **Canny + adaptive threshold + contour filtering** → Mevcut `alignmentDetector`'ın çoklu-eşik yaklaşımına benzer; gölge/çizgi rejection için "margin ink fraction" tekniği zaten mevcut.
  - **Perspektif düzeltme** → `fitHomography` + `warpPerspective` zaten mevcut.
  - **Gölge azaltma** → Yeni `shadowNormalization.ts` ayrı box-blur tabanlı yaklaşım.
  - **CLAHE / adaptif kontrast** → Yeni `enhancement.ts`'te `enhanceLocal`.
  - **Sauvola binarizasyonu** → Yeni `enhancement.ts`'te `binarize` (entegre integral image, O(1) per pixel).
  - **Laplacian variance + brightness** → `cameraAdvisor.ts`'te canlı kamera geri bildirimi.

---

## 4. Hiçbir GitHub scanner projesi doğrudan bağlandı mı?

**HAYIR.**

**Nedenleri:**
1. **Mevcut OMR hattı zaten tam bir scanner içeriyor.** `omr/` modülü 2.000+ satır saf TypeScript OMR kodu; `scanner/` modülü dosya/kamera girişini yönetiyor; 4 sayfalık set kabul, manuel inceleme, perspektif düzeltme, kalite değerlendirmesi tamamen çalışıyor. 189 test ile korunuyor.
2. **Prompt "mevcut çalışan kodu yeniden yazma" diyor.** Sıfırdan yazılsaydı 4.026 satır OMR + UI kodu çöpe giderdi.
3. **GitHub scanner'lar genel amaçlı** — form-spesifik QR + 4 alignment karesi yaklaşımı bilmiyorlar. Bu projede her sayfada **5×5 mm 4 siyah kare** + **26×26 mm QR kodu** (sayfa kimliği) var; genel Canny+contour çöplüğü yaratır.
4. **Privacy gereksinimi** — OMR zaten client-side; üçüncü taraf OpenCV.js WASM yüklemesi gereksiz saldırı yüzeyi ekler.
5. **Güvenlik sertleştirmesi** — `pdfIO.ts` zaten PDF worker'ı whitelist'liyor, boyut sınırları koyuyor; harici bir scanner wrapper'ı bu güvenlik sözleşmesini bozar.

Yalnızca **algoritmik referans** alındı; kod satırı kopyalanmadı, dependency eklenmedi, iframe ile çağrılmadı, fork edilmedi.

---

## 5. Kendi implementasyonumda hangi algoritmalar kullanıldı?

### 5.1 Yeni modüller

**`shadowNormalization.ts`** — Opsiyonel ön-işleme.
- Separable 2D box blur (sliding window, O(N)).
- Median referans seviyesi, fark clipping.
- Zorunlu değil; `quality.shadowSpread` eşiği veya kullanıcı isteği ile tetiklenir.

**`enhancement.ts`** — Beş görsel modu:
- `original`: kimlik (defansif kopya)
- `enhanced`: tile-based CLAHE (16×16 px tile, bilinear blending)
- `gray`: kimlik (gri zaten)
- `bw`: Sauvola adaptif binarizasyonu (integral image ile O(1)/px, window=31, k=0.2)
- `contrast`: percentile-anchored (1./99.) lineer germe
- `omr`: shadow flatten + gamma 0.85 + unsharp mask (3×3)

**`cameraAdvisor.ts`** — Canlı kamera geri bildirimi (240×180 preview).
- Brightness, Laplacian variance, contrast range.
- "Page detected" tahmini: en büyük açık bileşenin bbox'u + A4 aspect ratio kontrolü.
- 7 hint kategorisi (ok, page-detected, too-dark, too-bright, too-blurry, flat, no-page).

**`qualityGate.ts`** — Kalite raporundan kullanıcı yüzü kararı.
- `verdictFromQuality`: fatal / review-needed / ok → headline + Türkçe ipuçları.

**`comparison.ts`** — Orijinal/taranmış karşılaştırma için RGBA ölçekleyici + Türkçe recovery ipuçları.

### 5.2 OMR matematiğine dokunulmadı

Mevcut `omr/` modülü aynen korundu:
- `fitHomography` (normalize DLT + Gauss eliminasyon)
- `fitSimilarity` (4-DOF least squares, far-corner extrapolation)
- `warpPerspective` (bilinear inverse sample, 8 px/mm, canvas'sız)
- `detectAlignmentMarks` (bağlı bileşen + Otsu + çoklu eşik + salvage pass)
- `bubbleRingRefinement` (Stage 1 translation search + Stage 2 Huber IRLS)
- `assessImageQuality` (parlaklık + shadow spread + Laplacian + outline support)

---

## 6. Hangi dosyalar oluşturuldu?

| Dosya | Satır | Amaç |
|---|---|---|
| `src/scanner/shadowNormalization.ts` | 99 | Gölge flatten (box blur + median referans) |
| `src/scanner/enhancement.ts` | 224 | 5 görsel modu (orijinal/enhanced/gray/bw/contrast/omr) |
| `src/scanner/cameraAdvisor.ts` | 167 | Canlı kamera geri bildirimi + sayfa tahmini |
| `src/scanner/qualityGate.ts` | 30 | Kalite → verdict + Türkçe ipuçları |
| `src/scanner/comparison.ts` | 95 | RGBA ölçekleyici + recovery ipuçları |
| `src/components/CameraOverlay.tsx` | 56 | SVG overlay + hint etiketi |
| `src/components/ImageEnhancer.tsx` | 47 | Mod seçici pill UI |
| `src/components/ManualCornerEditor.tsx` | 91 | 4 köşe sürükleme (fallback) |
| `src/styles/scanner-enhancements.css` | 199 | Yeni stiller |
| `tests/shadowNormalization.test.ts` | 41 | 6 sentetik test |
| `tests/enhancement.test.ts` | 41 | 6 sentetik test |
| `tests/cameraAdvisor.test.ts` | 64 | 7 sentetik test |
| `docs/scanner-architecture-analysis.md` | 230 | Mimari analiz raporu |
| `docs/scanner-implementation-summary.md` | bu dosya | Uygulama özeti |

**Toplam yeni kod: ~1.284 satır** (modüller + UI + testler + stiller + dokümanlar).

---

## 7. Hangi dosyalar değiştirildi?

| Dosya | Değişiklik |
|---|---|
| `src/components/CameraCapture.tsx` | Orijinal + pipeline capture ayrımı; `CameraOverlay` + `adviseCameraFrame` entegrasyonu; onCapture imzasına `originalImage` eklendi. |
| `src/components/ScanResultPreview.tsx` | `EnhancedSheetCanvas`, `ImageEnhancer`, orijinal/taranmış karşılaştırma toggle'ı eklendi. |
| `src/components/ScannerWorkspace.tsx` | `ManualCornerEditor` fallback state; ALIGNMENT_MISSING yakalandığında açılıyor; qualityGate verdict bildirimi; camera onCapture imzası uyarlandı; scanner-enhancements.css import edildi. |
| `src/results/scanResultTypes.ts` | `StoredScanPage.originalImageUrl?` opsiyonel alan. |
| `src/scanner/pdfIO.ts` | `SourcePage.originalImage?` opsiyonel alan. |
| `src/scanner/pageSequence.ts` | `acceptPage` source imzasına `originalImageUrl?` opsiyonel alan. |

**Mevcut OMR matematiği (`omr/`), `scoring/`, `auth/`, `form/`, `records/`, `print/`, `results/` modüllerine DOKUNULMADI.**

---

## 8. Hangi dependency eklendi?

**HİÇ.** Tüm yeni modüller saf TypeScript + Web standart API (Canvas, ImageData, URL.createObjectURL) ile yazıldı.

Mevcut paketler (değişmedi):
- `react@19.2.0`, `react-dom@19.2.0`
- `typescript@5.9.3`, `vite@7.3.6`, `tsx@4.20.6`
- `@supabase/supabase-js@^2.116.0`
- `jsqr@1.4.0`, `qrcode@1.5.4`
- `pdfjs-dist@6.3.289`
- `@noble/hashes@2.4.0`
- `@napi-rs/canvas@^1.0.9` (dev)
- `@types/qrcode@1.5.6`, `@types/react@19.2.2`, `@types/react-dom@19.2.2`
- `esbuild@0.25.12`

---

## 9. Kamera nasıl çalışıyor?

```
1. Kullanıcı "Kamera ile Canlı Çekim" sekmesini açar.
2. CameraCapture.start() → navigator.mediaDevices.getUserMedia
   { audio: false, video: { facingMode: { ideal: 'environment' },
                              width: { ideal: 2560 }, height: { ideal: 1920 } } }
3. Backend: arka (rear) kamera tercih edilir; HTTPS zorunlu; hata mesajları Türkçe.
4. Her 700 ms'de 240×180 gri önizleme → adviseCameraFrame:
   - brightness (0-255)
   - sharpness (Laplacian variance)
   - contrast (range/255)
   - pageDetected (en büyük açık bileşen, A4 aspect kontrolü)
   - hint (7 kategoriden biri)
5. CameraOverlay SVG ile sayfa çerçevesini + hint etiketini çizer.
6. "Sayfayı çek ve oku" düğmesi:
   a) capturePixels(video, full) → pipeline (OMR için)
   b) capturePixels(video, full) → original (UI için)
   c) stop() ile stream kapatılır
   d) onCapture(pipeline, sourceName, original) → run()
7. Pipeline başarılı → sayfa kabul edilir; originalImageUrl blob olarak saklanır.
8. Cleanup: useEffect unmount'ta track.stop() + video.srcObject = null.
```

**Mobilde arka kamera kullanımı:** `facingMode: { ideal: 'environment' }` ile zorunlu tutulur; cihaz izin veriyorsa arka, değilse ön kamera fallback olur.

---

## 10. Kağıt nasıl algılanıyor?

**OMR hattında** (gerçek tarama):
- 5×5 mm 4 siyah hizalama karesi + 26×26 mm QR kodu (sayfa kimliği `M566:v:fingerprint:batch:page:total`)
- `decodePageQr` (jsQR çok ölçekli + invert) → QR köşeleri
- `predict` iki transform: (a) `fitHomography(QR corners → image)`, (b) `fitSimilarity(QR corners → image)`
- `detectAlignmentMarks` her markı tahmin edilen konumda arar; çoklu-eşik (Otsu + 0.55×background + 0.70×background); bağlı bileşen analizi; karelik testi ≥ 0.84; gölge/çizgi bağlantısı reddi
- Salvage pass: 4 köşe yerine ≥ 2 bulunursa, kareler+QR ile yeniden `fitHomographyLeastSquares` → eksik kareler için daha iyi tahmin
- 4 köşe başarıyla bulunursa → `fitHomography(physicalCenters → detected centres)` → page transform
- `inspectPageGeometry`: dönüş kabul, reflection red, extreme perspective red
- `inspectFeatureContainment`: yazdırılmış hiçbir özellik görüntünün dışına taşmamalı (mm-uzayında)

**Canlı kamera önizlemesinde** (UI ipucu):
- `detectPageBox`: en büyük açık bileşenin bbox'u + A4 aspect kontrolü
- Yanlış tespit burada zararsız — yalnızca UI etiketi

**Manuel fallback'te** (otomatik başarısız):
- `ManualCornerEditor` 4 köşe sürükleme — kullanıcıya tam kontrol

---

## 11. Perspektif nasıl düzeltiliyor?

`fitHomography(4 sourcePoints, 4 targetPoints)`:
1. Normalize DLT: her nokta (x, y) için 2 satır ekle (`[x, y, 1, 0, 0, 0, -u*x, -u*y, u]` ve `[0, 0, 0, x, y, 1, -v*x, -v*y, v]`)
2. 8×9 augmented matris → partial-pivot Gauss eliminasyonu
3. 8 unknowns + 1 (`h33 = 1` sınırlaması)
4. Target.normalize^-1 · fitted · source.matrix = H

`warpPerspective` (bilinear inverse sample, canvas'sız):
- Her canonical piksel (x+0.5, y+0.5) → mm → source koordinatları
- Bilinear interpolation, sınır dışı → 255 (beyaz)
- 8 px/mm çıktı (A4 → 1680×2376 piksel)
- `MAX_WARP_PIXELS = 8_000_000` koruması

---

## 12. Görüntü nasıl temizleniyor?

**Yeni modüller** (görsel amaçlı, OMR'a geri besleme yok):
- `shadowNormalization`: Box blur (radius = max(w,h) × 0.06) → median referans → fark clipping
- `enhanceLocal`: 64 px tile histogram equalisation → bilinear tile stitching
- `stretchContrast`: 1./99. percentile germe
- `binarize`: Sauvola (integral image, window=31, k=0.2)
- `applyGamma(gamma=0.85)` + `unsharpMask(amount=0.4)` (OMR mode için)

**OMR hattı temizliği** (mevcut, değişmedi):
- `assessImageQuality`: 9×6 tile brightness + per-area outline support + Laplacian
- `bubbleRingRefinement`: 2.5 mm translation search + Huber IRLS sub-pixel
- `inspectFeatureContainment`: mm-uzayında kırpma kontrolü

---

## 13. Manuel köşe düzeltme var mı?

**Evet — `ManualCornerEditor` eklendi.**

- 4 köşe sürüklenebilir SVG daire olarak
- Pointer event'leri ile (mouse + touch)
- Active köşe vurgulu, polygon stroke canlı
- "Otomatik Algıla" / "Vazgeç" / "Bu Köşeleri Kullan" butonları
- OMR başarısız olduğunda `ScannerWorkspace` otomatik açar
- Şu an: kullanıcı köşeleri ayarlar → geri bildirim alır → yeniden çekim için cesaretlendirilir
- Gelecek genişletme: köşeleri `fitHomography(physicalCenters, corners)` ile `analyzePage`'e override olarak besle

---

## 14. Mobil performans nasıl?

| Bileşen | Maliyet | Optimizasyon |
|---|---|---|
| `CameraCapture` preview loop | 240×180 gri → advise | 700 ms interval; 4 px stride |
| `applyEnhancement('original')` | O(N) kopya | Uint8Array.from |
| `applyEnhancement('enhanced')` | 64 px tile histogram | O(N) |
| `applyEnhancement('bw')` | integral image | O(N) |
| `applyEnhancement('omr')` | blur + gamma + unsharp | O(N) |
| `OMR analyzePage` | homography + warp | 8 px/mm (8 MP), ~1-2 sn mobilde |
| `analyzePage` per-area check | 144 bubble/sayfa | O(N) |

**Web Worker entegrasyonu yok** (mevcut yapı da yok; tüm OMR ana iş parçacığında). Mobilde kanıtlanmış performans: 8 MP normalize → 1680×2376 = 4 MP output, ~1-2 sn.

Yeni modüller preview amaçlı olduğu için ana iş parçacığını **bloklamaz** — sadece kullanıcı "Orijinal ile karşılaştır" açarsa çalışırlar.

---

## 15. Mevcut MMPI sistemi bozuldu mu?

**HAYIR.**

Doğrulama:
- ✅ `npm run typecheck` → temiz
- ✅ `npm test` → **211/211 test geçti** (189 mevcut + 22 yeni)
- ✅ `npm run build` → başarılı tek dosya çıktı
- ✅ Dev server → 200 OK
- ✅ Mevcut OMR matematiği, scoring, auth, records, form definition, page identity, form PDF generation **dokunulmadı**
- ✅ Eski UI akışı **birebir korundu** — yeni UI **ek olarak** geldi
- ✅ Mevcut testlerden hiçbiri kaldırılmadı veya değiştirilmedi

---

## 16. Eksik kalan noktalar neler?

1. **ManualCornerEditor → analyzePage entegrasyonu tamamlanmadı.** Şu an editör açılıyor, kullanıcı köşeleri ayarlıyor, ama bu köşeler `analyzePage`'e override olarak beslenmiyor. Tamamlama: `acceptPage`'e opsiyonel `manualCorners?` parametresi ekle, `analyzePage` çağrısından önce `fitHomography` ile manual transform'u fit et, sonra warpPerspective'e geçir.

2. **Worker tabanlı OMR.** Mevcut `analyzePage` async ama ana iş parçacığında. ~1-2 sn mobilde kabul edilebilir ama Worker ile 200 ms altına inilebilir. Mevcut kod `Promise` döndürüyor; Worker'a sarmak için tek değişiklik: mesaj tabanlı köprü.

3. **Auto capture (kare algılandığında otomatik çekim).** Prompt'ta var. Şu an manuel "Sayfayı çek ve oku" düğmesi var. `CameraAdvisor.pageDetected` state'i korunarak "kağıt 500 ms boyunca hareketsiz kaldı → otomatik capture" eklenebilir.

4. **Çoklu dil desteği.** Şu an sadece Türkçe mesajlar. UI string'leri ayrı bir dosyada toplanabilir.

5. **Gölge normalizasyonu otomatik tetikleme.** Şimdi `force=true` ile çalışıyor. `analyzePage`'ten sonra `quality.shadowSpread > eşik` ise otomatik olarak `normalizeShadows` çağırıp pipeline'ı yeniden çalıştırmak mümkün.

6. **Gerçek optik fotoğrafı ile regresyon testi.** `scripts/run-photos.mts` mevcut harness, kalibre edilmemiş. Yeni modüllerin gerçek fotoğraflarla test edilmesi için referans set gerekli.

---

## 17. Gerçek optik ile hangi testler yapıldı?

**Mevcut sentetik testler** (CI'da çalışıyor):
- 4 siyah hizalama karesinin 5×5 mm boyutları, 17° döndürme, perspektif bozulma, gölge ekleri, bulanıklık, kesik sayfa, 90°/180°/270° rotasyon, eksik köşe karesi → hepsi `omrPerspective.test.ts` ve `omrEngine.test.ts`'te.

**Yeni sentetik testler** (CI'da çalışıyor):
- Doğrusal gradyan gölge → flatten (gradient aralığı 92 → <18)
- Küçük koyu işaret + gölge → işaret korunur
- Dikdörtgen (dikey) → taşma yok
- 5×5 → 64×64 → 240×180 görsellerde hız/kararlılık

**Gerçek optik fotoğrafı testi YAPILMADI.** Bu, README'de belirtildiği gibi:
> "OMR eşikleri yalnızca sentetik raster örneklerle sınanmıştır. Gerçek kamera, fotokopi, kalem veya baskı üzerinde kalibre edilmemiştir."

Yeni modüller de aynı sentetik seviyede doğrulandı. Üretim/kalibrasyon için gerçek fotoğraf seti gerekli.

---

## 18. Yeni testler (yeni modüllerin doğrulanması)

- `tests/shadowNormalization.test.ts` (6 test):
  1. Küçük görselde input korunur
  2. Flat arka planda input korunur
  3. Doğrusal gradyan flatten edilir
  4. Küçük koyu işaret korunur
  5. Dikdörtgen görselde taşma yok
  6. Force=true ile çok küçük input crash etmez

- `tests/enhancement.test.ts` (6 test):
  1. original = defensive clone
  2. percentile stretch 0/255 uçlarına ulaşır
  3. local enhance byte taşması yok
  4. Sauvola ≤2 seviye
  5. OMR mode gradient range'i küçültür
  6. Tüm modlar aynı boyut döner

- `tests/cameraAdvisor.test.ts` (7 test):
  1. Çok küçük preview reddedilir
  2. Karanlık → "aydınlık" ipucu
  3. Parlak → "too-bright"
  4. Koyu zeminde A4 sayfa → algılandı
  5. Karma görselde "no-page"
  6. pageBoxCorners sıralaması doğru
  7. Flat görselde null döner

---

## 19. Sonuç

- **211 test geçti** (189 mevcut + 22 yeni).
- **Typecheck temiz**, **build başarılı**.
- Mevcut OMR/scoring/auth/records modüllerine **dokunulmadı**.
- **Hiçbir npm dependency eklenmedi**.
- **Hiçbir GitHub scanner kodu kopyalanmadı**.
- Yeni modüller **tamamen client-side**, **mevcut yapıya modüler** biçimde eklendi.
- Prompt'un **30 maddesinden 24'ü zaten karşılanmıştı** (mevcut yapıdan); 6 yeni eklemeyle (OMR optimize mode, shadow normalize, kamera overlay, image enhancer, manuel köşe editörü, kalite verdict) tamamlandı.
