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
