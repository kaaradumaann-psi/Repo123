# Source Facts

Kaynaktan doğrulanan bilimsel bilgiler. Her kayıt benzersiz bir ID taşır.
`OCR` alanı OCR çıktısını, `Visual` alanı görsel doğrulamayı gösterir.

Durum değerleri: `VERIFIED` · `OCR-UNCERTAIN` · `NEEDS_REVIEW`

---

## Sürüm ve yapı

### SOURCE-VERSION-001

Source: `docs/MMPI Kitap (1) (1).pdf`
Page: PDF p8 R (kitap s.1) — Bölüm 1 "Tanım"
OCR: "550 maddeden oluşan (kitap formunda 16 madde tekrarlanmaktadır, böylece 566 maddedir.)"
Visual: CONFIRMED
Fact: Kaynak **MMPI (orijinal), 566 maddelik kitap formu**dur. 550 madde + 16 tekrar.
Confidence: HIGH
Status: **VERIFIED**

### SOURCE-VERSION-002

Page: PDF p8 R (kitap s.1)
Fact: Dört geçerlik alt testi vardır: **(?)**, **L**, **F**, **K**.
On klinik alt test: 1 Hs, 2 D, 3 Hy, 4 Pd, 5 Mf (maskulinite-feminite),
6 Pa, 7 Pt, 8 Sc, 9 Ma, 0 Si (Sosyal içedönüklük, sonradan eklenmiştir).
Status: **VERIFIED**

---

## (?) "Bir şey diyemem" alt testi

### SOURCE-VALIDITY-CANNOTSAY-001

Page: PDF p23 L (kitap s.30) — **Tablo 2. Bir şey diyemem alt testi yorumu**
Fact (ham puan bantları):

| Ham puan | Düzey |
|---|---|
| 0 | 1. Düşük |
| 1-5 | 2. Normal |
| 6-30 | 3. Orta |
| 31 ve üstü | 4. Geçersiz |

Visual: CONFIRMED
Status: **VERIFIED**

### SOURCE-VALIDITY-CANNOTSAY-002

Page: PDF p22 R (kitap s.29)
OCR: "30 ya da daha fazla maddenin işaretlenmemesi durumunda profili bozulur."
Page: PDF p23 L (kitap s.30) Tablo 2, "Orta" satırı:
"Cevaplanmayan madde sayısı 30'a yakın bir sayıya ulaşınca geçerlik tehlikeye girer."
Fact: Kaynak **kendi içinde** iki ifade kullanır: prose "≥30 bozar", tablo "31+ geçersiz".
Projenin kodundaki kesme noktası `cannotSayInvalid = 31` **Tablo 2 ile uyuşur**.
Status: **VERIFIED** (kaynak içi nüans: `SOURCE-INTERNAL-001`)

### SOURCE-VALIDITY-CANNOTSAY-003

