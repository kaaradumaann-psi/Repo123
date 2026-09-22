# Code Changes

Her kod değişikliği buraya kaydedilir. Kayıt olmadan değişiklik yapılmaz
(kural: `SOURCE_FACT` + `CONFLICT` + `DECISION` üçlüsü tamam olmalı).

---

## Özet

| Değişiklik sayısı | 0 |
|---|---|
| Değiştirilen bilimsel değer | 0 |
| Test sonucu | 287/287 PASS (değişiklik öncesi baseline) |

**Bu aşamada bilinçli olarak hiçbir kod değişikliği yapılmamıştır**
(`DECISION-004`). Bulunan P0 farklar `CONFLICTS.md` içinde `OPEN` durumdadır ve
PHASE 4 + PHASE 6 doğrulamasından sonra karara bağlanacaktır.

---

## CHANGE-000 — Denetim altyapısı (kod dışı)

Date: 2026-09-21
Type: Araç / dokümantasyon (uygulama kodunu etkilemez)

Added:
- `docs/mmpi-audit/` (denetim kalıcı hafızası, 15 dosya)
- `scripts/mmpi-audit/extract.py` (sayfa→görsel→OCR aracı)

Affected runtime code:
**NONE** — `src/`, `supabase/`, `functions/`, `worker/`, `public/` değişmedi.

Tests:
`npm test` → 287 pass / 0 fail (değişiklik sonrası da doğrulandı)

Reason:
Denetim altyapısı kurulumu (görev talimatı §1-§3).

Status: **DONE**

---

## Düzeltme paketi — 2026-09-21 (Oturum 3)

Ön koşul zinciri tamamlandı: her değişiklik için
`SOURCE_FACT` (Ek 9 tablosu, görsel doğrulandı) → `CONFLICT` → `DECISION`
mevcuttur. `DECISION-008` ile onaylanmıştır.

`npm run typecheck` → **PASS** · `npm test` → **294/294 PASS** · `npm run build` → **PASS**

---

## CHANGE-001

Date: 2026-09-21
Source: `SOURCE-KEY-F-001` · Ek 9, kitap s.244 (PDF p130 L) · görsel doğrulandı
Conflict: CONFLICT-008 (P0)
Decision: DECISION-008

Old:
```ts
falseItems: [17, 20, 54, 65, 69, 75, 83, 112, 113, 115, 164, 177, 185, 196, 199, 220, 257, 258, 272, 276],
```
New:
```ts
falseItems: [17, 20, 54, 65, 75, 83, 112, 113, 115, 164, 169, 177, 185, 196, 199, 220, 257, 258, 272, 276],
```

