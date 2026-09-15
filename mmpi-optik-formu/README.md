# MMPI-566 Optik Cevap Formu ve OMR Okuyucu

A4 optik cevap formu (566 madde), tarayıcıda çalışan optik okuma (OMR) hattı,
kamera/dosya yükleme, sonuç inceleme ekranları ve **hazır yazdırılabilir PDF**.
React 19 + TypeScript + Vite. Sunucu, CDN çalışma zamanı veya API anahtarı
gerektirmez; tüm okuma kullanıcının cihazında yapılır.

Bu klasör projenin **tek** kaynağıdır.

## Hızlı başlangıç

Node.js 22 veya üzeri gerekir.

```sh
npm ci              # kilitlenmiş bağımlılıkları kurar
npm run dev         # geliştirme sunucusu -> http://localhost:5173
```

Tarayıcıda `http://localhost:5173` adresini açın. İki sekme vardır:
**Optik form** (önizleme + yazdırma) ve **Tara ve gözden geçir** (kamera/yükleme).

Form sayfasında iki düğme vardır: **Tüm sayfaları yazdır** (tarayıcı yazdırma
diyaloğu) ve **Hazır PDF'i indir**. İkincisi `MMPI-566-optik-cevap-formu.pdf`
dosyasını tek dosyalık derlemeye base64 olarak gömer; bu dosya hem dosyadan geri
okunup geometrisi doğrulanan (`tests/pdfForm.test.ts`) hem de rasterleştirilip
gerçek okuma hattından geçirilen (`tests/pdfScanPipeline.test.ts`) dosyadır.
Tarayıcının yazdırma diyaloğu kâğıt boyutunu, ölçeği veya kenar boşluğunu
değiştirebildiği için **indirilen PDF tercih edilmelidir**.

### Kendi sitenize koymak

```sh
npm run build
```

İki çıktı üretir:

| Çıktı | Ne işe yarar |
| --- | --- |
| `dist/index.html` | Kendi kendine yeterli tek dosya (React, CSS, pdf.js worker gömülü). Statik sunucuya atılır, backend gerekmez. |
| `../optik-form.html` | Aynı dosyanın depo kökündeki kopyası. Çift tıklayarak da açılır. |

Statik barındırmada çalışır (Netlify, Vercel, GitHub Pages, nginx, S3).
Kamera için **HTTPS zorunludur** (`getUserMedia` güvenli bağlam ister); localhost
bunun dışındadır.

## Yazdırılabilir optik form

Hazır dosya depoda: **`MMPI-566-optik-cevap-formu.pdf`** — 4 sayfa, A4 dikey,
242 KB, 1.132 boş D/Y dairesi.

Yeniden üretmek ve doğrulamak:

```sh
npm run pdf           # MMPI-566-optik-cevap-formu.pdf üretir
npm run verify:pdf    # üretilen dosyayı bağımsız olarak doğrular
```

PDF, tarayıcının CSS yazıcısından **bağımsız** bir üreticidir
(`src/print/`), ama koordinatları aynı `FormDefinition`'dan okur. Yani basılı
daire merkezleri ile okuyucunun beklediği koordinatlar aynı kaynaktan gelir.

Yazdırma ayarları: **A4 · Dikey · %100 (Gerçek boyut) · Kenar boşluğu yok ·
Üst/alt bilgi kapalı · Tek yüz · Siyah-beyaz.** “Sayfaya sığdır” seçeneğini
açmayın. İlk baskıda köşe karelerini kumpasla 5 mm olarak ölçün.

## Nasıl kontrol edersiniz

```sh
npm run typecheck   # tsc --noEmit
npm test            # 56 test
npm run build       # tip kontrolü + tek dosya çıktı
npm run pdf         # optik formu üret
npm run verify:pdf  # üretilen PDF'i doğrula
```

`npm test` şunları çalıştırır: form geometrisi, kimlik alanlarının yalnızca
1. sayfada olması, homografi/benzerlik matematiği, sentetik görüntüler üzerinde
OMR (boş, güçlü, silik, silinmiş, çoklu, çelişen iz, eksik köşe karesi, kesik
sayfa, düşük ışık, gölge, bulanıklık, 90/180/270° ve 17° dönüş, projektif
çarpıklık), güvenlik red yolları, sonuç doğrulama/elle inceleme ve **üretilen
PDF'in dosyadan geri okunup tanımla karşılaştırılması** ve **depodaki PDF'in
rasterleştirilip gerçek OMR hattından geçirilmesi** (4 sayfa kabul, 566 madde
boş okunuyor, sayfalar tek tek kabul ediliyor).

