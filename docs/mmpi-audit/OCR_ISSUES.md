# OCR Issues

OCR şüpheli/hatalı okumaların kaydı. Kural: şüpheli sayısal veri
`OCR-UNCERTAIN` olarak işaretlenir ve görsel doğrulama yapılmadan
`SOURCE_FACTS.md`'ye `VERIFIED` olarak **yazılmaz**.

---

## OCR-TOOL

Motor: **RapidOCR (onnxruntime)**, Türkçe model yok.
Tesseract kurulamadı (apt deposu sandbox'ta erişilemez: `deb.debian.org`
bağlantısı reddedildi). Bu nedenle Türkçe aksan ve bitişik kelime hataları
kaçınılmazdır → görsel doğrulama zorunludur.

---

## SPINE-CLIP — Merkez dikişi sütun kaybı (CRITICAL, çözüldü)

Belirti:
Her PDF sayfası iki kitap sayfası içerdiğinden sayfa tam ortadan bölünüyor.
Tabloların dikişe denk gelen sütunları ya kayboluyor ya yanlış sayfaya düşüyor.

Etkilenen ve doğrulanan örnekler:
- **F tablosu (s.34)**: 53, 169, 177, 197, 246 maddeleri ilk kırpmada görünmedi.
- **K tablosu (s.38)**: 160, 217, 322, 383 maddeleri ilk kırpmada görünmedi.
- **L tablosu (s.31)**: yalnızca "Yanlış" bölümü vardı; dikişte kayıp olmadı.

Çözüm:
Tablolar `--half both` yerine **bindirme paylı** kırpma ile okunur
(sol/sağ yarım arasında ~4-6% örtüşme). `extract.py` bu amaçla `render`
alt komutunda serbest kırpma destekler; doğrulama kırpmaları `.audit/pages/`
altında saklanır.

Durum: **ÇÖZÜLDÜ** (DECISION-003)

---

## TR-DIACRITICS — Türkçe harf kaybı

Örnekler:
`Çok Yönlü` → `CokYonlu` · `yükselmesi` → `yikselmesi` · `Kişilik` → `Kisilik`

Etki:
Sayısal veri etkilenmez; **yorum metinleri** için tehlikelidir. Kod içindeki
Türkçe yorum metinleri bu nedenle OCR'dan kopyalanmaz; yalnızca görsel
okumayla doğrulanır.

Durum: **AÇIK** (bilinen kısıt)

---

## LOWCONF satırları

`extract.py`, OCR güveni < 0.75 olan satırları `<LOWCONF>` ile işaretler.
Bu oturumda işaretlenenler (kitap s.5-38 aralığı): p007_R (1 satır),
p010_R (3), p024_R (1), p025_R (1), p026_R (1).
Hiçbiri sayısal fact taşımıyor; tümü yorum cümlesiydi.

---

## NEG-CONF — Doğrulaması değişen okumalar (kayıt)

| Veri | İlk OCR | Görsel okuma | Sonuç |
|---|---|---|---|
| K kadın normu (s.38) | `13.54` | `13.54` | OCR **doğruydu**; kod (11.82) farklı |
| K erkek normu (s.38) | `13.90` | `13.90` | OCR **doğruydu**; kod (13.98) farklı |
| F kadın normu (s.34) | `10.11` | `10.11` | OCR **doğruydu**; kod (9.38) farklı |
| F ham bant 3. sınır (s.35) | `3-9` | `3-9` | OCR doğru; kod `3-7` kullanır |
| F madde 169/177 (s.34) | eksik | `169`, `177` | **OCR hatalıydı** (dikiş) |
| K madde 322 (s.38) | `316,322` karışık | net | **OCR hatalıydı** (dikiş) |
| L T bant 3 (s.33) | `59-63` | `59-63` | OCR doğru; kod `56-63` kullanır |

> Not: Bu tablo, hataların kodda değil **hem OCR'da hem kodda** olabildiğini
> gösterir — bu yüzden çift doğrulama zorunludur.

---

## OCR-UNCERTAIN kayıtları (açık)

### OCR-UNCERTAIN-001