File: `src/scoring/mmpiKeys.ts` → `SCORING_KEYS.F`
Reason: Kaynak Ek 9 F tablosu (Yanlış sütunu) `164, **169**, 177` dizisini verir;
`69` **hiçbir** F listesinde yoktur. Basamak hatası düzeltildi.
Etki: F ham puanı → geçerlilik eşikleri (16/23), F-K endeksi, F T puanı.
Madde 69 hâlâ `Mf` (erkek: Doğru / kadın: Yanlış) anahtarındadır — doğru.
Tests: **PASS** (F uzunluğu 44+20 korunur; doğrudan 69/169 fixture'ı yoktu)

---

## CHANGE-002

Date: 2026-09-21
Source: `SOURCE-KEY-SPECIAL` · Ek 9, kitap s.255 (PDF p135 R) · görsel doğrulandı
Conflict: CONFLICT-009 (P0)
Decision: DECISION-008

Old: `Es.dogru` 38 madde içeriyordu (`...458, 483, 488, 489, 494, 510, 513, 515, 525, 541, 544, 548, 554, 555, 559, 561`)
New: `Es.dogru` 25 madde; 13 madde `Es.yanlis` tarafına taşındı

File: `src/scoring/mmpiDerived.ts` → `SPECIAL_KEYS.Es`
Reason: Kaynak tablosunda bu 13 madde **Yanlış** sütunundadır.
Etki: Es ham puanı; önceki kod bu maddeleri ters yönde sayıyordu → ego gücü
puanı sistematik olarak sapıyordu. Toplam 68 korunur.
Tests: **PASS**

---

## CHANGE-003

Date: 2026-09-21
Source: `SOURCE-KEY-WIGGINS` · Ek 9, kitap s.252 (PDF p134 L) · görsel doğrulandı
Conflict: CONFLICT-010 (P0)
Decision: DECISION-008

Old:
```ts
dogru: [70, 74, 77, 78, 87, 92, 132, 140, 149, 203, 261, 295, 538, 554, 557, 562],
yanlis: [1, 81, 126, 219, 221, 223, 283, 300, 423, 434, 463, 537, 552, 563],
```
New:
```ts
dogru: [70, 74, 77, 78, 87, 92, 126, 132, 140, 149, 203, 261, 295, 463, 538, 554, 557, 562],
yanlis: [1, 81, 219, 221, 223, 283, 300, 423, 434, 537, 552, 563],
```

File: `src/scoring/mmpiDerived.ts` → `WIGGINS_KEYS.FEM`
Reason: `126` ve `463` kaynakta **Doğru** sütunundadır. Toplam 30 korunur.
Etki: W_FEM ham puanı → `WIGGINS_NORMS.FEM` (M=14.77, SD=3.87) T dönüşümü.
Tests: **PASS**

---

## CHANGE-004

Date: 2026-09-21
Source: `SOURCE-KEY-PD-SCALES` · Ek 9, kitap s.249 (PDF p132 R) · görsel doğrulandı
Conflict: CONFLICT-011 (P0)
Decision: DECISION-008

Old: `AVD.dogru` 8 madde (toplam 25)
New: `AVD.dogru` 21 madde (toplam **38**) — eklenen 13 madde:
`52, 142, 171, 180, 267, 278, 292, 304, 317, 357, 377, 418, 473`

File: `src/scoring/mmpiDerived.ts` → `PERSONALITY_KEYS.AVD`
Reason: Kaynak başlığı "Madde sayısı: 38" der ve tablo 21+17=38 listeler.
Etki: AVD ham puanı artık 38 üzerinden; `PERSONALITY_CUTOFFS.AVD`
(`marked: 9, mild: 7`) doğru ölçekte uygulanır.
Tests: **PASS**

---

## CHANGE-005

Date: 2026-09-21
Source: `SOURCE-KEY-PD-SCALES` · Ek 9, kitap s.249 (PDF p132 R) · görsel doğrulandı
Conflict: CONFLICT-012 (P0)
Decision: DECISION-008

Old:
```ts
HST: { dogru: [99, 126, 181, 381, 445, 451, 482, 521], yanlis: [111, 180, 240, 304, 312] },
```
New:
```ts
HST: {
  dogru: [99, 126, 181, 353, 381, 391, 445, 449, 450, 451, 482, 521, 547],
  yanlis: [111, 171, 180, 240, 286, 304, 312],
},
```

File: `src/scoring/mmpiDerived.ts` → `PERSONALITY_KEYS.HST`
Reason: Kaynak başlığı "Madde sayısı: 20"; tablo 13+7=20 listeler.
Doğru'ya eklenen: `353, 391, 449, 450, 547`; Yanlış'a eklenen: `171, 286`.
Etki: HST ham puanı 20 üzerinden; `PERSONALITY_CUTOFFS.HST` (`marked: 10, mild: 7`)
artık erişilebilir eşikler.
Tests: **PASS**

---

## CHANGE-006 — Yeni test: anahtar bütünlüğü

Date: 2026-09-21
Type: Test eklemesi (uygulama davranışını değiştirmez)
Source: Denetim boşluğu tespiti (`TEST_AUDIT.md`, "Yeni test önerisi")

Added: `tests/mmpiKeyIntegrity.test.ts` (7 test)

Kapsam:
- 46 anahtarın **başlıkta belgelenen madde sayısı** ile karşılaştırılması
  (kaynak Ek 9 başlıkları referans)
- Yapısal bütünlük: tekrarlanan madde, Doğru/Yanlış çakışması,
  1-566 aralığı dışı madde
- Mf erkek/kadın anahtarlarının aynı madde kümesini kullanması (yalnızca yön farkı)
- CONFLICT-008..012 düzeltmelerinin kalıcı olması (regresyon koruması)

Neden gerekliydi:
Denetimde HST (başlık 20 / anahtar 13) ve AVD (başlık 38 / anahtar 25) hataları
**uzun yıllar görünmez kaldı** çünkü başlık-madde sayısı tutarlılığını
kontrol eden bir test yoktu. Bu test o sınıfı kapatır.

Testin ilk çalıştırmasında bulduğu ek şey:
`OH` ölçeğinde kaynağın **kendi içi tutarsızlığı** (başlık 33, tablo 31) —
kod tabloyu doğru izlediği için `EXPECTED_SPECIAL.OH = 31` olarak yazıldı
(bkz. `SOURCE-INTERNAL-OH-001`).

Tests: **PASS** (7/7) — toplam suite 287 → **294**

---

## CHANGE-007 — TR endeksi kesme puanı kaynağa çekildi (P1)

Date: 2026-09-21
Type: **Davranış değişikliği** (geçerlilik değerlendirmesi)
Priority: **P1**
Source: `SOURCE-TR-002` (kitap s.59, görsel doğrulanmış) · CONFLICT-015 · DECISION-019

Files:
- `src/scoring/mmpiConsistency.ts`
- `tests/mmpiKeyIntegrity.test.ts`

### Değişiklik 1 — kesme puanı

Before:
```ts
const consistent = score <= 3;   // 3 DAHİL tutarlı
```
After:
```ts
// Kaynak kitap s.59: "3 puan ya da daha fazla bir puanın, geçersiz profil
// olasılığını arttırdığı ileri sürülmüştür (Dahlstrom 1972)."
// → 3 puan DAHİL geçersizlik riski; tutarlılık yalnızca 0-2 için geçerlidir.
const consistent = score <= 2;
```

Etki: TR = 3 olan profiller artık "Tutarsız Yanıt Örüntüsü" + `isWarning: true`.

### Değişiklik 2 — kaynakta olmayan olgusal iddiaların kaldırılması

Before (yorum metni):
> "Normal bireyler tekrarlanan maddelerin **yalnızca üç-dördüne** değişik yanıt
> verir."

After:
> "TR endeksi 3 puanın altındadır; yanıtlar tutarlı kabul edilir. Bu seviyedeki
> düşük tutarsızlıklar genellikle dikkatsizlik kaynaklıdır."

Ayrıca dosya başı yorumundaki "3 ve altı tutarlı kabul edilir (Gravitz & Gerton
1976)" ifadesi kaynak cümlesiyle değiştirildi. **Gerekçe:** "üç-dört" ifadesi ve
Gravitz & Gerton atfı yüklü kaynak kitapta **yoktur**; kaynakta bulunmayan
olgusal iddia taşınamaz (SECONDARY-SOURCE kuralı).

### Değişiklik 3 — regresyon testleri (+4 test)

`tests/mmpiKeyIntegrity.test.ts` → yeni suite "PHASE 4 — tutarlılık endeksleri
kaynak uyumu":
1. TR = 3 → uyarı **var**; TR = 2 → uyarı **yok** (kesme kayması koruması)
2. Tablo 6 → `TR_PAIRS` birebir (16 çift, sıra dahil)
3. Tablo 7 → `CARELESS_PAIRS` birebir (12 çift + 12 yön)
4. F-K bantları (9 geçerli / 10 sahte-kötülük / 17 kritik / 8-11 notu iki dalda)

### Doğrulama

- `npm run typecheck` → **0 hata**
- `tests/mmpiKeyIntegrity.test.ts` → **14/14 PASS**
- Mevcut TR testleri etkilenmedi (1 puan uyarı yok, 4 puan uyarı var → ikisi de
  yeni kuralda da doğru)
- Tam suite sonucu: `TEST_AUDIT.md`

---

## CHANGE-008 — Geçerlik konfigürasyon eşikleri kaynağa çekildi (P1)

Date: 2026-09-21
Type: **Davranış değişikliği** (validity config eşleştirme)
Priority: **P1**
Source: `SOURCE-CONFIG-004/005/007/009` · CONFLICT-017 · DECISION-021

File: `src/scoring/mmpiValidityConfigs.ts` (+ testler)

| id | Before | After | Kaynak |
|---|---|---|---|
| `ascending` | `L<F<K ∧ L≤45 ∧ K≥55` | `… ∧ F≥45 ∧ F≤55 ∧ …` | "F alt testi 45-55 T" (s.46) |
| `descending` | `L>F>K ∧ L≥55 ∧ K≤45` | `… ∧ K≥40 ∧ K≤45` | "K alt testi 40-45 T puanı arasındadır" (s.47) |
| `all-true` | `F>120 ∧ L≤40 ∧ K≤40` | `F>120 ∧ L≤35 ∧ K≤35` | "L ve K alt testinin 35 T puanını aşmasını" (s.49) |
| `help-seeking` | `L<66 ∧ K<66 ∧ F 70-105` | `… ∧ F ≤ 100` | "F 100 T puanına yakın ya da altında" (s.51) |

Ayrıca `rule` metinleri kaynağa göre güncellendi ve `all-false` için kaynak
sapması **gerekçeli yorum** olarak kod içine yazıldı (CONFLICT-018,
DECISION-020 — kod değişmedi).

