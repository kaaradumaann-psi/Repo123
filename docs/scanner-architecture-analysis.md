# MMPI Scanner Mimarisi — Analiz Raporu ve Yol Haritası

> **Kapsam:** `kaaradumaann-psi/Repo123` deposu. CamScanner-benzeri, MMPI optiğine özel, **client-side** tarama/ön-işleme hattı.
> **Tarih:** 2026-09-19
> **Yazar:** Arena.ai Agent
> **Karar:** Mevcut çalışan sistemi koruyarak, modüler biçimde güçlendirme.

---

## 1. Projeyi nasıl analiz ettim?

Depoyu kökten itibaren okudum:

1. `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` → framework ve build.
2. `README.md` (~280 satır) → yüksek düzey mimari, kapsam ve sınırlar.
3. `src/` ağacı (102 dosya, 14 klasör) → modüler yapı haritası.
4. OMR ve scanner modülleri baştan sona:
   - `src/omr/omrTypes.ts`, `formDefinition.ts`, `perspectiveCorrection.ts`,
     `alignmentDetector.ts`, `analyzePage.ts`, `pageIsolation.ts`,
     `imageQuality.ts`, `bubbleRingRefinement.ts`, `markDetector.ts`,
     `qrDecoder.ts`, `orientation.ts`, `alignmentVerification.ts`
   - `src/scanner/imageIO.ts`, `pdfIO.ts`, `pageSequence.ts`, `reviewGeometry.ts`
   - UI bileşenleri: `ScannerWorkspace.tsx`, `CameraCapture.tsx`,
     `ScanResultPreview.tsx`, `RecordCapture.tsx`
5. Stil sistemi: `src/styles/scanner.css` ve diğerleri.
6. Test harness'i: `tests/pdfScanPipeline.test.ts` ve diğerleri.

---

## 2. Mevcut mimari — ne var?

### 2.1 Frontend
- **Framework:** React 19.2.0 + TypeScript 5.9.3 (strict).
- **Build:** Vite 7.3.6 → tek dosya (`optik-form.html`) inline script ile.
- **Routing:** Hash tabanlı (`#/optik-form`, `#/kayitlar`, …); SPA ama tek HTML çıktı.
- **State:** Hook tabanlı yerel state + `localStorage` taslak (30 gün TTL).
- **UI:** Token-temelli (`screen.css` → `theme.css`); DM Sans + Newsreader; düz, editoryal tasarım dili.

### 2.2 Kimlik, veri
- **Auth:** Supabase Auth + RLS + Edge Function (admin ataması). sessionStorage'da oturum, localStorage'da taslak, server'da kayıt.
- **DB:** Supabase (Postgres + RLS), `profiles`, `mmpi_records` tabloları.

### 2.3 MMPI modülü
- **Form tanımı:** `src/omr/formDefinition.ts` — A4, 4 sayfa, 566 madde, 1132 bubble.
- **Puanlama:** `src/scoring/mmpi*.ts` — Savaşır 1981 Türk normları, K düzeltme, geçerlik/klinik/kod yorumu, kritik maddeler, tutarlılık, türetilmiş ölçekler.
- **Sayfa kimliği:** `src/form/pageIdentity.ts` — `M566:v:fingerprint:batch:page:total` QR'ı.
- **Kayıt:** `src/records/supabaseRecords.ts` — ham OMR cevapları + danışan metadata'sı, idempotent outbox kuyruğu.

