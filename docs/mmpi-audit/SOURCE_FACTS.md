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
