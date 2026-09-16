# SON DURUM — 2026-09-16 (FINAL HANDOFF)

Bu dosya artık **güncel mühendislik durumudur**. Eski oturum dökümü (8664 satır sohbet logu) burada tutulmuyordu çünkü 6a `ALIGNMENT_MISSING`, C-serisi 70–83 ambiguous, “düz çizgi belirsiz yapıyor” ve E.2 “bütçeyi yükseltmek kurtarmaz” iddiaları **güncel gerçekleri yansıtmıyordu**.

Kaynaklar: PR #11 (`arena/01a0aa3d-repo123` @ `9049673`), `ENGINEERING_HANDOFF_2026-09-16.md` §F, `C-SERISI-FIX-RAPORU.txt`, `scripts/run-photos.mts` / final-review koşuları.

Kategoriler: **ÇÖZÜLDÜ** · **DOĞRULANDI** · **ÇÜRÜTÜLDÜ** · **BAŞARISIZ** · **HİPOTEZ** · **AÇIK**

Production kodu bu güncellemede **değiştirilmedi**. `maxOffsetMm` 3.0 yapılmadı. Eşik gevşetilmedi. Yeni fallback eklenmedi.

---

## 1. Özet tablo

| Konu | Durum |
|---|---|
| “Düz çizgi belirsiz yapıyor” | **ÇÜRÜTÜLDÜ** — ayraç çizgisi ölçüm bandına geometrik olarak giremez (0.375 mm boşluk). Asıl mekanizma: bükük kâğıtta planar homography’nin lokal halka kayması. |
| 6a landscape / orientation | **ÇÖZÜLDÜ** + **DOĞRULANDI** — landscape kasıtlı; `rotateGray90` ImageMagick’e bit-exact. |
| 6a `ALIGNMENT_MISSING` / squareWindow margin-ink | **ÇÖZÜLDÜ** — kurtarma artık kesilmiş pencerenin değil bileşenin mürekkebini sayıyor. |
| 6a ≡ 7a | **DOĞRULANDI** — 144/144 status+choice, nonblank 24, mismatch 0. |
| C-serisi 70–83 ambiguous (ilk baseline) | **tarihsel**; güncel baseline değil. Ara durum 27/29/25/22 (=103) idi. |
| C-serisi komşu-dışlama kök nedeni | **ÇÜRÜTÜLDÜ** — exclusion OFF: NOT_FOUND mean 37.3%→40.8%, yalnız 11/147 ≥70%. |
| E.2 “bütçeyi yükseltmek kurtarmaz” | **ÇÜRÜTÜLDÜ** (arama için). Nominal-merkezli bant için geometri doğru; arama **aday-merkezli**. |
| C-serisi gerçek kök neden | **DOĞRULANDI** — halkalar 1.75–2.50 mm’de; 1.6 mm bütçe altındaydı. |
| 2.5 mm geometrik arama | **ÇÖZÜLDÜ** + **DOĞRULANDI** — C-serisi amb 103→17. |
| Safety / chase | **DOĞRULANDI** — 27/27, chase=0. |
| 5a QR | **AÇIK** — `QR_UNREADABLE`, eşik gevşetilmedi. **BAŞARISIZ** zorla decode denemeleri. |
| Kalan 17 ambiguous | **AÇIK** — 13 geometrik, 4 gerçek silik #90. |
| 8 invalid | **AÇIK** — fail-closed; 7 blank-on-6a, 1 gerçek D (c3#104) karşı Y boş örnek. |
| Test / tsc / build / CI | **DOĞRULANDI** — 101/101, tsc clean, build clean, PR CI verify SUCCESS. |

---

## 2. 6a — orientation + squareWindow / margin-ink

**ÇÖZÜLDÜ.**

- Landscape saklanması hata **değildi** (**DOĞRULANDI**). 2550×1507, EXIF yok; `rotateGray90(1)` saat yönü, ImageMagick `-rotate 90` ile **bit-exact**.
- Salvage refit tasarlandığı gibi çalışıyordu (tahmin 1392 px → 66 px).
- Kök neden: `squareWindow()` izotropik; anizotropik kare (~1.2× dikey) kesiliyor; kesilmiş kenar satırları margin çerçevesini kirletiyor (`margin ink 40% > 15%`). squareFill=1.000 — squareFill hipotezi **ÇÜRÜTÜLDÜ**.
- Fix: `isPrintedSquare` kurtarması `head.count` yerine bileşenin `count` değerini kullanır. Eşik değişmedi, yeni fallback yok.
- Eksen-bağımsız `squareWindow` **BAŞARISIZ** (hairline test 13 kırıldı) — geri alındı, tekrarlanmasın.

Sonuç (doğrulandı):

```
6a  single=21  blank=120  multiple=2  ambiguous=1  warnings=1
7a  single=21  blank=120  multiple=2  ambiguous=1  warnings=1
6a ≡ 7a  144/144 status+choice, nonblank 24, mismatch 0
```

`ALIGNMENT_MISSING` **artık geçerli değil**.

---

## 3. C-serisi — sayılar

Eski 70–83 ambiguous **güncel baseline değildir**.

| Aşama | c1 | c2 | c3 | c4 | toplam amb |
|---|---:|---:|---:|---:|---:|
| İlk foto (çizgi hipotezi dönemi) | 70 | 74 | 83 | 77 | ~304 |
| 1.6 mm halka araması sonrası (HEAD 9b0140c öncesi fix) | 27 | 29 | 25 | 22 | **103** |
| 2.5 mm fix sonrası (**güncel**) | **8** | **6** | **2** | **1** | **17** |

103 → 17 **DOĞRULANDI** (final-review, `run-photos.mts`).

---

## 4. C-serisi kök neden

### Komşu dışlama — **ÇÜRÜTÜLDÜ** (ana kök neden değil)

`scripts/probe-neighbour-exclusion.mts`, 147 production NOT_FOUND:

- mean completeness A (excl ON) 50.6% → B (excl OFF) 56.8%
- NOT_FOUND mean 37.3% → 40.8%
- B≥70 & A<70 = **11/147** (3 foreign-dominated)

Exclusion production’da **duruyor** (`isCoveredByNeighbour`).

### E.2 “bütçeyi yükseltmek kurtarmaz” — arama için **ÇÜRÜTÜLDÜ**

E.2 tablosu **nominal-merkezli** 1.2–2.05 mm bant içindir (d≥0.5 mm’de tamamlık %66). `searchRingOffset` ise her adayın etrafında 1.60 mm çember arar.

`scripts/probe-why-notfound.mts`:

| Koşul | mean tamamlık | ≥70% |
|---|---|---|
| ≤1.6 mm, exclusion ON | 34.4% | 0/147 |
| ≤1.6 mm, exclusion OFF | 35.6% | 1/147 |
| ≤3.0 mm, exclusion ON | 77.8% | **146/147** |
| unconstrained winner komşu disk içinde | — | **0** |

Offset: (1.6,2.0] n=66 · (2.0,2.5] n=79 · (2.5,3.0] n=2. Mean **2.13 mm**. Mean \|nearest neighbour\| **2.62 mm**.

`probe-c-ring.mts` **güvenilmez** (şablon skoru komşu boş halkaya yapışabilir) — 2.0–2.6 mm değerleri gerçek kayma **değildir**.

### Gerçek kök neden — **DOĞRULANDI**

Basılı halka 1.75–2.50 mm öte. 1.6 mm arama bu artığın altındaydı → `halka bulunamadı` → boş balonda halka yayı kanıt → ambiguous.

---

## 5. Production fix (kod bu görevde değişmedi)

`src/omr/bubbleRingRefinement.ts` (PR #11, commit `9049673`):

- `maxOffsetMm` 1.6 → **2.5**
- `searchRadiiMm` += **1.9, 2.2, 2.5**
- `isCoveredByNeighbour` **korunuyor**
- `minSearchCompleteness` **0.7 korunuyor**
- kazanan merkez komşu elipsin içindeyse **ret** (`komşu balonun içine kilitlenme`)

`maxOffsetMm` 3.0 **yapılmadı**. Completeness düşürülmedi. Exclusion kapatılmadı.

---

## 6. Safety — **DOĞRULANDI**

`scripts/probe-budget-safety.mts`, exclusion ON, chase=no:

| fixture | 1.6 | 2.5 | chase |
|---|---|---|---|
| clean blank | 100% off 0 | aynı | no |
| strong fill | 42% | 42% | no |
| faint/erased | 100% off 0 | aynı | no |
| peripheral annular | 29% | 29% | no |
| adjacent-row filled | 100% off 0 | aynı | no |
| hairline | 100% off 0 | aynı | no |
| target ERASED + neighbour ring | 4% | 8% | no |
| true dy=1.5 mm | 83% pass | 83% pass | no |

OMR safety + bleed + peripheral + bubbleRing + captureGates: **27/27**. Yanlış komşu diske kilitlenme **0**.

---

## 7. 11 fotoğraf (güncel, SCAN_LIMITS.longSide)

| Foto | single | blank | multiple | ambiguous | invalid | warnings | durum |
|---|---:|---:|---:|---:|---:|---:|---|
| 1a | 4 | 130 | 3 | 0 | 0 | 0 | ok p2 (+reliable 7) |
| 2a | 4 | 130 | 3 | 0 | 0 | 0 | ok p2 (+reliable 7) |
| 3a | 4 | 120 | 2 | 1 | 0 | 0 | ok p1 (+reliable 17) |
| 4a | 9 | 120 | 2 | 1 | 0 | 0 | ok p1 (+reliable 12) |
| 5a | — | — | — | — | — | — | FAIL QR_UNREADABLE |
| 6a | 21 | 120 | 2 | 1 | 0 | 1 | ok p1 |
| 7a | 21 | 120 | 2 | 1 | 0 | 1 | ok p1 |
| c1 | 20 | 114 | 2 | 8 | 0 | 2 | ok p1 |
| c2 | 20 | 112 | 2 | 6 | 4 | 2 | ok p1 |
| c3 | 20 | 118 | 2 | 2 | 2 | 2 | ok p1 |
| c4 | 21 | 118 | 2 | 1 | 2 | 1 | ok p1 |

3a/4a/6a/7a tek ambiguous = **#90** (gerçek silik karşı iz).

---

## 8. 5a — **AÇIK**

2550×1879. 4 yönelimde QR decode FAIL. Hareket bulanıklığı / ghosting modül ızgarasını yok ediyor.

Zorla decode (binarize t=100/130/160, adaptif r=4/8) **BAŞARISIZ**. Eşik **gevşetilmedi**. `QR_UNREADABLE` doğru davranış.

---

## 9. Kalan 17 ambiguous — **AÇIK**

| Foto | # | Sınıf | Not |
|---|---|---|---|
| c1–c4 | 90 | gerçek silik (4) | D güçlü + Y silik; fit ~0.2 mm OK. 6a/7a/3a/4a ile aynı. |
| c1 | 97, 101, 102, 103, 104, 107, 108 | geometrik (7) | sağ sütun y≈67–114 mm; halka 2.50–2.64 mm veya tamamlık 63%. #104 6a’da D. |
| c2 | 97, 105, 107, 108, 116 | geometrik (5) | aynı bant. #116 6a’da Y; burada Y 67%. |
| c3 | 97 | geometrik (1) | D 2.59 mm OVER, Y 63%. |

**13 geometrik** (>2.5 mm veya completeness <70) · **4 gerçek silik #90**.

Sayfa-altı kalite değil; sağ sütun lokal warp. `maxOffsetMm` 3.0 **yapılmayacak** (bu görev / kullanıcı yasağı).

---

## 10. 8 invalid — **AÇIK**, fail-closed

Hepsi **Y** balonu: ~2.2–2.5 mm röfine sonrası disk/paper örneği boş → `zemini kirli`. D örnekleri boş değil.

| Foto | # | 6a | Yorum |
|---|---|---|---|
| c2 | 50, 51, 110, 111 | blank | boş madde, fail-closed |
| c3 | 105 | blank | fail-closed |
| c4 | 97, 98 | blank | fail-closed |
| c3 | **104** | **single/D** | D mürekkebi duruyor (cd≈0.49). Y boş örnek maddeyi invalid yapıyor. Bu fotoğrafta önceden ambiguous’du; yanlış D/Y üretilmedi. c2/c4 aynı maddeyi D okuyor. |

Kalite eşiği açılmadı. Bu 8’i “düzeltmek” için dirty-floor gevşetmek **yapılmayacak**.

---

## 11. Test / TypeScript / Build / CI — **DOĞRULANDI**

- `npx tsx --test tests/*.test.ts` — **101 pass / 0 fail**
- OMR safety alt kümesi — **27/27**
- `npx tsc --noEmit` — temiz
- `npm run build` — `optik-form.html` (yeniden koşuda diff yok)
- PR #11 CI `verify` — **SUCCESS**
- `clinicalTransferAllowed: false`
- Runtime OMRChecker’a bağlı değil

---

## 12. Git / PR

- Branch: `arena/01a0aa3d-repo123`
- Production HEAD: `9049673` — `fix(omr): search the printed ring out to the measured 2.5 mm C-series residual`
- PR: https://github.com/kaaradumaann-psi/Repo123/pull/11
- Yeni branch / yeni PR **açılmadı**.

---

## 13. Açık konular (yapılacaklar — production’a şu an dokunma)

1. **13 geometrik vaka** — sağ sütun 2.50–2.64 mm / tamamlık 54–67%. 3.0 mm bütçe **yasak** (kör yükseltme). Yeni ölçüm olmadan eşik açma.
2. **4 × #90 gerçek silik** — elle inceleme kalemi; kod sorunu değil.
3. **8 invalid fail-closed** — özellikle c3#104 (gerçek D, karşı Y boş örnek). Gevşetme yok.
4. **5a QR_UNREADABLE** — fiziksel; yeniden çekme.

---

## 14. Tekrarlanmasın

- 5a’yı zorla decode
- 6a’yı 5a ile karıştırma
- `squareWindow` eksen-bağımsız (hairline test 13)
- neighbour exclusion’ı kapatarak C-serisini “çözme”
- `probe-c-ring` 2.0–2.6 mm değerlerini gerçek kayma sayma
- E.2 nominal-bant tablosunu arama bütçesi yasağı sanma
- körlemesine `maxOffsetMm` 2.2 / 2.6 / 3.0
- completeness düşürme, margin/squareFill gevşetme, rastgele fallback
