# MMPI-566 — Mimari Analiz ve Karar Raporu

**Tarih:** 15 Eylül 2026  
**Kaynak:** `4cd2816` (main) üzerindeki gerçek kod ve testler  
**Durum:** Bu belgede kod değiştirilmedi. Kanıt → karar → (onay sonrası) uygulama.

Bu rapor önceki özet notları doğru kabul etmez. Her iddia ilgili dosya, fonksiyon ve koşulla bağlanmıştır.

---

## 1. Mevcut mimari (koddan)

Sistem zaten **şablon tabanlı, QR kimlikli, köşe kareleriyle hizalanan, homografi ile düzeltilen, sabit milimetre koordinatlarında OMR okuyan** bir hattır. “Yeni bir OMR motoru” yoktur; eksik olan, bu hattın gerçek dünya girdilerine kadar açık olmasıdır.

### 1.1 Veri akışı

```
Yazdırma / indirme
  FormDefinition (mm) ──► renderFormPdf / FormPage ──► A4 PDF veya HTML önizleme
                                                      QR: M566:sürüm:fingerprint:batchId:sayfa:toplam

Okuma
  Dosya/kamera
    identifyFile()           JPEG SOI / PNG imza / %PDF-
    readImageFile | readPdfPages
    analyzePage()
      toGrayscale
      decodePageQr (jsQR)
      parsePageIdentity      → hangi sayfa, hangi batch, hangi şablon
      QR köşelerinden tahmin (homografi + benzerlik)
      detectAlignmentMarks   → dört gerçek siyah kare (tahmin ikame edilmez)
      fitHomography(kare merkezleri)
      inspectPageGeometry    → kesik sayfa / aşırı perspektif
      warpPerspective        → kanonik 8 px/mm, 1680×2376
      assessImageQuality     → tek kapı: ok=false ise CEVAP YOK
      detectItemMarks        → her madde, şablondaki D/Y dairelerinde
    acceptPage + validatePageResult
    RecordCapture → Supabase mmpi_records.raw_omr_answers
```

Koordinat kaynağı tektir: `src/omr/formDefinition.ts`. PDF üreticisi daireleri `item.responseAreas` üzerinden çizer; okuyucu aynı alanları örnekler. Soru sırası görüntüden tahmin edilmez.

### 1.2 Modül haritası

| Katman | Dosyalar | Görev |
| --- | --- | --- |
| Form şablonu | `src/omr/formDefinition.ts`, `src/form/layout.ts`, `src/form/pageIdentity.ts` | 4 sayfa, 566 madde, D/Y mm koordinatları, QR metni |
| OMR | `analyzePage.ts`, `qrDecoder.ts`, `alignmentDetector.ts`, `perspectiveCorrection.ts`, `imageQuality.ts`, `markDetector.ts` | Kimlik, hizalama, warp, kalite, işaret |
| Girdi | `src/scanner/imageIO.ts`, `pdfIO.ts`, `pageSequence.ts` | Dosya türü, PDF worker, set kilidi |
| Sonuç | `src/results/*` | Doğrulama, `reliable` dışı otomatik cevap sayılmaz |
| UI | `ScannerWorkspace`, `CameraCapture`, `ScanResultPreview`, `FormPreview`, `AuthGate` | Yükleme, inceleme, giriş |
| Baskı | `src/print/renderFormPdf.ts`, `formPdf.ts` | Doğrulanmış 4 sayfalık PDF |
| Auth / kayıt | `src/auth/*`, `src/records/supabaseRecords.ts`, `supabase/` | Bellek-içi oturum, RLS |
| Test | `tests/omrEngine`, `omrSafety`, `pdfScanPipeline`, `pdfForm`, `resultsSafety`, … | Sentetik + vektör PDF; gerçek fotoğraf yok |

### 1.3 Soru eşleştirme — mevcut sistem zaten şablonludur

