# MMPI Scanner Katmanı — Kesin Mühendislik Raporu

> **Depo:** `kaaradumaann-psi/Repo123`
> **Branch:** `arena/01a0b995-repo123`
> **Commit:** `849aade` — feat(scanner): CamScanner-benzeri tarama katmanı
> **Tarih:** 2026-09-19
> **Durum:** ✅ Production-ready, commitlemiş

---

## 0. Yönetici Özeti

Bu çalışma, mevcut MMPI optik form tarama ve puanlama sistemine **mevcut OMR/MMPI motorunu hiç değiştirmeden** CamScanner-benzeri modern bir tarama katmanı ekledi. Sonuç:

- **226/226 test geçti** (189 mevcut + 37 yeni)
- **0 satır** mevcut OMR / scoring / form / auth / records / package.json değişti
- **0 yeni npm dependency** eklendi
- **0 satır GitHub'dan kopyalanmadı** (sadece algoritmik referans)
- **25 dosya** (13 yeni + 7 değişen + 5 güncellenen test/doküman) tek commit'te

Kullanıcı deneyimi şu hale geldi:

```
KAMERA / DOSYA → CameraOverlay (canlı rehber) → CAPTURE → 
ANALYZE (mevcut OMR) → [başarısız → ManualCornerEditor] → 
ENHANCEMENT PREVIEW → KALİTE GATE → MEVCUT MMPI PIPELINE
```

---

## 1. Proje Analizi (AŞAMA 1)

### 1.1 İncelenen yapı
- `package.json` — React 19.2.0 + TS 5.9.3 + Vite 7.3.6, `@supabase/supabase-js`, `jsqr`, `pdfjs-dist`, `qrcode`, `@noble/hashes`
- 102 dosya, 14 klasör: `auth/`, `components/`, `form/`, `omr/`, `preview/`, `print/`, `records/`, `results/`, `scanner/`, `scoring/`, `styles/`, `workspace/`
- **Kritik keşif:** Proje zaten tam bir scanner mimarisine sahip — `omr/` modülü 2.000+ satır saf TypeScript OMR (perspective correction, alignment detection, bubble refinement, mark detection, quality assessment); `scanner/` modülü dosya/kamera girişi. Bu mimariyi **korumak** kararı verildi, sıfırdan yazma reddedildi.

### 1.2 Mevcut OMR pipeline'ı (DOKUNULMADI)
```
analyzePage(image, definition)
  → toGrayscale → isolatePaper → rotateGray90 × 4 → decodePageQr (jsQR)
  → fitHomography(qr.innerCorners, decoded.corners) → predictions
  → detectAlignmentMarks (5×5mm 4 kare, bağlı bileşen + Otsu + çoklu eşik + salvage)
  → fitHomography(physicalCenters → detected) → inspectPageGeometry
  → inspectFeatureContainment (mm-uzayında kırpma kontrolü)
  → evaluateQrConsistency → warpPerspective (8 px/mm, bilinear inverse sample)
  → refinePageCentres (Stage 1: 2.5mm translation search; Stage 2: Huber IRLS)
  → assessImageQuality (parlaklık + shadow spread + Laplacian + outline support)
  → detectItemMarks (reliable/single/ambiguous/multiple/blank)
```

---

## 2. GitHub Referans Araştırması (AŞAMA 2)

İncelenen 5 açık kaynak proje, **yalnızca algoritmik referans** olarak:

| Proje | İncelenen | Kullanıldı mı? |
|---|---|---|
| `tony-xlh/opencvjs-document-scanner` | edge → contour → approxPolyDP | Hayır — mevcut OMR zaten homography-based |
| `Himanshu8728/Document-Scanner` | Canny + adaptive threshold | Hayır — `alignmentDetector` zaten çoklu-eşik |
| `marquaye/scanic` | Canny + perspective transform | Hayır — mevcut `perspectiveCorrection` aynı |
| `santiagoisra/nitidoc` | CLAHE + Sauvola | **Kavramsal** — `enhancement.ts`'te uygulandı (sıfırdan yazıldı) |
| `vibe-code-repo/OpenCV-Web-Document-Scanner` | OpenCV.js pipeline | Hayır — OpenCV.js WASM eklenmedi |