Sayfa: kitap s.5 (PDF p10 L)
Okuma: "10 ya da daha az maddenin boş bırakılması … 5-30 arasında maddenin …"
Sorun: "5-30" ifadesi görsel doğrulanmadı; "1-5" veya "5-30" olabilir.
İşlem: `SOURCE-VALIDITY-CANNOTSAY-003` → `NEEDS_REVIEW`. Kod değişikliği yok.

### OCR-UNCERTAIN-002

Sayfa: kitap s.13-15 (PDF p11-13) — Bölüm 1 klinik alt test tanıtımları
Sorun: Bitkişik kelime yoğunluğu çok yüksek; düz metin olduğu için sayısal
risk düşük, ancak **madde sayıları** (ör. "Si alt testi 70 madde") bu
sayfalardan alınacaksa yeniden görsel okunmalıdır.
İşlem: PHASE 1 kapanışında kontrol edilecek.

### OCR-UNCERTAIN-003

Sayfa: kitap s.40-41 (PDF p28 L/R) — K T bantları
Sorun: Bant sınırları OCR'dan alındı (`72`, `61-72`, `46-60`, `27-45`);
görsel doğrulama bu oturumda **yapılmadı** (p28 R henüz okunmadı).
İşlem: PHASE 4'te görsel teyit zorunlu.

---

## ISSUE — FIGURE-CURVE: OCR şekil içi eğri/ızgara değerlerini okuyamaz

Tarih: 2026-09-21 · PHASE 4

Belirti:
Bölüm 4'teki profil şekilleri (Şekil 14, 15, 16 …) bir ızgara + çizgi grafiğidir.
RapidOCR bu sayfalarda **yalnızca eksen etiketlerini** (90 / 70 / 50 / 30 ve
L F K) metne döker; **çizilen eğrinin hangi T değerinde olduğunu okumaz**.
Önceki bir CONFLICT kaydı bu yüzden **yanlış** çıktı: şekilde 55 çizgisi olduğu
sanıldı; yüksek DPI görsel okuma şeklin L noktasını **tam 60** seviyesinde
çizdiğini gösterdi (kaynakta 55 değeri **hiç yok**).

Kural (bundan sonra bağlayıcı):
1. Şekil/grafik sayfalarında sayısal bir iddia **OCR ile kurulmaz**.
2. Eğrinin T değeri **yüksek DPI (≥300) kırpma ile görsel** okunur; ızgara
   aralığı (bu kitapta 20 birim; 30-90 arası) referans alınarak konum tahmin
   edilir ve **tahmin olduğu açıkça yazılır** (ör. "F ≈ 72").
3. Metin ("L alt testi 60 T puanında") ile şekil **birlikte** raporlanır;
   ikisi çelişirse **CONFLICT yazılmadan önce** kaynak içi çelişki olarak
   işaretlenir (CONFLICT-014 örneği).

Ek not — dikiş (SPINE-CLIP) ile birleşen sorun:
Sayfa metni cilt payına kadar uzandığında merkez kırpma satırları keser.
Bu batch'te F-K endeksi paragrafı ve TR kesme puanı cümlesi bu nedenle
**bindirmeli kırpma** ile okundu (sol yarı 0.00-0.60, sağ yarı 0.50-1.00 W).

Ek not — düşük güven etiketi:
Tablo 7 OCR'ında bir satır `<LOWCONF>` olarak işaretlendi (178/342 satırının
sıra numarası "9" okundu; çift ve yön doğru). **Sıra numarası anlamsal değildir**
(madde çifti ve Aynı/Farklı yönü belirleyicidir) → bulgu etkilenmedi.

---

# ROTATED-TABLE — dönük taramada tablo satırları kayar (PHASE 8 dersi)

Tarih: 2026-09-21 · Kaynak: **Tablo 20** (Wiggins normları, kitap s.179,
PDF p97 R)

## Sorun

Taranan sayfa **~2.87° dönük**. Bu, sütunlar arasında satır başına yaklaşık
**+29 px dikey kayma** yaratıyor:

