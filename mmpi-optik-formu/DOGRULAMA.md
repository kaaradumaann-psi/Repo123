# Doğrulama Raporu

Tarih: 2026-09-14 · Şablon: `MMPI566-DY-3C48-V2` · Sürüm: `2.0.0`
Ortam: Node.js v22.22.3, npm 10.9.8, Debian bookworm sandbox.

Bu rapor yalnızca bu ortamda çalıştırılan komutların gerçek çıktılarını içerir.
Çalıştırılamayan kontroller "Doğrulanmayanlar" bölümünde ayrıca listelenmiştir.

## Bu oturumda düzeltilenler

### 1. Tip kontrolü ve derleme kırılmıştı (5 hata)

`npx tsc --noEmit` çıkış kodu **2** veriyordu. `npm run build` komutu
`tsc --noEmit && node scripts/build.mjs` olduğu için üretim derlemesi de
çalışmıyordu.

| Hata | Kök neden | Düzeltme |
| --- | --- | --- |
| `PageQr.tsx(16,32)` ve `(16,58)` — `Property 'get' does not exist on type 'Uint8Array'` | `qrcode`'un `BitMatrix.data` alanı düz `Uint8Array` olarak tiplenmiş; `typeof data.get === 'function'` dalı ölü koddu | Satır-öncelikli düz indeksleme: `data[y * size + x]`. `qrcode/lib/core/bit-matrix.js:39` içindeki `get(row, col)` tam olarak `this.data[row * this.size + col]` döndürür, yani davranış birebir aynı |
| `pdfIO.ts(103,36)` — `Cannot find module 'pdfjs-dist/build/pdf.worker.mjs?raw'` | `?raw` son eki Vite/esbuild özelliği; TypeScript bunu tanımaz | `src/rawImports.d.ts` ile tek noktadan ortam bildirimi |
| `pdfIO.ts(112,36)` — `Type 'Worker' is not assignable to type 'null \| undefined'` | pdfjs-dist 6.3.289'un ürettiği `api.d.ts`, `PDFWorker` kurucusunu `{ port?: null \| undefined }` olarak yazıyor; aynı paketin belgelediği `PDFWorkerParameters` ise `port?: Worker` diyor ve çalışma zamanı `params?.port` okuyor | Kurucu tipi tek çağrı noktasında belgelenen biçime çevrildi; çalışma zamanı davranışı değişmedi |
| `pdfIO.ts(113,49)` — `'isEvalSupported' does not exist in type 'DocumentInitParameters'` | Seçenek pdfjs-dist 6'da kaldırılmış: `grep -c isEvalSupported` hem `types/` hem `build/pdf.mjs` için **0** | Seçenek kaldırıldı. Zaten etkisizdi; "eval kapalı" iddiası geri çekildi ve koda not düşüldü |

Diğer seçenekler (`disableAutoFetch`, `isOffscreenCanvasSupported`,
`isImageDecoderSupported`, `useWasm`, `useSystemFonts`, `useWorkerFetch`,
`stopAtErrors`, `maxImageSize`) 6.3.289 tiplerinde ve çalışma zamanında mevcut;
dokunulmadı.

### 2. Eğik çekimde hizalama tamamen başarısızdı

`tests/omrEngine.test.ts` içindeki *"synthetic non-right-angle rotation still
detects all four actual squares"* testi başarısızdı:

```
not ok 18 - synthetic non-right-angle rotation still detects all four actual squares
  error: 'ALIGNMENT_MISSING: Dört siyah hizalama karesi ayrı ayrı bulunamadı; sayfanın tamamı görünmeli.'
  expected: true
  actual: false
```

Ölçülen kök neden: sayfa kimliği için 26 mm'lik QR'ın dört köşesinden **8
serbestlik dereceli** bir homografi uyduruluyor, sonra bu dönüşüm 254 mm ötedeki
köşe karesini tahmin etmek için kullanılıyordu. Uydurma QR köşelerinde kusursuz
(kalan hata `0.00 0.00 0.00 0.00` px), ancak alt-piksel köşe gürültüsü uzak
mesafede katlanarak büyüyor. 17° döndürülmüş sentetik sahnede ölçülen tahmin
hatası ve arama yarıçapı:

| Köşe karesi | QR'a uzaklık | Arama yarıçapı | Projektif tahmin hatası | Benzerlik tahmin hatası |
| --- | --- | --- | --- | --- |
| top-left | 166 mm | 138 px | **134,6 px** | 4,3 px |
| top-right | 28 mm | 63 px | 1,5 px | 0,3 px |
| bottom-right | 254 mm | 186 px | **247,0 px** | 6,8 px |
| bottom-left | 302 mm | 212 px | **116,9 px** | 8,0 px |

Üç kare arama penceresinin dışında kalıyordu; sonuç `ALIGNMENT_MISSING`. Aynı
ölçüm 15° gerçek perspektif sahnesinde tersini gösteriyor: orada projektif uyum
iyi (32–39 px), benzerlik uyumu kötüleşiyor (bottom-left 71,7 px). Yani iki
tahmin de tek başına yeterli değil.

Düzeltme: `perspectiveCorrection.ts` içine sınırlı (4 serbestlik dereceli)
`fitSimilarity()` eklendi ve `detectAlignmentMarks()` artık **sıralı tahmin
listesi** alıyor. `analyzePage` iki tahmini birden veriyor; bir kare yalnızca
bir tahmin tüm filtreleri (alan, doluluk, karelik, iç dolgunluk, belirsizlik
payı, yinelenen merkez) geçerse bulunmuş sayılıyor. Filtrelerin hiçbiri
gevşetilmedi ve sayfa dönüşümü hâlâ dört **gerçek** kare merkezinden
uyduruluyor; QR tutarlılık denetimi (`qrError > max(4, 1,5 mm)`) koruma ağı
olarak duruyor.

Sentetik gürültüyle doğrulama (254 mm ötede, ~1 px köşe gürültüsü):
projektif **83,5 px**, benzerlik **5,8 px**.

### 3. Kimlik alanları teste bağlandı

`FORM KİMLİĞİ`, `KATILIMCI KODU`, `TARİH` alanları kaynak kodda zaten
`firstPage &&` koşuluyla yalnızca ilk sayfada üretiliyordu
(`components/FormPage.tsx`), ama bunu koruyan bir test yoktu.
`tests/formIdentity.test.ts` eklendi: dört sayfanın statik render'ı alınıp
kimlik bloğunun, üç etiketin ve tarih ayraçlarının **yalnızca** 1. sayfada
olduğu; diğer sayfalarda `data-identity="continuation"` ile birlikte hiç
bulunmadığı; buna karşılık QR, dört köşe karesi, sayfa numarası ve tüm madde
satırlarının her sayfada korunduğu doğrulanıyor.

### 4. Klasör düzeni tek proje klasörüne indirildi

