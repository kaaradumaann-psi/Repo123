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
