# Conflicts

Kaynak ↔ mevcut sistem farkları. Sınıflandırma:
`MATCH` · `CONFLICT` · `MISSING` · `EXTRA` · `UNVERIFIED` · `OCR-UNCERTAIN`

Durumlar: `OPEN` · `INVESTIGATING` · `CONFIRMED` · `FIXED` · `REJECTED` · `UNVERIFIED`

> **Kural:** Kodu değiştirmeden önce `SOURCE_FACT → CONFLICT → DECISION`
> zinciri tamamlanmış olmalıdır. Şu an **hiçbir kod değişikliği yapılmadı.**

---

## CONFLICT-001 — F alt testi kadın normu (K P0)

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

---

## CONFLICT-002 — K alt testi normları (K P0)

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