| Sütun | Kayma (px) |
|---|---|
| 1 (Hasta X̄) | 0 |
| 2 (Hasta Sd) | ~+27 |
| 3 (Normal X̄) | ~+58 |
| 4 (Normal Sd) | ~+87 |

Sonuç: OCR, satırları **görsel konuma göre** grupladığı için 4. sütunun
değerlerini **bir alt satıra** yazdı ve okuma ±1 satır kaydı:

```
OCR (HATALI):
SOC  12.30  4.73  10.52
DEP   4.36  15.83  6.35  11.75     ← 4.36 aslında SOC'un Normal Sd'si
FEM   5.13  12.96   3.93  14.77
...
```
Doğru okuma: `SOC = 12.30 | 4.73 | 10.52 | 4.36`.

**Risk:** Bu kayma sessizdir; sayılar makul göründüğü için fark edilmezse
norm değerleri **yanlış eşleştirilir** (ör. REL normal SD 3.58 sanılırken
gerçekte 4.87). Bu, doğrudan T-puanı hatasına yol açardı.

## Çözüm (kalıcı yöntem)

1. **Deskew:** Sayfa eğimini ölç (sütun y-merkezlerinin x'e göre doğrusal
   regresyonu) ve görüntüyü ters yönde döndür:
   ```python
   slope = (y_last - y_first) / (x_last - x_first)   # ~0.0501
   ang = math.degrees(math.atan(slope))              # ~2.87°
   M = cv2.getRotationMatrix2D((w/2, h/2), ang, 1.0)
   rot = cv2.warpAffine(img, M, (w, h), borderValue=(255,255,255))
   ```
2. **Sütun doğrulaması:** Her sütunun y-merkezlerini programatik çıkar; 13
   veri satırının hizalandığını **sayısal olarak** doğrula (satır sayısı +
   eşit aralık).
3. Ancak bundan sonra değerleri görsel oku.

## Kural

> **Dönük taramada yoğun sayısal tablo:** OCR satır grubu **güvenilmez**.
> Önce deskew + sütun y-merkezi doğrulaması, sonra görsel okuma. Tablo
> sütunlarının kayma miktarı satır aralığının yarısına yaklaşırsa (±50 px)
> otomatik olarak ±1 satır hatası beklenir.

---

## ITEM-ORDER — OCR madde numarası ile metni farklı bloklarda döndürür

**Belirti:** RapidOCR, madde numarasını metinden **ayrı** bir blok olarak
okur ve blok sırası sayfadan sayfaya değişir:
- s.216 (p116 L): `"Babam iyi bir adamdır."` → sonra `"17."` (metin ÖNCE)
- s.217 (p116 R): `"50. Bazen ruhum vücudumdan ayrılır."` (birleşik)
- s.220 (p118 L): `"144. Asker olmak isterim."` (numaralı)
- s.226 (p120 L): `"336. …"`, `"337. …"` (numaralı)