- Madde `itemNumber` şablonda üretilir (sayfa 1: 1–144, … sayfa 4: 433–566).
- QR `pageNumber` verir; `definition.pages.find(...)` o sayfanın maddelerini seçer.
- Her D/Y dairesinin `x,y,width,height` milimetredir; warp sonrası `cx = (x + w/2) * 8` pikselinde örneklenir.
- OCR yoktur. Dinamik “koyu leke = sonraki soru” yoktur.

`resolveItem` (`resultNormalizer.ts`): algoritmanın etkili cevabı **yalnızca `status === 'reliable'`** iken geçerlidir. `single`, `ambiguous`, `multiple`, `blank`, `invalid`, `unread` otomatik kayıt cevabı olmaz; insan incelemesi veya boş bırakılır.

### 1.4 İşaret okuma modeli (değiştirmeden yeterli)

`detectItemMarks` mevcut durumları:

| Kod | Anlam | Otomatik cevap? |
| --- | --- | --- |
| `blank` | Belirgin işaret yok | Hayır (`resolveItem` yalnızca reliable) |
| `single` | Tek işaret, güven düşük | Hayır — inceleme |
| `reliable` | Tek, koyu, kalite yüksek | Evet |
| `multiple` | İki daire de dolu | Hayır |
| `ambiguous` | Silik/silinmiş iz | Hayır |
| `invalid` | Kirli zemin / kalite kapısı | Hayır |
| `unread` | Üretilmedi | Hayır |

Bu, önerilen `EMPTY / D / Y / AMBIGUOUS / MULTIPLE_MARK / UNREADABLE` kümesinin karşılığıdır. Veri modelini yeniden adlandırmak kazanç sağlamaz; klinik kayıt zaten `reliable` dışını cevap saymaz.

Ölçüm: merkez disk karanlığı + kapama oranı; çevre mürekkebi veto eder, seçmez; yerel kağıt referansı `max(background, paper)` — yani **daire bazında göreli** ölçüm zaten var.

---

## 2. Girdi türleri — kodun gerçek kabul/red tablosu

| Girdi | Kapı | Sonuç | Koşul |
| --- | --- | --- | --- |
| Depodaki vektör form PDF | `pdfIO.createSafePdfWorkerSource` Flate, Image yok | **Kabul** | `tests/pdfScanPipeline.test.ts` 4 sayfa, 566 blank |
| Uygulama “PDF indir” aynı dosya | aynı | **Kabul** | `formPdf.ts` gömülü baytlar |
| Düz JPEG (`FF D8`) | `identifyFile` | Decode olur; sonra `analyzePage` | Fotoğrafta çoğunlukla QR/hizalama/kalite red |
| Düz PNG | `identifyFile` | aynı | aynı |
| Telefon JPEG | `identifyFile` evet; `createImageBitmap` + EXIF | Decode olur | OMR kapıları |
| Taranmış JPG/PNG | aynı | Decode olur | OMR kapıları |
| Görüntü içeren PDF (telefon/tarayıcı) | Worker: `Subtype Image` → fail; `DCTDecode` yasak | **Red, OMR’ye hiç girmez** | `pdfIO.ts` `raster()` / `makeFilter` |
| Çok sayfalı tarama PDF | aynı | **Red** | aynı |
| HEIC/HEIF | `identifyFile` imza yok | **Red** “yalnızca gerçek JPG, PNG veya PDF” | `imageIO.ts` 49–57 |
| WEBP | aynı | **Red** | aynı |
| TIFF/BMP | aynı | **Red** | aynı |
| Canlı kamera | `CameraCapture` → aynı `analyzePage` | Decode olur | OMR kapıları; HTTPS şart |

Dosya seçici: `accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"` (`ScannerWorkspace.tsx:246`).

`getDocument({ maxImageSize: 0 })` görüntü bütçesini sıfırlar; worker yaması olmasa bile gömülü JPEG düşer.

`warn = info = fail` her pdf.js uyarısını öldürür; tarama PDF’leri uyarı üretir.

---

## 3. Dört şikâyet — koddan doğrulama

### 3.1 Telefon / tarama görüntüsü kabul edilmiyor — **doğru, üç katmanlı**