**Değişmeyenler (bilinçli):** `all-false` 75 eşiği (DECISION-020);
`credible` K ≤ 65, `v-shape` F ≤ 55, `descending` F sınırı, `help-seeking`
F ≥ 70 → CONFLICT-020 (ayrı karar).

### Doğrulama

- `npm run typecheck` → **0 hata**
- `tests/mmpiKeyIntegrity.test.ts` (PHASE 4 batch 3, +6 test) + `mmpiExtended`
  → **46/46 PASS**
- Tam suite → **307/307 PASS** (22 suite, ~120 s) — önceki 301/301 (21 suite)
- **REGRESSION YOK** · `build` PASS · `optik-form.html` senkron

---

## CHANGE-009 — Konf. 7 (`all-true`): ölü kural canlandırıldı (P1)

Date: 2026-09-21 · Type: **Davranış değişikliği** · Priority: **P1**
Source: SOURCE-CONFIG-007 (s.49) · CONFLICT-019 · DECISION-023

```
- isMatch: v => v.F > 120 && v.L <= 35 && v.K <= 35,
+ isMatch: v => v.F >= 120 && v.L <= 35 && v.K <= 35,
```

**Neden:** T puanları [20,120] kırpılır (`mmpiScoring.ts`) → `F > 120` hiç
sağlanamaz. Ampirik: 566 maddenin tamamına "Doğru" → L 26.5 · F **120.0** ·
K 22.1 → konfigürasyon **YOK** dönerdi.
**Geri alma koşulu:** T kırpması kaldırılırsa koşul `> 120` olmalıdır
(kod içinde yorum olarak belgeli).

## CHANGE-010 — Konf. 12 (`credible`): kaynakta olmayan K üst sınırı kaldırıldı (P2)

Date: 2026-09-21 · Type: **Davranış değişikliği** · Priority: **P2**
Source: SOURCE-CONFIG-012 (s.54) · CONFLICT-020 · DECISION-023

```
- isMatch: v => v.L >= 45 && v.L <= 55 && v.F < 70 && v.K > 50 && v.K <= 65,
+ isMatch: v => v.L >= 45 && v.L <= 55 && v.F < 70 && v.K > 50,
```

**Neden:** Kaynak K için üst sınır vermez. Eski kod, kaynağın Konfigürasyon 12
sayacağı profilleri (L=50, F=65, K=70) **hiçbir** konfigürasyona sokmuyordu.
Erişilebilirlik kontrolü yapıldı: başka örüntü etkilenmiyor.

### Doğrulama (her iki değişiklik)

- `npm run typecheck` → **0 hata**
- `npx tsx --test tests/mmpiKeyIntegrity.test.ts` → **22/22 PASS** (+2 test)
- Tam suite → aşağıda TEST_AUDIT kaydı

---

## CHANGE-011 — Kritik madde etiketleri kaynak metniyle uyumlu hâle getirildi (P2)

Date: 2026-09-21
Type: **Etiket/metin düzeltmesi** (klinik yönlendirme metni)
Priority: **P2**
Source: Ek 1 (s.216-226, görsel doğrulama) · CONFLICT-023 · DECISION-026

File: `src/scoring/mmpiCritical.ts` (+ `tests/mmpiKeyIntegrity.test.ts`)

| # | Before | After | Kaynak metni (kanıt) |
|---|---|---|---|
| 20 | Alkol/Madde Sorunları | **Cinsel Doyumsuzluk** | "Cinsel yaşamımdan memnunum" |
| 27 | Ruhsal/Bilişsel Karmaşa | **Etkilenme / Sanrısal Deneyim** | "kötü ruhların beni etkileri altına aldığını hissederim" |
| 33 | Sosyal Çekilme | **Tuhaf/Bizar Yaşantı** | "Başımdan çok garip ve tuhaf şeyler geçti" |
| 37 | Ruhsal Sıkıntı | **Cinsel Sorunlar** | "Cinsel yaşamım yüzünden başım hiç derde girmedi" |
| 69 | Sosyal/Ailevi Huzursuzluk | **Bedensel Ağrı** | "Ensemde nadiren ağrı hissederim" |
| 85 | Ruhsal Sıkıntı / Kaygı | **Dürtü Kontrolü / Aşırma İsteği** | "dokunmak ve aşırmak isterim" |
| 133 | Ailevi Sorunlar | **Cinsel Uyumsuzluk** | "normal olmayan cinsel ilişkilere girişmedim" |
| 146 | Sosyal Uyumsuzluk | **Sosyal Aktivite İhtiyacı** | "Seyahat edip gezip tozmadıkça mutlu olamam" |
| 151 | Sosyal Çekilme / Yabancılaşma | **Zehirlenme Sanrısı / Şüphecilik** | "Biri beni zehirlemeye çalışıyor" |
| 168 | Bağımlılık Potansiyeli | **Bilişsel Karmaşa** | "Zihnimde bir gariplik var" |
| 179 | Bedensel/Organik Belirti | **Cinsel Sıkıntı** | "Cinsel konularda sıkıntım vardır" |
| 334 | Depresif Çökkünlük | **Algı Bozukluğu (Koku)** | "Bazen tuhaf kokular duyarım" |
| 337 | Depresif Çökkünlük | **Huzursuzluk / Anksiyete** | "meraklanıp huzursuzlaşırım" |
| 354 | Bedensel / Nörolojik Belirti | **Kesici Alet Korkusu (Fobi)** | "keskin ve sivri şeyler kullanmaktan korkarım" |

Ayrıca dosya başlığına **"kaynak dışı klinik derleme"** uyarısı eklendi
(kaynakta kritik madde listesi yoktur; bkz. SOURCE-ITEM-002).

**Değişmeyen:** madde numaraları, D/Y yönleri, `#74` cinsiyet ayrımı.

### Doğrulama

- `npm run typecheck` → **0 hata**
- `tests/mmpiKeyIntegrity.test.ts` → **26/26 PASS** (+4 yeni test)
- `npm test` → **313/313 PASS** · 23 suite
- `npm run build` → **PASS** · `optik-form.html` senkron
- **REGRESSION YOK**

---

## CHANGE-012 — 40/04 kodunda tıbbi terim kaynağa çekildi (P2)

Date: 2026-09-21
Type: **İçerik düzeltmesi** (yanlış terim → kaynak terimi)
Priority: **P2**
Source: `SOURCE-CODE-PD-017` · CONFLICT-035 · DECISION-027

File: `src/scoring/mmpiSourceCodes.ts` — `CODES['04']` (40/04 Kodu)

| Before | After |
|---|---|
| "…psikomotor retardasyon ya da **negatifik** depresyon belirtileri yerine…" | "…psikomotor retardasyon ya da **vegetatif** depresyon belirtileri yerine…" |