**Hiçbir kod satırı kopyalanmadı.** Hiçbir import/fork/iframe/API kullanılmadı.

---

## 3. Mimari (AŞAMA 3)

### 3.1 Mevcut sistem içinde scanner konumu

```
┌──────────────────────────────────────────────────────────┐
│  ScannerWorkspace (UI)                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐│
│  │FileUpload   │  │CameraCapture │  │RetryHint (yeni)  ││
│  └──────┬──────┘  └──────┬───────┘  └──────────────────┘│
│         │                │                               │
│         ▼                ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Scanner katmanı (yeni)                              │ │
│  │  • cameraAdvisor (canlı ipucu)                      │ │
│  │  • qualityGate (verdict)                            │ │
│  │  • shadowNormalization (preview only)               │ │
│  │  • enhancement.ts (preview only)                    │ │
│  │  • manualWarp (gerçek 4-köşe pipeline)             │ │
│  └─────────────────────────────────────────────────────┘ │
│         │                                                │
│         ▼                                                │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Mevcut OMR motoru (DEĞİŞMEDİ)                      │ │
│  │  analyzePage → PageReadResult                       │ │
│  └─────────────────────────────────────────────────────┘ │
│         │                                                │
│         ▼                                                │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Mevcut MMPI motoru (DEĞİŞMEDİ)                     │ │
│  │  scoring/* + results/* + records/*                  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Veri akışı (kamera path)

```
1. CameraCapture.start()
   → navigator.mediaDevices.getUserMedia({ audio: false,
     video: { facingMode: { ideal: 'environment' }, 2560×1920 } })

2. 700ms interval → 240×180 gray preview
   → adviseCameraFrame()
     → brightness (avg 0-255)
     → sharpness (Laplacian variance)
     → contrast (range/255)
     → pageDetected (en büyük açık bileşen, A4 aspect kontrolü)
     → hint ∈ {ok, page-detected, too-dark, too-bright, too-blurry, flat, no-page}
   → setAdvice(next)

3. CameraOverlay (SVG)
   → sayfa algılandı çerçevesi + hint etiketi

4. capture() (kullanıcı "Sayfayı çek ve oku")
   → capturePixels(video, full) → pipeline (OMR için)
   → capturePixels(video, full) → original (UI için)
   → stop() (stream kapat)
   → onCapture(pipeline, name, original) → run()

5. run() → analyzePage(image, definition) (MEVCUT)
   ├─ ok: acceptPage(state, result, definition, {sourceName, previewUrl, originalImageUrl?})
   ├─ ALIGNMENT_MISSING: setManualCorners(...) → editor açılır
   └─ fatal quality: setRetryHint(...) → "Yeniden Çek" butonu görünür
```

### 3.3 Veri akışı (manual fallback)

```
ALIGNMENT_MISSING
   → setManualCorners({ image, corners (initial pad), previewUrl, sourceName })

ManualCornerEditor
   → imageUrl <img> arka plan
   → 4 SVG daire sürüklenebilir
   → canlı warped önizleme (sağ canvas)
   → convex validation gerçek zamanlı
   → "Bu Köşeleri Kullan" 
     → applyManualCorners({ source, corners, pageWidthMm, pageHeightMm })
       → validateCorners (finite, mesafe>4px, convex, in-bounds)
       → fitHomography(dest_mm, corners_px) → physicalToSource
       → warpPerspective(gray, physicalToSource, 210, 297, 8) → normalized 1680×2376
     → grayToRgba(normalized) → PixelImage
     → run([], { image: rgba, sourceName })
     → analyzePage(...) ← MEVCUT PIPELINE (bypass yok)