Bu tek bir bug değil.

**Katman A — biçim.** HEIC/WEBP/TIFF `identifyFile` dışında.

**Katman B — PDF.** Gömülü görüntü kasıtlı yasak (`pdfIO.ts` yorumu: “accept only image-free PDFs”). Vektör form PDF geçer; Adobe Scan / iOS “PDF kaydet” / tarayıcı PDF geçmez. Kullanıcı cümlesi “normal PDF tamam, telefon PDF’i yok” bununla örtüşür.

**Katman C — OMR, JPEG açılsa bile.** Sıra:

1. `decodePageQr`: tek ölçek, `inversionAttempts: 'dontInvert'` (`qrDecoder.ts:18`).
2. `detectAlignmentMarks`: karelik ≥ 0.84 (daire π/4≈0.785’i elemek için), doluluk ≥ 0.43, iç 0.92, tahmin ikamesi yok. Önceki gerçek fotoğraf (`DOGRULAMA.md`) QR’ı okuyup `ALIGNMENT_MISSING` almıştı.
3. Warp sonrası `assessImageQuality`: parlaklık ≥ 175, gölge yayılımı ≤ 65, **her** dairenin Laplacian ≥ 100, **her** dairenin kontrast ≥ 0.4, **288 dairenin 16/16 sektörü**. Bir daire bozulursa `ok=false`.
4. `analyzePage:98`: `if (!quality.ok) return POOR_QUALITY` — cevap üretilmez.
5. `validatePageResult:34`: `quality.ok !== true` sayfa kabulünü de reddeder.
6. `detectItemMarks:53`: `!quality.ok` → tüm maddeler `invalid`.

Eşikler sentetik beyaz 248 zemin + kusursuz daireler içindir (`omrSynthetic.ts`). README bunu “gerçek kamerada kalibre edilmedi” diye yazar. Yani red, regressiyon değil, **tasarımın gerçek fotoğrafı kapsamaması**.

`squareFill` 0.84’ü körlemesine düşürmek daireleri kare yerine koyar (`omrSafety`: “circular blobs cannot replace squares”). Bu gevşetilmemeli.

### 3.2 “Tüm Sayfaları Yazdır” HTML basıyor — **doğru**

`src/App.tsx:156`: `onClick={() => window.print()}`. Gömülü PDF’e dokunmaz.

`downloadFormPdf` ayrı düğmedir ve doğrulanmış 4 sayfalık dosyayı indirir.

HTML yazdırma ek olarak kırık:

- `print.css` eski sınıf adları (`.form-sidebar`, `.scanner-workspace`, `.page-intro` …); DOM’da `.form-sidebar-panel`, `.scanner-layout-container`, `.form-prep-hero`.
- `.is-screen-hidden` yalnızca `@media screen` (`screen.css:266`). Yazdırınca tarama paneli de dökülür.
- `.form-page { display: none }` / `.is-active { display: block }` ekranda tek sayfa. `print.css` `display:block !important` ile dördünü açmaya çalışır; ölçek inline `transform` + tarayıcı “sığdır” geometriyi bozar.

HTML yazdırma, OMR’nin 5 mm kare / 3,5 mm daire varsayımını tarayıcı diyaloğuna bırakır. Bu, form okuma zinciri için **kabul edilemez**.

### 3.3 F5 → giriş ekranı — **doğru, kasıtlı tasarım**

`supabaseClient.ts`: `persistSession: false` + `getItem` daima `null` olan sahte depo. Yorum: kimlik localStorage/sessionStorage’a yazılmasın.

F5 bellek sıfırlar → `getSession()` boş → `AuthGate` giriş formu. Bu bir implementasyon hatası değil; günlük kullanım için yanlış ürün kararı.

RLS ve `profiles.active` kontrolü bundan bağımsız durmalı.

### 3.4 “Örnek işaretleme” çakışması — **doğru, PDF üreticisinde**

`renderFormPdf.ts` `drawHeader`: 140 mm başlığa (`qrArea.x - contentLeft - 4`) tek satırda

