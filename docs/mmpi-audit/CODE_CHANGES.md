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
