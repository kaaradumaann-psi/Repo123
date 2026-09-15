# Doğrulama Raporu

Tarih: 2026-09-14 · Şablon: `MMPI566-DY-3C48-V2` · Sürüm: `2.0.0`
Ortam: Node.js v22.22.3, npm 10.9.8, Debian bookworm sandbox.

Bu rapor yalnızca bu ortamda çalıştırılan komutların gerçek çıktılarını içerir.
Çalıştırılamayan kontroller son bölümde ayrıca listelenmiştir.

## Çalıştırılan kontroller

| Komut | Sonuç |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | **exit 0**, hata yok |
| `npm test` (`tsx --test tests/*.test.ts`) | **56 test, 56 geçti, 0 başarısız, 0 atlandı** |
| `npm run build` | **exit 0** · `Built dist/index.html and ../optik-form.html (self-contained).` |
| `npm run pdf` | **exit 0** · `4 sayfa · A4 dikey · 242 KB` |
| `npm run verify:pdf` | **exit 0** (ayrıntı aşağıda) |
| `npm run dev` | Vite 7.3.6, `0.0.0.0:5173`, `HTTP 200` (yerel ve önizleme host başlığıyla) |

Test dağılımı:

| Dosya | Test |
| --- | --- |
| `tests/layout.test.ts` | 6 |
| `tests/formIdentity.test.ts` | 2 |
| `tests/omrPerspective.test.ts` | 7 |
| `tests/omrEngine.test.ts` | 16 |
| `tests/omrSafety.test.ts` | 7 |
| `tests/resultsSafety.test.ts` | 13 |
| `tests/pdfForm.test.ts` | 1 (üret + dosyadan doğrula) |
| `tests/pdfScanPipeline.test.ts` | 2 (PDF'i rasterleştir + gerçek OMR hattı) |
| `tests/build.test.ts` | 2 (tek dosya derleme + gömülü PDF) |

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

## İlk gerçek görüntü denemesi (2026-09-14)

Kullanıcı gerçek bir fotoğraf yükledi (`1234_page-0001.jpg`) ve
`ALIGNMENT_MISSING` aldı: “Dört siyah hizalama karesi ayrı ayrı bulunamadı”.

Bu hata kodu hattaki sırası gereği önemli bir bilgi taşıyor: QR **okunmuş** ve
sayfa kimliği **eşleşmiş** olmalı, çünkü `ALIGNMENT_MISSING` bu iki kontrolden
sonra üretiliyor. Yani form doğru, kimlik doğru; sorun yalnızca dört köşe
karesinin bulunmasında.

Görüntü bu ortama ulaşmadığı için kök neden **belirlenemedi** ve hiçbir eşik
değiştirilmedi — veri olmadan eşik gevşetmek tahmin olurdu. Bunun yerine hata
artık teşhis edilebilir: `detectAlignmentMarks` her red yolunu raporluyor,
`analyzePage` bunu mesaja taşıyor. Örnek gerçek çıktılar:

```
[ALIGNMENT_MISSING] ... Bulunamayan 1 kare var — sol üst kare: 1 aday boyut veya
dolgunluk ölçütünü geçmedi. Kâğıdın dört köşesi de kadrajda olacak şekilde,
gölgesiz ve sayfaya dik açıdan yeniden çekin.

[ALIGNMENT_MISSING] ... Bulunamayan 1 kare var — sol alt kare: 6 aday boyut veya
dolgunluk ölçütünü geçmedi. ...
```

Olası nedenler (henüz ayırt edilmedi): kâğıdın bir köşesinin kadraj dışında
kalması, köşede gölge veya parlama, çok soluk baskı, ya da gerçek kâğıdın
düzlemsel olmaması nedeniyle QR tabanlı tahminin arama yarıçapını aşması. Son
olasılık sentetik testlerde ölçülmedi; bu yüzden **gerçek fotoğraf gerekir**.

`tests/omrEngine.test.ts` içindeki yeni test, bulunamayan karenin adının ve
elendiği ölçütün gerçekten mesajda geçtiğini doğruluyor (56/56 test).

## Tam kenarlı sayfa: PDF yüklemesi neden reddediliyordu (2026-09-14)

Kullanıcı formu tarayıcıdan “PDF olarak kaydet” ile üretip yüklediğinde dört
sayfanın tamamı şu hatayı verdi:

```
optik.pdf · PDF 1/4: Sayfa kabul edilmedi: Sayfanın kenarları kesilmiş;
kâğıdın tamamını kadraja alın.
```

Kök neden tahmin edilmedi, ölçüldü. `inspectPageGeometry` sayfanın dört köşesini
görüntüye izdüşürüyor ve bir köşe kenarın dışına taşıyorsa `PAGE_CROPPED`
döndürüyordu; tolerans **sabit 1,5 pikseldi**. Oysa bir PDF rasteri veya kenar
boşluksuz tarama **tam kenarlıdır**: kâğıt görüntünün sınırına birebir oturur.
Depodaki PDF'in rasterinde ölçülen değer:

```
PDF rasteri (1680x2376) · px/mm 8.000 · köşeler -0.50 px · kalan pay 1.0 px
```

Yani tam kenarlı her sayfa, 2 piksellik (0,25 mm) bir kenar kaybında bile
“kesilmiş” sayılıyordu — dört köşe karesi kenardan 10 mm içeride ve tamamen
sağlam olmasına rağmen. Düzeltmeden önce ölçülen zarf:

```
  0 mm kenar kaybı -> KABUL
0.25 mm ve sonrası -> RED [PAGE_CROPPED]
```

Düzeltme: tolerans artık sabit bir piksel değeri değil, **formun kendi
yerleşiminden türetiliyor**. `analyzePage` kenardan en yakın basılı öğeye
(hizalama karesi, QR, yanıt dairesi) olan uzaklığı buluyor ve yarısını tolerans
yapıyor; bu form için 10 mm / 2 = **5 mm**, `MAX_CROP_TOLERANCE_MM` ile sınırlı.
Bu kadarlık bir kayıpta okunabilir hiçbir şey yitirilmediği için kabul doğru
davranıştır; gerçekten kesilmiş sayfalar çok daha büyük farkla reddedilmeye
devam ediyor. Düzeltmeden sonra ölçülen zarf:

```
0 - 4 mm kenar kaybı -> KABUL
6 mm -> RED [PAGE_CROPPED] yaklaşık 6,1 mm eksik
8 mm -> RED [PAGE_CROPPED] yaklaşık 8,1 mm eksik
```

Mesaj da artık ölçülen kaybı ve gerçek nedeni söylüyor; bir PDF'e “kadraja alın”
demek yerine yazdırma ayarlarını veriyor:

```
Sayfanın bir kenarı görüntüde yok; yaklaşık 6,1 mm eksik. Fotoğraflarda kâğıdın
tamamını kadraja alın. PDF veya yazdırma çıktısında sayfa boyutunu A4, ölçeği
%100, kenar boşluklarını "yok" yapın ve "sayfaya sığdır" seçeneğini kapatın.
```

Bu yol artık kalıcı olarak test ediliyor. `tests/pdfScanPipeline.test.ts`
depodaki PDF'i `src/scanner/pdfIO.ts` ile aynı ölçekte rasterleştirip gerçek
`analyzePage` hattından geçiriyor: 4 sayfa kabul ediliyor, 566 maddenin tamamı
`blank` okunuyor, sayfalar **tek tek** kabul ediliyor, eksik sayfalar listede
kalıyor ve dört sayfa aynı baskı setini paylaşıyor. Bu, PDF yükleme yolunun ilk
uçtan uca testi; daha önce hiç yoktu.

## Sitenin kendi yazdırma çıktısı ve bayat kopya (2026-09-14)

Kullanıcı, ana sayfadaki **“Tüm sayfaları yazdır”** düğmesiyle PDF üretip
yüklediğinde yine aynı hatayı aldı:

```
123.pdf · PDF 1/4: Sayfa kabul edilmedi: Sayfanın kenarları kesilmiş;
kâğıdın tamamını kadraja alın.
```

Bu metin **eski** metindir. Depoda arandığında hiçbir yerde yok:

```
grep -rn "kenarlar.. kesilmi" src/ dist/ ../optik-form.html   -> sonuc yok
```

Yeni metin (`analyzePage.ts:82`) hem `dist/index.html` hem `optik-form.html`
içinde. Yani o hata ancak **güncellenmemiş bir kopyadan** gelebilir; tarayıcı
sekmesi ya da daha önce indirilmiş `optik-form.html`.

Bunun yanında gerçek bir eksik giderildi: sitenin ürettiği çıktı ile depodaki
doğrulanmış PDF ayrı şeylerdi ve kullanıcı yalnızca tarayıcının yazdırma
diyaloğuna bağlıydı. Artık form sayfasında **“Hazır PDF'i indir”** düğmesi var.
`src/print/formPdf.ts` doğrulanmış PDF'i `?inline` ile içe aktarıyor; Vite bunu
geliştirmede data URI olarak veriyor, `scripts/build.mjs` içindeki esbuild
eklentisi aynı biçimi tek dosyalık derlemede üretiyor. İki yolda da çözülen
baytlar dosyayla birebir aynı (sha256 `ab51f0b6383227ac`, 248 169 bayt):

```
derlemeden cozülen : 248169 bayt · %PDF-1.7
Vite dev modulunden: 248169 bayt · %PDF-1.7
dosya              : 248169 bayt · BIREBIR AYNI: True
```

`tests/build.test.ts` içindeki ikinci test, derlemeye gömülen kopyanın committed
PDF'ten bayt bayt farklılaşmadığını doğruluyor; böylece okuyucuyla hiç
sınanmamış bir form dağıtılamaz.

**Yazdırma yolu hâlâ bir tarayıcıda çalıştırılmadı** — bu ortamda tarayıcı yok.
`@page { size: A4 portrait; margin: 0 }` kuralı `src/styles/print.css:1` içinde
mevcut; ancak tarayıcının diyaloğu kâğıt boyutunu veya ölçeği değiştirebilir.
Bu yüzden önerilen yol indirilen PDF'tir.

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
  kamera akışı yalnızca kod düzeyinde incelendi. Tarayıcı ayrıca kamerayı
  yalnızca HTTPS veya `localhost` üzerinde açar; bu kural uygulama kodundan
  aşılamaz.
- **Tarayıcıdaki PDF işçisi.** `tests/pdfScanPipeline.test.ts` PDF'i Node'da
  rasterleştirip OMR hattını doğruluyor; ancak `src/scanner/pdfIO.ts` içindeki
  sıkılaştırılmış Web Worker, `createSafePdfWorkerSource` denetimi ve blob
  işçisi bir tarayıcıda çalıştırılmadı.
- **Safari/Firefox ve mobil işletim sistemleri.**
- **Yetkili MMPI formu.** Madde düzeni, seçenek yapısı, sayfa sayısı ve
  numaralandırmanın lisanslı formla eşdeğerliği. Yetkili veri sağlanmadı.
- **Klinik puanlama.** Bu sürümde yoktur; `clinicalTransferAllowed` her zaman
  `false` döner.

## Eklenen kullanıcı ve kayıt akışı (kod düzeyi kapsam)

- Mevcut OMR, kamera, PDF, form geometrisi ve sonuç inceleme modülleri değiştirilmedi;
  yalnızca giriş kapısı, Admin paneli ve tarama sonrası kayıt bileşeni eklendi.
- `src/auth/authStore.ts` parola metni saklamaz; tarayıcı Web Crypto PBKDF2-SHA-256
  ile tuzlu özet üretir, aktif/pasif kullanıcı ve Admin/Psikolog rolü yönetir.
- `src/records/recordStore.ts` dört kabul edilmiş sayfayı zorunlu tutar; mevcut
  `ItemReadResult` maddelerini ve özgün ölçümleri dönüştürmeden danışan alanları,
  kayıt ID'si ve işlemi yapan kullanıcıyla birlikte yerel store'a yazar.
- Bu iki store yalnızca `localStorage` / `sessionStorage` kullanır. Sunucu tarafı
  yetkilendirme veya merkezi veritabanı yoktur; kullanıcı kendi tarayıcısındaki
  veriyi değiştirebileceği için klinik üretim güvenliği iddia edilmez. Gerçek
  dağıtım için backend, HttpOnly/SameSite oturumu, server-side RBAC ve şifreli
  veritabanı ayrıca uygulanmalıdır.
- Bu akış için henüz gerçek tarayıcı, çoklu kullanıcı ve backend entegrasyon testi
  çalıştırılmadı; aşağıdaki klinik/OMR doğrulama sonuçları mevcut kapsamını korur.

## Bir sonraki doğrulama adımı

1. `MMPI-566-optik-cevap-formu.pdf` dosyasını A4, %100, tek yüz yazdırın.
2. Köşe karelerini (5 mm) ve birkaç daireyi (3,5 mm) kumpasla ölçün.
3. Telefonla çekip “Tara ve gözden geçir” sekmesinde okutun; 17°'ye kadar eğik
   çekim destekleniyor.
4. Boş, tek işaretli, çoklu işaretli, silinmiş, silik, gölgeli, bulanık ve
   fotokopi senaryolarını gerçek kağıtla tekrarlayın ve eşikleri kalibre edin.

Bu dört adım tamamlanmadan okuma doğruluğu hakkında iddiada bulunulmamalıdır.