- `D: Doğru   Y: Yanlış` (~30–38 mm)
- kaydırmasız yönerge (~95 karakter, ~110–120 mm)
- sağda kare + `Örnek işaretleme`

Toplam 140 mm’yi aşıyor; metinler üst üste çizilir. HTML `form.css` aynı satırda `nowrap`. `gridTopMm = 60` sabit; çözüm ızgarayı kaydırmadan yönergeyi iki satıra bölmek ve sağda örnek için rezerv bırakmak. Izgara kayarsa 1.132 daire koordinatı kayar — **yasak**.

---

## 4. OMR okuma ve soru eşleştirme (ayrıntı)

Güvenlik duruşu doğru parçalar:

- Tahmin edilen köşe, gerçek kare bulunamazsa **kullanılmaz**.
- Warp, dört **gözlenen** kare merkezinden.
- QR ile kareler tutarsızsa `INVALID_GEOMETRY`.
- `reliable` dışındaki durumlar otomatik cevap değildir.
- Sentetik güvenlik testleri yanlış otomatik cevabı yasaklar.

Zayıf parçalar:

- QR tek ölçek, invert yok.
- Hizalama eşiği tek (zemin×0.55); gölgeli kare parçalanır.
- Kalite tek bit: tüm sayfa veya hiçbir cevap.
- `inspectResponse` `minTileBrightness=130` altında daireyi `invalid` sayar — loş fotoğrafta 144 madde birden düşer.
- Masa üstü fotoğrafta kağıt küçük kalır; QR 4 MP’ye inince daha da küçülür. Sayfa izolasyonu yok.

---

## 5. Görüntü ön işleme gerekli mi?

**Kısmen evet; genel filtre zinciri hayır.**

Mark detector zaten daire çevresinde yerel kağıt referansı kullanır. Global CLAHE / keskinleştirme / Otsu binarizasyonu:

- silik işareti yok edebilir veya
- gölgeyi işaret gibi gösterebilir veya
- QR/kare kenarını bozabilir.

Bu yüzden “önce güzelleştir, sonra OMR” yanlış çerçeve.

Gerekli ön işleme, **lokalizasyon** içindir (QR ve kareleri bulmak), işaret uydurmak için değil:

| İşlem | Ne zaman | İşarete etkisi | Karar |
| --- | --- | --- | --- |
| Masa/arka plan kırpma (açık kağıt bileşeni) | QR’dan önce | Yok (kırpma) | **Evet** — yeni küçük modül |
| QR çok ölçek + `attemptBoth` | decode | Yok | **Evet** — `qrDecoder` içi |
| Kare aramasında çoklu eşik / yerel Otsu | yalnızca arama penceresi | İşaret örneklemez | **Evet** — `alignmentDetector` içi |
| Warp (zaten var) | kareler bulunduktan sonra | Normalizasyon | **Koru** |
| Global kontrast/CLAHE | her yer | Yüksek yanlış pozitif riski | **Hayır** (ilk sürüm) |
| Global Otsu / 1-bit | her yer | Silik işaret ve kare içi delik | **Hayır** |
| Güçlü unsharp | her yer | Halka/leke | **Hayır** |
| Morfolojik close kare aramasında | aday çıkarma | Kare deliklerini birleştirebilir | İhtiyaten, yalnızca kare CCA’da, işaretten ayrı |
| Warp sonrası daire-yerel referans | zaten var | Doğru | **Koru** |

Ön işleme çıktısı aynı `PixelImage`/`GrayImage` olarak **mevcut** `analyzePage` devamına girmeli. İkinci bir OMR motoru yok.

---

## 6. Şablon/koordinat yaklaşımı mevcut sistemle uyumlu mu?

**Evet — bu zaten sistemin omurgası.** Kullanıcının tarif ettiği “doğrulanmış form şablonu + sabit soru koordinatları” yeni bir mimari değil; `FormDefinition` + `warpPerspective` + `item.responseAreas`.