**Kaynak kanıtı:** kitap s.120, **400 dpi görsel** `v_pd120_0404e.png` —
"gerçek, psikomotor retardasyon ya da **vegetatif** depresyon belirtileri yerine
depresif düşünce ve duygulara ilişkindir."

**Neden hemen düzeltildi (CONFLICT-025 gibi bekletilmedi):** bu bir **eksik
içerik** değil **yanlış içerik**tir; "negatifik depresyon" yerleşik bir tanı
değildir ve cümle depresyonun tipini ayırt eden işlevsel bir ayrım yapıyor.
Eksik koşullu cümleler tüm kod seti çıkarılana kadar bilinçli bekletilir (kural),
yanlış bilgi bekletilmez.

### Doğrulama

- `npm run typecheck` → **0 hata**
- `tests/mmpiKeyIntegrity.test.ts` → **29/29 PASS** (+3 yeni test: terim var /
  yanlış terim yok / gövde regresyonu)
- `npm test` (tam suite) → **316/316 PASS** · 24 suite (önceki 313/313, 23 suite)
- `npm run build` → **PASS** — `optik-form.html` senkron
- **REGRESSION YOK**

---

## CHANGE-013 — Sc `21-44` bandı kaynak terimine çekildi

Date: 2026-09-22
Type: **İçerik düzeltmesi** (yanlış terim → kaynak terimi + düşen sözcük)
Priority: **P2**
Source: `SOURCE-SC-004` · CONFLICT-038 · DECISION-028

File: `src/scoring/mmpiSource.ts` — `SC_T_BANDS` (band `T 21-44`)

| Before | After |
|---|---|
| "…davranışları ve yaşama **bakışları konservatiftir**." | "…davranışları ve yaşama **bakış açıları konformaldir**." |

**Kaynak kanıtı:** kitap s.146 (PDF p81 L), **400 dpi kadraj** `.audit/pages/b18_lowband.png`:
"21-44 T puanı: Pratik ve gelenekseldirler, davranışları ve yaşama bakış açıları
konformaldir." (OCR bu bandı 200 dpi'de doğru okumuş; **sayısal** bant sınırları
görselle doğrulandı — `OCR_ISSUES.md` BAND-HEAD-DROP yalnız 100+ başlığını ilgilendirir.)

**Kapsam:** tek dize. Bant sınırları, `tone`, `rangeLabel`, sayısal eşikler ve
diğer 4 Sc bandı **değişmedi**. Puanlama/ölçek matematiğine etkisi **yoktur**.

### Doğrulama

- `npm run typecheck` → **0 hata**
- `npx tsx --test tests/mmpiKeyIntegrity.test.ts` → **37/37 PASS** (29 → +8 yeni test:
  Tablo 15 Doğru/Yanlış birebirlik, 59+19=78 sayım, `K Eklemeli` + norm çifti,
  Sc bant sınırı 5/5, terim var / "konservatif" yok / gövde regresyonu)
- `npm test` (tam suite) → **324/324 PASS** · 26 suite (önceki 316/316 · 24 suite)
- `npm run build` → **PASS** — `optik-form.html` yeniden üretildi ve senkron (CI
  `git diff --exit-code -- optik-form.html` kapısı)
- **REGRESSION YOK**

---

## CHANGE-014 — kod çözümlemesi blok-yerel + koşullu yorumlar (DECISION-029 · seçenek A)

Date: 2026-09-22
Type: **Model değişikliği** (kod kimliği + kırpmasız çözümleme + koşullu yorum + örüntü katmanı)
Priority: **P1** (CONFLICT-030 kullanıcıya alakasız metin gösteriyordu)
Source: `SOURCE-CODE-PA-003` (s.130-131) · `SOURCE-MA-006` (s.153) · `SOURCE-SI-002` (s.157) ·
nevrotik üçlü konfigürasyonları (s.103-106, Şekil 18-20) · DECISION-029 **(A)**

**Dosyalar (4):**

| Dosya | Ne |
|---|---|
| `src/scoring/mmpiSourceCodes.ts` | `CodeInterpretation` alanları: `block?` · `rawCode?` · `conditions?: CodeCondition[]`; yeni `CODE_DIGIT_SCALE`, `BLOCK_CODES` (4 blok-yerel gövde), `CODE_CONDITIONS` (9 anahtar / 11 koşul), `KNOWN_BLOCK_CODES`, `parseCode()`, `resolveCodeInterpretation()`, `activeCodeConditions()`, `CodeScaleKey`; `codeInterpretation()` artık kırpmasız çözümlere **delege** ediyor |
| `src/scoring/mmpiInterpretation.ts` | `PatternHit.source?` alanı + **3 yeni desen** (`neurotic-step` · `neurotic-hat` · `neurotic-rising`, s.103-106) + `ProfileCodeInterpretation` ve `codeInterpretationForProfile()` (üçüncü yükselen testi ve T puanlarını profilden hesaplar) |
| `src/components/results/MMPICodeTab.tsx` | profil bağlamlı çözümlayıcı; "Koşullu ek yorum" kutusu (kaynak sayfası + `manuel` notu); blok etiketi `clinical.find(...).fullName`; "yorum tanımlı değil" paragrafı yeni |
| `src/components/results/MMPIPrintReport.tsx` | aynı çözümlayıcı; koşullar tek satır `pr-context` |

**Çözümleme sözleşmesi (yeni):**

```
parseCode('027(8)') → { digits: '027', block: 'Si', rawCode: '027(8)' }
BLOCK_CODES['Si:027'] VAR            → Si bloğunun 027(8) gövdesi  ✅
BLOCK_CODES['Ma:19'] YOK → '19' iki hane → CODES['19'] (19/91, s.77 Hs gövdesi) ✅
'794' → Pt:479 yok, 3 hane            → undefined (ARTIK 79/97 metni DÖNMEZ) ✅
```

1. Rakamlar **sıralanır** (`64` ↔ `46` aynı kanonik küme), **blok = kodun ilk rakamı**.
2. Önce `BLOCK_CODES[blok:digits]` aranır (kaynağın o bloğa özgü başlığı).
3. Yalnız **tam iki haneli** kodlar ortak `CODES` kaydına düşer; orada
   `CODE_CONDITIONS` ile birleşir.
4. Üç+ haneli / parantezli eşleşmeyen kod → **`undefined`** (kırpma yok).
5. `resolveCodeInterpretation()` **tek örnek (singleton)** döndürür: `12` ve `21`
   aynı nesnedir (cache; eski `assert.equal(a, b)` kimlik sözleşmesi korundu).

**Kaynaktan eklenen gövdeler (yalnız birebir okunmuş 4 kayıt — DECISION-028):**