**Etkisi:** "satır başı = madde numarası" varsayımıyla yapılan eşleme
**kayar** — ilk denemede 39 kritik maddenin tamamına yakını yanlış maddeye
bağlandı (ör. #33'e kaynakta #34 olan metin geldi).

**Kural (kalıcı):** Ek 1 madde metinleri **OCR'dan okunmaz**. Numara yalnız
`regex (^\d{1,3}\.\s)` ile **konum** için bulunur; metin **≥300 dpi görselden**
okunur. Araç: `scripts/mmpi-audit/verify-items.py`.

## PAGE-NUMBER-AS-ITEM — sayfa numarası madde sanılır

**Belirti:** Sayfa numarası (`215`, `217` …) ya tek başına ya da birleşik blok
olarak döner (`"215"`, `"216"`). Noktasız sayı, aralık dışı sayı → madde değil.

**Kural:** Yalnız `\d{1,3}\.` (noktalı) ve `1 ≤ n ≤ 566` kabul edilir.
Sayfa numaraları **hariç** tutulur; ayrıca sayfa üst/alt %6'lık bant taranmaz.

## SPINE-CLIP (Ek 1 varyantı)

Ek 1 sayfalarında dikiş tarafındaki maddeler kırpılır (ör. `#20`, `#37`
bandında yalnız üst yarı okunabildi). Görsel doğrulamada **bindirmeli kadraj**
(orta çizgiyi %2-3 aşan) kullanılmalıdır.


---

## DIGIT-6-9 — "6" ↔ "9" karışması (2026-09-21, PHASE 9/10)

**Gözlem:** Tablo 9 (D alt testi, s.80) ham OCR çıktısında Yanlış listesinin ilk
maddesi **"6"** olarak okundu; 420 dpi görsel crop **"9"** olduğunu gösterdi.
Kod anahtarıyla karşılaştırma da 9 olduğunu doğruladı.

**Etki:** Madde numaralarında tek karakterlik hata, anahtar karşılaştırmasını
**tamamen yanlış** yapar (bir madde eksik + olmayan bir madde fazla).

**Kural:** Madde numarası içeren tablolarda **6/9, 0/8, 1/7, 5/6** gibi karışması
olası çiftler için **görsel teyit zorunludur**. OCR metni tek başına yeterli
değildir — bu, tablolar için zaten geçerli olan "sayısal veri çift doğrulama"
kuralının somut bir örneğidir.


---

## TABLE-ROW-SHIFT — Tablo satırlarının yanlış listeye kayması (2026-09-21)

**Gözlem:** Tablo 10 (Hy alt testi, s.94) ham OCR çıktısında `55`, `51` ve `30`
maddeleri **Doğru** listesinde göründü; 400 dpi görsel okuma bunların **Yanlış**
listesinde olduğunu gösterdi. OCR, "Yanlış" başlığından sonraki ilk satırın
elemanlarını bir önceki bölüme iliştirmişti.

**Etki:** OCR ile karşılaştırma yapılsaydı **3 maddede sahte P0 fark** (madde
yönü hatası) raporlanacak ve yanlış bir kod değişikliği tetiklenebilecekti.
Görsel doğrulama ile kodun doğru olduğu kanıtlandı (13 + 47 = 60 BİREBİR MATCH).

**Kural:** Madde anahtarı tablolarında (Tablo 4, 8, 9, 10, 11, …):
1. OCR'a **hiç güvenilmez** — yön listeleri (Doğru/Yanlış) **görsel olarak** okunur.
2. Kritik sayılar (madde numaraları) **400 dpi** crop ile teyit edilir.
3. Toplam madde sayısı **kitabın başlığıyla** (ör. "Madde Sayısı: 60")
   çapraz kontrol edilir — bu, sessiz madde kaybını/eklenmesini yakalar.
4. Karşılaştırma **her zaman** `Doğru n + Yanlış n = kitap n` kontrolünü içerir.

## SENTENCE-SKIP — OCR tam bir cümleyi atlar (2026-09-21, PHASE 9/10 batch 7)

**Bulgu:** `p054_L` (kitap s.92, `20/02 Kodu`) OCR metninde şu cümle **yok**:

> "Çoğu (özellikle test 1 düşük ise) fiziksel olarak çekici olmadığını da düşünür."

300 dpi görsel okumada cümle **açıkça vardır** (satır kayması değil; OCR cümleyi
tamamen düşürmüştür). Kod karşılaştırmasında `20/02` kaydı bu cümleyi **içeriyor**;
yalnızca OCR'a bakılsaydı kod **"fazla cümle içeriyor"** sanılacak ve **sahte bir
"kaynakta yok" bulgusu** üretilecekti.

**Kural:** Kod içeriği ile kaynak arasında **cümle düzeyinde** fark bulunduğunda
(özellikle "kodda fazla içerik var" yönünde), fark **OCR yokluğuna değil görsele**
dayandırılır. OCR'da cümle atlaması **sessizdir** — eksik cümle, olmayan cümle gibi
görünür. Bu yüzden içerik farkları **≥300 dpi görsel** ile doğrulanır.

Ek doğrulama kuralı: `274/724` gibi **koşul parantezleri** (ör. "Eğer test 4 ve 7
birbirlerinin 5 T puanı alanı içindeyse…") OCR'da başlıkla birleşip kaybolabilir →
başlık çevresi her zaman görselden okunur.

## BLANK-PAGE-OCR — OCR boş sayfada tek karakter döndürür (2026-09-21, batch 9)

**Bulgu:** `p059_L` (kitap **s.102**) OCR çıktısı **tek satır** ve içeriği yalnızca
`5` (2 bayt). Şüphe üzerine 140 dpi tam sayfa görseli alındı: sayfa
**gerçekten boş** (kitabın bölüm arası boş sayfası; yalnızca tarama kusurları var).

**Kural:** Bir sayfa için `inventory.py` **0 kod başlığı** döndürüyor **ve** OCR
çıktısı **< 5 satır / < 200 bayt** ise, sayfa **"boş/işlenemez" varsayılmaz** —
**tam sayfa görseli (dpi 110-150) alınır.** Gerekçe: aynı turda `p059_L` yerine
komşu sayfa incelendiğinde (p059 R → s.103) **tamamen yeni bir bölüm**
("Nevrotik Üçlü Profilleri") bulundu; benzer bir durumda bölüm tamamen
atlanabilirdi. Bu kontrol **bölüm başlığı kaçırma riskini** ortadan kaldırır
(SPINE-CLIP ve PAGE-NUMBER-AS-ITEM ile aynı sınıf).

## LOWCONF-GAP — `<LOWCONF>` belirteci gizli cümle/paragraf demektir (2026-09-21, batch 11)

**Bulgu:** `p064_L` (kitap **s.112**) OCR çıktısında `45/54 Kodu` başlığından sonra:

```
45/54Kodu
o        o n  <LOWCONF>
malidir.
```

**Şüphe üzerine 340 dpi kadraj** (`v_pd112_lowconf.png`) alındı; eksik metin:

> "**Bu kod tipi hastanın yaşı, eğitimi ve cinsiyeti dikkate alınarak
> yorumlanmalıdır.**"

→ OCR **tam bir cümleyi** (12 kelime) `<LOWCONF>` olarak işaretleyip düşürmüş;
yalnızca son kelimenin kuyruğu (`malidir.`) kalmış.

**Kural:** OCR çıktısında `<LOWCONF>` görüldüğünde:
1. Belirteç **asla yok sayılmaz** — çevresi **≥300 dpi görselle** okunur.
2. Belirtecin bulunduğu yer **paragraf başı/başlık altıysa** (yeni bir kod bloğu
   ya da bölüm girişi), sayfa **"tamam" sayılmaz**.
3. Kod metniyle karşılaştırmada `<LOWCONF>` bölgesi **kaynak kanıtı sayılmaz**;
   görsel okuma şart (SENTENCE-SKIP'in ikinci biçimi).

**Etki:** Bu kural olmasa CONFLICT-034 (yaş/eğitim/cinsiyet direktifi) hiç
bulunamazdı — OCR o cümleyi tamamen düşürmüştü.

## LOWCONF-GAP · ikinci doğrulama (2026-09-21, batch 14)

Kural **aynı oturumda ikinci kez** işe yaradı:

| Sayfa | OCR | Kaybolan metin | Görsel kurtarma |
|---|---|---|---|
| **s.124** (`p070_L`) | `n  n  <LOWCONF>` + "vardir vebu abartilmis…" | **"26-40 T puanı:** Erkeklerde maskülen görünmek için kompülsif bir uğraş" | 360 dpi `v_p124_lowconf2.png` |
| **s.123** (`p069_R`) | (satır kesik) | "80 ve üstü T puanı: Lise eğitimi olan erkeklerde…" | 360 dpi `v_p124_lowconf.png` |

→ Her ikisi de **Mf T bandı etiketi**ydi. Kural olmasaydı **iki bant sınırı da
doğrulanamazdı** (bandın etiketi yok sayılır ya da yanlış okunurdu).

**Genel ders:** `<LOWCONF>` işaretleri **sayısal etiketlerde** (T bandı, madde
numarası, eşik) yoğunlaşıyor — çünkü OCR kalın/kısa satırları (etiket + uzun
paragraf) daha kolay düşürüyor. Bu yüzden **band/eşik etiketleri her zaman
görselden** okunur (FIGUR-CURVE kuralının sayısal tablo uzantısı).