Bunu terk etmek (görüntüde numara OCR’ı, sütun sayma, koyu blob sırası) klinik olarak daha kötü: yanlış madde numarası, yanlış D/Y.

Korunacak değişmezler:

- `FormDefinition` mm koordinatları
- QR formatı `M566:version:fingerprint:batchId:page:total`
- Dört kare bulunmadan sayfa transformu yok
- `reliable` olmadan otomatik cevap yok
- `clinicalTransferAllowed: false`

---

## 7. OCR gerekli mi?

**Hayır, ana karar mekanizması olarak.**

Gerekçe: 566 madde numarası şablonda var; sayfa kimliği QR’da var. Yoğun 3×48 ızgarada küçük “142” OCR’ı, eğik/gölgeli fotoğrafta şablondan daha kırılgan.

OCR ancak **teşhis** olabilir (QR okunamadı mesajına “sayfa numarası da okunamadı” eklemek). Sayfa/madde kimliği OCR’dan bağlanmamalı. İlk teslimatta OCR yok.

---

## 8. Taranmış PDF nasıl eklenmeli?

Worker yamasını “hiç görüntü yok”dan “bütçeli, süzgeç listeli görüntü var”a çevir.

- İzin: `FlateDecode`, `DCTDecode` (JPEG), `CCITTFaxDecode`, `ASCII85/ASCIIHex`, `RunLength` + `DecodeParms` (CCITT için şart).
- Yasak: `JPXDecode`, `JBIG2Decode`, `Crypt` — net mesajla JPG öner.
- `warn/info` artık fail değil.
- `maxImageSize: SCAN_LIMITS.sourcePixels` (şu an 0).
- `ensureBuffer` tavanı kalsın.
- Raster **aynı** `analyzePage`’e.

Güvenlik: sınırsız decode ve JBIG2/JPX wasm yok. Bu, “her PDF” değil; ofis tarayıcısı JPEG-PDF ve telefon PDF’inin büyük kısmı.

Test: worker sözleşmesi güncellenir; vektör PDF hattı kırılmamalı; mümkünse küçük DCTDecode fixture.

---

## 9. Yazdırma

**Karar:** Düğme doğrulanmış 4 sayfalık PDF’i yazdırsın (`formPdf.ts` baytları → gizli iframe `print()` veya yeni sekme). `window.print()` HTML yolu OMR formu için kullanılmasın.

Neden: geometri testli (`verify:pdf`, `pdfScanPipeline`); tarayıcı ölçeği yok; batch kimliği gömülü PDF ile okuyucunun beklediği şablon aynı.

HTML yazdır CSS’i Ctrl+P zararını azaltmak için onarılabilir ama **birincil baskı yolu olmamalı**. Kanıtlanmadan “HTML de güvenilir” denmez.

HTML önizlemenin `createBatchId()` her oturumda yeni set üretir; indirilen PDF sabit fingerprint kesiti kullanır. Kullanıcı HTML basıp kendi PDF’ini okutursa set uyumsuzluğu çıkar. Bir diğer neden PDF’i basmak.

---

## 10. Oturum

**Karar:** `persistSession: true`, depo **`sessionStorage`**.

| | F5 aynı sekme | Yeni sekme | Tarayıcı kapanınca | XSS yüzeyi |
| --- | --- | --- | --- | --- |
| Şu an (bellek) | düşer | düşer | düşer | kısa |
| sessionStorage | kalır | yeniden giriş | düşer | sekme ömrü |
| localStorage | kalır | kalır | kalır | uzun |

F5 şikâyeti sessionStorage ile kapanır. Orijinal “kimliği kalıcı yazma” niyetine localStorage’dan daha yakın. Rol/aktiflik hâlâ RLS + `userFromSession`. Çıkış depo anahtarını siler (`signOut`).

“Beni hatırla” / localStorage sonraya bırakılır.

---

## 11. Alternatif mimarilerin karşılaştırması

