# MMPI-566 Optik Cevap Formu ve OMR Okuyucu

A4 optik cevap formu, tarayıcıda çalışan optik okuma (OMR) hattı, kamera/dosya
yükleme ve sonuç inceleme ekranları. React 19 + TypeScript, Vite. Sunucu, CDN
çalışma zamanı veya API anahtarı gerektirmez.

Bu klasör projenin **tek** kaynağıdır: form tanımı, görsel tasarım, okuyucu
algoritması, testler ve doğrulama raporları aynı yerde tutulur.

## Kapsam ve sınırlamalar

Bunlar tasarım kararları değil, doğrulanmamış varsayımlardır. Okumadan kullanmayın.

- Bu bir **yerleşim şablonudur** (`source: 'unverified-template'`). Yetkili MMPI
  formunun birebir kopyası değildir; lisanslı madde düzeniyle eşdeğerliği
  doğrulanmamıştır.
- 1–566 madde **numaraları** ve boş D/Y daireleri vardır. Madde metni, cevap
  anahtarı veya klinik içerik yoktur ve uydurulmamıştır.
- `D = Doğru / Y = Yanlış` iki seçenekli düzen bir varsayımdır. Yetkili materyal
  ve uygulama yönergesiyle doğrulanmalıdır.
- OMR eşikleri (`omr/markDetector.ts`, `omr/imageQuality.ts`) **yalnızca sentetik
  raster örneklerle** sınanmıştır. Gerçek kamera, fotokopi, kalem veya baskı
  üzerinde kalibre edilmemiştir; bu yüzden doğruluk yüzdesi iddia edilmez.
- `confidence` sezgisel bir işaret gücüdür, olasılık değildir.
- Klinik puanlama, raporlama, veri tabanı ve API entegrasyonu **yoktur**.
  `summarizeResults()` her zaman `clinicalTransferAllowed: false` döndürür.
- Formda kişisel veri saklanmaz. Form kimliği, katılımcı kodu ve tarih yalnızca
  basılı kağıda el yazısıyla girilir.

## Kurulum

Node.js 22 veya üzeri gerekir.

```sh
npm ci            # kilitlenmiş bağımlılıklar
npm run dev       # Vite geliştirme sunucusu (0.0.0.0)
npm run typecheck # tsc --noEmit
npm test          # node:test, 48 test
npm run build     # tsc --noEmit + dist/index.html + ../optik-form.html
```