Depoda iki proje kopyası vardı: kökteki `mmpi-optik-formu/` (v2.0.0, RAR'dan) ve
`outputs/mmpi-optik-formu/` (v1.0.0, eski ZIP'ten). `diff -rq` ile v1'in v2'de
olmayan hiçbir dosyası bulunmadığı doğrulandı, ardından v1 kopyası kaldırıldı.
Ayrıca derlemenin depo köküne yazdığı `optik-form.html` kök `.gitignore`'a
eklendi.

### 5. README kodla çelişiyordu

README, RAR ile gelen v2 koduna rağmen v1'den kalmıştı: şablon kimliğini
`MMPI566-DY-3C48-V1` olarak veriyor ve "Kamera, yükleme, OMR ... yoktur"
diyordu; oysa `src/omr/` ve `src/scanner/` mevcut. README v2 gerçeğine göre
yeniden yazıldı.

## Çalıştırılan kontroller

| Komut | Sonuç |
| --- | --- |
| `npx tsc --noEmit` | **exit 0**, hata yok (düzeltme öncesi: 5 hata, exit 2) |
| `npm test` (`tsx --test tests/*.test.ts`) | **48 test, 48 geçti, 0 başarısız** (düzeltme öncesi: 44 test, 43 geçti, 1 başarısız) |
| `npm run build` | **exit 0** · `Built dist/index.html and ../optik-form.html (self-contained).` |

Test dağılımı:

| Dosya | Test |
| --- | --- |
| `tests/layout.test.ts` | 6 |
| `tests/formIdentity.test.ts` | 2 (yeni) |
| `tests/omrPerspective.test.ts` | 6 (2'si yeni) |
| `tests/omrEngine.test.ts` | 13 |
| `tests/omrSafety.test.ts` | 7 |
| `tests/resultsSafety.test.ts` | 13 |
| `tests/build.test.ts` | 1 |

Testlerin kapsadığı senaryolar: boş form, tek güçlü işaret, silik işaret,
silinmiş cevap, çoklu işaret, sınırda tek işaret, çelişen iz, eksik/oyuk köşe
karesi, kesilmiş sayfa, yetersiz ışık, gölge, genel ve yalnızca cevap alanına
özgü bulanıklık, 90/180/270° dönüş, 15° projektif çarpıklık, **17° sağ açı
olmayan dönüş**, yüksek çözünürlük, 12 MP üzeri girdi, bozuk/eksik görüntü
verisi, yanlış QR sürümü/özeti/seti/sayfası, elle inceleme ve geri alma,
yinelenen ve yabancı sayfa reddi.

## Statik olarak doğrulananlar

- `print.css`: `@page { size: A4 portrait; margin: 0 }`, dört `.form-page` için
  `break-after: page`, `.paper-stack` üzerinde `transform: none !important`
  (ekran yakınlaştırması baskıya taşınmaz), arayüz bileşenleri `display: none`.
  Yazdırma kuralları `.identity-fields`'a dokunmuyor; kimlik bloğu diğer
  sayfaların DOM'unda hiç olmadığı için baskıda da oluşamaz.
- `getDocument()` çağrısındaki tüm pdf.js seçenekleri 6.3.289 tiplerinde mevcut.
- Şablon verisi: 4 sayfa, 144/144/144/134 madde, 1.132 işaretleme alanı, yerleşim
  özeti `1F49F315B2636DCB4C18C2E48242AA09B560B8737F81E2E502DFA9109016E280`.

## Doğrulanmayanlar

Bunlar bu ortamda **çalıştırılamadı**; yapılmış gibi gösterilmiyor.

- **Basılı çıktı ve PDF.** Sandbox'ta Chromium, Playwright tarayıcı indirmesi,
  LibreOffice veya Poppler (`pdftotext`) yok; ağ yalnızca npm kayıt defterine
  açık (`deb.debian.org` ve Playwright CDN'i erişilemez). Bu yüzden:
  - v2 için yeni bir PDF **üretilmedi**. `uploads/mmpi-566-optik-cevap-formu.pdf`
    ve `uploads/optik-form.html` **v1** çıktısıdır: QR ve tarama bileşenleri
    içermez, güncel şablonla eşleşmez.
  - `scripts/verify-pdf.mjs` Poppler gerektirdiği için çalıştırılmadı.
  - DOM'daki daire merkezlerinin TypeScript koordinatlarıyla karşılaştırılması
    ve yazdırma önizlemesinin tarayıcıda ölçülmesi yapılmadı.
  - Kimlik alanlarının yalnızca ilk sayfada olduğu React render testiyle
    kanıtlandı, **basılı kağıt üzerinde kanıtlanmadı**.
- **Fiziksel yazıcı davranışı.** Ölçeklendirme, kenar kesimi, kağıt boyutu. İlk
  baskıda 5 mm köşe kareleri ölçülmelidir.
- **Gerçek görüntüler.** Kamera, ışık, gölge, kalem, silgi, fotokopi ve tarama
  üzerinde okuma doğruluğu. Tüm eşikler sentetik raster örneklerle sınırlıdır;
  doğruluk yüzdesi iddia edilmez.
- **Safari/Firefox ve mobil işletim sistemleri.** `getUserMedia`, yazdırma
  diyaloğu ve pdf.js worker davranışı yalnızca Chromium'da kısmen test edilebildi;
  bu oturumda hiç tarayıcı çalıştırılmadı.
- **Yetkili MMPI formu.** Madde düzeni, seçenek yapısı, sayfa sayısı ve
  numaralandırmanın lisanslı formla eşdeğerliği. Yetkili veri sağlanmadı.
- **Klinik puanlama.** Bu sürümde yoktur ve `clinicalTransferAllowed` her zaman
  `false` döner.

## Bir sonraki doğrulama adımı

Tarayıcı bulunan bir makinede:

```sh
npm ci && npm run build
npx playwright install chromium   # veya sistem Chromium'u
node scripts/verify-pdf.mjs <üretilen pdf>   # Poppler (pdftotext) gerektirir
```

ve ilk baskıda köşe karelerini, QR'ı ve 1. sayfadaki kimlik alanlarını fiziksel
olarak ölçün. Bu üçü tamamlanmadan okuma doğruluğu hakkında iddiada
bulunulmamalıdır.
