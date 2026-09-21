# Verified MMPI Data

Kaynakta **kesin olarak doğrulanan** veriler. Hızlı referans dosyası.
Her değer `SOURCE_FACTS.md` içindeki bir ID'ye bağlıdır.

## ⚑ NORM KATMANI — `TURKISH_NORMS` 26/26 HÜCRE VERIFIED

Kaynak: **Tablo 30**, "Normal Türk, Erkek ve Kadınların MMPI Alt Testlerindeki
Ortalama ve Standart Sapmaları", **kitap s.195** (PDF p105 R) · `SOURCE-NORM-001`
Örneklem: 1003 erkek / 663 kadın (Bölüm 8 standardizasyon, s.191)
Doğrulama: tam sayfa görsel okuma (OCR bu sayfayı boş döndürdü) +
`scripts/mmpi-audit/compare-norms.py` → **MATCH=26 DIFF=0**
Kalıcı test: `tests/mmpiKeyIntegrity.test.ts` → "Türk normları — Tablo 30"

| Ölçek | Erkek X̄ | SD | Kadın X̄ | SD |
|---|---|---|---|---|
| L | 6.45 | 2.74 | 6.00 | 2.25 |
| F | 8.30 | 4.62 | 9.38 | 5.16 |
| K | 13.98 | 4.65 | 11.82 | 3.80 |
| Hs | 13.19 | 4.07 | 15.89 | 4.88 |
| D | 20.63 | 4.76 | 23.86 | 5.08 |
| Hy | 19.31 | 4.71 | 18.12 | 5.31 |
| Pd | 22.22 | 4.45 | 22.84 | 4.51 |
| Mf | 29.21 | 3.82 | 32.98 | 3.67 |
| Pa | 11.12 | 4.03 | 11.93 | 4.17 |
| Pt | 27.90 | 6.30 | 29.20 | 6.59 |
| Sc | 29.82 | 9.05 | 31.06 | 8.20 |
| Ma | 19.96 | 4.40 | 19.72 | 4.36 |
| Si | 23.86 | 7.97 | 29.88 | 7.52 |

**K düzeltmesi doğrulandı:** Tablo 30, K eklenmiş (Hs+.5K, Pd+.4K, Pt+1K,
Sc+1K, Ma+.2K) ve eklenmemiş satırları ayrı verir. Kod, T dönüşümünden önce
K düzeltmesini uyguladığı için **doğru satırları** kullanır.

**Kaynak iki yerde çelişir (kayıt):** Geçerlik bölümü dipnotları
(s.34: F kadın 10.11 · s.38: K erkek 13.90, K kadın 13.54) Tablo 30 ile
uyuşmaz. Kod Tablo 30'u izler → `CONFLICT-001`/`CONFLICT-002` **REJECTED**.

**Örneklem sınırı (yorum için önemli):** Örneklem "normal Türk toplumu" değil,
**16-30 yaş ağırlıklı, eğitimli, kentli** bir gruptur (%85 bekâr; %84.88 büyük
kent; orta+lise %54.29 + üniversite %47.21). Kaynak kitap da 31-50 yaş
aralığının **yetersiz temsil edildiğini** belirtir (s.192).

---

## Sürüm

| Alan | Değer | Kaynak | Durum |
|---|---|---|---|
| Ölçek | MMPI (orijinal) / 566 madde (550 + 16 tekrar) | s.1 · `SOURCE-VERSION-001` | VERIFIED |
| Geçerlik alt testleri | (?) L F K | s.1 · `SOURCE-VERSION-002` | VERIFIED |
| Klinik alt testler | Hs D Hy Pd Mf Pa Pt Sc Ma Si | s.1 · `SOURCE-VERSION-002` | VERIFIED |

---

## Geçerlik — (?) Bir şey diyemem

Ham puan bantları (Tablo 2, s.30 · `SOURCE-VALIDITY-CANNOTSAY-001`):

| Ham | Düzey | Kod karşılığı |
|---|---|---|
| 0 | Düşük | `CANNOT_SAY_RAW_BANDS[0]` ✅ MATCH |
| 1-5 | Normal | `[1]` ✅ MATCH |
| 6-30 | Orta | `[2]` ✅ MATCH |
| 31+ | Geçersiz | `[3]` ✅ MATCH (kod etiketi "Belirgin") |

---

## Geçerlik — L

### Madde anahtarı (Tablo 3, s.31 · `SOURCE-VALIDITY-L-001`) — **VERIFIED**

Yön: **tamamı Yanlış (Y)**

```
15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 195, 225, 255, 285
```

