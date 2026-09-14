# Doğrulama Raporu

Tarih: 2026-09-14 · Şablon: `MMPI566-DY-3C48-V2` · Sürüm: `2.0.0`
Ortam: Node.js v22.22.3, npm 10.9.8, Debian bookworm sandbox.

Bu rapor yalnızca bu ortamda çalıştırılan komutların gerçek çıktılarını içerir.
Çalıştırılamayan kontroller son bölümde ayrıca listelenmiştir.

## Çalıştırılan kontroller

| Komut | Sonuç |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | **exit 0**, hata yok |
| `npm test` (`tsx --test tests/*.test.ts`) | **49 test, 49 geçti, 0 başarısız** |
| `npm run build` | **exit 0** · `Built dist/index.html and ../optik-form.html (self-contained).` |
| `npm run pdf` | **exit 0** · `4 sayfa · A4 dikey · 242 KB` |
| `npm run verify:pdf` | **exit 0** (ayrıntı aşağıda) |
| `npm run dev` | Vite 7.3.6, `0.0.0.0:5173`, `HTTP 200` (yerel ve önizleme host başlığıyla) |

Test dağılımı:

| Dosya | Test |
| --- | --- |
| `tests/layout.test.ts` | 6 |
| `tests/formIdentity.test.ts` | 2 |
| `tests/omrPerspective.test.ts` | 6 |
| `tests/omrEngine.test.ts` | 13 |
| `tests/omrSafety.test.ts` | 7 |
| `tests/resultsSafety.test.ts` | 13 |
| `tests/pdfForm.test.ts` | 1 (üret + dosyadan doğrula) |
| `tests/build.test.ts` | 1 |

## Yazdırılabilir optik form

`src/print/` içinde tarayıcı gerektirmeyen bir PDF yazıcısı var: minimal PDF 1.7
üreticisi, TrueType gömme (Type0/Identity-H + ToUnicode) ve form sayfası çizimi.
Yazı tipi, pdfjs-dist'in zaten gönderdiği Liberation Sans'tır (Arial/Helvetica
ile metrik uyumlu), böylece ek indirme veya sistem yazı tipi gerekmez.

Baloncuk geometrisi yeniden hesaplanmaz; doğrudan `item.responseAreas`
koordinatlarından çizilir. Yani basılı daire ile okuyucunun beklediği konum aynı
kaynaktan gelir.

`npm run verify:pdf` gerçek çıktısı:

```
Sayfa 1: A4, 144/144 madde numarası doğru koordinatta (en büyük sapma 0.08 pt = 0.028 mm), kimlik alanı var, 288/288 işaretleme dairesi yerinde (en büyük sapma 0.000 mm).
Sayfa 2: A4, 144/144 madde numarası doğru koordinatta (en büyük sapma 0.08 pt = 0.028 mm), kimlik alanı yok, 288/288 işaretleme dairesi yerinde (en büyük sapma 0.000 mm).
Sayfa 3: A4, 144/144 madde numarası doğru koordinatta (en büyük sapma 0.08 pt = 0.028 mm), kimlik alanı yok, 288/288 işaretleme dairesi yerinde (en büyük sapma 0.000 mm).
Sayfa 4: A4, 134/134 madde numarası doğru koordinatta (en büyük sapma 0.08 pt = 0.028 mm), kimlik alanı yok, 268/268 işaretleme dairesi yerinde (en büyük sapma 0.000 mm).
Doğrulandı: 4 A4 sayfa, 566 madde numarası tanımlı koordinatlarında, kimlik alanları yalnızca 1. sayfada.
```

Doğrulayıcı üretilen dosyayı **bağımsız** okur; üretecin kendi kaydına güvenmez:

- pdf.js (legacy build) ile sayfa sayısı ve `MediaBox` A4 kontrolü.
- Metin çıkarımıyla 566 madde numarasının tanımlı x/y konumunda olduğu
  (en büyük sapma 0,028 mm — bu, yazı tipi yerleşiminden gelen yuvarlamadır).
- Sayfa içerik akışı Flate ile açılıp her `m` + 4 `c` + `S` yolu çözümlenerek
  **1.132 dairenin** merkez ve çapının `FormDefinition` ile karşılaştırılması
  (sapma 0,000 mm).
- `FORM KİMLİĞİ` / `KATILIMCI KODU` / `TARİH` etiketlerinin yalnızca 1. sayfada
  geçtiğinin metin üzerinden doğrulanması.