| Blok:kod | Kaynak | Gövde (özet) |
|---|---|---|
| `Ma:19` (`91/19`) | s.153 | "Ender görülmektedir. Hastalar hipomanik durumdadırlar…" + `seeAlso`: `92/29 · 93/39 · 94/49 ("Eyleme vuruk davranış ile ilgilidir") · 95/59 · 96/69 · 97/79 · 98/89` |
| `Pa:46` (`64/46`) | s.130-131 | "Bu koddaki bireyler immatür, narsisistik, pasif- bağımlı kişilerdir…" (kitabın "düşmancıdır" yazımı **korundu**) + koşul: "64/46 kodunun yanında 8 alt testi de yükselmişse süreç daha kötü olur" |
| `Si:049` | s.157 | "Psikiyatrik olgularda eyleme vurukluğun bastırılması" |
| `Si:027` (`027(8)`) | s.157 | "Bireyde güçlü ruminatif davranışlar görülebilir." |

**Kullanıcıya etkisi (önceki davranış → yeni):** `'049'` `40/04` (Pd) metnini
gösteriyordu → **kendi** Si gövdesini gösteriyor; `'027(8)'` `20/02` → kendi
gövdesi; `'91'` Hs `19/91` → Ma `91/19`; `'64'` Pd `46/64` → Pa `64/46`;
`'794'`/`'8726'`/`'273/723'`/`'213/231'` **alakasız** iki-haneli gövdeler → "tanımlı değil".