## Kapsam ve sınırlamalar

Bunlar tasarım kararları değil, **doğrulanmamış varsayımlardır**.

- Bu bir **yerleşim şablonudur** (`source: 'unverified-template'`). Yetkili MMPI
  formunun birebir kopyası değildir; lisanslı madde düzeniyle eşdeğerliği
  doğrulanmamıştır.
- 1–566 madde **numaraları** ve boş D/Y daireleri vardır. Madde metni, cevap
  anahtarı veya klinik içerik yoktur ve uydurulmamıştır.
- `D = Doğru / Y = Yanlış` iki seçenekli düzen bir varsayımdır; yetkili
  materyalle doğrulanmalıdır.
- OMR eşikleri yalnızca **sentetik raster örneklerle** sınanmıştır. Gerçek
  kamera, fotokopi, kalem veya baskı üzerinde kalibre edilmemiştir; bu yüzden
  doğruluk yüzdesi iddia edilmez. `confidence` sezgisel bir işaret gücüdür,
  olasılık değildir.
- Klinik puanlama, raporlama, veri tabanı ve API entegrasyonu **yoktur**.
  `summarizeResults()` her zaman `clinicalTransferAllowed: false` döndürür.
- Yalnızca `reliable` maddeler algoritma cevabı sayılır; `single` ve `ambiguous`
  her zaman insan incelemesi ister.
- Formda kişisel veri saklanmaz. Form kimliği, katılımcı kodu ve tarih yalnızca
  basılı kağıda el yazısıyla girilir ve **yalnızca 1. sayfada** bulunur.

## Sabit form geometrisi

| Özellik | Değer |
| --- | --- |
| Şablon kimliği / sürüm | `MMPI566-DY-3C48-V2` / `2.0.0` |
| Yerleşim özeti (SHA-256) | `1F49F315B2636DCB4C18C2E48242AA09B560B8737F81E2E502DFA9109016E280` |
| Kağıt | A4, 210 × 297 mm, dikey |
| Sayfa sayısı / aralıklar | 4 · 1–144, 145–288, 289–432, 433–566 |
| Düzen | 3 sütun × 48 satır; son sütunda 38 madde |
| İşaretleme dairesi | 3,5 mm dış çap, 0,3 mm içe doğru siyah sınır |
| Satır aralığı | Merkezden merkeze 4,25 mm |
| D/Y yatay merkezleri | Sütun içinde 27 mm ve 43 mm (16 mm arayla) |
| Cevap ızgarası | x = 20 mm, y = 60 mm; başlık 7 mm |
| Sütun genişliği / aralığı | 51,333… mm / 8 mm |
| Köşe işaretleri | 5 × 5 mm; sol üst köşeleri (10,10), (195,10), (195,282), (10,282) mm |
| Sayfa QR alanı | x = 164, y = 18, 26 × 26 mm — her sayfada, cevap alanlarından ayrı |
| Normalize görüntü | 8 px/mm → 1680 × 2376 piksel |
| Toplam işaretleme alanı | 1.132 (566 madde × 2 seçenek) |

Sayfalar sütun boyunca yukarıdan aşağı, sonra soldan sağa numaralandırılır. Son
sayfadaki kullanılmayan satırlarda daire veya numara üretilmez.

### Sayfa kimliği

Her sayfanın QR metni: `M566:sürüm:yerleşim özeti:baskı seti:sayfa:toplam`.
Aynı oturumda yazdırılan dört sayfa aynı baskı seti kimliğini taşır; eksik,
yinelenen veya başka bir sete ait sayfa reddedilir. Depodaki hazır PDF sabit bir
şablon seti kimliği kullanır (`npm run pdf <dosya> <24 haneli set kimliği>` ile
değiştirilebilir); uygulamanın kendi yazdırma akışı her oturumda yenisini üretir.

## Mimari