`npm run build`, tip kontrolü başarısızsa derlemez. `dist/index.html` ve depo
kökündeki `optik-form.html` kendi kendine yeterli tek dosyalık çıktılardır
(React, CSS ve pdf.js worker'ı gömülüdür).

## Kullanım

Uygulama iki çalışma alanı açar:

**1. Optik form** — A4 önizleme, yakınlaştırma, dört sayfaya doğrudan geçiş ve
yazdırma.

Yazdırma ayarları: **A4 · Dikey · %100 (Gerçek boyut) · Kenar boşluğu yok ·
Üst/alt bilgi kapalı · Tek yüz · Siyah-beyaz.**

“Sayfaya sığdır” seçeneğini açmayın. CSS ekran ölçeği yazdırmada kaldırılır
(`print.css` içinde `transform: none`), ancak tarayıcının veya yazıcının kendi
ölçeklendirme ayarı yazılımla engellenemez. İlk baskıda köşe karelerini
kumpasla 5 mm olarak ölçün.

**2. Tara ve gözden geçir** — `getUserMedia` ile kamera (arka kamera tercihli,
2560×1920 hedefli) veya JPG/PNG/PDF yükleme. Her sayfa için:

1. QR okunur ve form sürümü, yerleşim özeti, baskı seti ve sayfa numarası doğrulanır.
2. Dört köşe karesi **gerçek piksel konumlarından** bulunur; tahminle değiştirilmez.
3. Perspektif düzeltilir, sayfa 1680 × 2376 piksele (8 px/mm) normalize edilir.
4. Işık, gölge, bulanıklık, halka kontrastı ve halka bütünlüğü denetlenir.
5. Her madde için durum üretilir: `blank`, `single`, `reliable`, `multiple`,
   `ambiguous`, `invalid`, `unread`.

Yalnızca `reliable` maddeler algoritma cevabı olarak aktarılır; `single` ve
`ambiguous` her zaman insan incelemesi ister. Eksik, yinelenen veya başka sete
ait sayfalar kabul edilmez ve kullanıcıya gösterilir.

## Mimari

| Yol | Görev |
| --- | --- |
| `src/omr/omrTypes.ts` | Ortak veri modeli: `FormDefinition`, `PageDefinition`, `ItemDefinition`, `ResponseArea`, `AlignmentMark`. Tüm koordinatlar kağıdın sol üst köşesinden **milimetre**. |
| `src/omr/formDefinition.ts` | Şablon sabitleri, sayfa/madde üretimi, SHA-256 yerleşim özeti, `getBubbleGeometry()`. |
| `src/form/layout.ts` | Bileşenlerin kullandığı tek içe aktarma yüzeyi. |
| `src/form/pageIdentity.ts` | Baskı seti kimliği, QR metni kodlama/çözümleme, QR modül geometrisi. |
| `src/omr/qrDecoder.ts` | jsQR ile sınırlı (≤4 MP) sayfa kimliği okuma. |
| `src/omr/perspectiveCorrection.ts` | `fitHomography`, `fitSimilarity`, `mapPoint`, `inspectPageGeometry`, `warpPerspective`. |
| `src/omr/alignmentDetector.ts` | Köşe karelerini bağlı bileşen analiziyle bulma. |
| `src/omr/imageQuality.ts` | Gri tonlama, aydınlık/gölge/bulanıklık/kontrast değerlendirmesi. |
| `src/omr/markDetector.ts` | Merkez, çevre ve zemin örneklemesiyle madde durumu. |
| `src/omr/analyzePage.ts` | Saf dizilerle çalışan sayfa hattı; başarısızlıkta cevap üretmez. |
| `src/results/*` | Sonuç tipleri, OMR sınırını güvenilmez sayan doğrulama, özetleme. |
| `src/scanner/*` | Görüntü/PDF girişi, sınırlar, sayfa sırası ve elle inceleme kayıtları. |
| `src/components/*` | Form sayfaları, önizleme, kamera, tarama alanı, sonuç incelemesi. |

Form tanımı ile okuyucu aynı `FormDefinition` örneğini paylaşır; görsel tasarım
CSS değişkenlerini bu tanımdan alır. İkisi ayrı dosyalarda tutulur ama koordinat
kaynağı tektir.

### İstenen mimariyle eşleşme

Önerilen klasör adları birebir kullanılmadı; her biri bu projedeki karşılığıyla
tek bir yerde tutuluyor.

| Önerilen | Bu projedeki karşılık |
| --- | --- |
| `components/OpticalFormPreview.tsx` | `components/FormPreview.tsx` |
| `components/FormPage.tsx` / `ItemRow.tsx` / `ResponseArea.tsx` | `components/FormPage.tsx` ve `components/AnswerColumn.tsx` (satır ve işaretleme alanı aynı bileşende; koordinatlar `FormDefinition`'dan) |
| `components/AlignmentMarks.tsx` | `components/RegistrationMarks.tsx` |
| `components/ScanResultPreview.tsx` | aynı adla mevcut |
| `omr/omrTypes.ts`, `formDefinition.ts`, `alignmentDetector.ts`, `perspectiveCorrection.ts`, `markDetector.ts` | aynı adlarla mevcut |
| `omr/pageDetector.ts` | `omr/analyzePage.ts`: QR doğrulaması + `inspectPageGeometry` (kırpma, çözünürlük, yansıma, aşırı perspektif) |
| `omr/itemMapper.ts` | `formDefinition.ts` içindeki `getBubbleGeometry()` + `scanner/reviewGeometry.ts` |
| `omr/confidenceCalculator.ts`, `omr/validation.ts` | `markDetector.ts` eşikleri + `results/resultValidator.ts` |
| `scanner/cameraScanner.ts` | `components/CameraCapture.tsx` + `scanner/imageIO.ts` |
| `scanner/imageUploader.ts` | `scanner/imageIO.ts` ve `scanner/pdfIO.ts` |
| `scanner/scanPipeline.ts` | `omr/analyzePage.ts` |
| `scanner/pageSequence.ts` | aynı adla mevcut |
| `results/*` | aynı adlarla mevcut |
| `utils/coordinateUtils.ts` | `omr/perspectiveCorrection.ts` (mm ↔ piksel, homografi) |
| `utils/imageUtils.ts` | `omr/imageQuality.ts` ve `scanner/imageIO.ts` |
| `utils/printUtils.ts` | `styles/print.css` + `App.tsx` yazdırma düğmesi |
| `pages/FormPreviewPage.tsx`, `ScannerPage.tsx`, `ScanResultsPage.tsx` | `App.tsx` içindeki iki çalışma alanı sekmesi |

## Sabit form geometrisi

| Özellik | Değer |
| --- | --- |
| Şablon kimliği / sürüm | `MMPI566-DY-3C48-V2` / `2.0.0` |
| Yerleşim özeti (SHA-256) | `1F49F315B2636DCB4C18C2E48242AA09B560B8737F81E2E502DFA9109016E280` |
| Kağıt | A4, 210 × 297 mm, dikey |
| Sayfa sayısı / aralıklar | 4 · 1–144, 145–288, 289–432, 433–566 |
| Düzen | 3 sütun × 48 satır; son sütunda 38 madde |
| İşaretleme dairesi | 3,5 mm çap; satır aralığı merkezden merkeze 4,25 mm |
| D/Y yatay merkez aralığı | 16 mm (sütun içi 27 mm ve 43 mm) |
| Cevap ızgarası | x = 20 mm, y = 60 mm; başlık 7 mm |
| Sütun genişliği / aralığı | 51,333… mm / 8 mm |
| Köşe işaretleri | 5 × 5 mm; sol üst köşeleri (10,10), (195,10), (195,282), (10,282) mm |
| Sayfa QR alanı | x = 164, y = 18, 26 × 26 mm (her sayfada, cevap alanlarından ayrı) |
| Normalize görüntü | 8 px/mm → 1680 × 2376 piksel |
| Toplam işaretleme alanı | 1.132 (566 madde × 2 seçenek) |

Sayfalar sütun boyunca yukarıdan aşağı, sonra soldan sağa numaralandırılır.
Son sayfadaki kullanılmayan satırlarda daire veya numara üretilmez.

### Sayfa kimliği

Her sayfanın QR metni: `M566:sürüm:yerleşim özeti:baskı seti:sayfa:toplam`.
Aynı oturumda yazdırılan dört sayfa aynı baskı seti kimliğini taşır; bu sayede
eksik, yinelenen veya başka bir sete ait sayfa reddedilir. El yazısı kimlik
alanları (`FORM KİMLİĞİ`, `KATILIMCI KODU`, `TARİH`) makine kimliğinden ayrıdır
ve **yalnızca 1. sayfada** bulunur.

## Doğrulama

`DOGRULAMA.md` çalıştırılan komutları, gerçek çıktıları ve doğrulanmayan
maddeleri listeler. Özet: 48/48 test ve tip kontrolü geçiyor; gerçek kağıt,
gerçek kamera ve lisanslı form düzeni doğrulanmadı.