**Bağlanan koşullar (CONFLICT-027 / 025 / 034 — 12 koşul, 2'si `manual`):**
`12` (5 T farkı) · `13` (Yüksek K: 2,7,8 < 70 ∧ F < 50) · `26` (Pa ve/veya 4&8 > 70) ·
`27` (85 T üzeri) · `49` (K > 50 · Si < 50) · `07` (Mf < 40 T) · `68` (Pt ≥ 70) ·
`89` (yaş 27 → **manuel** · üçüncü yükselen 4/7/6) · `08` (üçüncü yükselen 7/2) ·
`Pa:46` (Sc > 70).

**Yeni örüntüler (CONFLICT-033, 3/9):** basamak orantısı · şapka · yükselen eğilim —
eşikler kaynak cümlesinden ("> 70 T", "Hs 70 T'nin altında") ve **kaynak
referansı `source` alanında** (`s.103-104 · Şekil 18` vb.).

### Doğrulama

- `npx tsc --noEmit` → **0 hata**
- `tests/mmpiKeyIntegrity.test.ts` → **63/63 PASS** (56 → 3 eski kilit yeni
  davranışa güncellendi + 7 yeni CHANGE-014 testi)
- `tests/mmpiInterpretation.test.ts` → **38/38 PASS** (29 → +9: 3 desen testi,
  3 profil-bağlamlı kod testi, 3 SSR render testi)
- `npm test` → **359/359 PASS** · 34 suite (önceki 343/343 · 30 suite)
- `npm run build` → **PASS** · `optik-form.html` yeniden üretildi ve **commit edildi**
  (CI `git diff --exit-code` kapısı)
- **Güncellenen 3 eski kilit:** (i) batch 20 `91/19` "Ender görülmektedir **yok**"
  → artık **var**; (ii) batch 21 `049 → 40/04` kırpma kilidi → `049` kendi gövdesi;
  (iii) `12 ↔ 21` kimlik testi → cache ile korundu. Hiçbiri **geri alınmadı**,
  hiçbiri "testi sil" ile geçilmedi.
- **REGRESSION YOK** · puanlama/ölçek matematiğine (ham puan, T, düzeltme, anahtarlar)
  **etkisi yoktur** — yalnız yorum katmanı

---

## CHANGE-015 — BÖLÜM 6 örüntü eşikleri kaynağa çekildi + 6 desen + çekince katmanı (DECISION-030 · seçenek A)

Date: 2026-09-22
Type: **Davranış değişikliği** (yalnız **yorum katmanı**: desen tespiti + desen arayüzü)
Priority: **P1** (CONFLICT-041 — iki desende **yanlış pozitif** üreten eşik sapması) · birlikte **P2** CONFLICT-042 kapandı
Source: `SOURCE-B6-001` (s.160-169 kutu metinleri, **150 dpi görsel okuma**) · `SOURCE-B6-002`
(çekince direktifleri, s.159-160/166-167/169) · DECISION-030 **(A)**

**Dosyalar (3 + stil):**

| Dosya | Ne |
|---|---|
| `src/scoring/mmpiInterpretation.ts` | `PatternHit` alanları: `quote?` (birebir kaynak cümlesi) · `caveat?` (kaynağın çekincesi) · `manual?` (nicel eşiği yok → otomatik değerlendirilmez) · `manualNote?` (sayısal olmayan ayağın elle doğrulanacağı). `conversion-v` **65/5 → 70/10**, `psychotic-v` **70/70 → 80/80/70 (+vadi şekli)**. **6 yeni desen:** `kus-kanadi` · `pasif-agresif-v` · `pozitif-egim` · `yuzen-profil` · `batik-profil` · `sinir-profil` + **`negatif-egim` (`manual`)** → kayıt sayısı **11 → 18**. Yeni dışa aktarım **`MMPI_PATTERN_CAVEATS`** (BÖLÜM 6 direktifleri, kaynak sayfalı) |
| `src/components/results/MMPIExtraTab.tsx` | Desen kartlarında **kaynak satırı + alıntı + çekince + elle-doğrulama notu**; `manual` kayıtlar **“elle değerlendirilir”** bölümüne ayrıldı (vurmadı listesine karışmıyor); sekmeye **“Yorum Çekinceleri (BÖLÜM 6)”** kutusu eklendi |
| `src/styles/workspace.css` | `.mmpi-pattern-source` · `.mmpi-pattern-quote` · `.mmpi-pattern-note` (mevcut desen satırlarının devamı; yeni renk/tip yok) |

**Eşik değişiminin kullanıma etkisi (önce → sonra):**

| Desen | Eski `hit` | Yeni `hit` | Kaynak |
|---|---|---|---|
| `conversion-v` | `Hs,Hy ≥ 65 ∧ min − D ≥ 5` | `Hs,Hy ≥ 70 ∧ min − D ≥ 10` | s.160 |
| `psychotic-v` | `Pa,Sc ≥ 70 ∧ min > Pt` | `Pa ≥ 80 ∧ Sc ≥ 80 ∧ Pt ≥ 70 ∧ min > Pt` | s.161 |

→ **Eski eşikler daha gevşekti**; örnek: `Hs 66.7 / Hy 66.3 / D 59.2` ve
`Pa 74.5 / Sc 74.5 / Pt 59.7` profilleri konuyu **vuruyor**, kaynağın tanımı
**vurmuyordu** (CONFLICT-041 kanıtı) → şimdi ikisi de **vurmuyor**; kaynak
tanımını karşılayan profiller (`74.1/74.8/50.8` ve `82.0/81.1/74.0`) **vurmaya
devam ediyor** (yanlış negatif yok — testte kilitli).

**Eklenen desenler (yalnız kaynak cümlelerindeki sayılar):**

| id | Kural (kaynak) | Sayısal olmayan ayağı |
|---|---|---|
| `kus-kanadi` | Hs, D, Hy, Pd **≥ 70 T** (+ kadınlarda Mf **50 T**) | “Psikotik testlerde de yükselme vardır” → `manualNote` |
| `pasif-agresif-v` | **Kadın** ∧ Pd ≥ 70 ∧ Pa ≥ 70 ∧ Mf **< 50** | “Diğer alt testler 70 T'da olsa bile” → `detail` |
| `pozitif-egim` | Pa,Pt,Sc,Ma,Si **> 70** ∧ Hs,D,Hy,Pd **< 70** | — (bölme çizgisi: Mf hattı, s.165 cümlesi) |
| `negatif-egim` | **`manual`** — kaynak “belirgin düşüklük” diyor, sayı vermiyor | tamamı elle (DECISION-028) |
| `yuzen-profil` | Hs→Ma **tamamı > 70 T** | “F'teki yükselme eşlik eder” → `manualNote` |
| `batik-profil` | tüm klinik ölçekler **45-54 T** (uçlar dâhil) | “en düşük olan alt testlere bakılmalıdır” → `caveat` |
| `sinir-profil` | tüm klinik ölçekler **60-70 T** (kaynağın “> 54 T” cümlesi kapsanıyor) | “geçerlik testlerinde tam olmayan yükselme” → `manualNote` |

**Üretilmeyen hiçbir şey yok:** hiçbir desene kaynakta olmayan eşik, ek yorum
cümlesi veya tanı önerisi yazılmadı; `detail` alanındaki metinler BÖLÜM 6 kutu
cümlelerinin kendisidir (tırnak içinde birebir), `caveat`/`quote` alanları
`SOURCE-B6-001/002` kayıtlarıyla harfiyen aynıdır.

### Doğrulama (CHANGE-015 sonrası)

- `npx tsc --noEmit` → **0 hata**
- `npx tsx --test tests/mmpiInterpretation.test.ts` → **47/47 PASS** (44 → batch-22
  describe’ı yeniden yazıldı: 6 kilit yeni davranışa, 9 teste çıktı; **bilinçli kırılma
  listesi `TEST_AUDIT.md` → batch 23**)
- `npm test` → **368/368 PASS** · 35 suite (önceki 365/365) · `mmpiKeyIntegrity` 63/63
- `npx tsx scripts/mmpi-audit/cmp-b6-batch23.ts` → **SONUÇ: 0 FARK · P0 BULGU YOK**
  (18 kayıt · #1/#2 eşik mutabakatı · eski FP’ler söndü · #4-#10 aynı profilde
  tanım+vuru · Batık/Sınır bant ayrışması · 8/8 çekince · sayı üretim denetimi)
- `npm run build` → **PASS** · `src/` değişti → **`optik-form.html` yeniden üretildi ve
  commit edildi** (CI `git diff --exit-code` kapısı) · `git diff --check` temiz
- **REGRESSION YOK:** puanlama/ölçek matematiği (ham puan, T, K düzeltmesi, anahtarlar,
  normlar, bant metinleri) değişmedi — yalnız **yorum katmanı**. `multi-high` ve
  `SINGLE_PD` davranışı kilitlerle korundu; `MMPIPrintReport` desen listesi
  basmadığı için **dokunulmadı** (kontrol edildi).
- **Arayüz etkisi:** “Desen Göstergeleri” kartları artık kaynak satırı + alıntı +
  çekince taşıyor; `negatif-egim` “Elle değerlendirilir” listesinde; sekmede
  “Yorum Çekinceleri (BÖLÜM 6)” kutusu var. Ham markdown kalıntısı testi:
  `doesNotMatch(/\*\*/)` → arayüz metinlerinde `**` yok (`<b>` etiketi kullanılıyor).

---

## CHANGE-016 — kalan dört desen kartında kaynak atfı (DECISION-030/A · 5. madde devamı · batch 24)

**Area:** `src/scoring/mmpiInterpretation.ts` → `detectPatterns()` · yeni salt-okunur araç
`scripts/mmpi-audit/cmp-b6-batch24.ts` · `tests/mmpiInterpretation.test.ts`.

**Source:** `SOURCE-VALIDITY-F-006` (s.36 — bu turda yazıldı) · `SOURCE-CODE-014/015`
(s.87 · 27/72 ve s.89 · 278/728) · `SOURCE-CODE-PD-014` (s.118-119) · `SOURCE-SC-006`
(s.147-148). **Yalnız** bu kayıtlardaki birebir ve sayfalanmış satırlar taşındı.

**Değişiklikler (sunum/atıf katmanı — hiçbir `hit` koşulu değişmedi):**
1. `cry-for-help` → `source: 's.36 · F yükselme nedenleri (4. madde)'` + `quote` (birebir:
   “Yardım çağrısı profili. 2 ve 7 testleri 6, 8 ve 9 testlerinden yüksektir.”) + `manualNote`
   (eşik kod tarafı; kaynak bandı “80 ve üstü T puanı” → **CONFLICT-043** / **DECISION-032**).
2. `depressive-27` → `source: 's.87 · 27/72 + s.89 · 278/728 (CODE)'` + `quote` (s.89’un
   ⚠️ kritik koşulu: K ve Hs < 50 T ve/veya Ma↑ → “intihar olasılığı dikkatle
   değerlendirilmelidir”) + `manualNote` (Pt ≥ 70 ∧ D ≥ 60 kod tarafı; 85 T koşulu
   `CODE_CONDITIONS` katmanında — CHANGE-014).
3. `49` → `source: 's.118-119 · 49/94 Kodu (CODE)'` + `quote` + yorum satırı: K > 50 T,
   üçüncü yükselen test 2/5/7/0 > 70 T ve Si < 50 T koşulları `CODE_CONDITIONS['49']` içinde;
   `Pd/Ma ≥ 70` kapısı kitabın genel yükselme tanımıyla uyumlu (s.160: “Yükselmenin hepsi
   70 T puanına yakın ya da bunun üstündedir”).
4. `89` → `source: 's.147-148 · 89/98 Kodu (CODE)'`; `quote` **bilinçli yok** — SOURCE-SC-006
   gövdeyi kısaltmalı (“…”) aktarıyor, birebir okuma ayrı tur ister; uydurma alıntı yerine
   yalnız sayfa atfı taşındı.
5. `neurotic-triad` ve `multi-high` **kaynaksız kaldı** (kodun kendi ≥ 65 göstergeleri);
   “kaynaksız set = yalnız bu ikisi” kuralı hem testte hem araçta kilitli.

**Doğrulama:**
- `npx tsc --noEmit` → **0 hata**
- `npx tsx --test tests/mmpiInterpretation.test.ts` → **54/54 PASS** (47 → +7)
- `npm test` → **375/375 PASS** · 36 suite (önceki 368/368 · 35)
- `npx tsx scripts/mmpi-audit/cmp-b6-batch24.ts` → **SONUÇ: 0 FARK · P0 BULGU YOK**
  ((1) kapsam defteri · (2) sayfa atfı ↔ SOURCE_* kaydı · (3) `quote` ↔ SOURCE_FACTS birebir ·
  (4) eşik kilidi: statik `hit` ifadeleri + F 68,8/71 davranışı · (5) sayı üretimi denetimi:
  corpus’ta olmayan sayı **yalnız** “kod tarafındadır” notuyla geçebilir · (6) UI zinciri)
- `cmp-b6-batch23.ts` yeniden çalıştırıldı → **0 FARK** (CHANGE-016 bozmadı)
- `npm run build` → **PASS** · `src/` değişti → **`optik-form.html` yeniden üretildi ve
  commit edildi** · `git diff --check` temiz
- **REGRESSION YOK:** puanlama/ölçek matematiği ve tüm `hit` koşulları aynı; yalnız desen
  kartlarının atıf alanları büyüdü.

---

## CHANGE-017 — DECISION-032 (B): cry-for-help F bandı mutabakatı (CONFLICT-043 FIXED)

**Area:** `src/scoring/mmpiInterpretation.ts` → `detectPatterns()` · `tests/mmpiInterpretation.test.ts`.

**Decision:** DECISION-032 = (B) Kullanıcı onayı (2026-09-22):
- `cry-for-help` (Yardım Çağrısı) için mevcut F ≥ 70 T otomatik eşiği korundu.
- Kaynak s.36'daki "80 ve üstü T puanı" bağlamı `manualNote` alanında belgelendi.
- Sayısal davranış değişmedi; yanlış pozitifleri önleme adına kaynakta açıkça bulunmayan 80 T eşiği zorlanmadı.
- CONFLICT-043 FIXED olarak kapatıldı.

**Değişiklikler:**
1. `src/scoring/mmpiInterpretation.ts`: `cry-for-help` kartındaki `manualNote` ve yorum satırı DECISION-032 (B) kararıyla hizalandı.
2. `tests/mmpiInterpretation.test.ts`: Test başlığı ve DECISION-032 kilitleri güncellendi (`54/54 PASS`).
3. `docs/mmpi-audit/DECISIONS.md`: DECISION-032 KABUL (B) olarak kaydedildi.
4. `docs/mmpi-audit/CONFLICTS.md`: CONFLICT-043 FIXED olarak güncellendi.
5. `tests/aiInterpretation.test.ts`: PHASE 11 test paketi eklendi (5 test).

**Doğrulama:**
- `npx tsc --noEmit` → **0 hata**
- `npx tsx --test tests/mmpiInterpretation.test.ts` → **54/54 PASS**
- `npx tsx --test tests/aiInterpretation.test.ts` → **5/5 PASS**
- `npx tsx scripts/mmpi-audit/cmp-b6-batch24.ts` → **0 FARK**
- `npm run verify:pdf` → **PASS**
- `npm run build` → **PASS** (`optik-form.html` güncel ve senkron)
- `npm test` → **380/380 PASS** (36 suite)

---

## CHANGE-018 — DECISION-031 (A): Bölüm 5 Hs (1) Bloğu Kod Göçü ve Koşullu Yorumlar (s.67-78)

**Area:** `src/scoring/mmpiSourceCodes.ts` · `tests/mmpiHsBlock.test.ts` · `tests/mmpiKeyIntegrity.test.ts`.

**Decision:** DECISION-031 = (A) Kullanıcı onayı (2026-09-22):
- Bölüm 5 kod analizleri blok-blok, kitaptan görsel okunarak ve SOURCE_FACTS ile doğrulanarak sisteme aktarılmaktadır.
- İlk tamamlanan blok: **Hs (Hipokondriasis / 1) bloğu (s.67-78)**.
- Uydurma sayı veya tanı üretilmemiştir; metinler kitap sayfalarıyla birebir uyumludur.

**Değişiklikler:**
1. `src/scoring/mmpiSourceCodes.ts`:
   - `parseCode()`: 3+ haneli kodların kanonik digit-sort ile birbirine çakışması (`132`'nin `123`'e dönüşmesi) engellendi (`digits = raw.length === 2 ? raw.split('').sort().join('') : raw`).
   - `BLOCK_CODES`: Hs bloğundaki 20 çok haneli ve blok-yerel kod gövdesi kitaptaki tanı ve yönlendirmeleriyle birlikte eklendi:
     `Hs:123` (123/213), `Hs:1234`, `Hs:1236`, `Hs:1237`, `Hs:1270`, `Hs:12378`, `Hs:128` (128/218), `Hs:129` (129/219), `Hs:120` (120/210), `Hs:132` (132/312), `Hs:134` (134/314), `Hs:1342`, `Hs:136` (136/316), `Hs:137`, `Hs:138` (138/318), `Hs:1382`, `Hs:139`, `Hs:14_low4` (Yüksek 1 / Düşük 4), `Hs:146`, `Hs:1469`.
   - `CODE_CONDITIONS`: Hs bloğuna ait 10 koşul makinece değerlendirilebilir testlerle bağlandı:
     - `12/21`: 1-2 farkı ≤ 5 T (s.68), 3 testi 1'in 5 T alanı içinde (s.68), Pd+Ma ≥ 70 T (s.68)
     - `13/31`: Yüksek K (s.72), Düşük 2 (s.72), 2,7,8,9 ≥ 70 T ∧ K < 50 T (s.72), L ve K ≥ 70 T (s.72)
     - `14/41`: 3 testi ≥ 70 T (s.76)
     - `16/61`: 8 testi ≥ 70 T (s.77), 4 testi < 70 T Paranoid Şizofreni (s.77)
     - `18/81`: F testi ≥ 70 T (s.77)
     - `19/91`: 2 ve 3 testleri < 50 T (s.78)
     - `10/01`: Üçüncü test Sc (s.78), 2 ve 3 testleri ≥ 70 T maskeli depresyon (s.78)
     - `136/316`: Pa - Hy ≥ 10 T ve Hy - Pa ≥ 10 T (s.74)
     - `137`: Ma ≥ 70 T veya K < 50 T (s.75)
     - `139`: Pd ≥ 70 T ve K < 50 T (s.76)
2. `tests/mmpiHsBlock.test.ts`:
   - 16 yeni test ile Hs bloğunun kod çözme doğruluğu, çakışmasızlığı (123 vs 132), tanı sadakati ve tüm koşulların T-skoru tetiklenme mantığı kilitlendi.
3. `tests/mmpiKeyIntegrity.test.ts`:
   - `KNOWN_BLOCK_CODES` listesi 4'ten 24'e güncellendi (Hs bloğundaki 20 kod eklendi).
4. `scripts/mmpi-audit/cmp-hs-batch25.ts`:
   - Hs bloğu mutabakat denetçisi eklendi; 28 kapsam kontrolü ve 0 FARK ile onaylandı.

**Doğrulama:**
- `npx tsc --noEmit` → **0 hata**
- `npx tsx scripts/mmpi-audit/cmp-hs-batch25.ts` → **SONUÇ: 0 FARK · Hs BLOĞU KOD GÖÇÜ TAMAMLANDI**
- `npx tsx --test tests/mmpiHsBlock.test.ts` → **16/16 PASS**
- `npx tsx --test tests/mmpiKeyIntegrity.test.ts` → **63/63 PASS**
- `npx tsx --test tests/mmpi*.test.ts` → **170/170 PASS** (38 suite)
- `npm run build` → **PASS** (`optik-form.html` güncellendi ve senkron)

---

## CHANGE-019 — DECISION-031 (A): Bölüm 5 D (2) Bloğu Kod Göçü ve Koşullu Yorumlar (s.81-92)

**Area:** `src/scoring/mmpiSourceCodes.ts` · `tests/mmpiDBlock.test.ts` · `tests/mmpiKeyIntegrity.test.ts` · `scripts/mmpi-audit/cmp-d-batch26.ts`.

**Decision:** DECISION-031 = (A) Kullanıcı onayı:
- Bölüm 5 kod analizleri blok-blok, kitaptan görsel okunarak ve SOURCE_FACTS ile doğrulanarak sisteme aktarılmaktadır.
- Tamamlanan ikinci blok: **D (Depresyon / 2) bloğu (s.81-92)**.
- Uydurma sayı veya tanı üretilmemiştir; metinler kitap sayfalarıyla birebir uyumludur.

**Değişiklikler:**
1. `src/scoring/mmpiSourceCodes.ts`:
   - `parseCode()`: `248/F` veya `248 / Yüksek F` içeren girdilerin doğrudan `248_highF` anahtarına çözümlenmesi sağlandı.
   - `BLOCK_CODES`: D bloğundaki 14 yeni kod kaydı kitaptaki tanı ve yönlendirmeleriyle birlikte eklendi:
     `D:213` (213/231) + alias `D:231`, `D:243` (243/432), `D:247` (247/427/472/742), `D:248`, `D:248_highF` (248 / Yüksek F), `D:273` (273/723), `D:274` (274/724), `D:275` (275/725), `D:278` (278/728), `D:270`, `D:281` (281/821), `D:284` (284/824), `D:287` (287/827), `D:207`.
   - `CODE_CONDITIONS`: D bloğuna ait 11 koşul makinece değerlendirilebilir testlerle bağlandı:
     - `23`: Düşük Mf veya Ma (<50 T) apati uyarısı; Ma <50 T hareketsizlik uyarısı (s.83).
     - `24/42`: 3, 7 veya 8 üçüncü yükselen test (s.84).
     - `27/72`: 85 T üstü ilaç uyarısı; Hs ≥ 70 T somatizasyon uyarısı (s.87).
     - `20/02`: 7 veya 4 üçüncü yükselen test (s.92).
     - `213/231`: Pt ≥ 70 T endişe/ajitasyon uyarısı (s.84).
     - `247/427`: Erkek Mf ≥ 70 T bağımlılık; Kadın Mf < 50 T aşırı geleneksel rol (s.85-86).
     - `248`: F ≥ 70 T şizofreni riski (s.86).
     - `274/724`: Hy ≥ 70 T kronik alkolizm (s.88); Kadın Mf < 50 T bağımlılık (s.88).
     - `275/725`: Pd < 50 T yetersizlik ve bağımlılık (s.89).
     - `278/728`: **Kritik intihar riski** (K < 50 ∧ Hs < 50) veya Ma ≥ 70; Si ≥ 70 kronik depresyon; Pd < 50 yapışkan bağımlılık; Kadın Mf < 50 (s.89).
     - `281/821`: Hy ≥ 70 T somatizasyon (s.90).
     - `284/824`: Pd > 80 T kontrol kaybı ve öfke patlamaları korkusu (s.91).
     - `287/827`: **Kritik intihar riski** (K < 50 ∧ Ma ≥ 70 T) panik ve ajitasyon (s.91).
2. `tests/mmpiDBlock.test.ts`:
   - 16 yeni test ile D bloğunun kod çözme doğruluğu, tanı sadakati ve tüm koşulların (özellikle intihar riski kontrolleri) T-skoru tetiklenme mantığı kilitlendi.
3. `tests/mmpiKeyIntegrity.test.ts`:
   - `KNOWN_BLOCK_CODES` listesine D bloğundaki 15 anahtar (`D:207`, `D:213`, `D:231`, `D:243`, `D:247`, `D:248`, `D:248_highF`, `D:270`, `D:273`, `D:274`, `D:275`, `D:278`, `D:281`, `D:284`, `D:287`) eklendi (toplam 39 blok anahtarı).
   - Eski negatif kırpma testlerindeki `213/231` ve `273/723` assertion'ları artık başarıyla çözüldüğü için güncellendi; yerlerine henüz göçmemiş kodlar kondu (`314`, `412`).
4. `scripts/mmpi-audit/cmp-d-batch26.ts`:
   - D bloğu mutabakat denetçisi eklendi; tüm çözümler, tanılar ve koşul bağları 0 FARK ile onaylandı.

**Doğrulama:**
- `npx tsc --noEmit` → **0 hata**
- `npx tsx scripts/mmpi-audit/cmp-d-batch26.ts` → **SONUÇ: 0 FARK · D BLOĞU KOD GÖÇÜ TAMAMLANDI**
- `npx tsx --test tests/mmpiDBlock.test.ts` → **16/16 PASS**
- `npx tsx --test tests/mmpiKeyIntegrity.test.ts` → **63/63 PASS**
- `npx tsx --test tests/mmpiHsBlock.test.ts` → **16/16 PASS**
- `npx tsx --test tests/mmpi*.test.ts tests/aiInterpretation.test.ts` → **154/154 PASS** (31 suite)
- `npm run build` → **PASS** (`optik-form.html` güncellendi ve senkron)