OMR tarafı ayrıca kanıtlı: sentetik görüntü testleri, tam bu koordinatlardaki
daireleri `reliable`/`single`/`blank` olarak doğru okuyor. Zincir şöyle
kuruluyor: *PDF bu koordinatları içeriyor* (dosyadan doğrulandı) + *OMR bu
koordinatları okuyor* (sentetik testlerle doğrulandı). Yine de gerçek kağıt ve
gerçek kamera üzerinde test edilmedi.

## Bu oturumda düzeltilenler

### 1. Tip kontrolü ve derleme kırılmıştı (5 hata)

`npx tsc --noEmit` çıkış kodu **2** veriyordu; `npm run build`
`tsc --noEmit && node scripts/build.mjs` olduğu için derleme hiç çalışmıyordu.

| Hata | Kök neden | Düzeltme |
| --- | --- | --- |
| `PageQr.tsx(16)` ×2 — `Property 'get' does not exist on type 'Uint8Array'` | `data.get` dalı ölü koddu | `qrcode/lib/core/bit-matrix.js:39` → `get(row, col) === data[row * size + col]`; düz satır-öncelikli indeksleme |
| `pdfIO.ts(103)` — `?raw` modülü bulunamıyor | Yalnızca Vite/esbuild çözer | `src/rawImports.d.ts` |
| `pdfIO.ts(112)` — `Worker` → `null \| undefined` | pdfjs-dist 6.3.289 `api.d.ts` kurucuyu hatalı üretmiş; belgelediği tip `port?: Worker`, çalışma zamanı `params?.port` okuyor | Kurucu tipi tek çağrı noktasında belgelenen biçime çevrildi |
| `pdfIO.ts(113)` — `isEvalSupported` yok | pdfjs-dist 6'da kaldırılmış: `grep -c` hem tiplerde hem `pdf.mjs`'te **0** | Kaldırıldı; "eval kapalı" iması geri çekildi |

### 2. Eğik çekimde hizalama tamamen başarısızdı

`not ok 18 - synthetic non-right-angle rotation still detects all four actual squares`
→ `ALIGNMENT_MISSING`. 26 mm'lik QR'ın dört köşesinden 8 serbestlik dereceli
homografi uydurulup 254 mm öteye ekstrapole ediliyordu. Uydurma QR köşelerinde
kusursuz (kalıntı `0.00 px`), ama alt-piksel gürültü uzaklıkta katlanıyordu.
17° döndürülmüş sentetik sahnede ölçülen değerler:

| Köşe karesi | QR'a uzaklık | Arama yarıçapı | Projektif hata | Benzerlik hatası |
| --- | --- | --- | --- | --- |
| top-left | 166 mm | 138 px | **134,6 px** | 4,3 px |
| top-right | 28 mm | 63 px | 1,5 px | 0,3 px |
| bottom-right | 254 mm | 186 px | **247,0 px** | 6,8 px |
| bottom-left | 302 mm | 212 px | **116,9 px** | 8,0 px |

Üç kare arama penceresinin dışındaydı. 15° gerçek perspektifte ise tam tersi
(projektif 0,7–39,2 px, benzerlik 71,7 px) — bu yüzden ikisi birlikte kullanıldı.

Düzeltme: sınırlı 4 serbestlik dereceli `fitSimilarity()` eklendi,
`detectAlignmentMarks()` sıralı tahmin listesi alıyor. Hiçbir aday filtresi
gevşetilmedi; sayfa dönüşümü hâlâ dört **gerçek** kare merkezinden uyduruluyor ve
QR tutarlılık denetimi (`qrError > max(4, 1,5 mm)`) koruma ağı olarak duruyor.
Sentetik gürültüyle ölçüm (254 mm, ~1 px köşe gürültüsü): projektif **83,5 px**,
benzerlik **5,8 px**.

### 3. PDF sıkıştırmasında ölü kilit