| Yol | Görev |
| --- | --- |
| `src/omr/omrTypes.ts` | Ortak veri modeli: `FormDefinition`, `PageDefinition`, `ItemDefinition`, `ResponseArea`, `AlignmentMark`. Koordinatlar kağıdın sol üstünden **milimetre**. |
| `src/omr/formDefinition.ts` | Şablon sabitleri, sayfa/madde üretimi, SHA-256 yerleşim özeti, `getBubbleGeometry()`. |
| `src/form/layout.ts` | Bileşenlerin kullandığı tek içe aktarma yüzeyi. |
| `src/form/pageIdentity.ts` | Baskı seti kimliği, QR metni kodlama/çözümleme, QR modül geometrisi. |
| `src/omr/qrDecoder.ts` | jsQR ile sınırlı (≤4 MP) sayfa kimliği okuma. |
| `src/omr/perspectiveCorrection.ts` | `fitHomography`, `fitSimilarity`, `mapPoint`, `inspectPageGeometry`, `warpPerspective`. |
| `src/omr/alignmentDetector.ts` | Köşe karelerini bağlı bileşen analiziyle bulma; sıralı tahmin listesi. |
| `src/omr/imageQuality.ts` | Gri tonlama; aydınlık, gölge, bulanıklık, kontrast, halka bütünlüğü. |
| `src/omr/markDetector.ts` | Merkez, çevre ve zemin örneklemesiyle madde durumu. |
| `src/omr/analyzePage.ts` | Saf dizilerle çalışan sayfa hattı; başarısızlıkta cevap üretmez. |
| `src/results/*` | Sonuç tipleri, OMR sınırını güvenilmez sayan doğrulama, özetleme. |
| `src/scanner/*` | Görüntü/PDF girişi, boyut sınırları, sayfa sırası, elle inceleme kayıtları. |
| `src/print/*` | PDF yazıcısı, TrueType gömme ve form sayfası çizimi (tarayıcı gerektirmez). |
| `src/components/*` | Form sayfaları, önizleme, kamera, tarama alanı, sonuç incelemesi. |
| `scripts/*` | Tek dosya derleme, PDF üretimi, PDF doğrulaması. |

Form tanımı, görsel tasarım ve PDF üreticisi aynı `FormDefinition` örneğini
paylaşır; koordinat kaynağı tektir.

### İstenen mimariyle eşleşme

Önerilen klasör adları birebir kullanılmadı; her biri bu projedeki karşılığıyla
tek bir yerde tutuluyor.

| Önerilen | Bu projedeki karşılık |
| --- | --- |
| `components/OpticalFormPreview.tsx` | `components/FormPreview.tsx` |
| `components/FormPage.tsx` / `ItemRow.tsx` / `ResponseArea.tsx` | `components/FormPage.tsx` ve `components/AnswerColumn.tsx` (koordinatlar `FormDefinition`'dan) |
| `components/AlignmentMarks.tsx` | `components/RegistrationMarks.tsx` |
| `omr/pageDetector.ts` | `omr/analyzePage.ts`: QR doğrulaması + `inspectPageGeometry` |
| `omr/itemMapper.ts` | `formDefinition.ts` `getBubbleGeometry()` + `scanner/reviewGeometry.ts` |
| `omr/confidenceCalculator.ts`, `omr/validation.ts` | `markDetector.ts` eşikleri + `results/resultValidator.ts` |
| `scanner/cameraScanner.ts` | `components/CameraCapture.tsx` + `scanner/imageIO.ts` |
| `scanner/imageUploader.ts` | `scanner/imageIO.ts` ve `scanner/pdfIO.ts` |
| `scanner/scanPipeline.ts` | `omr/analyzePage.ts` |
| `utils/coordinateUtils.ts` | `omr/perspectiveCorrection.ts` |
| `utils/imageUtils.ts` | `omr/imageQuality.ts` ve `scanner/imageIO.ts` |
| `utils/printUtils.ts` | `src/print/*` + `styles/print.css` |
| `pages/FormPreviewPage.tsx`, `ScannerPage.tsx`, `ScanResultsPage.tsx` | `App.tsx` içindeki iki çalışma alanı sekmesi |

## Doğrulama

`DOGRULAMA.md` çalıştırılan komutları, gerçek çıktıları ve **doğrulanmayan**
maddeleri listeler. Özet: tip kontrolü temiz, 56/56 test geçiyor, derleme
çalışıyor, üretilen PDF dosyadan geri okunup doğrulanıyor ve aynı PDF
rasterleştirilip gerçek okuma hattından geçiriliyor. Gerçek kağıt, gerçek
kamera, tarayıcı yazdırma diyaloğu, tarayıcıdaki PDF işçisi ve lisanslı form
düzeni doğrulanmadı.