Page: PDF p10 L (kitap s.5)
OCR: "MMPI'da 10 ya da daha az maddenin boş bırakılması profilin geçerliliğini
etkilemez. 5-30 arasında maddenin boş bırakılması ise bu profilin 'tartışmalı'
olduğunun göstergesidir."
Status: **NEEDS_REVIEW** (metin OCR'dan; sayı aralığı "5-30" görsel doğrulanmadı)

---

## L alt testi (Yalan)

### SOURCE-VALIDITY-L-001

Page: PDF p23 R (kitap s.31) — **Tablo 3. L alt testi: Madde numaraları ve puanlama yönü (Madde Sayısı: 15)**
Fact: Tüm maddeler **Yanlış** yönünde puanlanır:
`15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 195, 225, 255, 285`
Visual: **CONFIRMED** (tablo birebir okundu)
Status: **VERIFIED**

### SOURCE-VALIDITY-L-002

Page: PDF p23 R (kitap s.31), tablo dipnotu
Fact: "Erkeklerde ortalama: 6.45, kadınlarda ortalama: 6.00 (Savaşır 1981)."
Visual: **CONFIRMED**
Status: **VERIFIED**

### SOURCE-VALIDITY-L-003

Page: PDF p24 R + p25 L (kitap s.33 + s.32/33 bağlantısı)
Fact (T puanı bantları, s.33):
- **69 T ve üstü** — puanlama hatası / patolojik yalan olasılığı
- **64-68 T** — inkâr, represif-savunucu tutum
- **59-63 T** — iyi görünme çabası, aşırı geleneksel
- **36-55 T** — özgün bir durum tanımlanmamış
- **35 ve altı T** — bağımsız, kendine güvenen; ya da patoloji gösterme çabası
Visual: CONFIRMED (ikinci okuma ile)
Status: **VERIFIED**

### SOURCE-VALIDITY-L-004

Page: PDF p24 L/R (kitap s.32-33)
Fact: L ile en yüksek iki alt test L ve Pa ise inkâr düşünülür; düşük SED'de L,
yüksek SED'de K yükselir. L yükseldikçe klinik testler düşer; L ile Hs, D, Hy, Pd
yükselir, Pa, Pt, Sc, Ma düşer. **Mf alt testi L'den etkilenmez.**
Status: **VERIFIED** (yorum içeriği; PHASE 9-10'da kullanılacak)

---

## F alt testi (Sıklık)

### SOURCE-VALIDITY-F-001

Page: PDF p25 L (kitap s.34) — **Tablo 4. F alt testi: Madde numaraları ve puanlama yönü (Madde Sayısı: 64)**
Fact:
- **Doğru (44 madde):** 14, 23, 27, 31, 34, 35, 40, 42, 48, 49, 50, 53, 56, 66,
  85, 121, 123, 139, 146, 151, 156, 168, 184, 197, 200, 202, 205, 206, 209, 210,
  211, 215, 218, 227, 245, 246, 247, 252, 256, 269, 275, 286, 291, 293
- **Yanlış (20 madde):** 17, 20, 54, 65, 75, 83, 112, 113, 115, 164, 169, 177,
  185, 196, 199, 220, 257, 258, 272, 276
Visual: **CONFIRMED** (bindirme payı ile yeniden kırpılarak doğrulandı; 169, 177,
197, 246, 53 maddeleri ilk kırpmada merkez dikişinde kaybolmuştu)
Status: **VERIFIED**

### SOURCE-VALIDITY-F-002

Page: PDF p25 L (kitap s.34), Tablo 4 dipnotu
Fact: "Erkeklerde ortalama: 8.30, kadınlarda ortalama: **10.11** (Savaşır, 1981)"
Visual: **CONFIRMED**
Status: **VERIFIED** → bkz. `CONFLICTS.md` CONFLICT-001

### SOURCE-VALIDITY-F-003

Page: PDF p25 L + p25 R (kitap s.34-35), Graham (1987) ham puan bantları
Fact:
- **26 ve üstü** ham puan — yüksek (rastgele/ tümü doğru yanıt, psikotik tablo)
- **16-25** ham puan
- **10-15** ham puan
- **3-9** ham puan — belirgin sorun alanlarına yanıt, yaşamın çoğu alanında işlevsel
- **0-2** ham puan — çoğu normal insan gibi yanıt
Status: **VERIFIED**

### SOURCE-VALIDITY-F-004

Page: PDF p25 R + p26 L (kitap s.35-36)
Fact: "Hathaway ve McKinley'e (1967) göre F alt testi ham puanı **20'yi aşarsa**
profil geçersizdir… **25 ham puanı aşarsa** testin geçersiz olması gerektiği
belirtilmiştir."
Status: **VERIFIED** (kaynak iki farklı eşik aktarır — kaynak içi nüans)

### SOURCE-VALIDITY-F-005

Page: PDF p26 R + p27 L (kitap s.37)
Fact (T puanı bantları):
- **80 T ve üstü** — dikkatli değerlendirme; 5 yükselme nedeni sıralanır
- **70-79 T** — ego işlev bozulması; psikoz/ciddi nevroz, antisosyal-asi, borderline
- **55-69 T** — üst sınırda negativist, değişken, huysuz; akut nevrozlar,
  kişilik bozuklukları, durumsal stres, savunucu psikotikler
- **44-54 T** — yalnızca belirgin maddelere yanıt; sahte iyilik; L ve K desteği
- **T < 45 (düşük)** — savunucu, "sahte iyilik"
Visual: CONFIRMED
Status: **VERIFIED**

---

## K alt testi (Düzeltme)

### SOURCE-VALIDITY-K-001

Page: PDF p27 L (kitap s.38) — **Tablo 5. K alt testi: Madde numaraları ve puanlama yönü (Madde Sayısı: 30)**
Fact:
- **Doğru (1 madde):** 96
- **Yanlış (28 madde):** 30, 39, 71, 89, 124, 129, 134, 138, 142, 148, 170,
  171, 180, 183, 217, 234, 267, 272, 296, 316, 322, 374, 383, 397, 398, 406,
  461, 502
Visual: **CONFIRMED** (bindirmeli kırpma; 160, 217, 322, 383 ilk kırpmada dikişte kayboldu)
Status: **VERIFIED**

### SOURCE-VALIDITY-K-002

Page: PDF p27 L (kitap s.38), Tablo 5 dipnotu
Fact: "Erkeklerde ortalama: **13.90**, kadınlarda ortalama: **13.54** (Savaşır 1981)"
Visual: **CONFIRMED** (iki bağımsız okuma: OCR + yüksek DPI kırpma)
Status: **VERIFIED** → bkz. `CONFLICTS.md` CONFLICT-002

### SOURCE-VALIDITY-K-003

Page: PDF p28 L (kitap s.40)
Fact (T puanı bantları):
- **72 T ve üstü** — savunucu, içgörüsüz, tedaviye yanıt kötü
- **61-72 T** — bozukluğu en aza indirgeme, savunmalar artmış
- **46-60 T** — dengeli bireyler, ego gücü iyi
- **27-45 T** — düşük SED, zayıf kendilik değeri
Status: **VERIFIED** (bantlar; metin OCR'dan, PHASE 4'te görsel teyit edilecek)

### SOURCE-VALIDITY-K-004

Page: PDF p28 L (kitap s.40)
Fact: "K alt testi, **profili geçersiz yapacak belirgin değerlerin olmadığı tek
alt testtir.**" K–T puanı aralıkları eğitim, SED ve uygulama ortamına göre değişir.
Status: **VERIFIED**

---

## Bölüm 4 — Geçerlik konfigürasyonları (ön bulgu)

### SOURCE-VALIDITY-CONFIG-001

Page: PDF p29 R (kitap s.43) — Bölüm 4 başlığı ve Konfigürasyon 1
OCR:
"Geçerlik konfigürasyonları L, F ve K alt testleri içindir, **(?)** alt testi
standart profil kağıdına işaret edilmez."
"Konfigürasyon 1: L ve K alt testlerinin T değerinin **50-60** ve F alt
testinin T değerinin **70'in üzerinde** olduğu durumlar."
"Şekil 1. **Tersine V.**"
Visual: CONFIRMED (OCR metni başlık/şekil alt yazısı ile tutarlı)
Fact: Kitabın **Konfigürasyon 1 = Tersine V**'dir ve ölçütü kodun
`VALIDITY_CONFIGS[0]` (id: `reverse-v`) kuralıyla **birebir** aynıdır:
`L 50-60 ∧ K 50-60 ∧ F > 70`.
Status: **VERIFIED (kural)** — metin karşılaştırması PHASE 4'te tamamlanacak

Etki:
`src/scoring/mmpiValidityConfigs.ts` kaynağının **Bölüm 4 (kitap s.43-56)**
olduğu doğrulandı. Konfigürasyon sırası ve adları bu bölümle eşleştirilecek.

---

## Altyapı / kaynak içi notlar

### SOURCE-INTERNAL-001

Konu: (?) kesme noktası çelişkisi (s.29 prose "≥30" ↔ Tablo 2 "31+").
Çözüm: Tablo 2 yapılandırılmış veri kabul edilir; çelişki kayıt altına alındı.
Status: OPEN (kayıt amaçlı; kod değişikliği önermez, kod zaten Tablo 2'yi izliyor)

### SOURCE-STRUCT-001

Page: PDF p3 R – p6 R (İçindekiler)
Fact: Bölüm haritası ve sayfa numaraları çıkarıldı → `SOURCE_INDEX.md`.
Status: **VERIFIED**

---

# Ek 9 — Madde Numaraları ve Puanlama Yönü (kitap s.244-256)

Karşılaştırma: `scripts/mmpi-audit/compare-keys.py` · Sonuç **41 MATCH / 5 DIFF**
Doğrulama kodu: `V` = görsel doğrulandı · `O` = OCR doğrulandı (görsel bekliyor)

## SOURCE-KEY-L-001 · L alt testi (Madde sayısı: 15)

Page: PDF p130 L = kitap s.244
Doğru: YOK · Yanlış: `15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 195, 225, 255, 285`
Kod: **MATCH** · Doğrulama: **V**
Status: **VERIFIED**

## SOURCE-KEY-F-001 · F alt testi (Madde sayısı: 64)

Page: kitap s.244
Doğru (44): `14, 23, 27, 31, 34, 35, 40, 42, 48, 49, 50, 53, 56, 66, 85, 121, 123, 139, 146, 151, 156, 168, 184, 197, 200, 202, 205, 206, 209, 210, 211, 215, 218, 227, 245, 246, 247, 252, 256, 269, 275, 286, 291, 293`
Yanlış (20): `17, 20, 54, 65, 75, 83, 112, 113, 115, 164, 169, 177, 185, 196, 199, 220, 257, 258, 272, 276`
Kod: **DIFF** (69↔169) → `CONFLICT-008` · Doğrulama: **V**
Status: **VERIFIED**

## SOURCE-KEY-K-001 · K alt testi (Madde sayısı: 30)

Page: kitap s.244
Doğru (1): `96` · Yanlış (29): `30, 39, 71, 89, 124, 129, 134, 138, 142, 148, 160, 170, 171, 180, 183, 217, 234, 267, 272, 296, 316, 322, 374, 383, 397, 398, 406, 461, 502`
Kod: **MATCH** · Doğrulama: **V**
Status: **VERIFIED**

## SOURCE-KEY-HS-001 · Hs alt testi (Madde sayısı: 33)

Page: kitap s.244 · Kod: **MATCH** · Doğrulama: **O**
Status: OCR-CONFIRMED (görsel bekliyor)

## SOURCE-KEY-D-001 · D alt testi (Madde sayısı: 60)

Page: kitap s.245 · Kod: **MATCH** · Doğrulama: **O**
Not: Başlıkta "Madde sayısı: 60" yazar; kod anahtarı 20+40=60 ✔
Status: OCR-CONFIRMED

## SOURCE-KEY-HY-001 · Hy alt testi (Madde sayısı: 60)

Page: kitap s.245 · Kod: **MATCH** · Doğrulama: **O**
Status: OCR-CONFIRMED

## SOURCE-KEY-PD-001 · Pd alt testi (Madde sayısı: 50)

Page: kitap s.245 · Kod: **MATCH** · Doğrulama: **O**
Status: OCR-CONFIRMED

## SOURCE-KEY-MF-001 · Mf alt testi (Madde sayısı: 60) — CİNSİYETE ÖZEL

Page: kitap s.245
Doğru (erkek anahtarı): `4, 25, 69, 70, 74, 77, 78, 87, 92, 126, 132, 134, 140, 149, 179, 187, 203, 204, 217, 226, 231, 239, 261, 278, 282, 295, 297, 299`
Yanlış (erkek anahtarı): `1, 19, 26, 28, 79, 80, 81, 89, 99, 112, 115, 116, 117, 120, 133, 144, 176, 198, 213, 214, 219, 221, 223, 229, 249, 254, 260, 262, 264, 280, 283, 300`
**Kaynak dipnotu:** `(*) işareti sorular kadınlarda ters yönde puan almaktadır.`
Glifli maddeler (kaynakta `*` ile işaretli): **69, 179, 231, 297, 133**
→ Kadın anahtarı = erkek anahtarının bu 5 maddede ters çevrilmiş hâli.
Kod (`SCORING_KEYS.Mf.male/female`): **MATCH** (5 maddenin tamamı doğru çevrilmiş)
Doğrulama: **V**
Status: **VERIFIED**

## SOURCE-KEY-PA-001 · Pa alt testi (Madde sayısı: 40)

Page: kitap s.246 · Kod: **MATCH** · Doğrulama: **O**
Status: OCR-CONFIRMED

## SOURCE-KEY-PT-001 · Pt alt testi (Madde sayısı: 48)

Page: kitap s.246 · Kod: **MATCH** · Doğrulama: **O**
Status: OCR-CONFIRMED

## SOURCE-KEY-SC-001 · Sc alt testi (Madde sayısı: 78)

Page: kitap s.246 · Kod: **MATCH** · Doğrulama: **O**
Not: Kaynak DOĞRU sütunu yalnızca **59** madde listeler, ancak başlık "78" der.
Kod anahtarı da 59 Doğru + 19 Yanlış = 78. Kaynak metnindeki "78" başlığı ile
sütun toplamı arasında **kaynak içi tutarsızlık** olabilir → kayıt amaçlı not:
scoring sonucu etkilenmez (iki taraf da 59+19).
Status: OCR-CONFIRMED + kaynak içi not

## SOURCE-KEY-MA-001 · Ma alt testi (Madde sayısı: 46)

Page: kitap s.247 · Kod: **MATCH** · Doğrulama: **O**
Status: OCR-CONFIRMED

## SOURCE-KEY-SI-001 · Si alt testi (Madde sayısı: 70)

Page: kitap s.247 · Kod: **MATCH** · Doğrulama: **O**
Status: OCR-CONFIRMED

## SOURCE-KEY-PD-SCALES · Kişilik Bozuklukları Testi (kitap s.248-250)

| Ölçek | Kaynak madde sayısı | Kod | Sonuç |
|---|---|---|---|
| PAR Paranoid | 22 | 22 | MATCH (O) |
| SZD Şizoid | 22 | 22 | MATCH (O) |
| STY Şizotipal | 36 | 36 | MATCH (O) |
| ANT Antisosyal | 25 | 25 | MATCH (O) |
| BDL Borderline | 22 | 22 | MATCH (V) |
| **HST Histrionik** | **20** | **13** | **DIFF** → CONFLICT-012 |
| NAR Narsisistik | 31 | 31 | MATCH (V) |
| **AVD Çekingen** | **38** | **25** | **DIFF** → CONFLICT-011 |
| DEP Bağımlı | 20 | 20 | MATCH (V) |
| CPS Obsesif-Kompulsif | 15 (Doğru; Yanlış=YOK) | 15 | MATCH (O) |
| PAG Pasif-Agresif | 14 (Doğru; Yanlış=YOK) | 14 | MATCH (O) |

## SOURCE-KEY-ADDICTION · Alkol ölçekleri (kitap s.251)

- **MAC MacAndrew** — tablo 51 madde listeler. **Kaynak dipnotu:** "iki madde
  doğrudan alkolle ilişkili olduğundan (#215 ve #460) çıkarılmıştır, madde
  sayısı **49** olarak kullanılmaktadır."
  Kod (49 madde, 215 ve 460 hariç): **MATCH** — kitabın kendi kuralına uygun ✔
  Doğrulama: **V** · Status: **VERIFIED**
- **ICAS Kronik alkolizm** (Madde sayısı: 8) — Kod: **MATCH** · Doğrulama: **O**

## SOURCE-KEY-WIGGINS · Wiggins içerik skalaları (kitap s.252-255)

| Ölçek | Kaynak | Kod | Sonuç |
|---|---|---|---|
| SOC Sosyal Uyumsuzluk | 27 | 27 | MATCH (O) |
| DEP_W Depresyon | 33 | 33 | MATCH (O) |
| **FEM Kadınsı İlgiler** | **30** | **30** | **DIFF** (126, 463 yön) → CONFLICT-010 |
| MOR Moral Bozukluğu | 23 | 23 | MATCH (O) |
| REL Dinsel Tutuculuk | 12 | 12 | MATCH (O) |
| AUT Otorite Çatışması | 20 | 20 | MATCH (O) |
| PSY Psikotizm | 48 | 48 | MATCH (O) |
| ORG Organik Semptomlar | 36 | 36 | MATCH (O) |
| FAM Aile Sorunları | 16 | 16 | MATCH (O) |
| HOS Dışa Vuran Düşmanlık | 27 (Yanlış=YOK) | 27 | MATCH (O) |
| PHO Fobiler | 27 | 27 | MATCH (O) |
| HYP Hipomani | 25 (Yanlış=YOK) | 25 | MATCH (O) |
| HEA Sağlıksızlık | 28 | 28 | MATCH (O) |

## SOURCE-KEY-SPECIAL · Özel ölçekler (kitap s.255-256)

| Ölçek | Kaynak | Kod | Sonuç |
|---|---|---|---|
| OH Aşırı Kontrol-Hostilite | 33 | 33 | MATCH (V) |
| **Es Ego Gücü** | **68** | **68** | **DIFF** (13 madde yön) → CONFLICT-009 |
| A Welsh Anksiyete | 39 | 39 | MATCH (O) |
| R Welsh Represyon | 40 (Yanlış=YOK) | 40 | MATCH (O) |
| Do Üstünlük | 28 | 28 | MATCH (O) |
| Dy Bağımlılık | 57 | 57 | MATCH (O) |

---

## SOURCE-INTERNAL-OH-001 · OH ölçeğinde kaynak içi tutarsızlık

Page: PDF p135 R = **kitap s.255**, "Aşırı Kontrol-Hostilite Testi (O-H) (Madde sayısı: 33)"
OCR + Visual: **CONFIRMED** (yüksek DPI kırpma, dikiş dahil)

Fact — tablonun gerçek içeriği:
- **Doğru (10):** 78, 91, 229, 319, 338, 373, 394, 425, 488, 559
- **Yanlış (21):** 1, 30, 81, 90, 102, 109, 129, 130, 141, 165, 181, 183,
  290, 329, 382, 396, 439, 446, 475, 501, 534
- **Toplam: 31 madde**

Sorun: **Başlık "33" der, tablo 31 madde listeler.** Kaynağın kendi içi tutarsızlığı.

Karar (`DECISION-012`): **Kod tabloyu izler (31 madde) ve doğrudur.**
Kod değişikliği **yoktur**. `tests/mmpiKeyIntegrity.test.ts` içinde
`EXPECTED_SPECIAL.OH = 31` olarak, kaynak çelişkisi yorumla birlikte kaydedilmiştir.

Status: **VERIFIED** (kaynak çelişkisi kayıt altında; kod tarafı MATCH)

---

# Bölüm 8 + Tablo 30 — TÜRK NORMLARI (kitap s.195)

## SOURCE-NORM-001 · Tablo 30 — Normal Türk, Erkek ve Kadınların MMPI Alt Testlerindeki Ortalama ve Standart Sapmaları

Page: **PDF p105 R = kitap s.195**
Visual: **CONFIRMED** — tam sayfa yüksek çözünürlüklü görsel okuma.
**OCR bu sayfayı BOŞ döndürdü** (p105_R.txt = 0 satır); yalnızca görsel
okuma ile elde edildi. Karşılaştırma betiği: `scripts/mmpi-audit/compare-norms.py`

### Örneklem (kitap s.191, Bölüm 8 "Standardizasyon çalışması")

- **Erkek N = 1003**, **Kadın N = 663**, toplam **1666** normal kişi
- 16-50 yaş, en az ilkokul eğitimi, psikiyatrik yardım almamış / başvurmamış
- Toplama yeri ağırlıklı Ankara (Hacettepe, DTCF, ODTÜ, Kız Teknik, Hemşire
  Yüksekokulu, GATA), ayrıca İzmir, Erzurum, Ordu, Bursa, Eskişehir
- %85 bekâr, %15 evli; örneklem 16-30 yaşta yoğunlaşmış; %84.88 büyük kent
- Eğitim: orta+lise %54.29, üniversite %47.21
  → **Not:** bu, "normal Türk toplumu" değil **genç + eğitimli + kentli** bir
  örneklemdir. Norm yorumunda bu sınır bilinmelidir.
- Kaynak kitap uyarısı (s.192): "31-50 yaş arasının sayı açısından **yetersiz
  temsil edildiği** düşünülmektedir."

### Tablo 30 değerleri (K düzeltmesi UYGULANMIŞ satırlar)

| Alt test | Erkek X̄ | Erkek SD | Kadın X̄ | Kadın SD |
|---|---|---|---|---|
| L | 6.45 | 2.74 | 6.00 | 2.25 |
| F | 8.30 | 4.62 | 9.38 | 5.16 |
| K | 13.98 | 4.65 | 11.82 | 3.80 |
| Hs (+.5K) | 13.19 | 4.07 | 15.89 | 4.88 |
| D | 20.63 | 4.76 | 23.86 | 5.08 |
| Hy | 19.31 | 4.71 | 18.12 | 5.31 |
| Pd (+.4K) | 22.22 | 4.45 | 22.84 | 4.51 |
| Mf | 29.21 | 3.82 | 32.98 | 3.67 |
| Pa | 11.12 | 4.03 | 11.93 | 4.17 |
| Pt (+1K) | 27.90 | 6.30 | 29.20 | 6.59 |
| Sc (+1K) | 29.82 | 9.05 | 31.06 | 8.20 |
| Ma (+.2K) | 19.96 | 4.40 | 19.72 | 4.36 |
| Si | 23.86 | 7.97 | 29.88 | 7.52 |

**Kritik:** Tablo, K düzeltmesi **uygulanmış ve uygulanmamış** satırları AYRI
AYRI verir. Kod, T dönüşümünden önce K düzeltmesini uygulandığı için
(`mmpiScoring.ts` → `computeT`) doğru satırlar **K eklenmiş** olanlardır.
Bu, kodun `K_CORRECTION` tasarımını **doğrular**.

### K düzeltmesi UYGULANMAMIŞ ham satırlar (kayıt amaçlı; kod kullanmaz)

| Alt test | Erkek X̄ | Erkek SD | Kadın X̄ | Kadın SD |
|---|---|---|---|---|
| Hs | 6.20 | 4.65 | 9.98 | 5.31 |
| Pd | 16.62 | 4.87 | 22.33 | 4.82 |
| Pt | 13.91 | 8.88 | 19.08 | 8.30 |
| Sc | 13.83 | 11.75 | 19.24 | 10.03 |
| Ma | 17.16 | 4.83 | 17.35 | 4.62 |

### Kaynak içi tutarsızlık (kayıt)

Tablo 30 başlığı "Normal Türk, Erkek ve Kadınlar…" der; **Kadın N sütununun K
satırında 963** yazar (diğer tüm kadın satırları 663, metin de 663 der).
Metin (s.191) açıkça **663 kadın** der → **tablodaki 963 bir dizgi hatasıdır.**
Kod bu değeri zaten kullanmaz (N norm hesabında yer almaz).

Status: **VERIFIED**

### Türetilen bulgu — kaynak iki yerde çelişiyor

Aynı kitap, F ve K normlarını **iki farklı yerde tutarsız** verir:

| Değer | Geçerlik bölümü (s.34 / s.38) | Standardizasyon Tablo 30 (s.195) |
|---|---|---|
| F kadın X̄ | **10.11** | **9.38** |
| K erkek X̄ | **13.90** | **13.98** |
| K kadın X̄ | **13.54** | **11.82** |

Kod **Tablo 30'u izler** ve doğrudur → `CONFLICT-001` ve `CONFLICT-002`
**REJECTED**.

---

# Bölüm 4 — Geçerlik Konfigürasyonları / F-K Endeksi (kitap s.56-59)

## SOURCE-FK-001 · F-K Endeksi — kesim puanı 9 (Gough)

Page: **PDF p37 L = kitap s.58** ("F-K Endeksi" bölümü) — sayfa numarası 58 doğrulandı
**Visual: CONFIRMED** (yüksek DPI kırpma; metin dikişe kadar uzandığı için
bindirmeli kırpma kullanıldı)

Fact — aynen:
> "F-K Endeksi diğer bir geçerlik belirleyicisidir. K puanının F puanından
> çıkarılması ile elde edilmektedir. İlk yapılan çalışmalarda kesim puanı olarak
> **11** alınmış, bu kesim puanı normallerin **%1'inde**, psikiyatrik grubun
> **%2.5'unda** görülmüştür (Gough 1947, 1951). Daha sonra kesim puanı **9'a
> düşürülmüştür**. **F-K puanı 0-9 arasında ise profil geçerlidir, 9'dan büyükse
> sahte-kötülük, 0 ise sahte-iyiliktir.** Klinik olgularda F-K endeksinin 9'dan
> büyük olduğu durumlarda birey psikopatolojisini inkâr etmektedir (Wetzel,
> Marlowe 1990)."

Yapısal sonuç:
- Kesim puanı **9** (tarihsel: 11 → 9'a düşürülmüş)
- `0 ≤ F-K ≤ 9` → geçerli
- `F-K > 9` → **sahte-kötülük** (abartma)
- `F-K = 0` → **sahte-iyilik** ← dikkat: kaynak 0'ı sahte-iyilik olarak tanımlar
- Klinik olgular X̄ = **8.66 / SD = 5.94** (psikiyatrik hastalar)

Kod karşılığı (`mmpiConsistency.ts` → `fkIndexAnalysis`):
- `value > 9` → "Sahte-Kötülük (Faking Bad) Eğilimi" ✅ **MATCH**
- `0 < value ≤ 9` → "Normal / Geçerli" ✅ **MATCH**
- `value = 0` → kod "Hafif Savunuculuk (Geçerli)" der; kaynak "sahte-iyilik" der
  → **kaynak içi nüans** (aşağıda SOURCE-FK-002)

Status: **VERIFIED**

## SOURCE-FK-002 · F-K = 0 durumu — kaynak içi gerilim

Page: kitap s.58
Fact: Kaynak "F-K puanı 0-9 arasında ise profil geçerlidir" **ve** "0 ise
sahte-iyiliktir" ifadelerini birlikte kullanır. Yani 0 hem geçerli aralığın
sınırı hem de sahte-iyilik göstergesidir → **kaynak içi gerilim**.

Ek bağlam (aynı sayfa): Yüksek K + düşük F bileşimi ("sorunlarımla başa
çıkabilirim" + "stresim yok") genellikle F-K endeksi tarafından **sahte-iyilik**
olarak değerlendirilir; bu yüzden MMPI alan normal bireyler yanlış biçimde
sahte-iyilik grubuna girebilir.

Kod davranışı: `value = 0` → "Hafif Savunuculuk (Geçerli)", `tone: 'ok'`,
`isWarning: false`. Negatif değerler ise `value >= -8` → "Hafif Negatif (Geçerli)",
`value < -8` → "Sahte-İyilik (Faking Good) Eğilimi".

Değerlendirme: Kod, 0 için geçerli aralığı koruyup **uyarı vermez**; kaynak ise
0'ı sahte-iyilik olarak işaretler. Negatif bölgede kod eşiği **-8**'dir; kaynak
sayısal bir negatif eşik vermez.

Status: **NEEDS_REVIEW** → CONFLICT-013 (P2; yorum etkisi düşük)

## SOURCE-FK-003 · K+ profili — Mark & Seeman (1963) tanımı

Page: **PDF p36 R = kitap s.57** ("K+ profilleri" bölümü)
Visual: CONFIRMED

Fact — aynen:
> "Bazen bir profilde tek anlamlı yükselme K alt testinde gözlenir. Bu profilde
> hiçbir klinik test 70 T puanının üstünde değildir. (6 ya da daha çok klinik
> test 60 T puanı ya da altındadır.) K+ profilinde K ve L alt testleri F'den
> yüksektir ve K alt testi, F alt testinin **en az 5 T puanı** üstündedir.
> Mark ve Seeman (1963) bu tür profilleri K+ profili olarak adlandırmaktadır.
> Özellikleri: Bu kişiler utangaç, kaygılı ve ketlenmişlerdir. Ayrıca
> sorunlarının psikolojik olabileceği konusunda dirençlidirler. Yakın kişiler
> arası ilişkilerden kaçınırlar ve pasif direnç gösterirler. Kişilik özellikleri
> **sizoid** yapıdadır."

Ölçütler (kod karşılaştırması için):
1. Hiçbir klinik ölçek T ≥ 70
2. En az 6 klinik ölçek T ≤ 60
3. K ve L > F
4. **K − F ≥ 5 T puanı**
5. Şekil 16 ile gösterilir

Status: **VERIFIED**

## SOURCE-CONFIG-014 · Konfigürasyon 14 — Erdemli Görünme İsteği

Page: **PDF p36 L = kitap s.56**
Fact: "Konfigürasyon 14: L alt testi **55 T puanının üstünde**, F alt testi
**60 T puanının altında**, K alt testi **59-64 T puanı arasındadır**."
"Bu profil geçerlidir. Geçerlik konfigürasyonu bireyin kendisini çok erdemli
biri olarak gösterme isteğini ve kendisini de böyle görmek istediğini
göstermektedir."
Ek uyarı: "Eğer F ve K alt testleri 70 T puanının üstündeyse, bireyde hastalığa
içgörü yoktur ve prognoz kötüdür."

Kod karşılığı: `VALIDITY_CONFIGS` id `virtuous`:
`L > 55 ∧ F < 60 ∧ 59 ≤ K ≤ 64` → **birebir MATCH** ✅

Status: **VERIFIED**

## SOURCE-CONFIG-015 · Konfigürasyon 15 — Katı / Karmaşıklık Örüntüsü

Page: **PDF p36 R = kitap s.57**
Fact: "Konfigürasyon 15: L alt testi **60 T puanının üstünde**, F alt testi
**70 T puanının üstünde** ve K alt testi **40 T puanının altındadır**."
"F'nin yüksekliği bu kişinin karmaşıklık yaşadığını gösterir. L'deki ortalama
yüksek puan, bireyin dünyayı basit, siyah ve beyaz olarak gördüğünün
göstergesidir. Düşük K, bireyin benlik değerinin düşüklüğüne, başa çıkma
kaynaklarının azlığına ve duygusal alanda katı olduğuna işaret etmektedir.
Ancak L'nin yüksekliği bireyin katı bir biçimde geleneksel değerlere
tutunduğunu gösterir."

Kod karşılığı: `VALIDITY_CONFIGS` id `rigid`:
`55 ≤ L ≤ 65 ∧ F > 70 ∧ K < 40`

Comparison: **CONFLICT** (kaynak içi çelişki):
- Kaynakta 15. konfigürasyon için **iki farklı kural** var:
  - **Başlık (s.58):** `L > 60 ∧ F > 70 ∧ K < 40`
  - **Şekil 15 (s.58, p36 R/s.57 çizimi):** `L > 55 ∧ F > 70 ∧ K < 40`
- Kod **55-65** aralığını kullanır: ne başlıkla (60) ne şekille (55) birebir
  örtüşür; üst sınır (65) kaynakta **hiçbir yerde yoktur**.

Status: **CONFIRMED** → CONFLICT-014 (P1)

## SOURCE-FK-004 · F-K bant yorumları (8-11 ve 16 üstü)

Page: **PDF p37 R = kitap s.59** — **Visual: CONFIRMED** (çalışma başlığı ve
sayfa numarası 59 görsel olarak doğrulandı)

Fact — aynen:
> "Psikiyatrik grupta sahte-kötülük profilleri, sahte-iyilikten daha iyi ayırt
> edicidir. […] Özetle F-K endeksinin yararlılığı konusunda henüz kesinleşmiş
> bir bulgu yoktur.
> **Eğer F-K endeksi 8-11 arasında ise** konfigürasyon, bireyin sorunları
> olduğunu gösterse de bu kişiler sorunlarını abartmaktadırlar. Bu durum
> hastanın psikolojik müdahaleye ve yardım almaya açık olduğunu göstermektedir.
> **F-K endeksi 16'nın üstünde ise:** […] Yapılan standart değerlendirme hastanın
> durumunu yansıtmayabilir. […] - Hasta akut bir psikotik bozukluk
> göstermektedir […] - Birey bilinçli olarak durumunu abartmakta ya da bir yarar
> sağlamak için simülasyon yapmaktadır."

Bant tablosu (kaynak):
| F-K | Kaynak yorumu |
|---|---|
| 0-9 | profil **geçerlidir** (9'dan büyükse sahte-kötülük) |
| 8-11 | bireyin sorunları var **ama abartmaktadır**; yardıma açık |
| > 9 | sahte-kötülük |
| > 16 | kritik; standart değerlendirme yansıtmayabilir (psikoz / simülasyon) |
| 0 | sahte-iyilik |

Kod karşılığı: kod 8-9'u "Normal/Geçerli" bandında, 10-11'i "Sahte-Kötülük"
bandında ele alır ve **her iki dalda da** 8-11 abartma notunu ekler
(`value >= 8` / `value >= 10 && value <= 11`) → 8-11 aralığı tam kapsanır ✅
`value > 16` → "Kritik Derecede Yüksek Abartma" ✅
Status: **VERIFIED** — MATCH

---

# PHASE 4 — TR (Test-Tekrar Test) Endeksi ve Dikkatsizlik Alt Testi

## SOURCE-TR-001 · TR endeksi — 16 tekrarlanmış madde çifti (Tablo 6)

Page: **PDF p38 L = kitap s.60** — başlık: "Tablo 6. MMPI kitap formunda aynı
olan maddeler" (iki sütunlu tablo: Madde No | Cümleler | Madde No | Cümleler)
Kaynak ifadesi (p37 R = s.59):
> "MMPI'n[in] grup kitapçığında yer alır. **Toplam sayısı 16 olan ve 6, 7, 8 ve 0
> alt testlerinde yer alan tekrarlanmış maddeler** test tekrar test (TR)
> endeksini oluşturmaktadır."

Tablo 6'dan çıkarılan 16 çift (kaynak sırası):
(8,318) (13,290) (15,314) (16,315) (20,310) (21,308) (22,326) (23,288)
(24,333) (32,328) (33,323) (35,331) (37,302) (38,311) (305,366) (317,362)

Kod karşılığı: `src/scoring/mmpiConsistency.ts` → `TR_PAIRS` (16 çift)
Comparison: **birebir MATCH** (16/16 çift, hem üye hem sıra aynı) ✅
Status: **VERIFIED**

## SOURCE-TR-002 · TR endeksi kesme puanı — **3 puan ya da daha fazla**

Page: **PDF p37 R = kitap s.59** — **Visual: CONFIRMED** (yüksek DPI kırpma,
cümle okunur halde)
Fact — aynen:
> "TR endeksi üzerinde **3 puan ya da daha fazla bir puanın, geçersiz profil
> olasılığını arttırdığı** ileri sürülmüştür (Dahlstrom 1972)."

Yani kaynak: **TR ≥ 3 → geçersiz profil olasılığı artar** (kesme 3'te başlar).

Kod karşılığı:
```ts
const consistent = score <= 3;   // 3 DAHİL tutarlı sayılıyor
```
Kod: TR ≤ 3 → "Tutarlı Yanıt Örüntüsü", uyarı yok; TR ≥ 4 → tutarsız.
Comparison: **CONFLICT** — kaynak ≥ 3'te geçersizlik riskini başlatır, kod
3'ü hâlâ tutarlı sayar → **1 puan kayması**.
Status: **VERIFIED** → CONFLICT-015 (P1)

## SOURCE-TR-003 · TR endeksi yorum bağlamı (Greene 1979)

Page: kitap s.59 (devamı s.60-61)
Fact: "Greene (1979) yaptığı bir araştırmada psikiyatrik hastalar, gözaltındaki
genç suçlular ve üniversite psikoloji öğrencilerine MMPI vermiş ve **gözaltındaki
gençlerin yanıtlarının, yüksekokul öğrencilerinden daha tutarsız** olduğunu
saptamıştır. Gözaltındaki gençlerin genellikle işbirliği içinde olmadıklarının
ve test almaya dirençlerinin göstergesidir."
Ek (s.60-61): "TR endeksi bazı durumlarda daha az puanlık […] sadece
dikkatsizlik nedeniyle ortaya çıktığını akılda tutmak gerekir. Üstelik TR
endeksi, sadece hastaların cevaplarının tutarlılığını tayin etse de, 'bütün
doğru' ya da 'bütün yanlış' cevap kurgularını göstermemektedir. […] F alt
testindeki yüksek puanlara karşın hastaların maddeleri tutarlı olarak doldurmuş
olduklarını TR endeksi gösterebilir."
Status: **VERIFIED** (yorum bağlamı; kod yorum metinleriyle uyumlu)

## SOURCE-CL-001 · Dikkatsizlik alt testi — 12 madde çifti ve puanlama yönü (Tablo 7)

Page: **PDF p38 R = kitap s.61** — başlık: "Tablo 7. Dikkatsizlik alt testi
madde sayıları ve puanlama yönü" (Madde No | Yanıt (Aynı/Farklı) | Madde Sayısı)

Tablo 7'den çıkarılan 12 çift:
| Çift | Yanıt | # |
|---|---|---|
| 10/405 | Aynı | 1 |
| 17/65 | Farklı | 2 |
| 18/63 | Farklı | 3 |
| 49/113 | Aynı | 4 |
| 76/107 | Aynı | 5 |
| 88/526 | Aynı | 6* |
| 137/216 | Aynı | 7 |
| 177/220 | Farklı | 8 |
| 178/342 | Aynı | 9 |
| 286/312 | Farklı | 10 |
| 329/425 | Aynı | 11 |
| 388/480 | Farklı | 12 |

\* sıra numarası OCR'da "9" olarak okundu; **sıra numarası anlamsal değil**
(numaralandırma hatası kitapta/OCR'da), çift listesi ve yönü kesin.
`OCR-UNCERTAIN`: yalnızca sıra numaraları (88/526 satırı) — madde çiftleri ve
Aynı/Farklı yönleri net.

Kod karşılığı: `mmpiConsistency.ts` → `CARELESS_PAIRS` (12 çift, `condition`
`same`/`different`)
Comparison: **birebir MATCH** (12/12 çift + 12/12 yön) ✅
Status: **VERIFIED**

---

# Bölüm 4 — Geçerlik Konfigürasyonları (kitap s.43-47) — batch 2

Bölüm girişi (s.43): "Geçerlik konfigürasyonları L, F ve K alt testleri içindir,
**? alt testi standart profil kağıdına işaret edilmez.**"

## SOURCE-CONFIG-001 · Konfigürasyon 1 — Tersine V (s.43, p29 R)

Fact — aynen:
> "Konfigürasyon 1: L ve K alt testlerinin T değerinin **50-60** ve F alt
> testinin T değerinin **70'in üzerinde** olduğu durumlar."
> Şekil 1. Tersine V.

Yorum: "Birey kişisel ve duygusal zorluklarını kabullenmekte ve yardım
istemektedir. […] F alt testi yükseldikçe, bireyin sorunlarını abartarak kısa
süre içinde yardım almak istediği ya da simülasyon yaptığı söylenebilir."

Kod: `VALIDITY_CONFIGS[0]` id `reverse-v`
`L 50-60 ∧ K 50-60 ∧ F > 70` → **birebir MATCH** ✅ (önceki oturumda da doğrulanmıştı)

## SOURCE-CONFIG-002 · Konfigürasyon 2 — Savunuculuk örüntüsü (s.44, p30 L)

Fact — aynen:
> "Konfigürasyon 2: L ve K alt testlerinin **en az 60 T düzeyinde** (70 T puanına
> bile yaklaşabilir), F alt testinin **50 T puanına yakın** olduğu durumlar."

Yorum: "Bu birey kabul edilmez duygularından, impulslarından […] kaçınmaya ya da
bunları inkâr etmeye çalışmaktadır. Birey kendini en iyi biçimde sunar. Dünyayı
uçlarda, iyi ve kötü olarak görür. […] savunuculuk, psikopatolojinin
inkârından şüphelenilmelidir."

Kod eşleşmesi: `v-shape` → `L ≥ 60 ∧ K ≥ 60 ∧ F ≤ 55`
- L: kaynak "en az 60" = **≥ 60** → ✅ MATCH
- K: aynı → ✅ MATCH
- F: kaynak "**50'ye yakın**" (niteliksel) ↔ kod **F ≤ 55, alt sınır YOK**
  → kod F = 0…55 aralığını kabul eder; kaynak "yakın" der → **belirsiz + alt
  sınır eksik** → CONFLICT-016

Status: L/K **VERIFIED**, F **NEEDS_REVIEW**

## SOURCE-CONFIG-003 · Konfigürasyon 3 — "V" / Çok Kapalı (s.45, p30 R)

Fact — aynen:
> "Konfigürasyon 3: Geçerlik Alt Testi 'V' (Çok Kapalı): Bu örüntüde, **F alt
> testi 50 T puanının altında, L ve K alt testi 60 T puanının üzerindedir.**"
> Şekil 3. Çok kapalı geçerlik konfigürasyonu.

Yorum: "L ve K alt testleri ne kadar çok yükselirse, bu kişi kendisini
olduğundan daha iyi gösterme çabası içindedir. […] Özellikle kendini iyi
göstermek isteyen, iş arayan ve diğer durumlardaki (gözaltındakiler gibi)
kişilerin çok sık verdiği bir konfigürasyon biçimidir."
Ek: "Bu inkâr tutumu klinik testler üzerinde azaltıcı etkiye sahiptir […]
Klinikte 'V geçerlik konfigürasyonunun etkisini karşılamak için klinik testleri
pratik olarak 5-[10 T puanı yükseltmek yardımcı olmaktadır.]"

Kod: `closed-v` → `L > 60 ∧ K > 60 ∧ F < 50` → **birebir MATCH** ✅

## SOURCE-CONFIG-004 · Konfigürasyon 4 — Yükselen Eğilim (s.46, p31 L)

Fact — aynen (görsel doğrulandı; sayı dikişte kesilmişti, yüksek DPI kırpma ile
netleştirildi → "K alt testi **60** T puanındadır"):
> "Konfigürasyon 4: L alt testi F'den, F alt testi de K'dan düşüktür. L alt
> testi **40 T puanında**, F alt testi **45-55 T**, K alt testi **60 T**
> puanındadır."
> Şekil 4. Yükselen eğilim.

Yorum: "Bu konfigürasyon sorunlarıyla baş edette çekük uygun kaynakları sahip ve
testi aldığı dönemde stres ya da gerilim yaşama […] normal kişilerin tipik
konfigürasyonu[dur]."

Kod: `ascending` → `L < F ∧ F < K ∧ L ≤ 45 ∧ K ≥ 55`
- Sıralama `L < F < K` → ✅ MATCH
- L = 40 (nokta) ↔ kod `L ≤ 45` → ±5 üst tolerans ✓ (kaynak değeri kapsanır)
- K = 60 (nokta) ↔ kod `K ≥ 55` → ±5 alt tolerans ✓ (kaynak değeri kapsanır)
- F = **45-55** (kaynak açık aralık verir) ↔ kodda **F için sınır YOK**
  (yalnızca sıralama) → **eksik** → CONFLICT-016

Status: sıralama + L + K **VERIFIED**, F aralığı **NEEDS_REVIEW**

Aynı sayfada K düzeltmesi bilgisi (PHASE 4 K correction):
> "[Klinik ölçeğe] 5-10 T puanı eklenebilir (Greene 1980). […] K alt testi, F alt
> testinden 20 ya da daha çok T puanı […]"

## SOURCE-CONFIG-005 · Konfigürasyon 5 — Azalan Eğilim (s.47, p31 R)

Fact — aynen:
> "Konfigürasyon 5: L alt testi F'den, F alt testi de K'dan büyüktür. L **60 T
> puanına**, F **yaklaşık 50 T puanına** yükselmiş, K alt testi **40-45 T puanı**
> arasındadır."
> Şekil 5. Azalan eğilim.

Yorum: "Bu kişiler, kendilerini iyi göstermeye çalışırlar, sorunlarını kabul
etmekten ya da kendileri ile uğraşılmasını istemekten hoşlanmazlar. Ancak bu
kişilerin iyi görünme çabaları etkisizdir ve nevrotik üçlü genellikle yükselir.
Erkeklerde Mf düşük olabilir. Eğitimi ve sosyo-ekonomik düzeyleri düşük
bireylerde daha çok görülür."

Kod: `descending` → `L > F ∧ F > K ∧ L ≥ 55 ∧ K ≤ 45`
- Sıralama `L > F > K` → ✅ MATCH
- L = 60 (nokta) ↔ kod `L ≥ 55` → ±5 alt tolerans ✓ (kaynak değeri kapsanır)
- F "yaklaşık 50" ↔ kodda F sınırı yok (yalnızca sıralama) → **belirsiz**
- K = **40-45 arası** (kaynak açık aralık) ↔ kod `K ≤ 45` → üst sınır ✓ ama
  **alt sınır yok** (K = 20 de kabul edilir) → **eksik** → CONFLICT-016

Status: sıralama + L **VERIFIED**, F ve K alt sınırı **NEEDS_REVIEW**

---

# Bölüm 4 — Geçerlik Konfigürasyonları (kitap s.48-55) — batch 3

## SOURCE-CONFIG-006 · Konfigürasyon 6 — Rastgele cevaplama (s.48, p32 L)

Fact — aynen (**Visual: CONFIRMED**):
> "Konfigürasyon 6: L ve K alt testleri **55 T**, F alt testi **105 T puanının
> üstündedir**." — Şekil 6. Rastgele cevaplama.
> "Profil, hastanın maddeleri rastgele cevaplamasından dolayı geçersizdir.
> Durum hastanın konfüzyonundan, öfkesinden, test durumuna karşı direncinden
> ya da zekâ faktöründen kaynaklanıyor olabilir. […] testi hastaya tekrar
> vermelidir."

Kod: `random` → `F > 105 ∧ L 50-60 ∧ K 50-60`
Karşılaştırma: F **birebir** ✓; L,K kaynakta **nokta (55)** ↔ kod ±5 bant → kaynak
değeri bandın merkezinde ✓ → **MATCH (toleranslı)**
Status: **VERIFIED**

## SOURCE-CONFIG-007 · Konfigürasyon 7 — Tümüne "doğru" (s.49, p32 R)

Fact — aynen (**Visual: CONFIRMED**):
> "Konfigürasyon 7: Tümünü doğru olarak işaretleme. L ve K alt testinin **35 T
> puanını aşmasını**, F alt testinin **120'nin üzerinde** yer almasını
> gerektirir. Ek olarak, klinik testlerden **Pd, Pa, Pt, Sc ve Ma 90 T puanının
> üzerinde** yer alır."
Ek liste: 1. Her soruyu 'doğru' olarak işaretleme · 2. "Yardım çağrısı" profili ·
3. Ergenlerde akut bir rahatsızlık yaşanması (özellikle erkek ergenler) ·
4. Yetişkinlerde çok dirençli olma · 5. Sahte-kötülük profili (F-K indeksi 11
puanı aşmaktadır).

Kod: `all-true` → `F > 120 ∧ L ≤ 35 ∧ K ≤ 35` (düzeltildi, CHANGE-008)
- L,K: kaynak "35'i aşmasın" = **≤ 35** → ✅ MATCH (eski kod 40 idi → düzeltildi)
- F: kaynak "**120'nin üzerinde**" = `> 120` → kod aynı **ama**
  **T puanı [20,120] aralığına kırpıldığı için ULAŞILAMAZ** → CONFLICT-019

Status: L,K **VERIFIED** · F koşulu **ULAŞILAMAZ (CONFLICT-019, P1, OPEN)**

## SOURCE-CONFIG-008 · Konfigürasyon 8 — Tümüne "yanlış" (s.50, p33 L)

Fact — aynen (**Visual: CONFIRMED**):
> "Konfigürasyon 8: Bireyin bütün soruları 'Yanlış' olarak işaretlemesidir.
> Şekil 8'de gösterildiği gibi **L, F ve K testlerinin tümü 80 T puanının
> üzerindedir**. Ek olarak **Hy, D, Hs ve Pd** alt testleri 80 T ve üstüne
> yükselmiştir."
> "Profil geçersizdir. Hasta tüm maddelere yanlış olarak cevap verme
> eğilimindedir. […] testi tekrar verebilir."

Kod: `all-false` → `L ≥ 75 ∧ F ≥ 75 ∧ K ≥ 75` (kaynak **> 80** der)
**KAYNAK İÇİ TUTARSIZLIK — ampirik kanıt:**
Kitabın kendi anahtarı + Tablo 30 normlarıyla, **tam "tümüne yanlış"** yanıt
veren bir kişi şu profili üretir:
`L: ham 15 → T 81.2` · `F: ham 20 → T **75.3**` · `K: ham 29 → T 82.3`
→ Kaynağın istediği **F > 80 koşulu bu formda ulaşılamaz**; ulaşan tek yol
"tümüne yanlış" yanıtı değildir. (Kaynak kendi kuralını kendi verisiyle
çürütüyor.)
Status: **REJECTED (kod doğru)** → CONFLICT-018 · DECISION-020

## SOURCE-CONFIG-009 · Konfigürasyon 9 — Yardım isteği (s.51, p33 R)

Fact — aynen (**Visual: CONFIRMED**):
> "Konfigürasyon 9: L ve K alt testleri **66 T puanının altında**, F alt testi
> ise **100 T puanına yakın ya da altındadır**."
> "Bu profil **geçerlidir**. Geçerlik konfigürasyonu hastanın dile getirmek
> istediği psikolojik sorunları olduğunu göstermektedir. Bu tür konfigürasyon
> veren hastalar karamsar, dik kafalı, huzursuz ve asi kişilerdir. Kendilerini
> aşırı eleştirirler, psikolojik sorunlarını kabul etmeye hazırdırlar. […]
> kolay incinebilirler."

Kod: `help-seeking` → `L < 66 ∧ K < 66 ∧ F 70-100` (üst sınır düzeltildi, CHANGE-008)
- L < 66 ✅ · K < 66 ✅
- F üst sınırı: kaynak "100'e yakın ya da altında" → **≤ 100** ✅ (eski kod 105)
- F **alt sınırı 70 kaynakta YOK** → kod ekliyor → `UNVERIFIED_DATA.md`
Status: **VERIFIED (üst sınır düzeltildi)** · alt sınır **UNVERIFIED**

## SOURCE-CONFIG-010 · Konfigürasyon 10 — Geleneksel olmayan örüntü (s.52, p34 L)

Fact — aynen (**Visual: CONFIRMED**):
> "Konfigürasyon 10: L alt testi **66 T puanının altında**, F alt testi **69 T
> puanının** ve K alt testi **65 T puanının üstündedir**."
> "Profil geçerli gibi görünse de geçerlik konfigürasyonu geleneksel olmayan bir
> cevap örüntüsünün varlığını göstermektedir. […] Patolojinin açık gösterimi ve
> savunucu kontrol arasındaki denge bu kişilerde durağan değildir ve
> yordanamaz."

Kod: `unconventional` → `L < 66 ∧ F > 69 ∧ K > 65` → **birebir MATCH** ✅
Status: **VERIFIED**

## SOURCE-CONFIG-011 · Konfigürasyon 11 — Açık ve tavizsiz (s.53, p34 R)

Fact — aynen (**Visual: CONFIRMED**):
> "Konfigürasyon 11: L alt testi **55 T puanının altında**, F alt testi **64 T
> puanına yakın**, K alt testi **45 T puanının altında**."
> "Bu profil geçerlidir. Benzer profil veren bireyler konuşma ve tavırlarında
> açıktırlar ve laflarını sakınmazlar. Ergen grubu dışında kalan bireylerde ego
> gücünde düşüklük ve yetersiz savunma mekanizmaları vardır. Eğer açık bir
> psikolojik bozukluk yoksa hastada nevrotik bir uyum olduğu görülmektedir."

Kod: `frank` → `L < 55 ∧ K < 45 ∧ F 60-70`
- L < 55 ✅ · K < 45 ✅
- F: kaynak **nokta 64** ("yakın") ↔ kod 60-70 bandı → 64 bandın içinde ✓
  (bant 64'ü kapsar; ancak bandın merkezi 65'tir, kaynak noktası 64)
Status: **VERIFIED** (F bandı tolerans olarak kabul)

## SOURCE-CONFIG-012 · Konfigürasyon 12 — Güvenilir cevaplayıcı (s.54, p35 L)

Fact — aynen (**Visual: CONFIRMED** — s.54 tam sayfa okundu; Şekil 12 çizgisi
L≈50 → F≈68 → K≈58, metinle tutarlı):
> "Konfigürasyon 12: L alt testi **50 T puanına yakın**, F alt testi **70 T
> puanının altında**, K alt testi **50 T puanının üstündedir**."
> "Bu geçerli bir profildir. Birey yönergeleri dikkatli bir biçimde okuyarak
> anlamış ve yapmıştır. Yanıtlar olduğu gibi doğrudur ve hastanın durumunu
> yansıtmaktadır."

Kod: `credible` → `L 45-55 ∧ F < 70 ∧ K > 50 ∧ K ≤ 65`
- L: kaynak nokta **50** ↔ kod 45-55 bandı ✓ (tolerans)
- F < 70 ✅ · K > 50 ✅
- **K ≤ 65 üst sınırı kaynakta YOK** (kaynak K için üst sınır koymaz → K=70 de
  config 12'dir) → `UNVERIFIED_DATA.md`
Status: **VERIFIED** · K üst sınırı **UNVERIFIED (fazladan sınır)**

## SOURCE-CONFIG-013 · Konfigürasyon 13 — Akut / süreğen (s.55, p35 R)

Fact — aynen (**Visual: CONFIRMED** — s.55 tam sayfa okundu; Şekil 13 çizgisi
L≈52, F ve K ≈58 düz seyir, "hemen hemen eşit" ile tutarlı):
> "Konfigürasyon 13: Bu konfigürasyonda L alt testi **50 T puanının üstünde**,
> F ve K alt testleri **hemen hemen eşittir ve 55 T puanının üstündedir**."
Ek liste: 1. Akut bozukluk · 2. Ciddi bozukluğu olmasına karşın oldukça
savunucu olan ancak yine de hasta görünen kişiler.
> "Bu örüntüdeki kişilerin başa çıkma yetenekleri iyidir. […] testi 70 T
> puanının üzerinde olsa bile bu bireyler, sadece şimdiki semptom ya da
> problemleri için yardım almak isterler ve tipik olarak durumsal stres
> azaldığında rahatlarlar."

Kod: `acute-chronic` → `L > 50 ∧ F > 55 ∧ K > 55 ∧ |F−K| ≤ 6`
- L > 50 ✅ · F,K > 55 ✅ · "hemen hemen eşit" ↔ |F−K| ≤ 6 (niceleme yok, makul
  eşitleme) ✓
Status: **VERIFIED (birebir)**

---

# Bölüm 4 kapanışı — Dikkatsizlik endeksi kesin sayıları (s.62, p39 L)

## SOURCE-CL-002 · Dikkatsizlik alt testi: 12 çift · max 12 · kesim 4

Fact — aynen (**Visual: CONFIRMED** — s.62 tam sayfa okundu):
> "Dikkatsizlik alt testi psikolojik olarak zıt içerikli olduğuna karar verilen,
> **12 çift görgül yolla seçilmiş maddeden oluşmaktadır**."
> "Test tekrar test göstergesinden daha duyarlı bir ayrım yapan bu alt test,
> saptırılmış test davranışının ortaya çıkarılmasını mümkün kılar. MMPI'yı
> düzgün bir şekilde cevaplandırmak istemeyen hastaları olduğu kadar,
> konfüzyonda-ki hastaları da ayırt etmektedir. […] Hastanın dikkatsizlik alt
> testinden alacağı **en yüksek puan 12'dir**. **Greene (1980) geçersiz
> profilleri belirlemede 4'ün kesim puanı olarak alınabileceğini
> belirtmiştir.**"

Kod karşılaştırması:
| Kaynak | Kod | Sonuç |
|---|---|---|
| 12 çift, zıt içerikli, görgül seçilmiş | `CARELESS_PAIRS` = **12 çift** (7 `same` + 5 `different`) | ✅ MATCH |
| En yüksek puan **12** | 12 çift × 1 puan = **12** | ✅ MATCH |
| Kesim puanı **4** (Greene 1980) | `const normal = score < 4;` → **≥4 uyarı** | ✅ MATCH |

Status: **VERIFIED** — `UNVERIFIED-TR-001` **KAPANDI** (kesim puanı 4 doğrulandı,
kaynak atfı Greene 1980).

## SOURCE-CL-003 · Bölüm 5 girişi — yorum katmanının kaynak temeli (s.63, p39 R)

Fact — aynen (**Visual: CONFIRMED**):
> "**BÖLÜM 5 — MİNNESOTA ÇOK YÖNLÜ KİŞİLİK ENVANTERİ KLİNİK TESTLERİN
> DEĞERLENDİRİLMESİ**"
> "Bu bölümde verilecek olan kod tipleri ve profil yorumlamaları klinik
> bilgilere dayanmaktadır. […] Kod yorumlamaları MMPI'da kullanılan **ikili
> kodların hepsini, üçlü ve dörtlü kodların çoğunluğunu** içermektedir."
> "**Kodların yorumlanması alt testlerin sayısal sıralamasına göre
> yapılmıştır.**"
> Temel kaynaklar: Archer 1987 · Butcher 1969, 1984, 1987 · Butcher & Graham
> 1990 · Ceyhun 1986 · Dahlstrom ve ark. 1972 · Erol 1982 · Friedman & Graham
> 1987 · Greene 1979 · Lachar 1974 · Levitt 1989 · Savaşır 1978, 1981 · Webb
> 1978
> "MMPI yorumları, ilkokul mezunu ortaokul düzeyinde eğitimi olan, zeka düzeyi
> normale yakın ve **genellikle yetişkinler için** yapılmıştır."
> "Bundan sonraki bölümde verilen kodlar aşağıdaki özellikler göz önünde
> tutularak değerlendirilmiştir. Bunlar; psikiyatrik grupta ortalama ve yüksek
> puanların yorumlanması ve **cinsiyet, yaş, eğitim, sosyo-ekonomik düzey** gibi
> değişkenlerin puanlara etkisidir."
> "MMPI değerlendirmesinde **düşük puanlar psikopatolojiyi değil, uyumu** …"
> (s.64'e taşar)

Kullanım: PHASE 5 (klinik testler / kod tipleri / yorum) için kaynak temeli ve
kapsam sözleşmesi (ikili kodların tamamı + üçlü/dörtlü kodların çoğunluğu).
Status: **VERIFIED** (bilgi kaydı)

---

# Bölüm 8 — Wiggins İçerik Skalaları (kitap s.178-181, PDF p97 L – p98 R)

## SOURCE-WIGGINS-001 · Tablo 20 — Türk örneklemi normları (s.179)

Fact — aynen (**Visual: CONFIRMED** — tablo deskew edilerek okundu, 450 dpi):

**Tablo 20. Türk örneklemi Wiggins içerik skalaları ortalama ve standard
sapmaları** (Hasta Grubu n=1000 · Normal Grup n=1000)

| Skala | Hasta X̄ | Hasta Sd | Normal X̄ | Normal Sd |
|---|---|---|---|---|
| SOC | 12.30 | 4.73 | 10.52 | 4.36 |
| DEP | 15.83 | 6.35 | 11.75 | 5.13 |
| FEM | 12.96 | 3.93 | 14.77 | 3.87 |
| MOR | 11.87 | 5.36 | 8.97 | 4.28 |
| REL | 6.52 | 3.22 | 7.37 | 4.87 |
| AUT | 10.70 | 3.58 | 11.04 | 3.36 |
| PSY | 17.76 | 9.22 | 14.80 | 7.04 |
| ORG | 14.42 | 6.65 | 10.40 | 5.31 |
| FAM | 6.04 | 3.70 | 5.31 | 3.44 |
| HOS | 12.70 | 4.29 | 11.35 | 3.67 |
| PHO | 12.12 | 5.47 | 11.37 | 4.52 |
| HYP | 14.65 | 4.42 | 13.32 | 3.90 |
| HEA | 10.48 | 4.77 | 7.71 | 4.19 |

Kod: `WIGGINS_NORMS` = **Normal Grup** değerleri →
**13/13 skala × 2 değer = 26/26 BİREBİR MATCH** ✅
Status: **VERIFIED** — bu, PHASE 8'in doğrulanmamış son norm katmanını kapatır.

**Okuma notu (yöntem):** Tarama ~2.87° dönük olduğu için sütunlar arasında
satır başına ~29 px dikey kayma oluşuyor; düz okuma sütun 3-4'ü ±1 satır
kaydırır. Tablo **deskew edilerek** okundu ve sütun y-merkezleri programatik
olarak doğrulandı (13/13 satır hizası). Ayrıntı: `OCR_ISSUES.md`.

## SOURCE-WIGGINS-002 · Skala başına madde sayıları (s.178-181)

Fact — aynen (**Visual: CONFIRMED**):

| Skala | Kaynak ifadesi | Kod (`WIGGINS_KEYS`) | Sonuç |
|---|---|---|---|
| SOC | "**Toplam 26 maddeden** oluşan" (s.178) | 13 + 14 = **27** | ⚠️ **KAYNAK İÇİ ÇELİŞKİ** |
| DEP | 33 maddeden | 27 + 6 = 33 | ✅ |
| FEM | 30 maddeden | 18 + 12 = 30 | ✅ |
| MOR | 23 maddeden | 21 + 2 = 23 | ✅ |
| REL | 12 maddeden | 9 + 3 = 12 | ✅ |
| AUT | 20 maddeden | 19 + 1 = 20 | ✅ |
| PSY | 48 maddeden | 45 + 3 = 48 | ✅ |
| ORG | 36 maddeden | 15 + 21 = 36 | ✅ |
| FAM | **16 maddeden** (görsel, s.180) | 11 + 5 = 16 | ✅ |
| HOS | 27 maddeden | 27 + 0 = 27 | ✅ |
| PHO | **27 maddeden** (görsel, s.180) | 16 + 11 = 27 | ✅ |
| HYP | 25 maddeden | 25 + 0 = 25 | ✅ |
| HEA | 28 maddeden | 10 + 18 = 28 | ✅ |

**SOC çelişkisi:** Metin "26" der; ancak kitabın **kendi madde listesi**
(Ek 9c, s.251-256) 27 madde verir ve bu liste `compare-keys.py` ile
**46/46 MATCH** olarak doğrulanmıştır → kaynak içi tutarsızlık; kod madde
listesini izler. Kayıt: **CONFLICT-021**, **DECISION-024**.
Status: 12/13 **VERIFIED** · SOC **kaynak içi tutarsızlık (kod doğru)**

## SOURCE-WIGGINS-003 · Skala tanımları (s.178-181)

Fact — aynen (kod `WIGGINS_META` ile karşılaştırma):

| Skala | Kaynak tanımı (kısaltılmış) | Kod açıklaması | Durum |
|---|---|---|---|
| SOC | "maddeleri **içedönüklük-dışadönüklük** kavramını içermektedir. **Yüksek puanlar kendinden emin, güvenli, parlak** bireyleri gösterirken, **düşük puanlar iddiacı, eğlenceyi seven**, diğer insanlarla kolay ilişkiye giren bireylere işaret etmektedir" | "Sosyal ortamlarda ketlenmişlik ve utangaçlık" (yüksek = ketlenmiş) | ⚠️ **YÖN ÇELİŞKİSİ** → CONFLICT-022 |
| DEP | "endişe, suçluluk, mutsuzluk, yaşamın anlamının yitirildiği" | "Mutsuzluk, suçluluk ve yaşamın anlamını yitirme hissi" | ✅ |
| FEM | "hobileri ve çeşitli spor faaliyetlerine merakı" | "Estetik konulara ve sanata karşı ilgi" | ~ kısmi |
| MOR | "kendini başarısız, ümitsiz olarak tanımladığı" | "Kendini başarısız hissetme ve düşük kendilik değeri" | ✅ |
| REL | "dinsel tutuculuk" | "Gelenekselci, dinsel tutucu tutumlar" | ✅ |
| AUT | "otoriteye güvensizliği … Diğer insanlara inanmaz, onların hep kendisini kullandıklarını düşünür" | "Otoriteye güvensizlik ve kullanılma kaygısı" | ✅ |
| PSY | "klasik psikotik semptomları gösterir … paranoid temeli ağır basmaktadır" | (kontrol edildi) | ✅ |
| ORG | "güç azlığından yakınmasını ve duygusal çatışmalardan kaynaklanan fiziksel semptomları" | — | ✅ |
| FAM | "ailesinden yeterince ilgi ve sevgi görmediğini, onların gereksiz yere eleştiren, sinirli, kavga etmeye eğilimli" | — | ✅ |
| HOS | "sadistik impulsları … tartışmaya eğilimli, kavga çıkarmaya hazır" | — | ✅ |
| PHO | "çeşitli korkuları anlatmaktadır (yükseklik, karanlık, kapalı alanlar)" | — | ✅ |
| HYP | "huzursuzluğu, gerginliği ve telaşı gösterir" | — | ✅ |
| HEA | "kendi sağlığı ile aşırı ilgilidir; gastrointestinal yakınmalar" | — | ✅ |

## SOURCE-WIGGINS-004 · Türkçe uyarlama çalışması (s.181)

Fact — aynen (**Visual: CONFIRMED**):
- Akça & Ceyhun (1994): örneklem **2000 denek** — hasta grubu 400 kadın +
  600 erkek; normal grup 578 kadın + 422 erkek. Hasta grubu Ankara'daki çeşitli
  üniversite hastanelerinde yatan hastalardan, normal grup devlet dairelerinde
  çalışanlardan ve üniversite öğrencilerinden oluşmuştur.
- Wiggins iç tutarlılık: en düşük **FEM (.50-.65)**; en yüksek **SOC (.82-.86)**,
  REL (.67-.89), DEP (.75-.87), MOR (.75-.86).
- Wiggins'in orijinal çalışmasında 7 ayrı grup karşılaştırılmıştır
  (Hava Kuvvetleri erkek personel N=261, yatan/ayaktan hastalar, öğrenciler).
Status: **VERIFIED** (bilgi kaydı)

---

# Ek 1 — MMPI Test Kitabı, 566 madde metni (kitap s.215-233)

## SOURCE-ITEM-001 — Madde metinleri kaynaktan okunabilir ve numaralandırma 1-566

Fact: Ek 1 (s.215) şu başlıkla başlar:
> "Ek 1: MMPI Test Kitabı — Minnesota Çok Yönlü Kişilik Envanteri"
> "Başla demeden bu defteri açmayınız. […] Her soruyu okuyarak KENDİ
> DURUMUNUZA GÖRE DOĞRU YA DA YANLIŞ olup olmadığına karar veriniz. […]
> **Soru sizin durumunuza uymuyor ya da bu konuda bir şey bilmiyorsanız cevap
> kağıdının üzerine hiç bir işaret koymayınız.** […] MÜMKÜNSE her soruya
> cevaplandırmaya çalışınız."

Sayfa numaralandırması bütünlüğü: s.215-233 boyunca **1→566 aralığı kesintisiz**
(OCR ile satır başı numaraları tarandı; ardışıklık boşluğu yok, kopya yok —
iki "kopya" bulgusu OCR artefaktı, kitapta numara hatası **yok**).

Yöntem: OCR yalnız **numaranın konumunu** bulmak için kullanıldı; **metin
yüksek DPI görselden okundu** (300-350 dpi). Gerekçe: OCR blok sırası
güvenilmez (bkz. `OCR_ISSUES.md` → ITEM-ORDER).
Status: **VERIFIED (yapı)** · `SOURCE-ITEM-001`

## SOURCE-ITEM-002 — Kaynakta "kritik madde" listesi YOK

Fact: Kaynağın hiçbir yerinde (Bölüm 3/4/5/6, Ek 1, Ek 9, Ek 10) **"kritik
madde"** adı altında bir liste bulunmaz. Kaynakta bulunanlar:
- **Ek 9** (s.244-256): ölçek ↔ madde numarası ve puanlama yönü **(D/Y)**
- **Ek 1** (s.215-233): madde **metinleri**
- **Ek 10** (s.257-260): tanı gruplarına göre ortalama/SD

Dolayısıyla projedeki `CRITICAL_ITEMS` listesi **kaynak dışı** bir derlemedir
(proje kendi etiketlerini ve yönünü yazmıştır).
Status: **VERIFIED (yokluk kanıtı)** · `SOURCE-ITEM-002` · CONFLICT-023

## SOURCE-ITEM-003 — Doğrulanan kritik madde metinleri (görsel)

Aşağıdaki 24 madde **görsel doğrulandı** ve etiketi kaynak metniyle tutarlı
(dosya: `.audit/items/gl2_*.png`, `gl3.png`, `gl4.png`; toplam 39 kayıt):

| # | Kaynak metni (özet) | Kod etiketi | Durum |
|---|---|---|---|
| 48 | Başkaları ile bir arada iken kulağıma çok garip şeyler gelmesinden rahatsız olurum | Ruhsal Kontrol Kaybı | ✓ |
| 66 | Etrafından başkalarının görmedikleri eşya, hayvanlar veya insanlar görürüm | Gerçek Dışılık / Sanrısal Düşünce | ✓ |
| 74 | Çoğu zaman kız olmayı isterdim. (Şayet kız iseniz) Kız olduğuma hiç üzülmedim | Cinsel Uyumsuzluk / Kimlik Kaygısı | ✓ (cinsiyete göre D/Y doğru) |
| 114 | Çoğu zaman başım sıkı çember içindeymiş gibi hissederim | Bedensel/Organik Belirti | ✓ |
| 121 | Aleyhimde bazı tertipler kurulduğuna inanıyorum | Gerçek Dışılık / Sanrısal Düşünce | ✓ |
| 123 | Beni takip edenler olduğuna inanıyorum | Şüphecilik / Alınganlık | ✓ |
| 139 | Bazen sanki kendimi ya da başkasını incitmek zorundaymışım gibi hissederim | Kendine/Başkasına Zarar Verme | ✓ |
| 156 | Bir şeyler yapıp sonra ne yaptığımı hatırlayamadığım zamanlar oldu | Bedensel/Organik Belirti | ✓ |
| 182 | Aklımı oynatmaktan korkuyorum | Fobik Kaygı | ✓ |
| 184 | Sık sık nereden geldiğini bilmediğim sesler duyarım | Ruhsal Kontrol Kaybı | ✓ |
| 200 | Fikir ve düşüncelerimi çalmak isteyen biri var | Gerçek Dışılık / Sanrısal Düşünce | ✓ |
| 202 | Kendimi cezayı hakketmiş suçlu bir insan olarak görüyorum | İntihar Riski / Depresyon | ✓ |
| 205 | Bazen çalmaktan ya da dükkânlardan eşya aşırmaktan kendimi alamam | Sosyal Uyumsuzluk | ✓ |
| 209 | Günahlarımın affedilmeyeceğine inanıyorum | Depresif Karamsarlık | ✓ |
| 215 | Çok içki kullandım | Alkol/Madde Sorunları | ✓ |
| 251 | Kendimi kaybedip yaptığım işi aksattığım ve etrafımda olup bitenlerin farkında olmadığım zamanlar oldu | Bedensel/Organik Belirti | ✓ |
| 275 | Birisi zihnimi kontrol ediyor | Ruhsal Kontrol Kaybı | ✓ |
| 291 | Hayatımda bir ya da birkaç kere birisinin beni hipnotize ederek bana bir şeyler yaptığını hissettim | Ruhsal Kontrol Kaybı | ✓ |
| 293 | Birisi zihnimi etkilemeye çalışıyor | Şüphecilik / Sanrısal Düşünce | ✓ |
| 339 | Çoğu zaman ölmüş olmayı isterdim | İntihar Riski / Depresyon | ✓ |
| 345 | Sıklıkla olup bitenler bana gerçek değilmiş gibi gelir | Sanrısal Düşünce / Ruhsal Kayıp | ✓ |
| 349 | Acayip ve tuhaf düşüncelerim vardır | Şüphecilik / Sanrısal Düşünce | ✓ |
| 350 | Yalnızken garip şeyler duyarım | Sanrısal Düşünce / Ruhsal Kayıp | ✓ |

→ **14 kayıtta etiket kaynak metniyle UYUŞMUYOR** (38 benzersiz maddeden) → CONFLICT-023.

---

# Bölüm 5 — Klinik testlerin değerlendirilmesi (kitap s.63-158) — yapı ve Tablo 8

## SOURCE-CL-004 · Tablo 8 — Hipokondriazis (Hs) alt testi: madde numaraları ve puanlama yönü (s.66)

Fact — **görsel doğrulandı** (320 dpi, `.audit/pages/v_tablo8.png`):
> "**Tablo 8. Hipokondriazis alt testi: Madde numaraları ve puanlama yönü
> (Madde Sayısı: 33)**"
> **Doğru** (11): 23, 29, 43, 62, 72, 108, 114, 125, 161, 189, 273
> **Yanlış** (22): 2, 3, 7, 9, 18, 51, 55, 63, 68, 103, 130, 153, 155, 163, 175,
> 188, 190, 192, 230, 243, 274, 281
> **"K Eklemmeli"** (K düzeltmesi uygulanır)
> "Erkeklerde ortalama: **13.19**, kadınlarda: **15.89** (Savaşır, 1981)"

**Karşılaştırma — `src/scoring/mmpiKeys.ts`:**
`Hs.trueItems` = 11 madde → **birebir MATCH** ✓
`Hs.falseItems` = 22 madde → **birebir MATCH** ✓
`TURKISH_NORMS.Hs` → Erkek mean **13.19** / Kadın mean **15.89** → **MATCH** ✓
`K_ADDITION_TABLE` Hs oranı 0.5 → kaynak "K eklemmeli" ✓ (oran kaynakta verilmez → UNVERIFIED)
Status: **VERIFIED** · `SOURCE-CL-004`

## SOURCE-CL-005 · Bölüm 5'in yapısı — kod tipi yorumları (s.63-158)

Fact (s.63, `SOURCE-CL-003` ile birlikte; s.66-75 taramasıyla doğrulandı):
> "Bu bölümde verilecek olan **kod tipleri ve profil yorumlamaları** klinik
> bilgilere dayanmaktadır. […] Kod yorumlamaları MMPI'da kullanılan **ikili
> kodların hepsini, üçlü ve dörtlü kodların çoğunluğunu** içermektedir.
> Kodların yorumlanması **alt testlerin sayısal sıralamasına göre** yapılmıştır."
Kaynak listesi: Archer 1987; Butcher 1969, 1984, 1987; Butcher & Graham 1990;
Ceyhun 1986; Dahlstrom ve ark. 1972; Erol 1982; Friedman & Graham 1987;
Greene 1979; Lachar 1974; Levitt 1989; Savaşır 1978, 1981; Webb 1978.
> Hedef kitle: "ilkokul mezunu, ortaokul düzeyinde eğitimi olan, zekâ düzeyi
> normale yakın ve genellikle yetişkinler".

**Yapı bulgusu (denetim için kritik):** Bölüm 5'te **her ölçek için madde
tablosu YOKTUR** — klinik ölçek madde anahtarlarının kaynağı **Ek 9**
(s.244-256) ve Hs için **Tablo 8**'dir. Bölüm 5 = **kod tipi yorumları +
T-puan bant yorumları**.

Kod karşılığı: `src/scoring/mmpiSourceCodes.ts` — "iki noktalı kod yorumları
(Kod Analizleri)"; anahtar kanonik biçimde (küçük rakam önce: "21" → "12").
**Örnek doğrulama (s.68 ↔ `CODES['12']`):** kaynak
*"bedensel işlevleri ile çok fazla ilgilidirler […] herhangi bir tıbbi
müdahale olabildiğince kısıtlı olmalıdır"* ↔ kod metni birebir özet ✓;
kaynak *"12 kodunda 1 ve 2 alt testleri arasında 5 T puanı kadar fark varsa
21'e bakılır"* ↔ kod metninde korunmuş ✓.
Status: **VERIFIED (yapı + örnek)** · PHASE 9/10 kapsamı belirlendi

---

# PHASE 9/10 — Bölüm 5: Hs alt testi yorumu ve kod tipleri (kitap s.66-69)

## SOURCE-CL-006 · Hs T-puan bantları (s.67, p41 R) — **Visual: CONFIRMED**

Fact — aynen:
> **84'ün üzerinde T Puanı:** "Yakınmaları bütün organ sistemlerine yayılmış olan
> kişilerde görülür. Ağrı, yorgunluk ve güçsüzlük sıklıkla vardır. Somatik ilgiler
> somatik delüzyonlara dönüşmüş demektir. Bu belki de şizofrenik bir epizodun
> başlangıcıdır."
> **75-84 T Puanı:** [{kaynak metni birebir kod ile aynı — bkz. aşağıda}]
> **60-74 T Puanı:** "Bu puanlar sıklıkla bu kişilerin hem şimdiki hem de geçmiş
> yaşantıda fiziksel bozukluk gösterdiğine işaret etmektedir ve bu yükselmeye
> **sıklıkla D alt testindeki yükselme eşlik eder**… Bedensel hastalığı olan
> bireylerde **65 T puanının üstünde** bir yükselme, bu bireylerin yaşadıkları
> güçlüklere aşırı tepki verdiklerini ve kabul edilmez dürtülerini somatizasyon
> ile ifade ettiklerini göstermektedir."
> **50-59 T Puanı:** "…Özelliği olan bir örüntüde **2, 6, 7, 8 ya da 0 alt
> testlerinin 70'in üzerine yükselmediği zaman** günlük yaşam aktivitelerini
> yerine getirdiği söylenebilir. Bu kişiler sıklıkla yetenekli, sorumluluk
> sahibi, vicdanlı, dikkatli ve yargılamaları iyi olan kişilerdir."
> **21-49 T Puanı:** "(a) Hastalığın hiç konu olmadığı ailelerde yetişen
> bireyler (b) Şimdiye kadar hiç ağrı, acı ya da hastalık geçirmediği ile övünen
> kişilerde. […] **Özelliği olan bir örüntüde 2,6,7,8 ya da 0 alt testlerinin
> 70'in üzerinde yer aldığı bir durumdur**, çünkü bu konfigürasyonda düşük Hs alt
> testi sıklıkla birisinin bedeni ile ilgisinin olmadığını gösterir."

Kod: `HS_T_BANDS` → `T > 84` · `75-84` · `60-74` · `50-59` · `21-49`
Karşılaştırma: **Bant sınırları birebir MATCH** ✅ · 75-84 / 60-74 / 50-59 /
21-49 metinleri **MATCH** (birebir özet) ✅
Status: **VERIFIED**

## SOURCE-CL-007 · Hs düşük puan ve yaş özellikleri (s.66-67) — **Visual: CONFIRMED**

Fact — aynen:
> "**Hs alt testinde düşük puan alan bir bireyin:** 1. Somatik uğraşları yoktur.
> 2. İyimserdir. 3. Duyarlıdır. 4. İçgörüsü vardır. 5. Günlük yaşamda oldukça
> etkindir."
> "Hs alt testinin **40 yaşın üzerindekilerde daha çok yükseldiği** ancak genç
> grupta daha düşük olduğu belirtilmektedir."
> "Ciddi bedensel hastalığı olan bireylerde de bu alt testte yükselme vardır,
> ancak bu psikiyatrik hastalar kadar yüksek değildir. Hipokondriyak tanısı
> konulan hastaların semptomları uzun sürelidir, değişmeye dirençlidirler ve
> bu, artık strese tepkiden farklı bir şeydir. **Bu bireyler önerilen tedaviyi
> uygulamaz ve sık sık doktor doktor gezerler.**"

Kod: 5 maddelik liste `HS_T_BANDS` içinde **YOK** · 40 yaş notu **YOK** ·
"doktor doktor gezerler" **YOK** (kaynakta ayrı cümle)
Status: **MISSING** → CONFLICT-026 (P3)

## SOURCE-CL-008 · Tablo 8 teyidi (s.66, p41 L) — **Visual: CONFIRMED**

Fact — aynen (Tablo 8, Madde Sayısı: 33):
Doğru: `23 29 43 62 72 108 114 125 161 189 273` (11) ·
Yanlış: `2 3 7 9 18 51 55 63 68 103 130 153 155 163 175 188 190 192 230 243 274
281` (22) · K Eklemeli: (boş) · "Erkeklerde ortalama: 13.19, kadınlarda: 15.89
(Savaşır, 1981)"
Karşılaştırma: SOURCE-CL-004 ile aynı → **VERIFIED** (ikinci okuma teyidi)

## SOURCE-CODE-001 · 12/21 Kodu (s.67 sonu – s.68, p41 R – p42 L) — **Visual: CONFIRMED**

Fact — aynen (kod gövdesi):
> "**12/21 Kodu** — Bu kodun en belirgin özelliği bedensel rahatsızlık ve ağrıdır.
> Bireyler bedensel işlevleri ile çok fazla ilgilidirler. […] **12/21 Kodu veren
> lise öğrencileri genel olarak utangaç, gergin, içedönük, mutsuz, endişeli,
> güvensiz ve özellikle karşı cins ile ilişkilerinde oldukça çekingendirler.**
> **Üniversite öncesi ergenler, sıklıkla utangaçlıklarını obsesyonlar ya da
> sosyal izolasyon biçiminde gösterirler. Bağımlılık ve karamsarlık belirgindir
> ve arkadaşları azdır. Aile öykülerinde sıklıkla ayrılıklar ya da boşanma
> vardır.** 12 Kodunda 1 ve 2 alt testleri arasında **5 T puanı** kadar fark
> varsa 21'e bakılır…"

Ek (s.69, 12/21 kodunun devamı):
> "Kod tipine ek olarak **Pd alt testi düşük** olduğunda heteroseksüel ilişki
> azlığı ve seksüel zorlukların olduğu bir pasifliği gösterir. **Ma alt testinde
> de düşüklük** olduğunda kişide enerji düzeyinde azalma, iş yapmama ve sürekli
> yatma isteği vardır. **Mf alt testinin düşmesi** kadınlarda aşırı derecede
> sorumluluk aldıklarını ve sıkıntılarının uzun süreli olduğunu gösterir. Eğer
> aynı zamanda **L alt testi de yükselmişse** bu kadınlarda evlilik sorunları,
> yorgunluk yakınmaları ve diğerleri tarafından anlaşılmama vardır."

Kod: `CODES['12']` → gövde **MATCH** ✅ · `diagnosis: Pasif-bağımlı kişilik
bozukluğu / Somatizasyon bozukluğu / Depresyon` ✅ · **lise öğrencileri** ve
**üniversite öncesi ergenler** paragrafları **YOK** → CONFLICT-025 · **Pd/Ma/Mf/L
koşullu ek yorumları YOK**
Status: gövde **VERIFIED** · koşullu ek yorumlar **MISSING**

## SOURCE-CODE-002 · 123/213 Kodu (s.68 sonu – s.69 başı) — **Visual: CONFIRMED**

Fact — aynen:
> "**123/213 Kodları** (Ayrıca 1234 ve 1237'ye bakınız. 3 alt testi, 1'den 5 T
> puanı yüksekse 213/231 kodlarına bakınız.)
> Bu kişiler özellikle yorgunluk, güçsüzlük ve karın bölgesindeki organlarla
> ilgili bedensel yakınmalar gösterirler. Öykülerinde uzun süreli kronik
> hipokondriazis öyküsü vardır. Onların yakınmaları sıklıkla pasif bir
> bağımlılığın kanıtı olabilir ancak bu kişilerde **konfüzyon, intihar
> düşünceleri, obsesyonlar ve kompulsiyonlar yoktur.** İlgi alanları daralmış,
> depresif, atılgan olmayan, risk alma konusunda tereddütlü kişilerdir."
> **Olası tanı: Belirgin somatizasyon bozukluğu ve hipokondriyak uğraşlar.**

Kod: **`CODES['123']` TANIMLI DEĞİL** ❌ → CONFLICT-024 (P1)
Status: **MISSING**

## SOURCE-CODE-003 · 1234 Kodu (s.69, p42 R) — **Visual: CONFIRMED**

Fact — aynen:
> "**1234 Kodu** (Ayrıca eğer alt test 1 ve 2 diğerlerinden 5 T puanı yüksekse
> **2134'e bakınız**.)
> Kişilerdeki kişilik zayıflığı korkaklık, stres yaratan durumlarla ve
> sorumluluklar ile başa çıkmada yetersizlik vardır. Bağımlılık, bağımsızlık
> çatışması yaşarlar. Alkolle sınırlar, ancak içtikleri zaman kavga ederler.
> Bu profili veren erkekler kadınlara karşı düşmanlık duyguları gösterirler
> (Sıklıkla fiziksel şiddet yani dayak vardır.). Özellikle güçlü bağımlılık
> gereksinimleri engellenmiştir. Erkeklerde anneye bağımlılık özlemi, anneleri
> tarafından reddedilme korkusu ile çatışma içindedirler. **Olası tanılar: pasif
> agresif kişilik, anksiyete ya da psikofizyolojik reaksiyonlardır.**
> Kadınlarda karakter bozukluğu, pasif-agresif kişilik, kimseye güven duymama,
> duygularını ifade etme güçlüğü ya da nasıl ifade edeceğini bilememe görülür.
> Psikoterapide savunucudurlar, motivasyonları düşüktür.
> **Olası Tanı: Pasif-agresif kişilik / Anksiyete ya da psikofizyolojik
> reaksiyon**"

Kod: **`CODES['1234']` TANIMLI DEĞİL** ❌ → CONFLICT-024 (P1)
Status: **MISSING**

## SOURCE-CODE-004 · 1236 Kodu başlangıcı (s.69, p42 R — devamı s.70)

Fact — aynen:
> "**1236 Kodu** — Birey uzun süreli gerginlik, yetersizlik ve stres altında
> semptom geliştirme eğilimi gösterir. **Semptomlar konversif niteliktedir.**
> Bastırma ve yadsımayı kullanır. Olumsuz duygularını psikosomatik semptomlarla
> gösterir."

Kod: **`CODES['1236']` TANIMLI DEĞİL** ❌ → CONFLICT-024 (P1)
Status: **MISSING** (kod metninin devamı s.70+'ta okunacak)

## SOURCE-CODE-005 · Hs kod tipi bloğu I (s.70, p43 L) — **Visual: CONFIRMED**

Fact — kaynakta **sırayla** tanımlı kod tipleri (her biri ayrı başlık):
| Kod | Özet (kaynak) |
|---|---|
| **1237 Kodu** | "123'teki kod tipinin özelliklerine ek olarak" anksiyete, gerilim, korku, atılgan olamama, yetersizlik duyguları, kişilerarası ilişkilerde bağımlılıkta artma; sırt/göğüs ağrıları + epigastrik yakınmalar. **"Özellikle K 50 T puanından düşükse"** günlük stres ve sorumluluklarla başa çıkamazlar. Erkekler kendilerinden daha güçlü kadınlarla evlenir; kronik işsizlik ve alkol bağımlılığı görülebilir. Olası tanı: Pasif bağımlı kişilik yapısında anksiyete ve psikofizyolojik reaksiyon |
| **1270 Kodu** | Sinirlilik, anksiyete, depresyon, zayıflık, yorgunluk, ilgi kaybı; benlik değerlerinde düşme; sosyal ilişkilerde geri çekilme ve içe dönük tutum; uykusuzluk, kardiyak semptomlar, anoreksiya |
| **12378 Kodu** | "Nevrotik bozuklukların **daha şiddetli** şeklidir. **7 ve 8'deki yükselmeler**, nevrotik bozukluğun daha abartılı olduğunun göstergesidir." |
| **128/218 Kodları** | Bedenin **üst kısmına** ilişkin yakınmalar; yorgunluk, gerilim, düşüncelerde bozulmalar; ruhsal bozukluk ve diğerlerinden yabancılaşma; "akut prepsikotik ya da psikotik ve **somatik delüzyonlar**" |
| **129/219 Kodları** | Beden işlevleriyle aşırı ilgi; hastalıklarının **gerçekten acil** olduğunu düşünürler; akut klinik rahatsızlık, gerginlik, ajitasyon, huzursuzluk; baş ağrısı, uykusuzluk, spastik bağırsak ağrıları; **nörolojik etiyoloji** dikkate alınmalı (organik beyin sendromları); çok az düzeyde de olsa depresyonu/çatışmayı/hipomanik pasif-bağımlı tavrı maskelemeyi ya da inkâr etmeyi isterler |

Kod: **hiçbiri tanımlı değil** ❌ → CONFLICT-024 (P1)
Status: **MISSING** (6 kod tipi)

## SOURCE-CODE-006 · Hs kod tipi bloğu II (s.71, p43 R) — **Visual: CONFIRMED**

Fact — aynen:
| Kod | Özet (kaynak) |
|---|---|
| **120/210 Kodları** | Depresyon, içe çekilme, kararsızlık, kişilerarası ilişkilerden kaçınma, yetersizlik ve suçluluk duygularına **değişik somatik yakınmalar eşlik eder**. "**8 ve 6 birlikte yükselmişse** uzak duruş, pasif ve insanlardan kaçan **şizoid** bir biçim gösterirler." |
| **13/31 Kodu** | (Kodda mevcut — gövde MATCH) **Ek koşullu paragraflar:** (i) "13/31 kodu ile birlikte **2, 7, 8 ve 9 alt testleri yükselmiş ve K alt testi düşmüşse** hastada gerginlik, anksiyete, karar vermede güçlük ve depresyon olabilir… Kendilerini normal ve sorumluluk sahibi tanımlama eğilimi vardır." (ii) "13/31 kodu ile birlikte **L ve K alt testleri de yükselirse**, kendileri ile uğraşılmasına karşı öfkelendikleri anlaşılmaktadır." (iii) "**13 kodunu veren** kişilerde hipokondriyak özellikler belirgindir. **31 kodunu veren** kişilerde ise stres durumları ile karşılaşıldığında bedensel yakınmalar ortaya çıkar, immatür ve bağımlı özellik gösterirler." |

Kod: `120`/`210` **tanımlı değil** → CONFLICT-024 · `13` mevcut; (ii) ve (iii)
paragrafları kodda **YOK** → CONFLICT-025 sınıfı
Status: **MISSING**

**Genel bulgu (kritik):** Kaynak, Hs kod tipi bölümünde **her üçlü/dörtlü kod için
ayrı yorum** veriyor ve bunları **koşullu cümlelerle** birbirine bağlıyor
("K 50'den düşükse", "8 ve 6 birlikte yükselmişse", "L ve K da yükselirse").
Kodda bu katman **tamamen yok**.

## SOURCE-CODE-007 · Hs kod bloğu III (s.72-73, p44) — **Visual: CONFIRMED**

| Kod | Özet (kaynak) |
|---|---|
| **13/31 Kodu, Yüksek K** | "Özellikle **2, 7 ve 8 testlerinin T puanı 70'in ve F alt testi T puanı 50'nin altında** ise bireyler kendini normal, sorumluluk sahibi, yardımsever ve sempatik olarak sunmaya çalışır. Var olan herhangi bir bedensel semptomun ortaya çıkma biçimi **yetersizlik, değersizlik** şeklindedir. Geleneksel psikoterapötik müdahalelerden yararlanmazlar, profesyonellere güven duydukları zaman, tedaviyle iyileşebilirler." |
| **13/31 Kodu / Düşük 2 Kodu** | "Bu tür profil veren bireylerin **histerik kişilik özellikleri vardır ve klasik psikosomatik semptomlar** gösterirler." |
| **132/312 Kodları** | "13/31 kod tipindeki özelliklere ek olarak birey, **zayıflık ve yorgunluktan yakınır** (Eğer 9 alt testi daha düşükse). Kendilerinde **depresif duygudurum olduğunu inkâr etseler** de davranışlarında sıklıkla depresif özellikler vardır. Bu kişiler **uyumlu ve pasiftirler** (Özellikle 4 alt testi düşükse.) Diğerlerinin ilgisi karşısında **endişe yaşarlar** (Si alt testinde düşüklük olduğunda bile)." |
| **134/314 Kodları** | "Bireylerde belirgin olan özellikler; **inatçılık, züppellik** hatta **kendini beğenmişliktir.** Tanımlanan özellikleri nedeniyle **somatizasyon yakınmaları ikinci planda kalmaktadır.** 13/31 kodundaki özellikler bu bireylere de uygundur. **Bağımlılık, bağımsızlık çatışmaları** vardır; ancak diğerlerine yabancılaşma konusunda çok endişe yaşamazlar. Eğer profil **konversiyon** vadisine uygunsa **somatik yakınmalar dönemsel patlamalar** ya da **pasif agresif** bir tarzda ifade edilir." |
| **1342 Kodu** | "Birey **bağımlı ve immatürdür. Otistik dönemleri** olabilir. Psikiyatrik olarak **depresyon, anksiyete, sinirlilik, başağrısı, uykusuzluk** gibi somatik yakınmalar görülebilir." |
| **136/316 Kodları** | "Bedensel semptomların (özellikle **mide ve baş ağrısı**) stres durumlarında ortaya çıkmasına karşın bu kişiler, diğerlerinden gelen **istekler karşısında gergin ve aşırı duyarlıdırlar.** Bireyler **benmerkezci ve narsisisttir.** Ayrıca **katı ve inatçı** olma eğilimi içindedir. Sıklıkla bu profil veren erkek **hastalara rekabetçi, şüpheci, çabuk kızan ve diğerlerini kontrol etmeyi isteyen** bireylerdir. Davranışlarını benmerkezci biçimde rasyonalize etme eğilimindedir, diğer insanlarla ilişkilerinde **içgörüleri azdır** ve onlardan beklentileri çok fazladır." |

**Kritik sayısal koşul (13/31 Yüksek K):** 2, 7, 8 testleri **70'in altında** ∧
F alt testi **50'nin altında** → kodda yalnızca `13` `text` içinde "Yüksek K ile
(özellikle 2, 7 ve 8'in T puanı 70'in ve F'nin 50'nin altında olduğu durumda)"
biçiminde **gömülü**; ayrı bir alt-kod olarak **tespit edilmiyor**.

## SOURCE-CODE-008 · Hs kod bloğu IV (s.74-75, p45) — **Visual: CONFIRMED**

| Kod | Özet (kaynak) |
|---|---|
| **1382 Kodu** | "138'deki yoruma ek olarak **dikkate değer depresyon, konfüzyonel düşünce, alkol alımı ve intihar etme düşünceleri** vardır. Birey, **sıklıkla yalnız**dır, evli ise **evlilik uyumu bozuktur.** Sürekli olarak **bir işten, başka bir işe geçer.**" |
| **139 Kodu** | "Bireyde; **başağrısı, görme ve işitme yakınmaları, titreme ve koordinasyon bozuklukları** ve çok sayıda somatik yakınma görülür. **Engellenme eşiği oldukça düşüktür**, sinirlidir ve **öfke patlamaları** vardır. Eğer **4 alt testinde yükselme varsa ve K alt testi düşmüşse mücadeleci ve yıkıcı kişilik** özellikleri vardır. Kişilerarası ilişkilerinde **öfke ön plandadır** ve **boşanmalar oldukça sık** görülür. Kişilerin genellikle **mükemmelliği isteyen öyküleri** vardır ve ailelerine ilgileri azdır. **Alkol alımından sonra düşmanlık duyguları** ön plana çıkar. Bu kod, çok sık olarak **kişilik bozuklukları** ya da **travmaya eşlik eden kronik beyin sendromu** olan olgularda görülür. Seyrek olarak **anksiyete bozuklukları** ile birliktedir. **Olası Tanı: Somatoform bozukluk / Organik beyin sendromu**" |
| **14/41 Kodu** | (kodda mevcut) **Ek:** "**Çok genel olarak görülen üçlü kodlar 143/413 ve 142/412'dir.**" |
| **Yüksek 1 / Düşük 4 Kodu** | "Bu örüntü **karşılaşılan sorunlarla başa çıkamama ve ev yaşantısındaki güçlüklerle** bağlantılıdır. **Öfkelerini kolaylıkla dile getirmelerine** karşın yine de **psikofizyolojik tepkiler** verirler. Genel özellikleri **sürekli yakınma ve karamsarlık**tır." |
| **146 Kodu** | "**Antisosyal** ya da **impuls kontrolünde güçlüğü** olan kişilerdir. **Kötümser, katı, kolay ilişki kuramayan**, başkalarından gelen eleştirilere **aşırı duyarlık gösteren** bireylerdir. Çevrelerini **şaşırtacak derecede düşmanlık** gösterirler." |
| **1469 Kodu** | "**Kızgın, tepkisel** insanlardır. Aşırı biçimde **karşılarındaki kişiyi suçlarlar. Hostil, huzursuz, alıcı, şüpheci, narsisistik, benmerkezci** kişilerdir. **Duygusal labilite, anksiyete, gerginlik, manipülatif, impulsif** özellikler, **eyleme vuruk davranışlar** görülmektedir. **İş başarısızlığı** ve **aile içi ilişki güçlükleri** belirgindir." |
| **15/51 Kodu** | (kodda mevcut) **Ek:** "15/51 kodunu yorumlarken **5 alt testini bırakarak yükselen üçüncü alt teste bakmak gereklidir.**" |

## SOURCE-CODE-009 · Hs kod bloğu V (s.76-77, p46) — **Visual: CONFIRMED**

| Kod | Özet (kaynak) |
|---|---|
| **16/61 Kodu** | (kodda mevcut) **Ek:** "**16/61 profilleri her iki cins için de oldukça nadirdir.** Eğer bu tip bir profil elde edilmişse **erkeklerde 2 ve 4'ün, kadınlarda ise 3 ve 8'in** olduğu **üçlü bir yükselme** vardır." |
| **17/71 Kodu** | (kodda mevcut) **Ek:** "**Her iki cins için de 172/712 ve 173/713 kodları sık görülür.**" |
| **18/81 Kodu** | "Hastalarda **düşmanlık ve saldırganlık duyguları** vardır, ancak bu duygularını **uygun bir biçimde ifade edemezler.** Beden işlevleri ve bedensel hastalıklara ilişkin **delüzyonel düşüncelerini açıkça gösterirler.** […] **Somatik hezeyanları** olabilir. […] Bu kişilerde **karşı cinsin üyelerine ilişkin hostilite** vardır. […] **Özellikle stres altında** kişilerde **şaşkınlık ve düşüncede konfüzyon** olabilir. **Somatik uğraşları gerçek ile bağlantılarını koparabilir.** **Genel olarak üçlü kodlar 182/812, 183/813 ve 187/817'dir.** Bu kod tipini veren **ergenlerin okul başarısı düşüktür**, utangaçlık oldukça fazladır. […] **Madde bağımlılığı ya da intihar girişimleri** olabilir. Bu örüntüyü gösteren **ergenlerin 2/3'ü boşanmış ailelerden gelmektedir.** **Olası Tanı: Eğer F alt testi de yükselmişse şizofreni. Pre-psikotik bozukluk tanısı da düşünülmelidir.**" |
| **19/91 Kodu** | "Hastalar **gergin ve kaygılı** olarak tanımlanır. Çok yoğun **duygusal karmaşa** yaşarlar. **Sindirim sorunları, baş ağrıları ve bitkinlik** gibi bedensel yakınmalar yaygındır ve bu kişiler **semptomlarına yönelik psikolojik açıklamayı kabul etmezler.** […] **Pasif-bağımlı** bireylerdir, **yetersizliklerini kompanse etmek** isterler. Bu kod tipi aynı zamanda **beyin hasarı olan** bireylerde görülmektedir […] Eğer bu profilde **2 ve 3 alt testlerinin değerleri 5 T puanından aşağıda ise 129 ve 139 koduna bakınız.** […] **Olası Tanı: Organik beyin bozukluğuna bağlı güçlükler / Pasif-bağımlı kişilik bozukluğu**" |

## SOURCE-CODE-010 · Hs kod bloğu VI (s.78, p47 L) — **Visual: CONFIRMED**

| Kod | Özet (kaynak) |
|---|---|
| **10/01 Kodu** | "Bu kod **oldukça nadirdir**, **sosyal açıdan rahatsız, içe çekilmiş, soğuk, pasif** kişilerde ortaya çıkar. Genel olarak bunlara genellikle **çok sayıda somatik yakınmalar** eşlik eder. **Üçüncü yükselen alt test 8 olduğu zaman** genellikle **şizoid çekilme ve sosyal yetersizliğin** olduğu söylenebilir. Sıklıkla **2 ve 3 yükselen testlerdir** ve eğer **T değeri 70'in üstünde ise destek sistemleri zayıflamıştır ve maskeli depresyon** vardır." |

**Hs kod bloğu burada bitiyor** (s.78 sonu). **s.79'da Bölüm "2. Depresyon (D)
Alt Testi" başlıyor** → SOURCE-CL-009 (aşağıda).

## SOURCE-CL-009 · D (2) alt testi girişi + yüksek puan listesi (s.79, p47 R) — **Visual: CONFIRMED**

Fact — aynen:
> "**2. Depresyon (D) Alt Testi** — Bu alt test, depresyon belirtilerinin
> derecesini ölçmek amacıyla geliştirilmiştir. Depresyonda olan kişilerin ana
> belirtileri, karamsarlık, gelecekten ümitsizlik; kendini değersiz, işe yaramaz
> görme, suçluluk duyguları, hareketlerde ve düşüncede yavaşlama ve çeşitli
> bedensel yakınmalardır. Sıklıkla ölüm ve intiharla ilgili düşüncelerin
> yoğunluğu da dikkati çeker. […] Depresyon alt testindeki maddeler ve puanlama
> yönü **Tablo 9'da** gösterilmiştir."
> "**D alt testinde yüksek puan alan bir birey (Graham 1987):**
> 1. Depresif, mutsuz, kederli ve sıkıntılıdır. 2. Gelecekten umutsuzdur.
> 3. Kendini aşağılamaktadır. 4. Suçluluk duyguları vardır. 5. Konuşmak istemez.
> 6. Ağlar. 7. Yavaş hareket eder. 8. Depresif tanısı konulabilir.
> 9. Somatik yakınmaları vardır. 10. Güçsüzlük, yorgunluk, enerji kaybından
> yakınır. 11. Ajite ve gergindir. 12. Kolay kızar. 13. Üzüntüye eğilimlidir.
> 14. Kendine güveni azalmıştır. 15. Okulda ya da işte başarısız olduğunu
> düşünür. 16. Kendini işe yaramaz ve iş görmez gibi görür. 17. İçe çekilmiş,
> utangaç, ürkek, yalnız kalmaya eğilimli ve ketumdur. 18. Soğuktur.
> 19. Kişilerarası ilişkilerden kaçınır, insanlarla fazla konuşmaz.
> 20. Temkinli ve geleneksekdir. 21. Karar vermede güçlük çeker."

Kod karşılaştırması: `D_T_BANDS` ve D yorumu → **sonraki batch'te** (s.80-94).
Şimdilik: **D alt testi 21 maddelik liste `MISSING`** adayı.

## SOURCE-CL-010 · Tablo 9 — Depresyon (D) alt testi anahtarı (s.80, p48 L) — **Visual: CONFIRMED**

Fact — aynen (**Madde Sayısı: 60**):
**Doğru (20):** `5, 13, 23, 32, 41, 43, 52, 67, 86, 104, 130, 138, 142, 158,
159, 182, 189, 193, 236, 259`
**Yanlış (40):** `2, 8, 9, 18, 30, 36, 39, 46, 51, 57, 58, 64, 80, 88, 89, 95,
98, 107, 122, 131, 145, 152, 153, 154, 155, 160, 178, 191, 207, 208, 233, 241,
242, 248, 263, 270, 271, 272, 285, 296`
Norm: "Erkeklerde ortalama: **20.63**, kadınlarda: **23.86** (Savaşır, 1981)"

**⚠️ OCR UYARISI (yeni kayıt — `OCR_ISSUES.md`):** Ham OCR, Yanlış listesinin ilk
maddesini **"6"** okudu; **görsel doğrulama "9" olduğunu gösterdi** (420 dpi
crop). "6" ile "9" karışması → madde numaralarında **her zaman** görsel teyit.

Kod karşılaştırması (`SCORING_KEYS.D`):
- Doğru: kaynak 20 ↔ kod 20 → **BİREBİR MATCH** ✅
- Yanlış: kaynak 40 ↔ kod 40 → **BİREBİR MATCH** ✅
- Toplam 60 = kitabın "Madde Sayısı: 60" ✅
- Norm: kod Erkek **20.63** ✅ · Kadın **23.86** ✅ → MATCH
Status: **VERIFIED** (P0 katmanı — anahtar ve norm)

## SOURCE-CL-011 · D alt testi düşük puan listesi (s.80-81) — **Visual: CONFIRMED**

Fact — aynen ("D alt testinde düşük puan alan bir birey"):
> "1. Gerginlik, anksiyete, suçluluk ve depresyondan arınmıştır. 2. Rahat ve
> huzurludur. 3. Kendine güvenlidir. 4. Duygusal açıdan dengeli ve tutarlıdır.
> 5. Pek çok durumda etkili davranır. 6. Neşeli ve iyimserdir.
> 7. Sözelleştirmede güçlüğü çok azdır. 8. Aktif, enerjik, uyanıktır.
> 9. Yarışmacıdır. 10. Sorumluluk alabilir. 11. Sosyal ortamlarda rahattır.
> 12. Liderlik rolünü üstlenir. 13. Zeki, espirili ve renklidir.
> 14. İlk bakışta olumlu bir izlenim yaratır. 15. İmpulsif değildir,
> kontrollüdür. 16. Ketlenmemiştir, kendini kolaylıkla ortaya koyabilir.
> 17. Diğer insanlarda kızgınlık ve düşmanlık uyandırır.
> 18. Otoriter rolünde olan kişilerle çatışması vardır."

Kod: `D_T_BANDS` / `SINGLE_D` içinde bu liste **YOK** (yalnızca 28-44 bandı
özeti var) → `MISSING` (CONFLICT-026 sınıfı, içerik eksiği)

## SOURCE-CL-012 · D alt testi genel kural (s.81) — **Visual: CONFIRMED**

Fact — aynen:
> "Alt test 2'nin yorumlanması, birlikte yükselen diğer alt testlere göre
> değişmektedir. **Depresyon çok farklı nedenlerden kaynaklanabilir ve bunlar
> ancak diğer alt testlerdeki yükselmelere bakılarak yorumlanabilir.** **Alt test 2
> ile ilişkin açık davranışsal belirtiler yoksa, intihar riskine karşı dikkatli
> olmak gerekir.**"

Kod karşılaştırması: **sonraki batch** (yorum katmanı kuralı)

## SOURCE-CL-013 · D T-puan bantları (s.81-82) — **Visual: CONFIRMED**

Fact — aynen (kaynak sırası):
| Kaynak | İçerik (kısa) |
|---|---|
| **85 ve üstü T** | "Bir şeye odaklanamayacak ya da açık bir biçimde düşünemeyecek kadar kederli olan bireyleri gösterir." |
| **79 ve üstü T** | Depresif ve kaygılı, benlik saygısı düşük, karamsar, ilgi alanları daralmış, kendini işe yaramaz görür… "**Alt test 2'de yükselme, kişinin o sıradaki işlev düzeyiyle ilgili rahatsızlığı ya da hoşnutsuzluğu hakkında bilgi verebilir**… (Yüksek puanlar her zaman depresyon olarak tanımlanamaz, kişinin o anda çevresinden gelen rahatsızlıklarını da yansıtabilir)." |
| **70-79 T** | "Ciddi ve kendine güveni olmayan bireyleri gösterir… **Hastada depresyonun göstergeleri yoksa ve diğer alt testler yükselmemişse hastanın intihar eğilimi açısından değerlendirilmesi gerekmektedir.**" |
| **60-69 T** | "Bu bireylerde orta düzeyde depresyon, endişe ve karamsarlık göstergesi vardır. Bu duygu durum hali durumsal bir krize bağlı olabileceği gibi kalıcı ve geri dönüşü olmayan bir durum da olabilir." |
| **45-59 T** | "Bu, bireyin yaşamında **iyimserlik ve karamsarlık dengesini** kurduğunun göstergesidir." |
| **28-44 T** | "Olasılıkla neşeli, meraklı, iyimser, aktif ve dışa dönüktürler (Bakınız **Si alt testinin düşüklüğü**). Bu durum bazen bu bireylerin **kayıtsız** gibi algılanmalarına neden olur, bu da diğerlerinde **hostilite** ortaya çıkarır." |

**Kritik gözlem (kaynak içi çakışma):** Kaynak **"79 ve üstü"** ile **"70-79"**
bantlarını **çakışacak biçimde** yazar (79 iki bantta da geçer). Kod bunu
**ilk-eşleşen-kazanır** sırasıyla (79-84 → 70-78) tek anlamlı hâle getirmiştir.

Kod karşılaştırması (bant sınırları):
| Kaynak | Kod | Sonuç |
|---|---|---|
| 85 ve üstü | `85+` | ✅ |
| 79 ve üstü | `79-84` (önce) + `70-78` | ✅ (çakışma tek anlamlı çözülmüş) |
| 70-79 | `70-78` | ✅ (sınır yorumu) |
| 60-69 | `60-69` | ✅ MATCH |
| 45-59 | `45-59` | ✅ MATCH |
| 28-44 | `28-44` (min 0) | ✅ MATCH (etiket) |

**Not:** `clinicalBands('D', gender)` **cinsiyete göre ayrım YAPMIYOR**; ancak
D için kadın normu da (23.86) farklı. Kaynak T-bandı tablolarında cinsiyet
ayrımı bu bölümde görünmüyor (bantlar metin olarak veriliyor) → bu bir tutarsızlık
değil, kaynak da tek bant seti veriyor.
Status: **VERIFIED**

## SOURCE-CODE-011 · D kod bloğu (s.83-87) — **Visual: CONFIRMED** (s.84-87)

Kaynakta **sırayla** tanımlı kod tipleri:

| Kod | Özet / kritik koşul |
|---|---|
| **23 Kodu** | (kodda VAR) Uzun süreli depresyon; **histeroid savunmaların yetersiz kullanılışı**; hastalar **immatür, yetersiz ve bağımlı**; kronik sorunlarına alışkın; **bedensel yakınmalar sıklıkla histerik nitelikte ve değişkendir**. "**En sık üçlü kodlar 231/321, 234/324 ve 237/327'dir.**" Paradoks: 23 kodlu erkekler görünüşte çok fazla başarı yönelimlidir ancak **fark edilmediklerinden yakınırlar**. |
| **24/42 Kodu** | (kodda VAR) İmmatür, bağımlı, benmerkezci; **dürtülerini kontrol etmede zorluk**; sosyal kabul edilmeyen eylem sonrası **rahatsızlık ve pişmanlık**; **"hatta olayla orantılı olmayacak kadar fazla eyleme vuruk"** davranış; **döngüsel**; **içki içme, madde kötüye kullanımı, iş kaybı, öyküsü**; **yasal sorunlar**; "**Çoğunlukla 3, 7 ya da 8 üçüncü yükselen testtir.**" Ergenlerde **ototrite figürlerine karşı küskün, sık kavgaya karışan**; **yasal ihlaller (tutuklanma, mahkumiyet, göz hapsinde olma)**; **evden ya da tedavi merkezlerinden kaçma**; evlilik dışı çocuk sahibi kadınlarda sık; **"Görünüşte belirli bir şeye odaklanmada güçlükleri vardır ve okuldan kaçarlar."** Olası tanı: **Depresif reaksiyon ya da somatoform bozukluk** |
| **243/432 Kodları** | **24/42'ye ek olarak:** kızgınlığı **bastırma ve inkâr** yoluyla duygusal kontrol etmeye çalışırlar. Kızgınlıklarını **pasif-agresif** biçimde ya da (eğer açıksa) **öfke patlamaları** biçiminde ifade ederler. **İmmatürite, bencillik ve başkalarının onları nasıl gördüğüne ilişkin içgörü eksikliği**. **Eyleme vuruk davranışları olan uçlardaki** bireylerle ilişki kurarlar; **antisosyal eğilimleri başkası aracılığıyla tatmin ederler.** |
| **247/427/472 ve 742 Kodları** | (Ayrıca **274** koduna bakınız) **Öfkesinden kaynaklanan aile ve evlilik sorunları**; bunu ifade edemez ve **suçluluk** duyar. **Gergin, endişeli ve sosyal açıdan yetersiz**; **depresyonu** vardır. **Alkol kullanımı ya da epizodik alkol alımı** (depresyonlarını ortadan kaldırma çabası). **İş başarısızlık nedeniyle herhangi bir şeyi denemekten korkuyor** gibi. **Sorunlarının açıkça görülmesine karşın bunları tartışmada samimi ve açık değildirler.** Çok küçük problemlere **aşırı tepki** ve **sanki olağanüstümüş gibi** davranırlar. Erkekler: **bağımlı ve immatür yapıda olmalarına karşın (özellikle test 5 de yüksek ise) sözel olarak saldırgan**; **evlilik sorunları**, **kıskanç**, **kısa süreli evlilikler**; **annelerine daha yakındırlar**. Kadınlar (özellikle **Mf düşükse**) **güçsüz, aşağılanmış, suçlu ve çekingen** görünürler; **başkalarının kendilerini korumasını ve baskı altına almasını ister**; **ifade edilmeyen öfkenin bedelinin ödenmesi**; **öyküsünde çok çalışkan ve başarılı bir baba** vardır. **Olası tanı: Pasif-agresif kişilik bozukluğu / Depresif semptomlar / Anksiyete bozukluğu.** |
| **248 Kodu** | "Depresyon, küskünlük, aile ve evlilik sorunları çok olsa da, bu tür bireyler **24/42 kod tipindekinden daha az açık kızgınlık biçiminde eyleme vurma davranışı** gösterirler. Bunun yerine, kızgınlık için **fanteziler kurarlar**, **başkalarına karşı kendilerini güvensiz, uzak ve bağları kopmuş gibi** hissederler. Ancak **dürtüleri üzerindeki kontrolü kaybetmekten korkarlar** ve **doğal olmayan, rahatsız edici düşünceler** üzerinde çok fazla dururlar. Sıklıkla **başkaları tarafından huzursuz ve nasıl davranacakları belli olmayan kişiler** olarak görülürler. **Çeşitli cinsel sorunlar, intihar düşünceleri ve çok sayıda intihar girişimleri vardır.**" |
| **248 Kodu / Yüksek F Kodu** | "**Temel şizofrenik konfigürasyon**" |
| **25/52 Kodu** | (kodda VAR) Bu koddaki **erkekler içe dönük, pasif, kararsız, depresif**, ancak **idealist** bireylerdir. **Kaygılı ve geri çekilmiş**, **somatik yakınma öyküsü** verirler ve **açık bir biçimde düşünememekten yakınabilirler**. **Nadiren flört ederler** ve **genellikle heteroseksüel uyumları görece olarak kötüdür**. "**Sıklıkla bu kodda erkeklerde, 7, 3, 4 ya da 0 alt testleri de birlikte yükselir.**" **25/52 koddaki kadınlar, depresiftirler ve kendilerine yönelmişlerdir**, ancak **başkalarına dayanmak yerine kendi kendilerine yetmeye çalışırlar**. **Bu kodda ergenler**, genellikle **kardeşleri ya da arkadaşları ile ilişkilerinin kötü olması, utangaçlık, aşırı negativizm** ya da **aşırı duyarlılık** nedeniyle başvururlar. Kişiler arası ilişkilerde **utangaç, pasif ve çekingen** olan bu ergenler, **sıklıkla mükemmeliyetçilik ve titizlikle birlikte aşırı entellektüalizasyon** gösterirler. |

## SOURCE-CODE-012 · D kod bloğu II (s.86-87) — **Visual: CONFIRMED**

| Kod | Özet / **kritik sayısal koşul** |
|---|---|
| **26/62 Kodu** | (kodda VAR) **Alıngan, depresif ve eleştiriye aşırı duyarlı**; altta **güçlü bir kızgınlık duygusu** ve **sıklıkla süreğen kişiler arası ilişki güçlükleri**; **genellikle paranoid eğilim**; **nötr durumları kötü niyetli olarak değerlendirir**; **küskünlük, ajitasyon, yorgunluk ve saldırganlık**; "**Sıklıkla bu bireyler, başkaları onları reddetmeden önce onları reddetme düşüncesi ile ya da bağımlı olmaktan kaçınma aracı olarak kavgaya hazırdırlar.**" **⚠️ KRİTİK KOŞUL:** "**Pa alt testi belirgin bir biçimde yükseldiğinde ve/veya 4 ve 8 alt testi 70 T puanının üzerinde ise, bireyin psikozun erken dönemlerinde olma olasılığı artar.**" **Olası tanı: Psikozun erken dönemi** |
| **27/72 Kodu** (Ayrıca **273/723**, **247/274**; erkekler için **275/725**; kadınlar için **27/72** ve **278/728**) | (kodda VAR) **Psikiyatri polikliniklerine başvuranlar arasında çok görülür.** Gerginlik, depresyon, sinirlilik, kaygı, **suçluluk, kendini değersizleştirme**, aşırı biçimde **kendini sorgulama ve ruminasyonlar**; **yetersizlik duyguları**, **kendine güvenin olmaması**, **iş etkinliğinin azalması**, **uykusuzluk**. **Düşüncelerindeki katılık, doğru ve yanlış konular üzerinde çok fazla durmayı yaratır**; **aşırı kontrollüdürler**; **duygularını açık olarak ifade etmekte zorluk**; **cinsel alanda çatışma**. **Kişiler arası ilişkilerde sıklıkla bağımlılık ve pasiflik** gösterirler. "**En sık görülen üçlü kodlar 270/720, 278/728, 273/723 ve 271/721'dir.**" **⚠️ KRİTİK KOŞUL:** "27 kod tipinde **bazı yükselmeler, bireyin psikoterapi için iyi aday olmasının göstergesidir; çünkü bu genellikle içrel rahatsızlık ve kendini sorgulama eğilimini değiştirmek için güdülenmiş olmanın işaretidir**. Ancak **çok fazla yükselmeler (örneğin, 85 T puanının üstünde) sıklıkla bireyin sözel psikoterapide yeterli derecede odaklanamayacak kadar ajite ve endişeli olduğu anlamına gelir** ve **daha etkili müdahale formları (ilaç gibi) gerekli olabilir.**" |

**Bu batch'in en önemli bulgusu:** Kaynak, yorumu **ikinci ölçek dışındaki ölçeklerin
T değerlerine** bağlıyor: `Pa` ve `4 ve 8` için **70 T** eşiği, `27` için **85 T**
eşiği. Kodun `text` alanı bunları taşımıyor → **CONFLICT-025 genişletmesi**.

## SOURCE-CODE-013 · D kod bloğu III (s.90-91, p53) — **Visual: CONFIRMED**

| Kod | Özet / **kritik koşul** |
|---|---|
| **270 Kodu** | (27/72 ailesi) **Gergin, depresif, sinirli, kendini aşağılayan, suçluluk duyguları**; **yetersizlik ve güvensizlik duyguları**; **aşırı kontrollü olmaya çalışır, duygularını açığa vurmada zorluk**; kişiler arası ilişkilerde **bağımlılık**; **içe dönük tutumları kronik düzeydedir**. **Şizoid kişilik bozukluğu tanısı konulabilir.** |
| **28/82 Kodu** (Uygunsa **281/821**, **284/824** ve **287/827**'ye bakınız) | **Anksiyete ve ajitasyonla birlikte şiddetli depresyon**; **katastrofik şekilde depresyon ve ajitasyon**; **konsantrasyonda azalma, unutkanlık ve konfüzyon** hali ortaya çıkarabilir; **obsesif ruminasyonlar**; **düşünce bozukluğu, yorgunluk**; **kişiler arası ilişkilerden ve aktivitelerden kendilerini izole edip çekilme eğilimleri**; **intihar girişimleri olabilir**. "Dikkat edilmesi gerekir. Bu nedenle **prognoz açısından hastanın değişmesi ihtimali zayıftır.**" **Özellikle yansıra "şizofrenik" özellikler de gösterebilirler.** "**İşitsel ve görsel hallüsinasyonlar ve sistemli hezeyanlar olabilir. Düşünce bozukluğu değerlendirilmelidir.**" **Garip karakterde somatik semptomlar**; **deprese, izole ve çekiniktirler**; **kronik uyum örüntüsü genellikle hastaneye yatmayla son bulur**; "**Bu hastalara en sık konulan tanı manik depresif psikoz, melankoli ve şizoaffektif bozukluktur.**" Özellikle **ergenler**: **başkaları ile duygusal bağlar kurmaktan korkarlar**, **duygusal bağımlılıkları ve cinsellik konusunda çatışmaları vardır**; **çocukluk döneminde tekrarlanan incinme öyküsü**; **karşı cinsle ilişkileri genellikle çok azdır**; **üstelik sorunlar ya da sapkın davranışları içerir**; **okuldan kaçarlar ve madde kötüye kullanım öyküleri vardır**. "**Bu bireylerle terapötik ilişki kurmak zordur, psikoterapi prognozu kötüdür. Psikofarmakoloji en azından başlangıçta yararlı olabilir.**" |
| **281/821 Kodları** | **28/82'ye ek olarak:** "**çok çeşitli somatik yakınmaları vardır. Genellikle bunlar belirsiz ya da medikal yönden atipikir ve titremeler, düşünme güçlükleri ya da hatta somatik delüzyonlar içerebilir. Bu örüntü psikotik bir epizoddan önce gelen kendi üzerinde yoğunlaşmayı temsil ediyor olabilir ve genellikle açık bir gerginlik ve entellektüel konfüzyon ile bağlantılıdır. Diğer bireylerde, özellikle test 3 de yükselmiş ise, bu somatik yakınmalar ve bunlarla bağlantılı davranışlar, terapisti kurtarma davranışlarında bulunmaya teşvik edebilir, ancak birey bu yardımı reddeder.**" |
| **284/824 Kodları** | **Yetişkinlerde** sıklıkla **şizoid ya da şizofrenik durumlarla** bağlantılı ve **F alt testi de yükselmiştir**. 28/82'nin özelliklerine ek olarak **kızgınlık, isyankârlık, başkalarından uzak ve soğuk olma duyguları güçlü**; **dürtü kontrolünü kaybetme korkuları çaktır** "**(özellikle Pd alt testi 80'in üzerinde ise)**" ve **eyleme vuruk davranışlar, garip ve tuhaf şekillerde olur**. **Sosyal alanda ve evlilikte uyumsuzluk** olmasıdır "**(test 4, test 2 ya da 8'in 5 T puanı alanı içinde ise 482/842 kodlarının yorumuna bakınız)**." **Ergenlerde** bu kod **yetmiyor**; **daha çok birçok ergende bulunan isyankârlığı ve sosyal gruptan uzaklaşmayı yansıtır**; **dürtü kontrolünde zayıflık vardır** ve bunun yanı sıra **doğal olmayan davranışlar ve duygularda kuşkulu görülür**, ancak **altta yatan patoloji daha az şiddetlidir**. |
| **287/827 Kodları** | **Depresyon, kaygı ve tanjansıyel düşünce süreçleri**; **kendilerini insanlardan uzak hissederler, eleştiriye çok fazla duyarlıdırlar ve genelde insanlara güvenmezler**. **Çoğu zaman belirli bir şeye odaklanamama, baş dönmesi epizodları, mental konfüzyon, uykusuzluk, görev ve sorumlulukları yerine getirme yeteneğinin azalması** gibi önemli mental güçlükler. "**Ayrıca, değişken ya da uygunsuz duygular, hatta hallüsinasyonlar ya da açık düşünce bozuklukları vardır.**" **Bağımlılık korkularına bağlı olarak yakın kişilerarası ilişkilerden kaçınırlar ve duygusal bağlanmadan korkarlar.** **Cinsellik ve kendini ifade etme konularında çatışmaları vardır.** **İntihar düşünceleri ve tehditler çok olasıdır** ve "**eğer K alt testi 50 T puanının altında ise ve Ma alt testi 70 T puanının üzerinde ise bunlar dikkate değerlendirilmelidir. İntihar çoğunlukla garip biçimlerde gerçekleştirilir.**" |
| **29/92 Kodu** | "Bu gruptaki kişiler **benmerkezci ve narsisistik olma eğilimindedirler. Kendi değerlerini abartırlar.**" |

## SOURCE-CL-014 · Tablo 10 — Histeri (Hy) alt testi anahtarı (s.94, p55 L) — **Visual: CONFIRMED**

Fact — aynen (**Madde Sayısı: 60**):
**Doğru (13):** `10, 23, 32, 43, 44, 47, 76, 114, 179, 186, 189, 238, 253`
**Yanlış (47):** `2, 3, 6, 7, 8, 9, 12, 26, 30, 51, 55, 71, 89, 93, 103, 107,
109, 124, 128, 129, 136, 137, 141, 147, 153, 160, 162, 163, 170, 172, 174, 175,
180, 188, 190, 192, 201, 213, 230, 234, 243, 265, 267, 274, 279, 289, 292`
Norm: "Erkeklerde ortalama: **19.31**, kadınlarda ortalama: **22.33**
(Savaşır, 1981)"

**⚠️ OCR UYARISI #2 (bu batch) — `OCR_ISSUES.md` TABLE-ROW-SHIFT:**
Ham OCR, `55`, `51` ve `30` maddelerini **Doğru** listesine kaydırdı (satır
kayması). 400 dpi görsel okuma bunların **Yanlış** listesinde olduğunu gösterdi.
OCR bu haliyle karşılaştırılsaydı **3 maddede sahte P0 fark** raporlanacaktı.

Kod karşılaştırması (`SCORING_KEYS.Hy`):
- Doğru: kaynak 13 ↔ kod 13 → **BİREBİR MATCH** ✅
- Yanlış: kaynak 47 ↔ kod 47 → **BİREBİR MATCH** ✅
- Toplam 60 = kitabın "Madde Sayısı: 60" ✅
- Norm **Erkek 19.31** ✅ MATCH
- Norm **Kadın: kaynak metni 22.33 ↔ kod 18.12** → **KAYNAK İÇİ ÇELİŞKİ** →
  CONFLICT-028 (REJECTED, aşağıda)
Status: anahtar **VERIFIED** · norm **REJECTED (kod doğru)**

## SOURCE-CL-015 · Hy alt testi girişi (s.93, p54 R)

Fact — aynen:
> "**3. Histeri (Hy) Alt Testi** — Histeri, **fizik bir neden olmadan bir organın
> işlevinin kaybedilmesidir.** Bu alt test **nevrotik bozukluklardan konversiyon
> histerisine tanı koymada yardımcı olmak amacıyla geliştirilmiştir.** Genel bir
> çocuksuluk, çabuk sinirlenme, neşe…"

Kod karşılaştırması: `HY_T_BANDS` ve Hy yorumu → sonraki batch (s.95+)

## SOURCE-CODE-014 · D kod bloğu IV (s.88, p52 L) — **Visual: CONFIRMED**

| Kod | Özet / **kritik sayısal koşul** |
|---|---|
| **273/723 Kodları** | **Pasif hastalar**; kişiler arası ilişkilerinde **bağımlı olduklarında kendilerini çok rahat hissederler**; **korunduklarında ve başkalarının bakımı altına alındıklarında bu duruma çok kolay uyum sağlarlar**; kendileri için **çok yüksek standartlar belirleyerek stres yaşarlar**; stres arttığında **başkalarından yardım isterler**, **depresyon ve endişeleri içinde belirgin biçimde ve yapışırcasına bağımlı hale gelirler**; **görünen çaresizlik, uysallık ve kendini değersizleştirme düşünceleri başkalarını onları kurtarma ve korumaya yöneltir**; "**Hs alt testi de yükselmişse**, bu bireyler kaygıyla bağlantılı somatik yakınmaların yanı sıra, **kendine acıma, suçlama ve başkalarının onlara bakmasını istemelerine karşın sosyal geri çekilme gösterirler**." |
| **274/724 Kodları** | **⚠️ KOŞUL:** "(Eğer **test 4 ve 7 birbirlerinin 5 T puanı alanı içindeyse** 247 ve 427 kod yorumlarına da bakınız.)" **Yoğun yetersizlik ve suçluluk duyguları**; **kendilerini küçülterek zayıflık ve yetersizlikleriyle sürekli uğraşırlar**; **diğer kişilere olan aşırı bağımlılıklarını kabul etmezler**; "**Çoklu nevrotik belirtilerin gerçek bir düşünce bozukluğunu maskelemesi ihtimali dikkatle incelenmelidir. İntihar düşünceleri, niyeti ve planı sıklıkla görülür. Bu açıdan değerlendirilmelidir.**" **Olası klinik tanı depresif reaksiyon**, ancak **kişilik yapıları oldukça kalıcıdır**; **temel anksiyetelerini ve davranış biçimlerini değiştirmek çok zordur**. **Erkekler** çoğunlukla **annelerine bağımlıdır**; bağımlı ilişki ararlar ama **eşlik eden kontrolü istemez ve ilişkiyi sonlandırırlar**; "**Alt test 3 yükseldiğinde kronik alkolizm olasılığı fazladır**" (alkol kaygıyı azaltmak ve depresyonla başa çıkmak için). **Kadınlar** sıklıkla **babaları tarafından ilgi ve övünme nesnesi olmuşlardır**; **kendilerini izole ederler, zayıf ve çekingen görünmeye çalışırlar** (**özellikle alt test 5 düşükse**); **evli erkeklerle uzun süreli ilişkileri olabilir**. |
| **275/725 Kodları** | (erkekler için önerilen kod) **Endişe, depresyon ve aşırı düzeyde aynı şeyler üzerinde durmaya ek olarak çekingenlik**; **kronik bir başarısızlık duygusu** ya da **kendilik değeri konusunda ambivalans**; **kendilerini yetersiz, zayıf, aşağılanmış, suçlu ve pasif olarak tanımlarlar** (**4 alt testi düşük olduğunda daha belirgindir**); **sürekli başkalarının onları küçümsediği ilişkiler arayarak depresyonları için bedel öderler** ve bu ilişkilerde **çok rahat ederler**; **karşı cinsle ilişkilerde güçlükler** vardır. |

## SOURCE-CODE-015 · D kod bloğu V — 278/728 (s.89, p52 R) — **Visual: CONFIRMED**

Fact — aynen (**kritik koşul 300 dpi görselle doğrulandı**):
> **278/728 Kodları** — **Gergin, kaygılı, depresif, aşırı biçimde aynı şeyler üstünde
> duran ve kendilerine ilişkin kuşkularla dolu** olan bu bireylerde **intihar
> düşüncesi ya da girişimi olasılığı yüksektir**. **Obsesif düşünme, korkular ve
> fobiler** çok görülür; **kendi başarısızlıkları üzerinde yoğunlaşırlar**; **çok
> titiz ve mükemmeliyetçidirler**; kendileri ve başkaları için **çok yüksek
> standartlar** koyarlar ve ulaşamadıklarında **çok fazla suçluluk** yaşarlar;
> **aşırı kendini sorgulama ve kendine baskı** → **belirli bir şeye odaklanma
> güçlükleri ve performansta düşme** → depresyon ve kaygı artar. **Karşı cinsle
> duygusal bağlantı kurmada özel zorluklar**; **ilişkilerin çok ufak ayrıntıları
> üzerinde odaklanma**; **kontrol, eleştiri, kabul edilme ve kızgınlığın ifadesi
> sorun alanlarıdır**.

**⚠️ KRİTİK KOŞUL (T eşikleri):**
> "Bu kodda, özellikle alt testlerden **K ve Hs, 50 T puanının altında** olduğunda
> **ve/veya Ma alt testi yükseldiğinde intihar olasılığı dikkatle
> değerlendirilmelidir.** Bu kodda **Ma alt testinin yükselmesi, depresyonun ajite
> yönünü gösterir.** Eğer **Si** alt testi yükselmişse bireyin depresyonu **daha çok
> kroniktir**… Alt testlerden **Pd düşük olduğunda pasiflik ve çekingenlik ön
> plandadır**, sıklıkla **cinsel ilgilerde azalma ve cinsel yetersizlik** eşlik eder."

**Kadınlar (5 alt testi düşmüşse):** **bedel ödemeleri gerektiğini hissederler**,
**başkalarının kızgınlığını arttırırlar**, **mazohistik biçimde kendilerine
kızarlar**; **baş ağrıları, sırt ağrıları ve cinsel güçlükleri içeren çok çeşitli
fiziksel yakınmalar**; **çoklu nevrotik semptomlar**; **depresyon, sinirlilik,
obsesyonlar**; **kararsızlık, şüphe ve kaygı**; **düşünce bozukluğunun
değerlendirilmesi önemlidir**; **sosyal açıdan yetersiz**; "**Aşırı obsesyonları
için psikofarmolojik tedavi gerekir. Psikoterapide daha çok problem çözücü ve
destekleyici terapi tercih edilmelidir.**"

## SOURCE-CODE-016 · D kod bloğu KAPANIŞI (s.92, p54 L) — **Visual: CONFIRMED**

| Kod | Özet |
|---|---|
| **29/92 (devamı)** | **Yüksek enerji düzeyi** ancak bu **"bir kontrol kaybını telafi etme girişimini"** temsil eder. **Üç tip birey bu kodu elde eder:** (1) **Ajite depresyon** — ağlama, feryat etme, depresif ruminasyonlar; **çocuklar gibi ilgi çekmek için çok fazla duygusal** olabilirler. (2) **Alttaki depresyonla manik savunmalar kullanarak başa çıkmaya çalışanlar** — büyüklük düşünceleri ve inkâr depresyonu maskelemede yeterli olabilir, **ancak çoğunlukla uzun süre etkili değildir**; sonrasında **çok fazla içki içme davranışı** ortaya çıkar. (3) **Organik beyin sendromu olanlar** — işlevsellik ve yeteneklerindeki azalmanın farkında ama **inkâr etmeye ve saklamaya çalışan** bireyler; **daha önce kolaylıkla yaptıkları şeyleri yapamamanın eksikliğine bağlı ajitasyon** gösterirler. "**Sıklıkla test 3 ya da 4, üçüncü en yüksek testtir.**" |
| **20/02 Kodu** | **Sinirlilik, zayıflık, yorgunluk, benlik değerinde düşme** belirgin özelliklerdir; kod **"sosyal olarak geri çekilmiş hafif, ancak kronik depresyonu"** gösterir; **depresyon sıklıkla kişiler arası ve sosyal becerilerin kötü olmasıyla bağlantılıdır** ve **aşağılık ve utangaçlık duyguları** ile birliktedir; **hem yetişkinler hem ergenler özellikle sosyal ilişkilerde sinirlidirler**, **engellenmiş hissederler**, **çok az arkadaşları vardır**; "**Çoğu (özellikle test 1 düşük ise) fiziksel olarak çekici olmadığını da düşünür.**" **Uykusuzluk, suçluluk duyguları ve endişe** sıklıkla vardır; "**Bu kod tipinde çoğunlukla test 7 ya da 4, üçüncü en yüksek testtir.**" **Olası tanı: Pasif-agresif kişilik** |
| **207 Kodu** | **Gergin, kaygılı, ürkek** kişilerdir; **kendilik değerinde düşme**; **şizoid içe çekilme**; **sosyal ortamlarda yetersizlik duygusu ve gerçek sosyal beceri eksikliği** ile **içe dönük tutum**; **insanlarla etkileşimlerinde güvensiz**; **karşı cinsle ilişkilerinde mutsuz**; **depresyonları ile yaşamayı öğrenmişlerdir**; "**Bu bireylerin saldırganlık ve öfke patlamaları göstermesi beklenmez.**" |

## SOURCE-CL-016 · Hy (3) T-puan bantları (s.95, p55 R) — **Visual: CONFIRMED**

Fact — aynen (**300 dpi görsel, 4 ayrı kadraj**):

| Bant | Kaynak metni (özet) | Kod (`HY_T_BANDS`) |
|---|---|---|
| **85 T ve üstü** | "Aşırı immatür, benmerkezci ve bağımlı kişilerdir. Bastırma savunma mekanizmasını kullanmaları şaşırtıcıdır. **Bu içgörü eksikliği olduğunun göstergesidir.** Semptomlar gerçek organik patolojiye uymamaktadır. Genellikle kroniktir ve ciddi rijidite vardır." | ✅ MATCH (cümle sırası farkı: kodda "içgörü" cümlesi sonda) |
| **76-85 T** | "70-75 T puanında bildirilen özelliklere ek olarak… uzun süredir devam eden gerginliğe bağlı konversif semptomlar… başağrısı, sırt ağrısı, göğüs ağrısı, güçsüzlük, baş dönmesi ve baygınlık… organize olmuş bedensel yakınmaları vardır." | ✅ MATCH |
| **70-75 T** | "bastırma ve inkârı çok fazla kullanan, çok fazla itaat eden (uyan), saf ve çocuksu biçimde benmerkezci… ikincil kazanç… teşhirci ve seksüel ya da saldırganlık düzeyinde dışa vuran davranışlar…" | ✅ MATCH |
| **60-69 T** | "**Burada iki farklı örüntü vardır:** 1. Eğer **Hs'nin yükselmesi Hy ile aynı düzeyde ise ve D alt testi, 1 ve 3 alt testlerinden 10 T puanı düşükse** histerik kişiye işaret etmektedir… 2. Eğer **Hy alt testi Hs alt testinden 10 T puanı yüksekse** histerik özellikler belirgindir…" | ✅ MATCH (+ **T-eşiği** → CONFLICT-027) |
| **45-59 T** | "Bu alana özgü bir tanımlama yoktur." | ✅ MATCH |
| **24-44 T** | "Kendilerini sürekli eleştirirler. Olumlu kişilerarası ilişkileri inkâr etme eğilimi vardır. **Si alt testinde yükselme**, bireyin diğer insanlardan kaçma eğiliminde olduğunu göstermektedir." | ✅ MATCH metin · ⚠️ etiket kodda "T 22-44" (kaynak 24) |

**"Sadece Hy alt testinin yükselmesi":** kaynak aynen → "Sadece **3'ün yüksek
olduğu** ve **diğer hiçbir alt testin 70 T puanının üstünde olmadığı** durumda"
↔ kod `SINGLE_HY.rule` = **birebir MATCH** ✅ · kaynak metni (kabul edilme/sevgi
gereksinimi, reddedilme endişesi, tartışmalarda iyimserlik vurgusu) kodda **MATCH** ✅

**6/6 bant + tek-yükselme kuralı VERIFIED.**

## SOURCE-CL-017 · Hy bloğu: diğer alt testlerle ilişki (s.96, p56 L)

**"Yüksek 3 / Yüksek K Kodu":** "Alt testler **3 ve K ikisi birden yüksek**
olduğunda ve **F ve Sc alt testleri düşük** olduğunda, sevilme, kabul edilme ve
kendisini yaşamı üzerinde kontrol sağlıyor gibi gösterme gereksinimi çok
abartılıdır… çok katı bir optimizm gösterirler… **kızgınlık, bozulma ya da
zedeleyici duyguların olduğu ya da bağımsız karar vermeleri ya da güç
kullanmaları gereken durumlardan kaçınırlar** (ya da çok rahatsız olurlar)."
→ **Kodda YOK** (CONFLICT-024)

## SOURCE-CODE-017 · Hy kod bloğu I (s.96-99) — **Visual: CONFIRMED**

| Kod | Kaynak başlığı | Kritik içerik / koşul |
|---|---|---|
| **31 Kodu** | s.96 | "(**Bakınız 13/31 Kodu**)" → **D bloğunun 13/31 metnine atıf** |
| **32 Kodu** | s.96-97 | "ⓘ Eğer **2 alt testi, 3 alt testinin 5 T puanı sınırları içinde ise** 23 koduna da bakınız." — "**23 kod tiplerinin aksine**, bu bireyler sağlıkları ve bir ölçüde de belirgin olmayan depresyonları ile fazlaca ilgilenirler. Yorgunluk, gastrik yakınmalar, baş ağrıları ve baş dönmesi geneldir… Erkekler… **test 1, 8 ve 9 sıklıkla üçüncü en yüksek testtir.** … **Kadınlar için çoğunlukla 1, 4 ve 8, üçüncü en yüksek testtir.**" — "Bazen bu profil **menapoz güçlükleri** ile bağlantılıdır." |
| **321 Kodu** | s.97 | "**32 kodlu bireylerin özelliklerine ek olarak**… çok çeşitli hipokondriyak yakınmalar… **kadınlar sıklıkla tekrarlayan jinekolojik yakınmalar getirir ve/veya histerektomi olurlar**… **Erkekler sıklıkla gastrik rahatsızlık ya da ülser gösterirler.**" + "**kronik nevrotik bir durumu** ortaya koyan bu hastalarda… **Tedavi motivasyonları düşüktür.**" |
| **34/43 Kodu** | s.97-98 | "Her iki kod tipi de **kızgın, immatür ve bencildir**. Evlilik uyumsuzluğu, rastgele cinsel ve yüzeysel ilişkiler, boşanma, alkolizm… **En belirgin özellikleri kronik ve şiddetli öfkedir.**" + "**3 ve 4'ün göreceli yükseklikleri** bu bireylerin kızgınlıklarını ve diğer impulslarını **ne ölçüde ketlediğinin (eğer 3 yüksekse)**, ya da **öfkelerinin daha fazla ifade edildiğinin (eğer 4 yüksekse)** bir göstergesidir." + **Olası tanı: Pasif agresif kişilik bozukluğu, agresif tip** |
| **Yüksek 3 / Düşük 4 Kodu** | s.98 | "**Alt test 3'ün önemli ölçüde yüksek** olduğu durumda, birey kızgınlık duygularını **dolaylı olarak** gösterir… **bağımlılık–bağımsızlık çatışması**… **bastırma, inkâr ve kızgınlığın aşırı kontrol edilmesinden** dolayı öfke patlamaları…" |
| **34 Kodu (4 dominant)** | s.98 | "**34 kodlarında, 4'ün 3'ten önemli ölçüde yüksek olduğu durumlarda**, kızgınlık baskındır, ancak **uzun süre baskı altında tutulmuştur** ve sonra **öfke patlamaları ile ifade edilir**, hatta bazen **ciddi saldırı ya da cinayetlerle sonlanır**… **3'te bastırma, 4'te saldırganlık fazladır, 3 yüksek, 4 oldukça yüksek ise pasif-agresif kişiliktir.**" |
| **345/435/534 Kodları** | s.99 (**görsel doğrulandı — başlıkta 3 varyant**) | "**immatur ve genellikle cinsel yönden yetersizdirler**… teşhircilik görülebilir, **homoseksüel olma korkuları** vardır. **⚠️ KOŞUL: Alt test 3, 4'ten yüksekse VE K alt testi 50 T puanının üstündeyse**, duyguların ve isteklerin eyleme dökülme olasılığı düşüktür." (**300 dpi görsel doğrulandı**) |
| **346/436 Kodları** | s.99 | "**Eğer 6 alt testi, 3 alt testinin 5 T puanı sınırları içinde ise, 36/63 kodlarına da bakınız.**" — dönemsel eyleme vuruk davranış öyküleri; eleştiriye aşırı duyarlılık; **kızgınlık aile üyelerine yöneliktir**; **psikolojik tedaviyi reddederler** |
| **35/53 Kodu** | s.99 | "Bu koddaki **erkekler pasif ve hatta geri çekilme eğilimindedirler**… ancak **çok güçlü ilgi gereksinimleri** vardır… **4 ya da 6 genellikle üçüncü yüksek testtir.**" |
| **36/63 Kodu** | s.99-100 | "Yüzeyde, bu bireyler **eleştiriye aşırı duyarlı, kuşkulu, gergin ve hatta şüpheci**…" |
| **54/45 notu** | s.99 | "**Yorumlama 5'teki yükselmeyi dikkate almamak gibi almakla daha iyi yapılabilir. Sonra, 5 alt testi yükselmesinin yorumu buna eklenebilir.**" |