`CompressionStream` ile sıkıştırma, `write()` okuma başlamadan beklendiğinde
iç kuyruk boyutunu aşan girdilerde (139 KB'lık yazı tipi) geri basınçtan
kurtulamıyordu; üretici sessizce askıda kalıyordu. Okuma artık yazmadan önce
başlatılıyor.

### 4. Diğer

- Kimlik alanları teste bağlandı (`tests/formIdentity.test.ts`): `FORM KİMLİĞİ`,
  `KATILIMCI KODU`, `TARİH` yalnızca 1. sayfada; QR, dört köşe karesi, sayfa
  numarası ve tüm madde satırları her sayfada korunuyor.
- İki proje kopyası tek klasöre indirildi. `diff -rq` ile v1'in (`outputs/`)
  benzersiz dosyası olmadığı doğrulandı ve kaldırıldı.
- README v1'den kalmıştı ("Kamera, yükleme, OMR yoktur", şablon `...-V1`);
  kodla çelişiyordu, yeniden yazıldı.
- Vite yapılandırması eklendi: barındırılan önizleme host'u `.e2b.app`
  izin listesine alındı (öncesinde 403), sunucu `0.0.0.0`'a bağlanıyor.
- Poppler gerektiren `scripts/verify-pdf.mjs` kaldırıldı; yerine pdf.js ile
  çalışan ve `npm test` içinde de koşan `scripts/verify-pdf.ts` geldi.

## Statik olarak doğrulananlar

- `print.css`: `@page { size: A4 portrait; margin: 0 }`, dört `.form-page` için
  `break-after: page`, `.paper-stack` üzerinde `transform: none !important`
  (ekran yakınlaştırması baskıya taşınmaz), arayüz bileşenleri `display: none`.
- `getDocument()` çağrısındaki tüm pdf.js seçenekleri 6.3.289 tiplerinde mevcut.
- `* { box-sizing: border-box }` geçerli; bu yüzden 3,5 mm daire çapı dış
  ölçüdür ve 0,3 mm sınır içe çizilir — PDF üreticisi de aynı modeli kullanır.
- Şablon verisi: 4 sayfa, 144/144/144/134 madde, 1.132 işaretleme alanı.

## Doğrulanmayanlar

Bunlar bu ortamda **çalıştırılamadı**; yapılmış gibi gösterilmiyor.

- **Tarayıcı yazdırma yolu.** Sandbox'ta Chromium, Playwright tarayıcı
  indirmesi, LibreOffice veya Poppler yok; ağ yalnızca npm kayıt defterine açık
  (`deb.debian.org` ve Playwright CDN'i erişilemez — ikisi de denendi). Bu
  yüzden `dist/index.html` içindeki “Tüm sayfaları yazdır” akışı ve CSS
  render'ının basılı çıktısı bir tarayıcıda ölçülmedi. **Doğrulanmış olan PDF,
  `src/print/` üreticisinden geliyor; tarayıcının yazdırma çıktısı değil.**
- **Fiziksel yazıcı.** Ölçeklendirme, kenar kesimi, kağıt boyutu. İlk baskıda
  5 mm köşe kareleri ve 3,5 mm daireler ölçülmelidir.
- **Gerçek görüntüler.** Kamera, ışık, gölge, kalem, silgi, fotokopi ve tarama
  üzerinde okuma doğruluğu. Tüm OMR eşikleri sentetik raster örneklerle
  sınırlıdır; doğruluk yüzdesi iddia edilmez.
- **Kamera ve `getUserMedia`.** Bu oturumda hiçbir tarayıcı çalıştırılmadı;
  kamera akışı yalnızca kod düzeyinde incelendi.
- **Safari/Firefox ve mobil işletim sistemleri.**
- **Yetkili MMPI formu.** Madde düzeni, seçenek yapısı, sayfa sayısı ve
  numaralandırmanın lisanslı formla eşdeğerliği. Yetkili veri sağlanmadı.
- **Klinik puanlama.** Bu sürümde yoktur; `clinicalTransferAllowed` her zaman
  `false` döner.

## Bir sonraki doğrulama adımı

1. `MMPI-566-optik-cevap-formu.pdf` dosyasını A4, %100, tek yüz yazdırın.
2. Köşe karelerini (5 mm) ve birkaç daireyi (3,5 mm) kumpasla ölçün.
3. Telefonla çekip “Tara ve gözden geçir” sekmesinde okutun; 17°'ye kadar eğik
   çekim destekleniyor.
4. Boş, tek işaretli, çoklu işaretli, silinmiş, silik, gölgeli, bulanık ve
   fotokopi senaryolarını gerçek kağıtla tekrarlayın ve eşikleri kalibre edin.

Bu dört adım tamamlanmadan okuma doğruluğu hakkında iddiada bulunulmamalıdır.
