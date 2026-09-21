# CONFLICT-024 — Üçlü/dörtlü kod tipi kapsamı (ara çalışma)

> Bu dosya, kaynağın üçlü/dörtlü kod seti **tamamen** çıkarılana kadar
> CONFLICT-024'ün kapsamını biriktirir. Karar, set tamamlandıktan sonra
> DECISIONS.md'ye yazılır.

## Kaynakta tanımlı, kodda OLMAYAN kod tipleri

| Kod | Kaynak sayfa | Kaynak | Kodda |
|---|---|---|---|
| 123/213 | s.68-69 | ✅ | ❌ |
| 1234 | s.69 | ✅ | ❌ |
| 1236 | s.69 | ✅ | ❌ |
| 1237 | s.70 | ✅ | ❌ |
| 1270 | s.70 | ✅ | ❌ |
| 12378 | s.70 | ✅ | ❌ |
| 128/218 | s.70 | ✅ | ❌ |
| 129/219 | s.70 | ✅ | ❌ |
| 120/210 | s.71 | ✅ | ❌ |
| 13/31 Yüksek K | s.72 | ✅ (alt-kod) | ❌ (yalnız metin içinde) |
| 13/31 / Düşük 2 | s.72 | ✅ (alt-kod) | ❌ |
| 132/312 | s.72 | ✅ | ❌ |
| 134/314 | s.72 | ✅ | ❌ |
| 1342 | s.73 | ✅ | ❌ |
| 136/316 | s.73 | ✅ | ❌ |
| 137 | s.73 | ✅ | ❌ |
| 138/318 | s.73 | ✅ | ❌ |
| 1382 | s.74 | ✅ | ❌ |
| 139 | s.74 | ✅ | ❌ |
| Yüksek 1 / Düşük 4 | s.75 | ✅ (alt-kod) | ❌ |
| 146 | s.75 | ✅ | ❌ |
| 1469 | s.75 | ✅ | ❌ |
| 182/812, 183/813, 187/817 | s.77 | ✅ (atıf) | ❌ |
| 143/413, 142/412 | s.75 | ✅ (atıf) | ❌ |
| 172/712, 173/713 | s.76 | ✅ (atıf) | ❌ |
| 10/01 | s.78 | ✅ | ✅ (MATCH) |

## Hs kod bloğu kapanış sayımı (s.67-78)

Kaynak, **yalnızca Hs (1) alt testi** bölümünde **31 kod tipi bölümü** tanımlıyor:
- Kodda **mevcut (9):** `12`, `13`, `14`, `15`, `16`, `17`, `18`, `19`, `01`
  → **gövde metinleri sadık (MATCH)**, ancak koşullu ek cümleler eksik
- Kodda **YOK (22):** `123`, `1234`, `1236`, `1237`, `1270`, `12378`, `128`,
  `129`, `120`, `132`, `134`, `1342`, `136`, `137`, `138`, `1382`, `139`,
  `146`, `1469` + 3 **alt-kod** (`13/31 Yüksek K`, `13/31 Düşük 2`,
  `Yüksek 1/Düşük 4`) + 6 **atıf** (`2134`, `213/231`, `182/812`, `183/813`,
  `187/817`, `143/413`, `142/412`, `172/712`, `173/713`)

### Mevcut 9 kodun doğrulama sonucu

| Kod | Gövde | Koşullu ek cümle |
|---|---|---|
| 12 | ✅ MATCH | ❌ lise/ergen paragrafları (s.68) |
| 13 | ✅ MATCH | ⚠️ Yüksek K koşulu metin içinde gömülü |
| 14 | ✅ MATCH | ❌ "143/413 ve 142/412" (s.75) |
| 15 | ✅ MATCH | ✅ seeAlso var |
| 16 | ✅ MATCH | ❌ "erkeklerde 2 ve 4'ün, kadınlarda 3 ve 8'in üçlü yükselmesi" (s.76) |
| 17 | ✅ MATCH | ❌ "172/712 ve 173/713 sık görülür" (s.76) |
| 18 | ✅ MATCH | ❌ üçlü kod atıfları (s.77) |
| 19 | ✅ MATCH | ❌ "2 ve 3 → 129/139" atfı |
| 01 | ✅ MATCH | ✅ tam |

