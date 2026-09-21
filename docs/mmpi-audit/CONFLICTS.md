# Conflicts

Kaynak ↔ mevcut sistem farkları. Sınıflandırma:
`MATCH` · `CONFLICT` · `MISSING` · `EXTRA` · `UNVERIFIED` · `OCR-UNCERTAIN`

Durumlar: `OPEN` · `INVESTIGATING` · `CONFIRMED` · `FIXED` · `REJECTED` · `UNVERIFIED`

> **Kural:** Kodu değiştirmeden önce `SOURCE_FACT → CONFLICT → DECISION`
> zinciri tamamlanmış olmalıdır. Şu an **hiçbir kod değişikliği yapılmadı.**

---

## CONFLICT-001 — F alt testi kadın normu — **REJECTED (ÇÖZÜLDÜ)**

Area:
Türk normları / F geçerlik alt testi (T puanı dönüşümü)

Source:
PDF p25 L = **kitap s.34**, Tablo 4 dipnotu — `SOURCE-VALIDITY-F-002`

Source value:
`Erkeklerde ortalama: 8.30` · `kadınlarda ortalama: 10.11 (Savaşır, 1981)`
(görsel olarak doğrulandı, iki bağımsız okuma)

Current implementation:
`src/scoring/mmpiKeys.ts` → `TURKISH_NORMS.Kadın.F = { mean: 9.38, sd: 5.16 }`

Comparison:
**CONFLICT** — ortalama 10.11 ↔ 9.38 (fark 0.73; sd 5.16 varsayımıyla ≈ 1.4 T puanı)

Impact:
F ham puanı 10 olan bir kadın: kaynak ortalamasına göre T ≈ 50, koddaki
ortalamaya göre T ≈ 51.2. Band eşiklerine yakın puanlarda yorum değişebilir.

Problem:
Koddaki kadın normu kaynakta verilen Savaşır (1981) değeriyle uyuşmuyor.
Erkek normu (8.30) ise birebir uyuşuyor → hata büyük olasılıkla tek bir hücrede.

Status:
**OPEN** — PHASE 6'da (normlar) Bölüm 8 "Standardizasyon çalışması" (kitap
s.191-195) ve Ek 10 (kitap s.257-260) okunduktan sonra karara bağlanacak.
Karar `DECISIONS.md`'ye yazılmadan kod değişmeyecek.

### ÇÖZÜM (2026-09-21, Oturum 4)

**Kod DOĞRU; değişiklik gerekmez.**

Kanıt: Kitap, F kadın normunu **iki farklı yerde tutarsız** verir:
- Geçerlik bölümü, Tablo 4 dipnotu (s.34): `kadınlarda ortalama: 10.11`
- **Tablo 30** "Normal Türk, Erkek ve Kadınların… Ortalama ve Standart Sapmaları"
  (s.195, Bölüm 8 standardizasyon): `Kadın F X̄ = 9.38, SD = 5.16`

Kodun değeri (9.38 / 5.16) **Tablo 30 ile birebir aynıdır.** Tablo 30,
standardizasyon çalışmasının normatif veri tablosudur (N=1003 erkek / 663 kadın);
geçerlik bölümündeki dipnot ise ikincil bir aktarımdır. Norm kaynağı olarak
Tablo 30 esas alınır.

Doğrulama: `scripts/mmpi-audit/compare-norms.py` → 26/26 hücre MATCH.
Kanıt: `SOURCE-NORM-001`.

Status: **REJECTED** (önceki OPEN kaydı tarihsel olarak korunur; DECISION-015)

---

## CONFLICT-002 — K alt testi normları — **REJECTED (ÇÖZÜLDÜ)**

Area:
Türk normları / K geçerlik alt testi

Source:
PDF p27 L = **kitap s.38**, Tablo 5 dipnotu — `SOURCE-VALIDITY-K-002`

Source value:
`Erkeklerde ortalama: 13.90` · `kadınlarda ortalama: 13.54 (Savaşır 1981)`
(görsel olarak doğrulandı)

Current implementation:
`src/scoring/mmpiKeys.ts` → `TURKISH_NORMS.Erkek.K = { mean: 13.98, sd: 4.65 }`
`src/scoring/mmpiKeys.ts` → `TURKISH_NORMS.Kadın.K = { mean: 11.82, sd: 3.8 }`

Comparison:
**CONFLICT**
- Erkek: 13.90 ↔ **13.98** → büyük olasılıkla **yazım hatası** (`0` ↔ `8`),
  OCR hatası değil: iki bağımsız okuma 13.90 verdi.
- Kadın: 13.54 ↔ **11.82** → **maddi fark** (1.72 ortalama puanı ≈ 4.5 T puanı).

Impact (yüksek):
K hem doğrudan bir alt test olarak yorumlanır hem de **Hs, Pd, Pt, Sc, Ma
düzeltmesinde** kullanılır (`K_CORRECTION`). Kadın normundaki 1.72 puanlık fark
K–T puanını ve dolayısıyla K+ profillerini, F-K endeksini ve K ile düzeltilmiş
klinik T puanlarını etkiler.

Problem:
Kadın K normu kaynaktaki Savaşır (1981) değeriyle uyuşmuyor.

Status:
**OPEN** — PHASE 4 (K düzeltmesi) + PHASE 6 (normlar) sonrası karar.
Özellikle: Bölüm 8 standardizasyon metni (s.191-195) bağımsız teyit sağlayacak.

### ÇÖZÜM (2026-09-21, Oturum 4)

**Kod DOĞRU; değişiklik gerekmez.**

Kanıt: Kitap, K normlarını **iki farklı yerde tutarsız** verir:
- Geçerlik bölümü, Tablo 5 dipnotu (s.38): `13.90` (E) / `13.54` (K)
- **Tablo 30** (s.195, standardizasyon): `K X̄ = 13.98, SD = 4.65` (E) /
  `K X̄ = 11.82, SD = 3.80` (K)

Kodun değerleri **Tablo 30 ile birebir aynıdır.** Kullanıcı adına kritik olan
nokta: K hem bir alt test olarak yorumlanır hem de Hs/Pd/Pt/Sc/Ma
düzeltmesinde kullanılır; bu yüzden *normatif tablo* (Tablo 30) esas alınmalıdır.

Not: Erkek K değerindeki fark (13.90 ↔ 13.98) başlangıçta "yazım hatası" olarak
değerlendirilmişti; aslında **kod doğru**, geçerlik bölümünün dipnotu Tablo 30
ile uyuşmuyor.