### 2.4 Optik (OMR) hattı
- `src/omr/` altında:
  - `analyzePage.ts` (163 satır) — sayfa yönlendirmesi (90°×4 QR otoriteli), `pageIsolation`, QR çözümleme, alignment kareleri bulma, homography fit, perspektif düzeltme, kalite değerlendirmesi, halka iyileştirme, bubble okuma.
  - `perspectiveCorrection.ts` (266 satır) — `fitHomography` (4 köşe, normalize DLT + Gauss eliminasyon), `fitHomographyLeastSquares`, `fitSimilarity`, `mapPoint`, `warpPerspective` (bilinear inverse sample, canvas'sız), `inspectPageGeometry`, `inspectFeatureContainment` (mm-uzayında kırpma kontrolü).
  - `alignmentDetector.ts` (382 satır) — 5×5 mm siyah kareleri arar; bağlı bileşen analizi; Otsu + arka plan 85. percentile ile çoklu eşik; kare doluluk ≥ 0.84; gölge/çizgi bağlantısı reddi; salvage pass (bulunan karelerle yeniden fit).
  - `pageIsolation.ts` (91 satır) — koyu masa üzerinde sayfayı kırpar; tam-kenarlı taramaları değiştirmez.
  - `imageQuality.ts` (114 satır) — parlaklık, gölge yayılımı, Laplacian varyansı, kenar kontrastı, halka bütünlüğü; üç kademe: `ok`, `!ok` (inceleme), `fatal` (okunmaz).
  - `bubbleRingRefinement.ts` (586 satır) — per-bubble halka iyileştirmesi: Stage 1 translation search + Stage 2 Huber IRLS sub-pixel fit.
  - `markDetector.ts` (263 satır) — bubble iç/dış merkez örneklemesi, komşu izolasyon, durum sınıflandırması (`reliable`/`single`/`ambiguous`/`multiple`/`blank`).
  - `qrDecoder.ts` — jsQR çok ölçekli + invert.
  - `orientation.ts` — 90° döndürme, QR köşe sırasından dik yön.
  - `alignmentVerification.ts` — bulunan transform ile QR köşelerinin mutabakatı.
  - `formDefinition.ts` — şablon sabitleri, SHA-256 yerleşim özeti, `getBubbleGeometry()`.

### 2.5 Scanner girişi
- `src/scanner/imageIO.ts` (194 satır) — magic-byte sniff (JPG/PNG/WEBP/HEIC/GIF/PDF), boyut korumaları (24 MB / dosya, 96 MB / batch, 40 MP / 16k px), `readImageFile`, `capturePixels`, `normalizedThumbnail`.
- `src/scanner/pdfIO.ts` (186 satır) — pdf.js ile rasterize (1680×… sayfa).
- `src/scanner/pageSequence.ts` (67 satır) — sayfa sırası, manuel inceleme, eksik sayfa.
- `src/scanner/reviewGeometry.ts` (14 satır) — satır dikdörtgeni hesabı.

### 2.6 UI
- `ScannerWorkspace.tsx` (503 satır) — dosya yükleme sekmesi + kamera sekmesi, ilerleme kartı, 4 sayfa önizleme kartı, metrik şeridi, sayfa inceleme alanı, danışan formu, kayıt.
- `CameraCapture.tsx` (154 satır) — `getUserMedia` `facingMode: 'environment'`, 240 px preview üzerinde brightness + Laplacian varyansı canlı geri bildirim, hata Türkçe metinleri, stream kapatma.
- `ScanResultPreview.tsx` (475 satır) — sayfa önizleme kartı, kalite dropdown, filtre/aramalı madde listesi, kırpılmış satır görüntüsü + outline overlay, D/Y seçim butonları, inceleme geçmişi.
- `RecordCapture.tsx` (254 satır) — danışan bilgi formu + kayıt.

### 2.7 Stil
- `src/styles/scanner.css` → scanner'a özel `scan-camera*`, `scanner-layout*`, `scan-pages-grid`, `scan-crop-*` sınıfları.

---

## 3. CamScanner-benzeri hangi özellikler eksik?

Aşağıdaki tablo, prompttaki 30 maddenin **mevcut projede karşılanma durumunu** gösterir:

| # | Prompt özelliği | Mevcut durum | Yorum |
|---|---|---|---|
| 1 | GitHub scanner referansı | Yok | Mimari analiz aşamasında değerlendirildi. |
| 2 | Mevcut proje analizi | Yok (rapor) | Bu doküman. |
| 4 | Yol haritası | Yok (rapor) | Bu doküman. |
| 5 | Amaç: FOTOĞRAF → TEMİZLENMİŞ OPTİK | **Var** | `analyzePage` tam olarak bunu yapıyor. |
| 6 | Dosya/kamera çift girişi | **Var** | `ScannerWorkspace` iki sekme, `imageIO.readImageFile` + `CameraCapture`. |
| 7 | Canlı kamera yönlendirme | **Yarı var** | Brightness + blur var; "optik algılandı" çerçeve göstergesi **yok**. |
| 8 | Document detection | **Form-spesifik** | Sayfa köşeleri değil; 4 alignment karesi + QR ile. Genel Canny/contour **yok** (ve gerekmiyor — form sabit). |
| 9 | Document validation | **Var** | `inspectFeatureContainment`, `inspectPageGeometry`, kare/solid/karelik testleri. |
| 10 | Perspective correction | **Var** | `fitHomography` + `warpPerspective` (canvas'sız, 8 px/mm). |
| 11 | Manuel köşe düzeltme | **Kısmen** | Manuel madde inceleme var (D/Y seçim); köşe sürükleme **yok**. |
| 12 | CamScanner modları (orijinal/gri/BW/yüksek kontrast) | **Kısmen** | Görsel sadece grayscale warp çıktısı; önizlemede "orijinal/taranmış" toggle **yok**. |
| 13 | OMR için optimize mod | **Var** | `bubbleRingRefinement` + per-bubble ring outline check + `imageQuality` üç kademe kalite; cevap işaretleri için ince ayar zaten yapılıyor. |
| 14 | Gölge/ışık normalizasyonu | **Yarı var** | Laplacian variance + shadow spread + per-tile background percentile; adaptif threshold yok. |
| 15 | Görüntü kalitesi geri bildirimi | **Var** | `quality.score` (0–1), `quality.reasons` Türkçe. |
| 16 | Orijinal/Taranmış karşılaştırma | **Yok** | Camera path'inde ham görsel saklanmıyor; sadece normalized. |
| 17 | MMPI'ye özel | **Var** | FormDefinition, FormLayout, pageIdentity QR'ı. |
| 18 | Form alignment | **Var** | `fitHomography` + `inspectPageGeometry` zaten form'a hizalıyor. |
| 19 | Manuel kontrol | **Var** | Sayfa inceleme paneli. |
| 20 | GitHub kodu yasağı | **Uygulandı** | Kod eklenmedi. |
| 21 | Privacy / client-side | **Var** | Tüm OMR istemcide; görüntü kaydedilmez, sadece blob URL önizleme. |
| 22 | Web Worker performans | **Yok** | Tüm pipeline ana iş parçacığında; `analyzePage` async ama CPU-bound. |
| 23 | Modüler mimari | **Var** | `omr/` ve `scanner/` ayrılmış. |
| 24 | Hata yönetimi | **Var** | Her modülde `failure()` + `PageReadFailure.code` + Türkçe `message`. |
| 25 | Fallback (algılayamadım) | **Var** | Hizalama başarısız → Türkçe hata → sayfa reddedilir; kullanıcı yeniden çekebilir. **Manuel köşe seçimi yok.** |
| 26 | Mevcut projeyi bozmama | **Korunacak** | Bu çalışmanın kuralı. |
| 27 | Implementation sırası | Uygulanıyor | Bu rapor + takip eden aşamalar. |
| 28 | Geriye dönülebilirlik | Korunacak | Her aşama kendi modülünde; geri alma diff ile yapılabilir. |
| 29 | Gerçek optik test | CI var | Sentetik + PDF testleri mevcut. Gerçek fotoğraf `scripts/run-photos.mts` harness'i ile yapılabilir ama kalibre değil. |
| 30 | Son rapor | Bu doküman + kapanış özeti. |

### Önemli çıkarım
**Mevcut sistem, promptun %70'inden fazlasını zaten karşılıyor.** "Sıfırdan yaz" gereksiz ve "mevcut kodu yeniden yazma" kuralıyla çelişir. Bu nedenle **güçlendirme** yolu izleniyor.

---

## 4. Yeni neler eklenecek?

Aşağıdaki eklemeler **yalnızca** mevcut scanner yüzeyinin **görünür/UX/operasyonel** katmanlarıdır. Mevcut OMR matematiğine dokunulmuyor.

### 4.1 Eklenecek modüller
1. **`src/scanner/shadowNormalization.ts`** — homojen arka-plan tahmini + flatten (büyük-median filtre mantığı, O(n) bucket sort). Opsiyonel; sadece `quality.shadowSpread > THRESHOLD` veya isteğe bağlı kullanıcı tetiklemeliyse.
2. **`src/scanner/enhancement.ts`** — "Orijinal / Geliştirilmiş / Gri / Yüksek kontrast / OMR-optimize" modlarını **görüntü olarak** üretir. Mevcut OMR yine normalized halde çalışır; bu modüller önizleme içindir.
3. **`src/scanner/cameraAdvisor.ts`** — kamera frame'lerinden gerçek zamanlı: parlaklık, Laplacian varyansı, kontrast oranı, "kağıt algılandı" göstergesi (homography benzeri bir hizalama tahmini istasyonu olmadan, **sayfa kenarı tahmini** üzerinden).
4. **`src/scanner/qualityGate.ts`** — `analyzePage`'in reddettiği sayfalar için "yeniden çek önerisi" mesajları; kırpılma, bulanıklık, düşük ışık için net uyarılar.
5. **`src/scanner/comparison.ts`** — orijinal fotoğraf (kamera path) ve normalized sayfanın yan yana önizlemesi için hafif yardımcı.

### 4.2 Güncellenecek UI
- `CameraCapture.tsx` → canlı "Optik algılandı" çerçevesi + brightness/blur rehberi iyileştirmesi; capture anında **iki görsel** saklansın (orijinal + normalized).
- `ScanResultPreview.tsx` → "Orijinal ↔ Taranmış" toggle + geliştirme modu seçici.
- `ScannerWorkspace.tsx` → kalite reddi sonrası kullanıcıya net "yeniden çek" mesajı.
- `src/styles/scanner.css` → yeni sınıflar (`scan-mode-pills`, `scan-comparison`, `scan-original-frame`).

### 4.3 Değişmeyecek şeyler
- Mevcut OMR matematiği (`perspectiveCorrection`, `alignmentDetector`, `bubbleRingRefinement`, `markDetector`, `imageQuality`).
- Supabase Auth, RLS, profil rolleri.
- `scoring/` modülü.
- `formDefinition`, `pageIdentity`.
- Tüm mevcut testler (yeniler eklenecek ama silinmeyecek).

---

## 5. Veri akışı (güncel + eklenen)

```
[Kamera / Dosya] (CameraCapture veya imageIO.readImageFile)
       │
       ▼
[Yeni] shadowNormalization? (sadece quality.shadowSpread > eşik veya kullanıcı isteği)
       │
       ▼
analyzePage(image, definition)
   ├── toGrayscale → GrayImage
   ├── isolatePaper (pageIsolation)
   ├── rotateGray90 × 4 (orientation)
   ├── decodePageQr (qrDecoder, jsQR)
   ├── detectAlignmentMarks (alignmentDetector)
   ├── fitHomography(physicalCenters → detected centres) + inspectPageGeometry
   ├── inspectFeatureContainment (kırpma kontrolü, mm)
   ├── evaluateQrConsistency (alignmentVerification)
   ├── warpPerspective → 8 px/mm A4 normalized (perspectiveCorrection)
   ├── refinePageCentres (bubbleRingRefinement)
   ├── assessImageQuality (imageQuality)
   └── detectItemMarks (markDetector) → PageReadResult
       │
       ▼
[Yeni] enhancement modes → preview için
       │
       ▼
[UI] ScanResultPreview (filtre, manuel inceleme, karşılaştırma toggle)
       │
       ▼
[UI] RecordCapture → mmpi_records (Supabase)
       │
       ▼
MMPI scoring → resultNormalizer + scoring/*
```

---

## 6. Değiştirilecek dosyalar

| Dosya | Neden |
|---|---|
| `src/components/CameraCapture.tsx` | Orijinal + normalized çift saklama; geliştirilmiş brightness/blur rehberi; "sayfa algılandı" overlay. |
| `src/components/ScanResultPreview.tsx` | "Orijinal ↔ Taranmış" toggle + geliştirme modu seçici + manuel köşe düzeltme placeholder. |
| `src/components/ScannerWorkspace.tsx` | Kalite reddi sonrası rehberli yeniden çek önerisi; `originalImage` blob'unu `StoredScanPage`'e yaz. |
| `src/styles/scanner.css` | Yeni `scan-mode-pills`, `scan-comparison`, `scan-original-frame` vb. |
| `src/results/scanResultTypes.ts` | `StoredScanPage.originalBlobUrl?` ekle. |
| `src/scanner/imageIO.ts` | Ham fotoğrafı saklamak için `readImageFileKeepOriginal` yardımcısı. |

## 7. Yeni dosyalar

| Dosya | Sorumluluk |
|---|---|
| `src/scanner/shadowNormalization.ts` | Gölge flatten; opsiyonel. |
| `src/scanner/enhancement.ts` | Beş görsel modu üretimi (orijinal/gri/enhanced/BW/yüksek kontrast/OMR-optimize). |
| `src/scanner/cameraAdvisor.ts` | Canlı brightness/contrast/blur + sayfa kenarı tahmini (masa üzerinde en büyük açık bileşenin bbox'u). |
| `src/scanner/qualityGate.ts` | Türkçe yeniden çek önerileri. |
| `src/scanner/comparison.ts` | Orijinal ↔ normalized yan yana render. |
| `src/components/ImageEnhancer.tsx` | UI: mod seçici. |
| `src/components/CameraOverlay.tsx` | UI: sayfa algılandı çerçevesi. |
| `src/components/ManualCornerEditor.tsx` | UI: 4 köşe sürükleme (placeholder + tam implementasyon). |
| `tests/shadowNormalization.test.ts` | Sentetik gölge testleri. |
| `tests/enhancement.test.ts` | Mod determinizmi + kimlik testi. |
| `tests/cameraAdvisor.test.ts` | Sentetik frame testleri. |

## 8. Bağımlılıklar

**Hiçbir yeni npm dependency eklenmeyecek.** Tüm işlemler saf TypeScript + Canvas API ile yapılacak. Mevcut paketler yeterli.

| Mevcut | Kullanım |
|---|---|
| React 19 | UI |
| TypeScript 5 | Tip |
| Vite 7 | Build |
| `@noble/hashes` | Hash (mevcut) |
| `@supabase/supabase-js` | Kayıt (mevcut) |
| `jsqr` | QR (mevcut, OMR hattında) |
| `pdfjs-dist` | PDF (mevcut) |
| `qrcode` | QR üretimi (mevcut) |

---

## 9. Uygulama sırası (AŞAMA 5+)

1. **AŞAMA 5** — `shadowNormalization.ts` + test
2. **AŞAMA 6** — `imageIO` genişletmesi + dosya yükleme iyileştirmesi (UI korunur)
3. **AŞAMA 7** — `CameraCapture` orijinal saklama + canlı brightness/blur
4. **AŞAMA 8** — `cameraAdvisor.ts` + `CameraOverlay.tsx` (sayfa algılandı çerçevesi)
5. **AŞAMA 9** — `enhancement.ts` + `ImageEnhancer.tsx`
6. **AŞAMA 10** — `ManualCornerEditor.tsx` (sürüklenebilir 4 köşe; fallback)
7. **AŞAMA 11** — `ScanResultPreview` "Orijinal ↔ Taranmış" toggle
8. **AŞAMA 12** — OMR-optimize modu (`enhancement.ts` içinde, kayıpsız)
9. **AŞAMA 13** — `comparison.ts` yan yana önizleme
10. **AŞAMA 14** — `ScannerWorkspace` kalite reddi → yeniden çek önerisi
11. **AŞAMA 15** — typecheck + test + build
12. **AŞAMA 16** — kapanış raporu

---

## 10. Riskler ve mitigasyon

| Risk | Mitigasyon |
|---|---|
| Yeni modüllerin mevcut OMR çıktısını bozması | Yeni modüller **yalnızca preview** üretir; `analyzePage` çağrı zincirine girmez. |
| Manuel köşe editörünün OMR matematiğiyle çakışması | Editör yalnızca kullanıcının yeni bir taramayı yeniden başlatması için kullanılacak; otomatik hat bozulmaz. |
| Mobilde Web Worker olmadan performans | Tüm yeni modüller ana iş parçacığında çalışır ama önizleme amaçlıdır (analyzePage zaten ana iş parçacığında ve 8 px/mm'de kanıtlanmış). |
| CI test süreleri | Yeni testler küçük sentetik görsellerle sınırlı. |

---

## 11. Başarı kriterleri

- `npm run typecheck` → temiz.
- `npm test` → tüm mevcut + yeni testler geçer.
- `npm run build` → başarılı tek dosya çıktı.
- Dev sunucu → mevcut tarama akışı **birebir aynı** çalışır.
- Yeni UI: kamera overlay + mod seçici + karşılaştırma toggle görünür.