| Yaklaşım | Doğruluk / yanlış pozitif | Telefon/tarama | Maliyet | Mevcut kod | Karar |
| --- | --- | --- | --- | --- | --- |
| A. Yalnızca eşik gevşet | Yanlış pozitif artar; daire≠kare riski | Kısmen | Düşük | Uyumlu | Yetersiz ve tehlikeli |
| B. Genel görüntü filtresi + mevcut OMR | İşaret uydurma riski | Belirsiz | Orta | Uyumlu | Hayır |
| C. Mevcut hattı tamamla: girdi kapıları + lokalizasyon ön işleme + 3 kademeli kalite + aynı şablon/OMR | Yanlış pozitif kontrol altında kalır | Hedef | Orta | **Doğal uzantı** | **Seçilen** |
| D. Dinamik geometri / blob sırası | Madde numarası kayması | Kötü | Yüksek | Şablonu atar | Hayır |
| E. OCR ağırlıklı | Numara/OCR hatası | Kötü | Yüksek | Yok | Hayır |
| F. Sıfırdan yeni motor | Bilinmez | ? | Çok yüksek | Çalışan parçaları yakar | Hayır |

C, kullanıcının tarif ettiği hibritin **mevcut koda oturan** halidir: yeni motor değil, eksik gerçek-dünya katmanları.

---

## 12. Nihai mimari (tek karar)

```
Dosya/kamera
  → biçim (JPEG/PNG/WEBP/HEIC dene, PDF)
  → PDF ise bütçeli raster (DCT/Flate/CCITT) ─┐
  → görüntü ise decode + EXIF                 │
                                               ▼
  [lokalizasyon] kağıdı masadan ayır (emin değilse dokunma)
  → QR (çok ölçek, invert) → kimlik parse
  → kare ara (çoklu eşik; karelik 0.84 kalsın; tahmin ikame yok)
  → homografi / kesik sayfa / QR-kare tutarlılığı
  → warp 8 px/mm
  → kalite:
       fatal     → sayfa red, cevap yok
       degraded  → sayfa kabul, reliable YASAK, inceleme
       ideal     → bugünkü automatic reliable
  → detectItemMarks (mevcut model, yerel referans)
  → validatePageResult (quality.ok false’a izin; fatal değilse)
  → kayıt (yalnızca reliable veya manuel)
```

**Soru sırası yalnızca şablon + QR sayfa numarası.** Görüntü işleme madde numarası üretmez.

### Değişiklik sınıfları

| Öğe | Sınıf |
| --- | --- |
| FormDefinition, QR formatı, mm koordinatlar, warp, mark modeli, RLS, roller, PDF geometri üreticisi, sentetik güvenlik testleri | **Koru** |
| `persistSession` + sessionStorage | **Küçük değişiklik** |
| Yazdır = gömülü PDF | **Küçük değişiklik** |
| Başlık 2 satır + örnek rezervi (`renderFormPdf` + `form.css`); ızgara yerinde | **Küçük değişiklik** |
| `identifyFile` HEIC/WEBP | **Küçük değişiklik** |
| PDF worker süzgeç listesi + maxImageSize | **Küçük değişiklik** (sözleşme testi güncellenir) |
| QR çok ölçek/invert | **Küçük değişiklik** |
| Hizalama çoklu eşik | **Küçük değişiklik** |
| Kalite 3 kademe + validator | **Küçük değişiklik** (davranış; model alanı isteğe bağlı `fatal`) |
| Kağıt izolasyonu | **Yeni modül** (`pageIsolation`, analyzePage öncesi) |
| OCR, dinamik ızgara, ikinci OMR, HTML yazdırmayı birincil yapmak, karelik eşiğini daireye açmak | **Yapma** |
| Form/OMR veri modeli yeniden yazımı | **Yapma** |

---

## 13. Uygulama sırası (onay sonrası)