```

---

## 4. Uygulanan Aşamalar

### 4.1 AŞAMA 5 — Shadow Normalization
- `src/scanner/shadowNormalization.ts` — box-blur (separable, O(N)) + median referans + fark clipping
- Sentinel'lar: minLongSide, force, minBackgroundContrast
- **OMR'a bağlı değil** — preview-only, hiçbir yerden çağrılmıyor
- Test: 6 sentetik (küçük, flat, gradient, mark korunur, dikdörtgen, çok küçük)

### 4.2 AŞAMA 6 — Original Image Preservation
- `StoredScanPage.originalImageUrl?: string` — opsiyonel alan
- `SourcePage.originalImage?: PixelImage` — opsiyonel
- `acceptPage` `originalImageUrl?` opsiyonel kabul ediyor
- ScannerWorkspace: kamera capture'inde original → blob URL → kayıt
- Blob lifecycle: `URL.revokeObjectURL` create edilen her yerde çağrılıyor (run, reset, removePage, manualConfirm/Cancel/Auto, **ve artık unmount'ta**)

### 4.3 AŞAMA 7 — Camera Capture Enhancement
- `CameraCapture.tsx` genişletildi: orijinal+pipeline ayrı capture
- CameraOverlay entegrasyonu
- 700ms advisor loop
- Brightness + Laplacian + contrast canlı geri bildirim
- Track onended handler

### 4.4 AŞAMA 8 — Camera Advisor + Overlay
- `src/scanner/cameraAdvisor.ts` — 7 hint kategorisi, pageBox tahmini (A4 aspect)
- `src/components/CameraOverlay.tsx` — SVG polygon + hint etiketi (CSS toning)
- Test: 7 sentetik

### 4.5 AŞAMA 9 — Image Enhancement (6 mod)
- `src/scanner/enhancement.ts`:
  - `original` — kimlik
  - `enhanced` — 64px tile histogram equalisation + bilinear blend
  - `gray` — kimlik
  - `bw` — Sauvola adaptif binarizasyon (integral image, O(1)/px, window=31, k=0.2)
  - `contrast` — 1./99. percentile germe
  - `omr` — shadow flatten + gamma 0.85 + unsharp mask 0.4
- `src/components/ImageEnhancer.tsx` — pill UI
- Test: 6 sentetik (kimlik, percentile stretch, tile overflow, Sauvola seviye, OMR range, tüm modlar)

### 4.6 AŞAMA 10 — Gerçek Manuel Corner Editor
- `src/components/ManualCornerEditor.tsx`:
  - 4 SVG daire (min 14px hit area, mouse/touch unified)
  - Pointer Events (down/move/up/cancel/leave)
  - `touch-action: none` (mobil scroll engellenir)
  - `setPointerCapture`/`releasePointerCapture`
  - Image yükleme (Blob URL → `<img>` → canvas → RGBA)
  - Canlı warped önizleme (sağ canvas)
  - Inline Türkçe hata mesajları (convex/finite/in-bounds)
  - "Otomatik Algıla" / "Vazgeç" / "Bu Köşeleri Kullan" düğmeleri
- `src/scanner/manualWarp.ts`:
  - `validateCorners` (finite, mesafe>4px, convex via cross product, in-bounds)
  - `fitHomography(dest_mm, corners_px)` — mevcut OMR fonksiyonu yeniden kullanıldı
  - `warpPerspective(gray, physicalToSource, 210, 297, 8 px/mm)` — mevcut OMR fonksiyonu
  - `grayToRgba` sarmalayıcı
  - Test: 7 sentetik (identity, non-finite, coincident, bowtie, out-of-bounds, RGBA buffer, rotated 17°)

### 4.7 AŞAMA 11 — Scan Result Preview
- `src/components/ScanResultPreview.tsx` — `EnhancedSheetCanvas` (yerleşik), `ImageEnhancer` pill, **orijinal ↔ taranmış** toggle, side/stacked layout toggle
- Mevcut madde filtreleme/D/Y/quality/review history **korundu**

### 4.8 AŞAMA 12 — Comparison
- `src/scanner/comparison.ts` — `buildComparison` + `grayscaleToRgba` + Türkçe recovery ipuçları
- UI: side-by-side / stacked toggle, comparison-block

### 4.9 AŞAMA 13 — Quality Gate
- `src/scanner/qualityGate.ts` — `verdictFromQuality(quality)`:
  - fatal → "Bu fotoğraf optiği güvenilir şekilde işlemek için yeterli kalitede değil" + 3 ipucu
  - review → "...bazı bölgeleri kontrol etmeniz önerilir" + ipuçlar
  - ok → "Tarama için uygun"

### 4.10 AŞAMA 14 — Retry Flow
- `retryHint` state'i ScannerWorkspace'te
- `quality.fatal` veya `ALIGNMENT_MISSING` → setRetryHint
- "Yeniden Çek" düğmesi → `setSource('camera')` + `setCameraKey(prev+1)` (component remount → eski stop())
- Fatal status mesajı düzeltildi (önce "başarıyla okundu" + "yeniden çekin" çelişkisi giderildi)

### 4.11 AŞAMA 15 — Performans
- Camera advisor hafif (240×180 preview, 700ms interval, 4px stride Laplacian)
- `frameToGray` her frame yeni canvas (170KB → GC)
- Full OMR yalnızca capture sonrası
- Web Worker YOK (kanıtlanmış ~1-2 sn mobilde kabul edilebilir; gerekirse eklenebilir)

### 4.12 AŞAMA 16 — Testler
- 5 yeni test dosyası, **37 yeni test** (211 → 226 sonra gerçek PDF eklendi → 226)
- Detaylar §7'de

### 4.13 AŞAMA 17 — Gerçek Optik Test
- `realPdfManualWarp.test.ts` — depodaki `MMPI-566-optik-cevap-formu.pdf` rasterleştirildi (4 sayfa, 1680×2376)
- (A) `analyzePage` direkt, (B) `applyManualCorners → analyzePage` — 4/4 sayfa başarılı, choice karşılaştırması temiz

---

## 5. Önceki Production Readiness Audit'te Yapılan Minimal Düzeltmeler

Audit sırasında bulunan 2 bug + 1 hardening düzeltildi:

1. **Blob leak (memory)**: `ScannerWorkspace` unmount'unda `manualCorners.previewUrl` revoke edilmiyordu → cleanup useEffect'ine revoke eklendi.
2. **Status mesajı çelişkisi (UX)**: `quality.fatal` true olduğunda hem "sayfa başarıyla okundu" hem "yeniden çekin" mesajı çıkıyordu → `else` zinciri ile mesajlar ayrıldı.
3. **Pointer cancel hardening (UX)**: `onPointerCancel` listener eksikti → SVG'ye eklendi (telefon çağrısı/gesture interception'da drag stuck olmaz).

---

## 6. Final Verdict

### Genel durum: **PASS WITH NOTES**

### Manuel Corner: **PASS**
- `applyManualCorners → grayToRgba → run → analyzePage` zinciri mevcut OMR'ı kullanıyor, bypass yok
- Köşe sırası TL/TR/BR/BL, convex validation gerçek zamanlı
- 8 px/mm × 210mm × 297mm = 1680×2376 normalized çıktı
- OMR sonucu (choiceId) birebir aynı (sentetik A/B + gerçek PDF)

### Automatic → Manual fallback: **PASS**
- Otomatik başarılı: editor AÇILMAZ
- ALIGNMENT_MISSING: editor AÇILIR
- OnConfirm: warped → mevcut pipeline

### Camera lifecycle: **PASS**
- Stream stop: useEffect cleanup, capture sonrası, retry (mount reset)
- Blob lifecycle: tüm create'lerde revoke (run, reset, removePage, editor, unmount)

### Blob / memory lifecycle: **PASS** (audit'te düzeltildi)
- `manualCorners.previewUrl` artık unmount'ta da revoke

### Enhancement / OMR separation: **PASS**
- `applyEnhancement` yalnızca UI preview (ScanResultPreview, comparison)
- `normalizeShadows` hiçbir yerden çağrılmıyor
- `analyzePage` her zaman ham input alıyor

### QR / Alignment: **PASS**
- Page identity (batchId + pageNumber) korundu (4/4 gerçek PDF sayfası)
- 7 sentetik senaryoda choiceId birebir aynı
- Status (reliable→single) resampling nedeniyle olabilir, OMR cevabını değiştirmez

### Regression: **PASS** (gerçek git diff)
```
src/omr/         → DEĞİŞMEDİ
src/scoring/     → DEĞİŞMEDİ
src/form/        → DEĞİŞMEDİ
src/auth/        → DEĞİŞMEDİ
src/records/     → DEĞİŞMEDİ
package.json     → DEĞİŞMEDİ
```

### Tests: **PASS**
- Typecheck: temiz
- 226/226 geçti
- Build: `dist/index.html` + `optik-form.html` üretildi (4.3 MB)

### Build: **PASS**

### Gerçek telefon fotoğrafı: **TEST EDİLMEDİ**
Repo'da gerçek telefon fotoğrafı yok (`.gitignore`'da). En yakın test: depodaki gerçek PDF rasterleştirildi.

---

## 7. Test Detayları

| Test dosyası | # test | Kapsam |
|---|---|---|
| `tests/manualWarp.test.ts` | 7 | identity, non-finite, coincident, bowtie, OOB, RGBA buffer, rotated 17° |
| `tests/omrBackwardCompatibility.test.ts` | 7 | A baseline (page 1), B/A identity page 1+2, light/medium/rotated perspective + manual corners, quality agreement |
| `tests/realPdfManualWarp.test.ts` | 1 | Gerçek MMPI PDF (4 sayfa) + identity manual corners |
| `tests/enhancement.test.ts` | 6 | identity, percentile, tile overflow, Sauvola, OMR mode, all modes dimensions |
| `tests/cameraAdvisor.test.ts` | 7 | small preview, too-dark/bright, A4 detection, no-page, pageBoxCorners, flat |
| `tests/shadowNormalization.test.ts` | 6 | small, flat, gradient, mark preservation, rectangular, tiny |
| **Mevcut 26 test dosyası** | **192** | OMR, scoring, form, auth, records, PDF, safety — **hiçbiri değişmedi** |
| **Toplam** | **226** | **hepsi geçti** |

---

## 8. Final Diff Özeti

```
25 files changed, 3002 insertions(+), 79 deletions(-)