Doğrulama: `scripts/mmpi-audit/compare-norms.py` → 26/26 hücre MATCH.
Kanıt: `SOURCE-NORM-001`.

Status: **REJECTED** (önceki OPEN kaydı tarihsel olarak korunur; DECISION-015)

---

## CONFLICT-003 — L T puanı üçüncü bandının alt sınırı (P1)

Area:
Geçerlik yorumu / L T bantları

Source:
PDF p24 R = **kitap s.33** — `SOURCE-VALIDITY-L-003`
Source bands: `≥69` · `64-68` · **`59-63`** · `36-55` · `≤35`

Current implementation:
`src/scoring/mmpiSource.ts` → `L_T_BANDS[2] = { min: 56, max: 63, rangeLabel: 'T 56-63' }`

Comparison:
**CONFLICT** (sınır) — bant etiketi ve alt sınır farklı (56 ↔ 59).
Kaynakta **T 56-58** aralığı hiçbir banda atanmamıştır (boşluk);
kod bu aralığı "Orta Yüksek" bandına katmaktadır.

Impact:
T 56-58 arası L puanları kodda "iyi görünme çabası" yorumu alır; kaynak bu
aralık için tanım vermez (bir üst bant 59'dan başlar).

Status:
**OPEN** — PHASE 3 kapanışında karara bağlanacak (bant boşluğu mu, kod
genişletmesi mi?). Kaynak metni kodun yorumuyla **içerik olarak** uyuşuyor.

---

## CONFLICT-004 — F ham puan bant sınırları (P1)

Area:
Geçerlik yorumu / F ham puan bantları

Source:
PDF p25 L – p25 R = **kitap s.34-35** (Graham 1987) — `SOURCE-VALIDITY-F-003`
Source bands: `0-2` · **`3-9`** · **`10-15`** · **`16-25`** · **`26+`**

Current implementation:
`src/scoring/mmpiSource.ts` → `F_RAW_BANDS`
= `0-2` · `3-7` · `8-15` · `16-22` · `23 ve üstü`
`src/scoring/mmpiSource.ts` → `VALIDITY_CUTOFFS = { fSuspect: 16, fInvalid: 23 }`

Comparison:
**CONFLICT** (üç sınır):
- 3-9 ↔ 3-7 (kaynakta 8 ve 9 "normal aralık" sayılır, kodda "Orta" bandında)
- 16-25 ↔ 16-22 ve 26+ ↔ 23+ (kaynak eşiği 25/26, kod eşiği 22/23)

Impact:
F ham puanı 8-9 olan profiller kodda daha ağır ("Orta") yorum alır;
ham puan 23-25 olan profiller kodda "profil geçersiz" sayılır, kaynak bu
aralığı Graham ölçütünde hâlâ "16-25" bandında tutar.

Not:
Kaynak ayrıca Hathaway & McKinley (1967) eşiklerini **20** ve **25** olarak
aktarır (`SOURCE-VALIDITY-F-004`) — yani kaynak içinde üçüncü bir eşik kümesi
vardır. Kod'un 16/23 eşiği bu kitaptaki hiçbir kümeyle birebir örtüşmez;
başka bir rehberden gelmiş olabilir (bkz. `UNVERIFIED_DATA.md`).

Status:
**OPEN** — PHASE 3 kapanışında karar.

---

## CONFLICT-005 — L ve K ham puan bantları kaynakta bulunamadı (P1)

Area:
Geçerlik yorumu

Source:
Kitap s.31-33 (L) ve s.38-41 (K) okundu.

Current implementation:
`L_RAW_BANDS` = `0-2` · `3-5` · `6-7` · `8-15`
`K_RAW_BANDS` = `0-4` · `5-9` · `10-15` · `16-20` · `21+`

Comparison:
**EXTRA / MISSING karşılıklı** — kaynakta L ve K için **ham puan bandı tablosu
yoktur**; kaynak bu iki alt testi T puanı bantlarıyla ve niteliksel betimlerle
(s.32-33, s.38-39 "yüksek/ortalama/düşük puan alan birey") yorumlar.

Impact:
Kod, kaynakta bulunmayan ham puan eşiklerini kullanıcıya "kaynak tabanlı"
olarak sunuyorsa yanıltıcıdır (kaynak izi iddiası doğrulanamaz).

Status:
**INVESTIGATING** — PHASE 3 sonunda: ya bu bantlar başka bir belgelenmiş
kaynağa bağlanacak, ya da "kaynakta doğrulanamadı" olarak işaretlenecek.

---

## CONFLICT-006 — F ve K T bantlarında sınır farkları (P2)

Area:
Geçerlik yorumu / T bantları

Source & current:
- F: kaynak `44-54` + `T<45` (s.37) ↔ kod `45-54` + `≤44`
- K: kaynak `61-72` (s.40) ↔ kod `61-71` + `≥72`; kaynak alt bant `27-45` ↔ kod `≤45`

Comparison:
**MATCH (eşdeğer bölümleme)** — bantlar aynı aralıkları kapsar; yalnızca
sınır yazımı farklıdır (T=44 F'de kodda "düşük", kaynakta "44-54" bandında).
Kod `≤45` bantı için alt sınır koymaz, kaynak 27'dir (27 altı sınırsız).

Status:
**CONFIRMED (kabul edildi)** — davranışsal fark üretmez; yalnızca etiket
netliği. Kayıt amaçlı tutulur, kod değişikliği önerilmez.

---

## CONFLICT-007 — Proje dokümanı `docs/kaynak-denetimi.md` depoda yok (P2)

Area:
Dokümantasyon bütünlüğü / kaynak izi iddiası

Evidence:
- `README.md:390` bu dosyaya tablo satırında atıf yapar.
- `SYSTEM.md:368` ve `SYSTEM.md:632` atıf yapar.
- `src/scoring/version.ts:15` yorumu atıf yapar.
- `src/components/SourcesPage.tsx:564` kullanıcıya gösterilen metinde dosya adını verir.

Current state:
`ls docs/` → yalnızca `MMPI Kitap (1) (1).pdf`. Dosya **mevcut değil**.

Problem:
Kaynakça sayfası, kullanıcıya "künye–bileşen eşleştirme tabloları depoda
`docs/kaynak-denetimi.md` dosyasındadır" diyor; dosya yoksa bilimsel kaynak izi
iddiası kanıtlanamaz.

Status:
**CONFIRMED** — bu denetim klasörü (`docs/mmpi-audit/`) doğru içeriği
üretiyor; PHASE 12/13 (UI/report) sonunda ya dosya oluşturulacak ya da
UI metni düzeltilecek. **Karar bekliyor → DECISIONS.md DECISION-005.**

---

# PHASE 2 — Ek 9 (kitap s.244-256) madde anahtarı denetimi

Karşılaştırma betiği: `scripts/mmpi-audit/compare-keys.py` (kaynak değerler
OCR + görsel doğrulama ile girildi). Sonuç: **41 MATCH / 5 DIFF / 0 MISSING**
(46 anahtarın tamamı karşılaştırıldı).

Aşağıdaki 5 farkın **hepsi görsel olarak doğrulanmıştır** ve hepsi **P0**'dır.

---

## CONFLICT-008 — F alt testi: 69 ↔ 169 basamak hatası (P0)

Area: F geçerlik alt testi madde anahtarı

Source: PDF p130 L = **kitap s.244**, Ek 9, "F alt testi: F (Madde sayısı: 64)"
Source value (Yanlış sütunu, 20 madde):
```
17, 20, 54, 65, 75, 83, 112, 113, 115, 164, 169, 177, 185, 196, 199, 220, 257, 258, 272, 276
```
Visual: **CONFIRMED** (tam sayfa görüntüsü, yüksek çözünürlük; "164, 169, 177" dizisi net okundu)

Current implementation:
`src/scoring/mmpiKeys.ts` → `SCORING_KEYS.F.falseItems`
son üçlü: `... 164, **177**, 185 ...` ve listede **69** var, **169** yok.

Comparison: **CONFLICT** — `69` (kod) ↔ `169` (kaynak)

Impact (yüksek):
- Madde 169 F'de sayılmaz, madde 69 yanlışlıkla F'ye sayılır → F ham puanı
  hatalı hesaplanır.
- F ham puanı geçerlilik eşiklerini (`fInvalid=23`, `fSuspect=16`) belirlediği
  için **profil geçerlilik kararı** yanlış çıkabilir.
- Madde 69 aynı zamanda `Mf` (erkek: Doğru) ve `Mf` (kadın: Yanlış) anahtarında
  da vardır → çift etki.

Problem: Tek karakterlik basamak hatası; kaynak tablo net.

Status: **FIXED** (CHANGE-001, 2026-09-21)

---

## CONFLICT-009 — S_Es (Barron Ego Gücü): 13 madde yanlış yönde (P0)

Area: Özel ölçek `Es` madde anahtarı

Source: PDF p135 R = **kitap s.255**, Ek 9, "Ego Gücü Testi (Es) (Madde sayısı: 68)"
Source value:
- Doğru (25): `2, 36, 51, 95, 109, 153, 174, 181, 187, 192, 208, 221, 231, 234, 253, 270, 355, 367, 380, 410, 421, 430, 458, 513, 515`
- Yanlış (43): `14, 22, 32, 33, 34, 43, 48, 58, 62, 82, 94, 100, 132, 140, 189, 209, 217, 236, 241, 244, 251, 261, 341, 344, 349, 359, 378, 384, 389, 420, 483, 488, 489, 494, 510, 525, 541, 544, 548, 554, 555, 559, 561`

Visual: **CONFIRMED** (tam sayfa s.255; her iki sütun dikişten bağımsız okundu)

Current implementation:
`src/scoring/mmpiDerived.ts` → `SPECIAL_KEYS.Es.dogru` (38 madde) içinde
`483, 488, 489, 494, 510, 525, 541, 544, 548, 554, 555, 559, 561` **Doğru** tarafında;
`yanlis` yalnızca 30 madde.

Comparison: **CONFLICT** — yön farkı, 13 madde
- Doğru 25 ↔ 38 · Yanlış 43 ↔ 30 (toplamlar eşit: 68 ✓)

Impact (yüksek):
Es puanı **sistematik olarak yukarı sapar**: bu 13 maddeye "doğru" diyen birey
kaynakta puan almamalıyken kodda +13 alır. Tersine "yanlış" diyen birey
kaynakta +13 almalıyken kodda 0 alır → Ego gücü yorumu tamamen ters
yönde hatalı olabilir.

Status: **FIXED** (CHANGE-002..005, 2026-09-21)

---

## CONFLICT-010 — W_FEM (Wiggins Kadınsı İlgiler): 2 madde yanlış yönde (P0)

Area: Wiggins içerik skalası `FEM`

Source: PDF p134 L = **kitap s.252**, "Kadınsı İlgiler Skalası FEM (Madde sayısı: 30)"
Source value:
- Doğru (18): `70, 74, 77, 78, 87, 92, **126**, 132, 140, 149, 203, 261, 295, **463**, 538, 554, 557, 562`
- Yanlış (12): `1, 81, 219, 221, 223, 283, 300, 423, 434, 537, 552, 563`

Visual: **CONFIRMED** (tam sayfa s.252; "126" ve "463" Doğru sütununda net)

Current implementation:
`src/scoring/mmpiDerived.ts` → `WIGGINS_KEYS.FEM`
`dogru` = 16 madde (126 ve 463 **yok**); `yanlis` = 14 madde (**126 ve 463 var**)

Comparison: **CONFLICT** — yön farkı, 2 madde

Impact (orta-yüksek):
W_FEM toplamı değişmez (30), ancak bu iki maddeye verilen yanıt ters
yorumlanır → `WIGGINS_NORMS.FEM` (M=14.77, SD=3.87) ile hesaplanan T puanı
2 maddeye kadar sapar.

Status: **FIXED** (CHANGE-002..005, 2026-09-21)

---

## CONFLICT-011 — P_AVD (Çekingen Kişilik Bozukluğu): 13 madde eksik (P0)

Area: Kişilik bozuklukları testi `AVD`

Source: PDF p132 R = **kitap s.249**, "Çekingen Kişilik Bozukluğu AVD (Madde sayısı: 38)"
Source value:
- Doğru (21): `52, 86, 138, 142, 171, 180, 201, 267, 278, 292, 304, 305, 317, 321, 344, 357, 368, 377, 418, 473, 509`
- Yanlış (17): `54, 57, 79, 91, 99, 122, 170, 309, 353, 371, 391, 449, 450, 479, 482, 521, 547`

Visual: **CONFIRMED** (tam sayfa s.249; AVD tablosu net)

Current implementation:
`PERSONALITY_KEYS.AVD` = Doğru **8** madde + Yanlış 17 madde = **25**

Comparison: **CONFLICT** — kodda 13 madde eksik:
`52, 142, 171, 180, 267, 278, 292, 304, 317, 357, 377, 418, 473`
(başlıktaki "Madde sayısı: 38" ile kodun 25'i zaten tutarsız)

Impact (yüksek):
AVD ham puanı 38 üzerinden değil 25 üzerinden hesaplanır →
`PERSONALITY_CUTOFFS.AVD = { marked: 9, mild: 7 }` eşikleri yanlış ölçekte
uygulanır; ölçek **sistematik olarak düşük** çıkar. Çekingen kişilik özellikleri
olduğu gibi kaçırılabilir.

Status: **FIXED** (CHANGE-002..005, 2026-09-21)

---

## CONFLICT-012 — P_HST (Histrionik Kişilik Bozukluğu): 7 madde eksik (P0)

Area: Kişilik bozuklukları testi `HST`

Source: PDF p132 R = **kitap s.249**, "Histrionik Kişilik Bozukluğu HST (Madde sayısı: 20)"
Source value:
- Doğru (13): `99, 126, 181, 353, 381, 391, 445, 449, 450, 451, 482, 521, 547`
- Yanlış (7): `111, 171, 180, 240, 286, 304, 312`

Visual: **CONFIRMED** (tam sayfa s.249; HST tablosu net)

Current implementation:
`PERSONALITY_KEYS.HST` = Doğru **8** madde + Yanlış 5 madde = **13**

Comparison: **CONFLICT** — kodda 7 madde eksik:
`171, 286, 353, 391, 449, 450, 547`
(başlıktaki "Madde sayısı: 20" ile kodun 13'ü tutarsız)

Impact (yüksek):
`PERSONALITY_CUTOFFS.HST = { marked: 10, mild: 7 }` eşiği 20 madde için
belirlenmiştir; 13 maddelik anahtarla bu eşiklere ulaşmak çok zor →
histrionik özellikler **sistematik olarak kaçırılır**.

Status: **FIXED** (CHANGE-002..005, 2026-09-21)

---

## PHASE 2 kapanış notu — doğrulama durumu

41 MATCH'in **33'ü yalnızca OCR** ile doğrulanmıştır (görsel doğrulama
bekliyor). Bunlar `SOURCE_FACTS.md` içinde `OCR-CONFIRMED` olarak işaretlenir;
`VERIFIED` sayılmaları için görsel doğrulama gerekir. Maddeler:
`Hs, D, Hy, Pd, Pa, Pt, Sc, Ma, Si, P_PAR, P_SZD, P_STY, P_ANT, P_CPS, P_PAG,
A_ICAS, W_SOC, W_DEP_W, W_MOR, W_REL, W_AUT, W_PSY, W_ORG, W_FAM, W_HOS,
W_PHO, W_HYP, W_HEA, S_A, S_R, S_Do, S_Dy`.

---

# PHASE 4 — Geçerlik Konfigürasyonları ve F-K Endeksi

## CONFLICT-013 — F-K = 0: sahte-iyilik etiketi ve geçerlilik sınırı çakışması (P2)

Area:
F-K endeksi yorumu / sahte-iyilik (faking good)

Source:
**kitap s.59** ("F-K Endeksi" bölümü) — `SOURCE-FK-002`
Source value:
> "F-K puanı **0-9 arasında ise profil geçerlidir**, 9'dan büyükse
> sahte-kötülük, **0 ise sahte-iyiliktir**."

Current implementation:
`src/scoring/mmpiConsistency.ts` → `fkIndexAnalysis`
`value === 0` → `level: 'Hafif Savunuculuk (Geçerli)'`, `isWarning: false`, `tone: 'ok'`
`-8 ≤ value < 0` → `'Hafif Negatif (Geçerli)'`, uyarı yok
`value < -8` → `'Sahte-İyilik (Faking Good) Eğilimi'`, `isWarning: true`

Comparison:
**CONFLICT** — kaynak F-K = 0'ı **sahte-iyilik** olarak tanımlar ve uyarı
gerektirir; kod 0'ı "geçerli, uyarı yok" sayar.
Ayrıca kaynak negatif bölge için **sayısal eşik vermez**; kodun `-8` eşiği
kaynakta doğrulanamadı.

Problem:
F-K = 0 olan profillerde sahte-iyilik sinyali kullanıcıya gösterilmez.

Impact (düşük-orta):
Yalnızca tam 0 değerinde uyarı kaybolur; negatif bölge uyarısı -9'da başlar
(kaynak -8 eşiğini desteklemiyor). Yorum katmanı etkisi sınırlı ama
"sahte-iyilik" hipotezi kaynağın açık kuralıdır.

Status: **REJECTED** (kod doğru kabul edildi) — ilgili karar: **DECISION-017**

**Resolution:** Kaynağın kesme kuralı cümlesi "0-9 arasında ise profil
geçerlidir" olduğu için 0 geçerli aralığın **içindedir**; "0 ise sahte-iyiliktir"
ifadesi ise tek bir noktaya ilişkin **etiketlemedir**. Kaynak içi tutarsızlıkta
DECISION-015 kuralı uygulanır → birincil kesme kuralı esastır, kod değişmez.
Kodun negatif bölgedeki `-8` eşiği kaynakta **yok** → `UNVERIFIED_DATA.md`'ye
kaydedildi (kaynak bulunana kadar değiştirilmez).

**Reason:** Kod hatası değil, kaynak üslup gerilimidir; 0 hem sınır hem etiket
olduğu için iki cümle birlikte doğru kabul edilebilir.

---

## CONFLICT-014 — Konfigürasyon 15: L değeri nokta mu bant mı? (P2)

> **DÜZELTME KAYDI** — Bu kaydın ilk sürümü hatalıydı; tarihsel olarak korunur.

**Previous finding (hatalı, ilk okuma):**
"Kaynak başlığı s.58'de `L > 60` der, Şekil 15'te 55 çizgisi vardır; kod 55-65
kullanır (üst sınır 65 kaynakta yok)" → P1 olarak kaydedilmişti.

**New source evidence (yüksek DPI görsel okuma, düzeltir):**
- **Metin (kitap s.57, Şekil 15 kutusu):** "Konfigürasyon 15: L alt testi
  **60 T puanında**, F alt testi 70 T puanının üstünde ve K alt testi 40 T
  puanının altındadır."
  → "puanının üstünde" DEĞİL, "**puanında**" yazıyor; yani **nokta değeri**.
- **Şekil 15 grafiği (görsel doğrulandı):** x ekseni L, F, K; y ekseni 30-90.
  Çizilen profil: **L noktası tam 60** seviyesinde (L/F sütun sınırında), F
  noktası 70 çizgisinin hemen üstünde (~72), K noktası 40'ın altında (~37).
  → Şekil metni **doğrular**; "şekilde 55 vardır" iddiası **yanlıştı**.

**Resolution:**
Kaynakta Konfigürasyon 15 için **L = 60 noktası** verilir (aralık değil).
Kod: `v.L >= 55 && v.L <= 65` → kaynak noktasının çevresine **±5 tolerans
bandı** koyar. Bant kaynakta **yoktur** ama kaynak değeri (60) bandın tam
merkezindedir → **CONFLICT değil, EXTRA (tolerans yorumu)**.

Karşılaştırma ölçütü: Kitap, aralık vermek istediğinde açıkça verir
(Konfigürasyon 14'te "K alt testi **59-64 T puanı arasındadır**", s.56 —
kodla birebir MATCH). Konfigürasyon 15'te L için aralık değil **nokta** vermesi
bilinçli bir üslup farkıdır.

**Reason:** Düz nokta eşitliği (`L === 60`) pratikte neredeyse hiçbir profili
yakalamaz; ±5 bandı kaynak değerini merkez alır ve kaynak değerini dışlamaz.
Ek olarak hiçbir profil bu örüntüden **dışlanmaz** (bant genişletici, daraltıcı
değil — L=70 olan bir profil zaten F>70 ve K<40 koşullarını taşıyorsa başka
örüntülere de girebilir).

**Status: REJECTED** (ilk hatalı bulgu geçersiz; kod değişikliği YOK)
İlgili karar: **DECISION-018**

**Ders:** Şekil içindeki eğri, ızgara çizgileri ve nokta konumları 200 DPI
OCR ile güvenilir okunamaz; bu tür bulgular **yüksek DPI kırpma ile görsel
doğrulanmadan** CONFLICT olarak kaydedilmemelidir. (Bu kayıt, o hatanın
örneğidir ve silinmez.)

---

## CONFLICT-015 — TR endeksi kesme puanı 1 puan kaymış (P1)

Area:
Yanıt tutarlılığı / TR endeksi geçerlilik değerlendirmesi

Source:
**kitap s.59** — `SOURCE-TR-002` — **Visual: CONFIRMED** (yüksek DPI kırpma)
Source value:
> "TR endeksi üzerinde **3 puan ya da daha fazla** bir puanın, geçersiz profil
> olasılığını arttırdığı ileri sürülmüştür (Dahlstrom 1972)."

Current implementation (önce):
`src/scoring/mmpiConsistency.ts` → `trIndex`
```ts
const consistent = score <= 3;   // 3 DAHİL tutarlı
```
+ dosya başı yorumu: "3 ve altı tutarlı kabul edilir (Gravitz & Gerton 1976…)"

Comparison:
**CONFLICT** — kaynak 3'te geçersizlik riskini başlatır (≥ 3); kod 3'ü tutarlı
sayar. **1 puan kayma.** Kodun kendi atfı (Dahlstrom 1972) kaynağın atfıyla
aynıdır → kayma, uygulama hatasıdır (yorum değil).

Problem:
TR = 3 olan profiller kaynakta "geçersizlik olasılığı arttı" bölgesindeyken
kodda **uyarısız/tutarlı** görünüyordu. Ayrıca kod metnindeki "normal bireyler
üç-dördüne değişik yanıt verir" ifadesi **kaynakta yok** (kaldırıldı).

Impact:
Geçerlilik değerlendirmesi ve rapordaki "Tutarlı/Tutarsız Yanıt Örüntüsü"
bandı; TR = 3 olan tüm profiller.

Resolution:
**FIXED** — CHANGE-007 (2026-09-21): `consistent = score <= 2`; doküman yorumu
ve yorum metinleri kaynak cümlesine göre yeniden yazıldı; kaynakta olmayan
"üç-dört" ifadesi kaldırıldı. Regresyon testi eklendi
(`tests/mmpiKeyIntegrity.test.ts` → PHASE 4, 3 puan uyarı / 2 puan tutarlı).
İlgili karar: **DECISION-019**

---

---

## CONFLICT-016 — Konfigürasyonlarda F/K aralık sınırları uygulanmıyor (P1)

Area:
Geçerlik konfigürasyonları (`VALIDITY_CONFIGS`) — örüntü eşleştirme

Source:
**kitap s.44, 46, 47** — `SOURCE-CONFIG-002`, `004`, `005`

Source value (üç ayrı örüntüde açık aralık/nitelik verilir):

| Konf. | Kaynak ifadesi | Kod kuralı | Fark |
|---|---|---|---|
| 2 (s.44) | L,K **en az 60**; F **50'ye yakın** | `v-shape`: L≥60 ∧ K≥60 ∧ **F ≤ 55** | F için **alt sınır yok** (F=0 da eşleşir) |
| 4 (s.46) | L=40; F **45-55**; K=60 | `ascending`: L<F<K ∧ L≤45 ∧ K≥55 | F aralığı **hiç uygulanmıyor**; sıralama yeterli |
| 5 (s.47) | L=60; F **≈50**; K **40-45** | `descending`: L>F>K ∧ L≥55 ∧ **K ≤ 45** | K için **alt sınır yok** (K=20 de eşleşir) |

Comparison:
**CONFLICT (kısmi)** — sıralama ilişkileri (L<F<K, L>F>K, V / tersine V) ve
nokta değerleri birebir uyuşur; ancak kaynağın **aralık olarak verdiği**
değerler kodda **tek yönlü** uygulanmıştır. Sonuç: kod, kaynağın kapsamadığı
profilleri bu örüntülere dahil edebilir.

Örnek (Konf. 4): L=40, F=62, K=65 → kaynakta F 45-55 dışında olduğu için
Konfigürasyon 4 **değildir**; kodda sıralama sağlandığı için **eşleşir**.

Impact:
Yorum katmanı — yanlış örüntü etiketi ve yanlış yorum metni. Puanlama/T puanı
etkilenmez (P1).

Status:
**OPEN** — bilinçli olarak **karar verilmedi**. Gerekçe: Bölüm 4'ün yalnızca ilk
5 konfigürasyonu okundu (s.43-47); kalan örüntüler (s.48-55) aynı desende
olabilir. **Tüm konfigürasyon seti okunmadan kural sıkılaştırılmamalıdır**
(CONFLICT-014'ün dersi: eksik veriyle acele kayıt/karar hata üretir).

Sonraki adım:
s.48-55 batch'i tamamlandıktan sonra tek bir DECISION ile:
(a) tüm konfigürasyonlara kaynak aralıklarını **iki yönlü** uygula, veya
(b) "±5 tolerans" kuralını tüm sette tutarlı kabul et ve aralık verilen
yerlerde aralığı **zorunlu** kıl.

---

## CONFLICT-017 — Konfigürasyon eşikleri kaynaktan sapmış (P1) → **FIXED**

Area: `VALIDITY_CONFIGS` — Konfigürasyon 4, 5, 7, 9

Source: `SOURCE-CONFIG-004`, `005`, `007`, `009` (kitap s.46, 47, 49, 51)

| # | Kaynak ifadesi | Eski kod | Sonuç |
|---|---|---|---|
| 4 | "F alt testi **45-55 T**" | `ascending`: F için **hiç sınır yok** | kaynak aralığı uygulanmıyor |
| 5 | "K alt testi **40-45 T puanı arasındadır**" | `descending`: `K ≤ 45` (alt sınır yok) | K=20 de eşleşiyordu |
| 7 | "L ve K alt testinin **35 T puanını aşmasını**" | `all-true`: `L ≤ 40 ∧ K ≤ 40` | 5 puan gevşek |
| 9 | "F alt testi **100 T puanına yakın ya da altında**" | `help-seeking`: `F ≤ 105` | üst sınır 5 puan yüksek |

Impact: Yorum katmanı — yanlış örüntü etiketi. Puanlama etkilenmez (P1).

Resolution: **FIXED** — CHANGE-008 (2026-09-21): kaynakta açıkça verilen dört
sayı/sınır koda uygulandı. İlgili karar: **DECISION-021**.

Regresyon testleri: `tests/mmpiKeyIntegrity.test.ts` → PHASE 4 batch 3 (6 test).

---

## CONFLICT-018 — Konfigürasyon 8: kaynak eşiği kendi verisiyle çelişiyor (P2) → **REJECTED**

Area: `all-false` konfigürasyonu (tümüne "yanlış")

Source (**Visual: CONFIRMED**, s.50): "Şekil 8'de gösterildiği gibi **L, F ve K
testlerinin tümü 80 T puanının üzerindedir**."

Current implementation: `v.L >= 75 && v.F >= 75 && v.K >= 75`

**Ampirik test (bu oturumda koşuldu):**
Kitabın kendi madde anahtarı + Tablo 30 normlarıyla, **tam "tümüne yanlış"**
yanıtlayan bir kişi:
```
L: ham 15 → T 81.2   |   F: ham 20 → T 75.3   |   K: ham 29 → T 82.3
```
→ Kaynağın istediği **F > 80** koşulu, gerçek bir "tümüne yanlış"
yanıtlayıcıda **sağlanamaz**. Kaynak, kendi kuralını kendi verisiyle çürütür.

Comparison: **kaynak içi tutarsızlık** — DECISION-015'in sınıfı.

Resolution: **REJECTED (kod doğru).** Kodun 75 eşiği, örüntünün gerçekten
yakalanabilmesini sağlar; kaynaktaki 80 eşiği pratikte ölü kuraldır ve
uygulanırsa "tümüne yanlış" hiç tespit edilemez. İlgili karar: **DECISION-020**.

Not: Kodun `rule` metni "L, F ve K tümü T 75 üzerinde" olarak bırakıldı ve
kaynaktan sapma kod içinde gerekçesiyle belgelendi (yorum bloğu).

---

## CONFLICT-019 — Konfigürasyon 7 (tümüne "doğru") pratikte tetiklenemez (P1)

Area: `all-true` konfigürasyonu

Source (**Visual: CONFIRMED**, s.49): "L ve K alt testinin 35 T puanını
aşmasını, **F alt testinin 120'nin üzerinde yer almasını gerektirir.**"

Current implementation:
- `mmpiScoring.ts`: T puanları `Math.max(20, Math.min(120, t))` ile **[20, 120]**
  aralığına kırpılır.
- `all-true` kuralı: `v.F > 120` → **hiçbir zaman doğru olamaz**.

Ampirik kanıt (bu oturumda koşuldu): **tüm maddelere "Doğru"** yanıtı veren
profil `F = 120 T` (tam üst sınır) üretir → konfigürasyon **YOK** döner.
Aynı profilde L = 26.5 ve K = 22.1 (kaynağın ≤ 35 koşulunu sağlar).

Impact: "Tümüne doğru" örüntüsü **hiçbir zaman raporlanmaz**; bu, kaynağın
açıkça tanımladığı bir geçerlik durumudur (P1 — geçerlilik değerlendirmesi).

Status: **OPEN** — düzeltme bir eşik kopyası değil, **tasarım kararı** gerektirir:
(a) T kırpmasını yükselt (tüm profil görünümünü etkiler), **veya**
(b) bu örüntüyü T puanından değil **ham cevap örüntüsünden** tespit et
(ör. "tüm maddeler Doğru" + klinik ölçekler > 90), **veya**
(c) eşiği kaynak dışı bir değere çek ve `UNVERIFIED` olarak belgele.
Karar verilmeden **kod değiştirilmedi**.

---

## CONFLICT-020 — Konfigürasyonlarda kaynakta olmayan ek sınırlar (P2, OPEN)

Aşağıdaki sınırlar kaynakta **yok**, kod ekliyor:

| # | Kod sınırı | Kaynakta karşılığı |
|---|---|---|
| 2 (`v-shape`) | `F ≤ 55` (alt sınır yok) | "F **50'ye yakın**" (niteliksel) |
| 5 (`descending`) | `F` için sınır yok | "F **yaklaşık 50**" (niteliksel) |
| 9 (`help-seeking`) | `F ≥ 70` | kaynak yalnızca üst sınır verir ("100'e yakın ya da altında") |
| 12 (`credible`) | `K ≤ 65` | kaynak: yalnızca "K **50'nin üstünde**" |

Impact: Aşırı/eksik eşleşme — ör. `credible` K = 70 olan bir profili
reddederken kaynak kabul eder.

Status: **OPEN** — CONFLICT-016 ile aynı sınıfın devamı; karar
**DECISION-021** ile birlikte verilmedi çünkü alt sınır eklemek/çıkarmak
konfigürasyon sırası (ilk eşleşen kazanır) nedeniyle başka örüntülerin
erişilebilirliğini değiştirir. Ayrı bir karar gerektirir.

---

## CONFLICT-016 — Konf. 2: `v-shape` F üst sınırı (P1) → **REJECTED (kod doğru)**

Area: `v-shape` (Konfigürasyon 2)

Source (s.44): "L ve K en az 60 T düzeyinde … F alt testi 50 T puanına yakın"
→ F için **niteliksel** ifade, sayısal aralık yok.

Current implementation: `L ≥ 60 ∧ K ≥ 60 ∧ F ≤ 55`

**Erişilebilirlik analizi (bu oturumda koşuldu):**
`detectValidityConfig` **ilk eşleşen kazanır** sırasını kullanır ve
`closed-v` (indeks 1) `F < 50 ∧ L > 60 ∧ K > 60` koşulunu taşır. Dolayısıyla:

| Profil | Kod sonucu | Kaynak |
|---|---|---|
| L=62, K=62, F=45 | `closed-v` (Çok Kapalı) | Konf. 3 (F<50) ✓ |
| L=62, K=62, F=52 | `v-shape` | Konf. 2 ✓ |
| L=62, K=62, F=80 | `unconventional` / başka | Konf. 10 ✓ (yüksek F) |

→ `v-shape` pratikte **F ∈ [50, 55]** aralığında çalışır; bu, kaynağın
"F 50'ye yakın" ifadesinin doğru karşılığıdır. **Üst sınır kaldırılırsa**
yüksek-F profilleri (Konf. 10/14) yanlışlıkla "V Şekli" olarak etiketlenir.

Resolution: **REJECTED — kod doğru.** Sınır, örüntüleri ayrık tutmak için
gereklidir. İlgili karar: **DECISION-023**.

---

## CONFLICT-019 — Konf. 7 (tümüne "doğru") hiç tetiklenemiyor (P1) → **FIXED**

Area: `all-true`

Source (**Visual: CONFIRMED**, s.49): "… **F alt testinin 120'nin üzerinde**
yer almasını gerektirir."

Current implementation (önce): `v.F > 120 && v.L <= 35 && v.K <= 35`
`mmpiScoring.ts`: T puanları `Math.max(20, Math.min(120, t))` ile **[20, 120]**
aralığına kırpılır → `F > 120` **hiçbir zaman** doğru olamaz.

**Ampirik kanıt:** 566 maddenin tamamına "Doğru" yanıtı → L 26.5 · **F 120.0** ·
K 22.1 → **konfigürasyon YOK** dönerdi (kaynağın tanımladığı örüntü kayıptı).

Resolution: **FIXED** — CHANGE-009: `F > 120` → **`F >= 120`**. Kırpma altında
kaynağın "> 120" koşulunun tek temsili tam üst sınırdır; kırpma kaldırılırsa
koşul `> 120`'ye dönmelidir (kod içinde not düşüldü). Karar: **DECISION-023**.

---

## CONFLICT-020 — Konfigürasyonlarda kaynakta olmayan ek sınırlar (P2) → **FIXED kısmen**

| # | Kod sınırı | Kaynakta karşılığı | Sonuç |
|---|---|---|---|
| 12 (`credible`) | `K ≤ 65` | yalnız "K, T 50'nin **üstünde**" | ✅ **KALDIRILDI** (CHANGE-010) |
| 9 (`help-seeking`) | `F ≥ 70` | kaynak yalnız üst sınır verir | ⚠️ **KORUNDU** (gerekçeli, aşağıda) |
| 5 (`descending`) | F sınırı yok | "F yaklaşık 50" (niteliksel) | ✅ sınır **eklenmedi** (doğru) |
| 2 (`v-shape`) | `F ≤ 55` | "F 50'ye yakın" | ✅ **REJECTED** — CONFLICT-016'ya bkz. |

**`credible` kanıtı (boşluk kapatıldı):** L=50, F=65, **K=70** profili kaynağa
göre Konfigürasyon 12'dir; eski kodda **hiçbir konfigürasyona girmiyordu**
(`YOK`). CHANGE-010 sonrası → "Güvenilir Cevaplayıcı" ✅
Erişilebilirlik kontrolü: kaldırılan sınır `unconventional` (indeks 9),
`frank` (10), `reverse-v` (0), `virtuous` (13), `rigid` (14) örüntülerinden
hiçbirini etkilemez (F/K bantları ayrık).

**`help-seeking` F ≥ 70 neden KORUNDU:** alt sınır kaldırılırsa `help-seeking`
(indeks 8) `L < 66 ∧ K < 66 ∧ F ≤ 100` ile **`frank`** (indeks 10,
`F 60-70`) ve **`credible`** (indeks 11) örüntülerini de yutar → iki örüntü
erişilemez hale gelir. Kaynağın Şekil 9'daki yükselmiş-F eğrisi de alt sınırı
destekler. → `UNVERIFIED-CONFIG-F-001` (belgeli, kaynak dışı ama gerekli).

---

## CONFLICT-021 — Wiggins SOC: metin "26 madde" ↔ kitabın kendi listesi 27 (P1) → **REJECTED (kod doğru)**

Area: `WIGGINS_KEYS.SOC`

Source A (metin, s.178, **görsel doğrulandı**): "Sosyal uyumsuzluk skalası
(SOC): **Toplam 26 maddeden** oluşan bu skalanın…"
Source B (kitabın kendi madde listesi, **Ek 9c s.251-256**): SOC = 13 Doğru +
14 Yanlış = **27 madde** — `dump-keys.ts` + `compare-keys.py` ile
**46/46 MATCH** olarak doğrulanmıştı (PHASE 2).

Current implementation: `WIGGINS_KEYS.SOC` = **27 madde** (13 + 14).

**Değerlendirme:** Kaynak **kendi kendisiyle** çelişiyor (düzyazı sayısı ↔ kendi
madde listesi). Bu, PHASE 2'de bağımsız olarak doğrulanan **madde listesi**
lehine çözülür; metindeki sayı muhtemelen dizgi/çeviri hatasıdır.

Toplam kontrolü: kaynak metin toplamı 351, kitabın listelerinden gelen kod
toplamı 352 → fark tam olarak SOC'taki bu 1 maddedir.

Resolution: **REJECTED — kod doğru.** Karar: **DECISION-024**.
Not: Kaynak metnin kendisi de doğrulanmış listeden farklı olduğu için
`UNVERIFIED` **değil, kaynak içi tutarsızlık** olarak sınıflandırıldı
(CONFLICT-018 ile aynı sınıf).

---

## CONFLICT-022 — Wiggins SOC yorum yönü (P2, OPEN)

Area: `WIGGINS_META.SOC` + `WIGGINS_HIGH_TEXT.SOC` (yorum katmanı)

Source (s.178-179, **görsel doğrulandı**): "…Yüksek puanlar **kendinden emin,
güvenli, parlak** bireyleri gösterirken, **düşük puanlar iddiacı, eğlenceyi
seven**, diğer insanlarla kolay ilişkiye giren bireylere işaret etmektedir."

Current implementation: `WIGGINS_HIGH_TEXT.SOC` = "Sosyal ortamlarda
ketlenmişlik, utangaçlık ve içedönüklük; insanlarla iletişim kurmakta güçlük"
→ **yüksek puan = uyumsuzluk** (standart Wiggins SOC yönü).

**Gerilim:** Kaynağın tanımı, ölçeğin adıyla ("Sosyal **uyumsuzluk**") ve
standart Wiggins yönüyle çelişiyor; kaynak her iki ucu da olumlu niteliklerle
tarif ediyor.

Status: **OPEN** — yorum katmanı işi (PHASE 10) kapsamında karara bağlanacak;
sayısal veri (norm/madde listesi) etkilenmez. Acele karar verilmedi.

---

## CONFLICT-023 — Kritik madde etiketleri kaynak metniyle uyuşmuyor (P2) — **OPEN**

Area: `src/scoring/mmpiCritical.ts` → `CRITICAL_ITEMS` (39 kayıt, 38 benzersiz madde)

Source: **Ek 1 (kitap s.215-233)** — madde metinleri; **görsel doğrulandı**
(`.audit/items/gl2_*.png`, `gl3.png`, `gl4.png`); Ek 9 (s.244-256) ölçek/yön
kanıtı.

**Ön bulgu (kaynakta liste yok):** Kaynakta hiçbir yerde "kritik madde" listesi
yoktur (`SOURCE-ITEM-002`) → listenin **varlığı** kaynak dışıdır; ancak
etiketler kaynak metniyle **çeliştiği** için ayrıca çelişki kaydı gerekir.

**Uyuşmayan 14 kayıt:**

| # | Kaynak metni (görsel) | Kod etiketi | Ek 9 ölçeği | Değerlendirme |
|---|---|---|---|---|
| 20 | Cinsel yaşamımdan memnunum | Alkol/Madde Sorunları | F(Y), Pd(Y), Sc(Y) | ❌ etiket yanlış (cinsel doyum) |
| 27 | Bazen kötü ruhların beni etkileri altına aldığını hissederim | Ruhsal/Bilişsel Karmaşa | F(D), Pa(D) | ❌ "etkilenme/sanrı" olmalı |
| 33 | Başımdan çok garip ve tuhaf şeyler geçti | Sosyal Çekilme | Pd(D), Sc(D), Si(Y) | ❌ etiket yanlış |
| 37 | Cinsel yaşamım yüzünden başım hiç derde girmedi | Ruhsal Sıkıntı | Pd(Y), Sc(Y) | ❌ etiket yanlış |
| 69 | Ensemde nadiren ağrı hissederim | Sosyal/Ailevi Huzursuzluk | (klinik ölçekte yok) | ❌ etiket yanlış (ağrı) |
| 85 | …başkalarının ayakkabı, eldiven vb. özel eşyaları o kadar hoşuma gider ki **dokunmak ve aşırmak isterim** | Ruhsal Sıkıntı / Kaygı | F(D) | ❌ dürtü kontrolü/aşırma |
| 133 | Hiçbir zaman normal olmayan cinsel ilişkilere girişmedim | Ailevi Sorunlar | (klinik ölçekte yok) | ❌ etiket yanlış (cinsellik) |
| 146 | Seyahat edip gezip tozmadıkça mutlu olamam | Sosyal Uyumsuzluk | F(D) | ❌ etiket yanlış |
| 151 | **Biri beni zehirlemeye çalışıyor** | Sosyal Çekilme / Yabancılaşma | F(D), Pa(D) | ❌ sanrısal içerik |
| 168 | Zihnimde bir gariplik var | Bağımlılık Potansiyeli | F(D), Sc(D) | ❌ bilişsel karmaşa |
| 179 | Cinsel konularda sıkıntım vardır | Bedensel/Organik Belirti | Hy(D), Sc(D) | ❌ cinsel sıkıntı |
| 334 | Bazen tuhaf kokular duyarım | Depresif Çökkünlük | Sc(D) | ❌ algı bozukluğu (koku) |
| 337 | Çoğunlukla bir takım şeyler ve kimseler için meraklanıp huzursuzlaşırım | Depresif Çökkünlük | Pt(D) | ❌ anksiyete/huzursuzluk |
| 354 | Bıçak gibi çok keskin ve sivri şeyler kullanmaktan korkarım | Bedensel / Nörolojik Belirti | Sc(D) | ❌ fobik kaygı |

Impact: Kritik madde listesi **UI** (`MMPICriticalSection.tsx`) ve **basılı
rapor** (`MMPIPrintReport.tsx`) üzerinde etiketleriyle görünür → yanlış etiket
klinisyeni yanlış yönlendirir (P2). Puanlama etkilenmez.

Comparison: **CONFLICT (etiket ↔ kaynak metni)** + **EXTRA (liste kaynakta yok)**

Status: **FIXED** (DECISION-026, CHANGE-011 — 2026-09-21).

Resolution: Üç yön birlikte uygulandı — (a) **14 etiket kaynak metnine göre
düzeltildi**, (b) liste **korundu** (raporda/ekranda klinisyen kontrol listesi
olarak kullanılıyor), (c) listenin **kaynak dışı** olduğu kod başlığında ve
`SOURCE_FACTS`'ta belgelendi. Madde numaraları ve D/Y yönleri değişmedi.
Regresyon: +4 test; `tests/mmpiKeyIntegrity.test.ts` 26/26 · `npm test`
313/313 PASS.

Not (lehte delil): #74 cinsiyete göre yön ayrımı **doğru** (#74 kaynakta
"Şayet kız iseniz" koşullu metni vardır) ve 24 kayıt kaynak metniyle tutarlıdır
→ liste tümüyle hatalı değil; içinde hem doğru hem hatalı kayıt var.