| 2134 | s.69 | ✅ (atıf) | ❌ |
| 213/231 | s.68-69 | ✅ (atıf) | ❌ |

**Kodun mevcut durumu:** `mmpiScoring.ts:258` → `slice(0, 2)` = yalnızca en
yüksek **2** klinik ölçek. `CODES` sözlüğü: **45 iki noktalı kod**, 0 üçlü kod.

## Koşullu yorumlar (kaynaktan)

Kaynak yorumları yalnızca koda değil, **ek koşullara** da bağlıyor:
- 12/21: "1 ve 2 arasında **5 T puanı** fark varsa 21'e bakılır"
- 1237: "**K 50 T puanından düşükse**"
- 120/210: "**8 ve 6 birlikte yükselmişse** şizoid biçim"
- 13/31: "**2, 7, 8 ve 9 yükselmiş ve K düşmüşse**"; "**L ve K da yükselirse**"
- 136/316: "**Pa, Hy'den 10 T puanından daha yüksekse** şüphecilik ve kızgınlık";
  "**Hy, Pa'dan 10 ya da daha fazla T puanı yüksekse** paranoid…"
- 138: "**4 alt testinde yükselme varsa ve K düşmüşse** mücadeleci ve …"
- 14/41: "**Çok genel olarak görülen üçlü kodlar 143/413 ve 142/412'dir.**"

Kodda bu koşul katmanı **yok** (yalnızca `seeAlso` metinleri).


---

## D (2) alt testi kod bloğu (s.82-94) — devam ediyor

### Kodda VAR (2)
| Kod | Kaynak | Durum |
|---|---|---|
| `21/12` | s.82 | ✅ tanımlı |
| `23` | s.82-83 | ✅ tanımlı |

### Kodda YOK (D bloğunda şu ana kadar)
| Kod | Kaynak | Not |
|---|---|---|
| `213/231` | s.83 | "Ayrıca 123 koduna da bakınız" |
| `231/321`, `234/324`, `237/327` | s.83 | "**En sık üçlü kodlar**" |
| `237`, `239` | s.83 | atıf |
| `243/432` | s.85 | "24/42'ye ek olarak" |
| `247/427/472`, `742` | s.85 | "Ayrıca 274'e bakınız" |
| `248` | s.86 | |
| `248 / Yüksek F` | s.86 | alt-kod ("Temel şizofrenik konfigürasyon") |
| `26/62` | s.87 | **Pa ve/veya 4,8 > 70 T → psikoz erken dönem** |
| `27/72` | s.87 | **85 T üstü → ilaç gerekli** |
| `275/725`, `278/728`, `273/723`, `271/721`, `270/720` | s.87 | "en sık üçlü kodlar" |
| `24/42` + atıflar `3, 7 ya da 8` | s.84 | üçüncü yükselen test |

### D (2) alt testi kod bloğu — KAPANIŞ (s.82-87)

**Kodda VAR (4):** `21/12`, `23`, `24/42`, `25/52`, `26/62`, `27/72`
**Kodda YOK (12+):** `213/231`, `231/321`, `234/324`, `237/327`, `239`, `243/432`,
`247/427/472`, `742`, `274`, `248`, `248+YüksekF`, `275/725`, `278/728`,
`273/723`, `271/721`, `270/720`, `Nat`

### Kritik kaynak cümlesi (s.83, D bloğu)
> "**En sık üçlü kodlar 231/321, 234/324 ve 237/327'dir.**"

→ Kaynak, üçlü kodları yalnızca tanımlamıyor; **frekans sırası** bile veriyor.
Kodda üçlü kod altyapısı **hiç yok** (CONFLICT-024).
