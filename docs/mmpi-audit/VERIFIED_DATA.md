# Verified MMPI Data

Kaynakta **kesin olarak doğrulanan** veriler. Hızlı referans dosyası.
Her değer `SOURCE_FACTS.md` içindeki bir ID'ye bağlıdır.

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