1. Oturum sessionStorage — F5.
2. Yazdır = doğrulanmış PDF.
3. PDF başlığı: ızgara `y=60` mm’ye değmeden iki satır + sağ rezerv; `npm run pdf` + `verify:pdf`.
4. Girdi: HEIC/WEBP denemesi; tarama PDF süzgeçleri.
5. QR çok ölçek/invert; kağıt izolasyonu (tam kenarlı PDF’de no-op).
6. Hizalama çoklu eşik; `squareFill` 0.84 korunur.
7. Kalite 3 kademe; `validatePageResult` degraded kabul; `reliable` yalnızca `quality.ok`.
8. Testler: mevcut sentetikler gevşetilmez; yeni: masa çerçevesi, degraded kabul + doğru madde numarası, worker DCT izin, sniffBytes.

Eşik sayıları **gerçek fotoğraf fixture’ı olmadan** düşürülmez. Önce kapıları ve lokalizasyonu aç; kalan redleri ölç.

---

## 14. Riskler

| Risk | Azaltma |
| --- | --- |
| Daha çok kabul = yanlış D/Y | `reliable` kapısı + inceleme; sentetik safety silinmez |
| Karelik gevşetme daire kabulü | 0.84 korunur |
| Global filtre işaret uydurur | Global filtre yok |
| Kağıt izolasyonu yanlış kırpar | Emin değilse orijinal görüntü |
| JPEG-PDF bellek | mevcut buffer tavanı + maxImageSize |
| HEIC Chrome’da yok | Açık mesaj: JPG kaydet |
| HTML yazdır hâlâ Ctrl+P | Düğme PDF; CSS ikincil |
| sessionStorage yeni sekmede giriş | Bilinçli; F5 hedefini karşılar |
| Izgara kaydırma | Başlık yalnızca metin sarımı |

Başarı ölçütü: “daha fazla dosya yeşil” değil; **doğru madde numarasına doğru durum** (D/Y/boş/belirsiz) ve belirsizin `reliable` olmaması.

---

## 15. Test planı

**Korunacak (gevşetilmeyecek):** `omrEngine`, `omrSafety` (daire≠kare, kalın leke otomatik cevap olmasın), `pdfForm`, `pdfScanPipeline` vektör PDF, `resultsSafety` (`reliable` tek otomatik cevap).

**Eklenecek:**

- Biçim: JPEG/PNG/WEBP/HEIC/PDF/çöp imzaları.
- Worker: DCT izinli, JPX red, sürüm pin.
- Masa çerçevesi sentetik: kırpılır, madde 1 = D, diğerleri blank.
- Degraded aydınlatma: sayfa kabul, `quality.ok=false`, **hiç reliable yok**, işaretli madde `single` ve `choiceId` doğru.
- Fatal bulanıklık/karanlık: hâlâ sayfa red, `items` yok.
- Vektör PDF hâlâ 4× kabul, 566 blank.
- Başlık: kimlik alanları, ızgara sapması 0.000 mm (`verify:pdf`).
- Altın senaryo (fixture hazır olunca, kabul tek başına yetmez):

```
madde 1 → reliable veya single, choiceId D
madde 2 → Y
madde 3 → blank
madde 4 → ambiguous veya multiple
```

Gerçek JPEG/tarama PDF bu ortamda yoksa sentetik masa+aydınlatma önce; kullanıcı görselleri ikinci turda altın set.

---

## Nihai soru

> Görüntü ön işleme + doğrulanmış form şablonu + QR/sayfa doğrulama + geometrik hizalama + sabit soru koordinatları + güvenilir OMR — en doğru yol mu?

**Evet — çünkü bu, mevcut kodun zaten olduğu mimaridir.** Doğru iş, onu değiştirmek değil tamamlamaktır.

- Şablon, QR, dört kare, homografi, sabit mm koordinatlar, `detectItemMarks` **kalır**.
- “Ön işleme” global güzelleştirme değil: kağıdı bul, QR’ı oku, kareleri **var oldukları yerde** çıkar.
- İşaret kararı warp sonrası, şablon konumunda, yerel referansla; belirsiz `reliable` olmaz.
- OCR ve dinamik ızgara daha kötü.
- Kör eşik gevşetme güvenlik testlerini ve klinik doğruluğu bozar.

Kod henüz değiştirilmedi. Onaydan sonra sıra §13’tür.