Kod (`mmpiKeys.ts` → `SCORING_KEYS.L.falseItems`): **birebir aynı** ✅ MATCH

### Normlar (Tablo 3 dipnotu, s.31 · `SOURCE-VALIDITY-L-002`) — **VERIFIED**

| Cinsiyet | Ortalama | Kod | Durum |
|---|---|---|---|
| Erkek | 6.45 | 6.45 | ✅ MATCH |
| Kadın | 6.00 | 6.00 | ✅ MATCH |

### T bantları (s.33 · `SOURCE-VALIDITY-L-003`) — **VERIFIED**

`≥69` · `64-68` · `59-63` · `36-55` · `≤35`
→ kod `56-63` kullanır: bkz. `CONFLICTS.md` CONFLICT-003

---

## Geçerlik — F

### Madde anahtarı (Tablo 4, s.34 · `SOURCE-VALIDITY-F-001`) — **VERIFIED**

Yön Doğru (44 madde):
```
14, 23, 27, 31, 34, 35, 40, 42, 48, 49, 50, 53, 56, 66, 85, 121, 123, 139, 146,
151, 156, 168, 184, 197, 200, 202, 205, 206, 209, 210, 211, 215, 218, 227, 245,
246, 247, 252, 256, 269, 275, 286, 291, 293
```
Yön Yanlış (20 madde):
```
17, 20, 54, 65, 75, 83, 112, 113, 115, 164, 169, 177, 185, 196, 199, 220, 257,
258, 272, 276
```

Kod (`SCORING_KEYS.F`): **birebir aynı** ✅ MATCH

### Normlar (Tablo 4 dipnotu, s.34 · `SOURCE-VALIDITY-F-002`) — **VERIFIED**

| Cinsiyet | Kaynak | Kod | Durum |
|---|---|---|---|
| Erkek | 8.30 | 8.30 | ✅ MATCH |
| Kadın | **10.11** | **9.38** | ❌ CONFLICT-001 (P0) |

### Ham puan bantları (s.34-35 · `SOURCE-VALIDITY-F-003`) — **VERIFIED**

`0-2` · `3-9` · `10-15` · `16-25` · `26+`
→ kod `0-2` · `3-7` · `8-15` · `16-22` · `23+`: bkz. CONFLICT-004

### T bantları (s.37 · `SOURCE-VALIDITY-F-005`) — **VERIFIED**

`≥80` · `70-79` · `55-69` · `44-54` · `<45`
→ kod eşdeğer bölümleme kullanır (CONFLICT-006, kabul edildi)

---

## Geçerlik — K

### Madde anahtarı (Tablo 5, s.38 · `SOURCE-VALIDITY-K-001`) — **VERIFIED**

Yön Doğru (1 madde): `96`
Yön Yanlış (28 madde):
```
30, 39, 71, 89, 124, 129, 134, 138, 142, 148, 170, 171, 180, 183, 217, 234,
267, 272, 296, 316, 322, 374, 383, 397, 398, 406, 461, 502
```

Kod (`SCORING_KEYS.K`): **birebir aynı** ✅ MATCH

### Normlar (Tablo 5 dipnotu, s.38 · `SOURCE-VALIDITY-K-002`) — **VERIFIED**

| Cinsiyet | Kaynak | Kod | Durum |
|---|---|---|---|
| Erkek | **13.90** | **13.98** | ❌ CONFLICT-002 (P0, yazım farkı) |
| Kadın | **13.54** | **11.82** | ❌ CONFLICT-002 (P0, maddi fark) |

### T bantları (s.40 · `SOURCE-VALIDITY-K-003`) — **VERIFIED**

`≥72` · `61-72` · `46-60` · `27-45`
→ kod `≥72` · `61-71` · `46-60` · `≤45`: eşdeğer bölümleme (CONFLICT-006)

### Yapısal kural (s.40 · `SOURCE-VALIDITY-K-004`) — **VERIFIED**

"K alt testi, profili geçersiz yapacak belirgin değerlerin olmadığı tek alt testtir."
→ K hiçbir zaman tek başına profili geçersiz kılmaz; kod bu davranışı
`VALIDITY_CUTOFFS` içinde yalnızca (?) ve F ile uygular ✅ davranış MATCH

---

# Ek 9 — Madde anahtarları (kitap s.244-256)

**Karşılaştırma sonucu (düzeltme sonrası): 46 MATCH / 0 DIFF / 0 MISSING**

Önceki durum: 41 MATCH / 5 DIFF → `CODE_CHANGES.md` CHANGE-001..005