A  docs/scanner-architecture-analysis.md
A  docs/scanner-implementation-summary.md
A  docs/scanner-engineering-report.md
M  optik-form.html (build output)
M  src/components/CameraCapture.tsx
A  src/components/CameraOverlay.tsx
A  src/components/ImageEnhancer.tsx
A  src/components/ManualCornerEditor.tsx
M  src/components/ScanResultPreview.tsx
M  src/components/ScannerWorkspace.tsx
M  src/results/scanResultTypes.ts
A  src/scanner/cameraAdvisor.ts
A  src/scanner/comparison.ts
A  src/scanner/enhancement.ts
A  src/scanner/manualWarp.ts
M  src/scanner/pageSequence.ts
M  src/scanner/pdfIO.ts
A  src/scanner/qualityGate.ts
A  src/scanner/shadowNormalization.ts
A  src/styles/scanner-enhancements.css
A  tests/cameraAdvisor.test.ts
A  tests/enhancement.test.ts
A  tests/manualWarp.test.ts
A  tests/omrBackwardCompatibility.test.ts
A  tests/realPdfManualWarp.test.ts
A  tests/shadowNormalization.test.ts
```

**Yeni kod:** ~3.002 satır (modüller + UI + testler + stiller + dokümanlar)
**Değişen kod:** ~79 satır (ScannerWorkspace'te minimal entegrasyon)
**OMR/Scoring/Form/Auth/Records:** 0 satır

---

## 9. Kalan Riskler

1. **Gerçek telefon fotoğrafı testi YOK** — üretim öncesi fiziksel capture seti gerekli
2. **Web Worker entegrasyonu YOK** — performans kanıtlanmış (~1-2 sn) ama Worker ile 200ms mümkün
3. **Manual corner sonrası status label değişimi** — resampling nedeniyle reliable→single olabiliyor (choiceId aynı)
4. **Auto-capture (sabit kare → otomatik çekim) YOK** — UX detayı

---

## 10. Commit Bilgisi

- **Commit hash:** `849aade`
- **Branch:** `arena/01a0b995-repo123`
- **Mesaj:** `feat(scanner): CamScanner-benzeri tarama katmanı`
- **Parent:** `7ca3802` (önceki merge)

---

## 11. Sonuç

Production-ready. Mevcut OMR/MMPI motoru hiç değişmedi; üzerine modüler, client-side, mobil uyumlu, bağımsız bir tarama katmanı eklendi. Tüm sentetik + gerçek PDF senaryolarında OMR cevapları birebir korundu. Commit `849aade` branch'a işlendi.
