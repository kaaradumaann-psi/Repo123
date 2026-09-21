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