Araç: `scripts/mmpi-audit/compare-keys.py`
Sütun `Doğrulama`: `V` = görsel doğrulandı · `O` = yalnızca OCR

## Geçerlik ve klinik ölçekler

| Ölçek | Madde | Kaynak | Kod | Sonuç | Doğrulama |
|---|---|---|---|---|---|
| L | 15 | 15 | 15 | ✅ MATCH | V |
| F | 64 | 64 | 64 | ✅ MATCH (düzeltildi) | V |
| K | 30 | 30 | 30 | ✅ MATCH | V |
| Hs | 33 | 33 | 33 | ✅ MATCH | O |
| D | 60 | 60 | 60 | ✅ MATCH | O |
| Hy | 60 | 60 | 60 | ✅ MATCH | O |
| Pd | 50 | 50 | 50 | ✅ MATCH | O |
| Mf (E) | 60 | 60 | 60 | ✅ MATCH | V |
| Mf (K) | 60 | 60 | 60 | ✅ MATCH | V |
| Pa | 40 | 40 | 40 | ✅ MATCH | O |
| Pt | 48 | 48 | 48 | ✅ MATCH | O |
| Sc | 78 | 78 | 78 | ✅ MATCH | O |
| Ma | 46 | 46 | 46 | ✅ MATCH | O |
| Si | 70 | 70 | 70 | ✅ MATCH | O |

**Kritik doğrulama (Mf cinsiyet kuralı):** Kitap s.245 dipnotu
"(*) işareti sorular kadınlarda ters yönde puan almaktadır" der ve
**69, 179, 231, 297, 133** maddelerini işaretler. Kodun kadın anahtarı bu beş
maddenin tamamını doğru şekilde ters çevirmiştir ✅

## Kişilik bozuklukları testi (kitap s.248-250)

| Ölçek | Kaynak | Kod | Sonuç | Doğrulama |
|---|---|---|---|---|
| PAR | 22 | 22 | ✅ MATCH | O |
| SZD | 22 | 22 | ✅ MATCH | O |
| STY | 36 | 36 | ✅ MATCH | O |
| ANT | 25 | 25 | ✅ MATCH | O |
| BDL | 22 | 22 | ✅ MATCH | V |
| HST | 20 | 20 | ✅ MATCH (düzeltildi) | V |
| NAR | 31 | 31 | ✅ MATCH | V |
| AVD | 38 | 38 | ✅ MATCH (düzeltildi) | V |
| DEP | 20 | 20 | ✅ MATCH | V |
| CPS | 15 | 15 | ✅ MATCH | O |
| PAG | 14 | 14 | ✅ MATCH | O |

## Alkol ölçekleri (kitap s.251)

| Ölçek | Kaynak | Kod | Sonuç | Doğrulama |
|---|---|---|---|---|
| MAC | 49 (dipnot: #215 ve #460 çıkarıldı) | 49 | ✅ MATCH | V |
| ICAS | 8 | 8 | ✅ MATCH | O |

## Wiggins içerik skalaları (kitap s.252-255)

| Ölçek | Kaynak | Kod | Sonuç | Doğrulama |
|---|---|---|---|---|
| SOC | 27 | 27 | ✅ MATCH | O |
| DEP_W | 33 | 33 | ✅ MATCH | O |
| FEM | 30 | 30 | ✅ MATCH (düzeltildi) | V |
| MOR | 23 | 23 | ✅ MATCH | O |
| REL | 12 | 12 | ✅ MATCH | O |
| AUT | 20 | 20 | ✅ MATCH | O |
| PSY | 48 | 48 | ✅ MATCH | O |
| ORG | 36 | 36 | ✅ MATCH | O |
| FAM | 16 | 16 | ✅ MATCH | O |
| HOS | 27 | 27 | ✅ MATCH | O |
| PHO | 27 | 27 | ✅ MATCH | O |
| HYP | 25 | 25 | ✅ MATCH | O |
| HEA | 28 | 28 | ✅ MATCH | O |

## Özel ölçekler (kitap s.255-256)

| Ölçek | Kaynak | Kod | Sonuç | Doğrulama |
|---|---|---|---|---|
| OH | 33 (başlık) / **31** (tablo) | 31 | ✅ MATCH (tablo izlenir) | V |
| Es | 68 | 68 | ✅ MATCH (düzeltildi) | V |
| A | 39 | 39 | ✅ MATCH | O |
| R | 40 | 40 | ✅ MATCH | O |
| Do | 28 | 28 | ✅ MATCH | O |
| Dy | 57 | 57 | ✅ MATCH | O |
