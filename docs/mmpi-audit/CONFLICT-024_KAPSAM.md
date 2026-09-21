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


### D kod bloğu — devam (s.90-91)

| Kod | Kaynak | Kodda |
|---|---|---|
| `270` | s.90 | ❌ |
| `28/82` | s.90 | ✅ VAR |
| `281/821` | s.90 | ❌ |
| `284/824` | s.91 | ❌ |
| `482/842` | s.91 (atıf) | ❌ |
| `287/827` | s.91 | ❌ |
| `29/92` | s.91 | ✅ VAR |

**D bloğu güncel sayım:** Kodda **VAR 6** (`21/12`, `23`, `24/42`, `25/52`,
`26/62`, `27/72`, `28/82`, `29/92`) · **YOK 16+**


---

## D (2) alt testi kod bloğu — KAPANIŞ (s.82-92) · batch 7

| Kod | Kaynak | Kodda | Not |
|---|---|---|---|
| `21/12` | s.82 | ✅ VAR | |
| `23` | s.82-83 | ✅ VAR | |
| `24/42` | s.84 | ✅ VAR | |
| `25/52` | s.86 | ✅ VAR | |
| `26/62` | s.87 | ✅ VAR | |
| `27/72` | s.87 | ⚠️ VAR ama **metni 273/723'ün** (CONFLICT-030) | |
| `28/82` | s.90 | ✅ VAR | |
| `29/92` | s.91-92 | ✅ VAR | 3 tip birey + yüksek enerji ✓ |
| `20/02` | s.92 | ✅ VAR | tanı: Pasif-agresif ✓ |
| `270` | s.90 | ❌ YOK | → `27/72` kaydına düşüyor |
| `273/723` | s.88 | ❌ YOK | → `27/72` kaydına düşüyor |
| `274/724` | s.88 | ❌ YOK | → `27/72` kaydına düşüyor |
| `275/725` | s.88-89 | ❌ YOK | → `27/72` kaydına düşüyor |
| `278/728` | s.89 | ❌ YOK | → `27/72` kaydına düşüyor |
| `207` | s.92 | ❌ YOK | → `20/02` kaydına düşüyor |
| `281/821` | s.90 | ❌ YOK | |
| `284/824` | s.91 | ❌ YOK | |
| `482/842` | s.91 | ❌ YOK | atıf |
| `287/827` | s.91 | ❌ YOK | |
| `213/231` | s.83 | ❌ YOK | → `12/21`e düşüyor |
| `231/321`, `234/324`, `237/327` | s.83 | ❌ YOK | **"en sık üçlü kodlar"** |
| `243/432` | s.85 | ❌ YOK | |
| `247/427/472`, `742` | s.85 | ❌ YOK | → `24/42` · `47/74`e düşüyor |
| `248` (+`Yüksek F` alt-kodu) | s.86 | ❌ YOK | → `24/42`ye düşüyor |
| `271/721`, `270/720` | s.87 | ❌ YOK | **"en sık üçlü kodlar"** |

### D bloğu özeti

**Kodda VAR: 9** (`21/12`, `23`, `24/42`, `25/52`, `26/62`, `27/72`, `28/82`,
`29/92`, `20/02`) · **Kodda YOK: 18** (yukarıdaki ❌ satırları).

### ⚠️ Mekanizma kanıtı (batch 7 — CONFLICT-030)

`mmpiSourceCodes.ts:305` → `CODES[canonicalCode(code.slice(0, 2))]`

**Kırpma yalnızca "eksik" değil, "yanlış" sonuç üretir:** 13 farklı üçlü/dörtlü
kod **yanlış** iki-ölçekli kayda düşer. Örnek: `274/724` → `27/72` metni +
`seeAlso` **kullanıcıyı tekrar `274/724`'e yollar** (kapalı döngü).
Ayrıntı ve tam tablo: `CONFLICTS.md` → **CONFLICT-030**.

### Hs + D blokları toplamı (CONFLICT-024 kapsamı tamamlandı)

| Blok | Kodda VAR | Kodda YOK |
|---|---|---|
| Hs (s.63-78) | 9 | 22 (+3 alt-kod) |
| D (s.79-92) | 9 | 18 |
| **Toplam** | **18** | **40** |


---

## Hy (3) alt testi kod bloğu (s.95-100) — batch 8

| Kod | Kaynak | Kodda | Not |
|---|---|---|---|
| `Yüksek 3 / Yüksek K` | s.96 | ❌ YOK | F ve Sc düşük koşulu |
| `31` | s.96 | ✅ `13/31` | kaynak "(Bakınız 13/31 Kodu)" der → **atıf doğru** |
| `32` | s.96-97 | ❌ YOK | ⚠️ `23`e düşüyor → **CONFLICT-031** (D bloğunun metni) |
| `321` | s.97 | ❌ YOK | → `23`e düşüyor |
| `34/43` | s.97-98 | ✅ VAR | 3 varyant + göreceli yükseklik koşulu eksik |
| `Yüksek 3 / Düşük 4` | s.98 | ❌ YOK | |
| `34` (4 dominant) | s.98 | ❌ YOK | → `34/43`e düşüyor |
| `345/435/534` | s.99 | ❌ YOK | → `34/43`e düşüyor; **534 varyantı hiç erişilemez** |
| `346/436` | s.99 | ❌ YOK | → `36/63`e düşüyor |
| `35/53` | s.99 | ✅ VAR | |
| `36/63` | s.99-100 | ✅ VAR | |
| `54/45` notu | s.99 | ❌ YOK | "5'teki yükselmeyi dikkate almamak…" yorum kuralı |

### Blok toplamı

| Blok | Kodda VAR | Kodda YOK |
|---|---|---|
| Hs (s.63-78) | 9 | 22 (+3 alt-kod) |
| D (s.79-92) | 9 | 18 |
| **Hy (s.95-100, devam ediyor)** | **3** (`13/31`, `34/43`, `35/53`, `36/63` → sayım: 4) | **8** |
| **Genel toplam** | **22** | **48** |

Not: Hy bloğu **s.100+**'da devam ediyor (`36/63` metni s.100'e taşıyor).


---

## Hy (3) alt testi kod bloğu — DEVAM (s.100-101) · batch 9

| Kod | Kaynak | Kodda | Not |
|---|---|---|---|
| `36/63` devamı | s.100 | ✅ VAR | 5 T fark koşulu eksik |
| `37/73` | s.100 | ✅ VAR | içerik MATCH |
| `38/83` | s.101 | ✅ VAR | Olası Tanı: Şizofreni ✓ |
| `39/93` | s.101 | ✅ VAR | Si<40 T koşulu eksik |
| `30/03` | s.101 | ✅ VAR | |
| `394/934` | s.101 | ❌ YOK | **"en sık görülen üçlü kod tipi"** → `39/93`e düşüyor |

→ **Hy kod bloğu (s.95-101) kodda 8 VAR / 8 YOK.**

## 🆕 NEVROTİK ÜÇLÜ PROFİLLERİ (s.103-106) — **tamamı kodda YOK**

| # | Konfigürasyon | Kaynak koşulu | Şekil |
|---|---|---|---|
| 1 | **Konversiyon vadisi** | Hs ↑, Hy ↑, D ↓ | 17 |
| 2 | **Basamak orantısı** | üçü de >70 T, Hs>D>Hy | 18 |
| 3 | **Şapka** | Hs<70 T ∧ D>70 T ∧ Hy>70 T | 19 |
| 4 | **Yükselen eğilim** | üçü de >70 T, Hs<D<Hy | 20 |

Kod yalnızca **tek ölçek** ve **iki noktalı kod** katmanına sahiptir →
**CONFLICT-033 (P1)**. Üçlü kod altyapısı yokluğunun **ikinci ve daha ağır**
sonucu: bu örüntüler klinik yorum üretmez.

> **→ CHANGE-014 (2026-09-22):** 2-3-4 artık kodda (`neurotic-step` ·
> `neurotic-hat` · `neurotic-rising`; s.103-106 alıntıları `mmpiInterpretation.ts`
> desen katmanında), 1 (konversiyon vadisi) önceden vardı → **4/4 konfigürasyon
> temsil ediliyor**. Bu satırlar **kod tipi başlığı değildir**, yukarıdaki 148'lik
> başlık sayacını **değiştirmez** (desen katmanı → CONFLICT-033).

## Pd (4) kod bloğu I (s.111-113) — **5 VAR / 4 YOK**

| # | Kaynak başlığı | Sayfa | Kodda | Not |
|---|---|---|---|---|
| 1 | `41/14` | s.111 | **VAR** ✅ | kayıt `14/41` |
| 2 | `42/24` | s.111 | **VAR** ✅ | kayıt `24/42` |
| 3 | `43/34` | s.111 | **VAR** ✅ | kayıt `34/43` |
| 4 | **`Yüksek 4/Düşük 5`** | s.111-112 | **YOK** ❌ | tam sayfa metin (kadın/erkek/ergen ayrı) |
| 5 | `45/54` | s.112-113 | **VAR** ✅ | gövde MATCH; yaş/eğitim/cinsiyet direktifi eksik → CONFLICT-034 |
| 6 | **`456`** | s.113 | **YOK** ❌ | `codeInterpretation('456')` → `45/54` döndürüyor |
| 7 | `46/64` | s.113 | **VAR** ✅ | gövde + diagnosis MATCH |
| 8 | `468/648` | s.113 | **YOK** ❌ | 46/64 içinde atıf; `seeAlso`'da adı var, kaydı yok |
| 9 | `463/643` | s.113 | **YOK** ❌ | 46/64 içinde atıf; `seeAlso`'da adı var, kaydı yok |

## Pd (4) kod bloğu II (s.114-117) — **2 VAR / 8 YOK**

| # | Kaynak başlığı | Sayfa | Kodda | Not |
|---|---|---|---|---|
| 1 | `46/64` kapanışı (40 T koşulu + Yüksek4/Düşük5 atfı) | s.114-115 | **VAR** ✅ | gövde devamı MATCH |
| 2 | **`468/648`** | s.115 | **YOK** ❌ | paranoid şizofreni + **K<50, 5/4/6 5T alanı, 9&2>70** koşulu |
| 3 | **`469`** | s.115 | **YOK** ❌ | tek cümle: "46'ya ek olarak **test 9 > 70 T** → ani öfke patlamaları" |
| 4 | `47/74` | s.115-116 | **VAR** ✅ | gövde + seeAlso MATCH |
| 5 | **`247/427`** | s.115 | **YOK** ❌ | `seeAlso`'da adı var, gövdesi yok |
| 6 | **`274`** | s.115 | **YOK** ❌ | `47`'nin seeAlso'sunda — **D bloğunda da vardı** (batch 7) |
| 7 | **`478/748`** | s.116 | **YOK** ❌ | "en sık görülen 3'lü kodlardan biri" |
| 8 | **`472/742`** | s.116 | **YOK** ❌ | "en sık görülen 3'lü kodlardan biri" |
| 9 | `48/84` | s.116-117 | **VAR** ✅ | gövde + 3 diagnosis MATCH |
| 10 | **`482/842`, `486/846`, `489/849`** | s.116 | **YOK** ❌ | `seeAlso`'da ad var, gövde yok |

**Örüntü (kayıt):** `seeAlso` alanları **kayıtta olmayan kodlara** işaret ediyor —
`46/64` → `468/648`, `48/84` → `482/842, 486/846, 489/849`. Bu, CONFLICT-030'un
"kapalı döngü" bulgusunun bir başka biçimi: kullanıcı tıkladığında **kırpma
nedeniyle başka bir metne** düşüyor.

### Güncel genel toplam

| Blok | Kodda VAR | Kodda YOK |
|---|---|---|
| Hs (s.63-78) | 9 | 22 (+3 alt-kod) |
| D (s.79-92) | 9 | 18 |
| Hy (s.95-101) | 8 | 8 |
| Nevrotik üçlü profilleri (s.103-106) | 0 | 4 |
| Pd (s.111-113) — batch 11 | 5 | 4 |
| Pd (s.114-117) — batch 12 | 2 | 8 |
| Pd (s.118-121) — batch 13 | 2 | 6 |
| **Mf (s.122-125) — batch 14** | **6** | **1** |
| **Toplam** | **36** | **71** |

## Mf (5) kod bloğu (s.125-126) — **6 VAR / 1 YOK**

| # | Kaynak başlığı | Kodda | Not |
|---|---|---|---|
| 1 | `51/15` | **VAR** ✅ | kayıt `15/51` |
| 2 | `52/25` | **VAR** ✅ | kayıt `25/52` |
| 3 | `53/35` | **VAR** ✅ | kayıt `35/53` |
| 4 | `54/45` | **VAR** ✅ | kayıt `45/54` |
| 5 | `56/65` | **VAR** ✅ | gövde MATCH |
| 6 | **`564/654`** | **YOK** ❌ | `'564'` → `56/65` (kırpma) |
| 7 | `57/75` | **VAR** ✅ | |

## Pd (4) kod bloğu III (s.118-121) — **2 VAR / 6 YOK** — **Pd BLOĞU KAPANDI**

| # | Kaynak başlığı | Sayfa | Kodda | Not |
|---|---|---|---|---|
| 1 | **`482/842/824`** | s.118 | **YOK** ❌ | 48/84 + depresyon/anksiyete/intihar girişimi |
| 2 | **`489/849`** | s.118 | **YOK** ❌ | 48/84 + eyleme vuruk/şiddet |
| 3 | `49/94` | s.118-119 | **VAR** ✅ | gövde + diagnosis MATCH |
| 4 | **`493/943`** | s.119 | **YOK** ❌ | 49/94 + pasif-agresif |
| 5 | **`495/945`** | s.119 | **YOK** ❌ | Mf yükselmesi + cinsel yönelim |
| 6 | **`496/946`** | s.120 | **YOK** ❌ | homisidal davranış |
| 7 | **`498/948`** | s.120 | **YOK** ❌ | doğal olmayan davranış |
| 8 | `40/04` | s.120 | **VAR** ✅ | gövde MATCH · **"negatifik" ↔ "vegetatif"** sapması → CONFLICT-035 |

### Pd (4) bloğu — birleşik özet (s.107-120)

| | Sayı |
|---|---|
| İncelenen kod başlığı | **20** |
| Kodda VAR | **7** (`41/14`, `42/24`, `43/34`, `45/54`, `46/64`, `47/74`, `48/84`, `49/94`, `40/04` → kod kaydı olarak 9 kayıt) |
| Kodda YOK | **13** |

**Pd bloğundan açılan yeni çelişkiler:** CONFLICT-034 (yaş/eğitim/cinsiyet
direktifi) · CONFLICT-035 (terim sapması)

## Pa (6) kod bloğu (s.130-135) — **9 VAR / 6 YOK**

| # | Kaynak başlığı | Sayfa | Kodda | Not |
|---|---|---|---|---|
| 1 | `61/16` | s.130 | **VAR** ✅ | çapraz ref `16/61` |
| 2 | `62/26` | s.130 | **VAR** ✅ | çapraz ref `26/62` |
| 3 | `63/36` | s.130 | **VAR** ✅ | çapraz ref `36/63` |
| 4 | `64/46` | s.130-131 | **VAR** ✅ | ⚠️ ~~çağrı Pd bloğu `46/64` metnini döndürüyor~~ → **CHANGE-014: `Pa:46` ayrık kaydında, uyarı KAPANDI** (başlık sayacı değişmedi) |
| 5 | **`648`** | s.131 | **YOK** ❌ | `'648'` → `46/64` (kırpma) |
| 6 | `65/56` | s.131 | **VAR** ✅ | `56/65` (Pd bloğunda) |
| 7 | `67/76` | s.131 | **VAR** ✅ | ⚠️ kaynak Pd ve Pa bloğunda farklı bağlam → CONFLICT-031 |
| 8 | **`678/876`** | s.131 | **YOK** ❌ | `'678'` → `67/76` (kırpma) |
| 9 | **`679`** | s.132 | **YOK** ❌ | `'679'` → `67/76` (kırpma) |
| 10 | `68/86` | s.132 | **VAR** ✅ | sayısal "paranoid vadi" kuralı eksik → CONFLICT-027 |
| 11 | **`680/860`** | s.133 | **YOK** ❌ | `'680'` → `68/86` (kırpma) |
| 12 | `69/96` | s.133 | **VAR** ✅ | |
| 13 | **`694/964`** | s.133 | **YOK** ❌ | `'694'` → `69/96` (kırpma) |
| 14 | **`698/968`** | s.134 | **YOK** ❌ | `'698'` → `69/96` (kırpma) |
| 15 | `60/06` | s.134 | **VAR** ✅ | kayıt `06` |

### Ek örüntüler (kod başlığı değil, sayısal tarama kuralı)

| Örüntü | Kaynak kuralı | Kodda |
|---|---|---|
| **Paranoid vadi** (s.132) | `6 ≈ 8 ≈ 70 T` ∧ `7 = 6/8 − 10 T` | **YOK** ❌ |
| `698/968` → `68/86` geçişi (s.134) | "8, 6'dan **5 T puanı aşağıda** ise" | **YOK** ❌ |
| **456 Alt Testlerinin Örüntüsü** (s.134) | `4 > 65 T` ∧ `6 > 65 T` ∧ `5 = 35 T` (+ 3 yükselirse) | **YOK** ❌ |
| **Scarlett O'Hara vadisi** (s.135, Şekil 21) | `Pd ↑ · Mf ↓ · Pa ↑` | **YOK** ❌ (CONFLICT-033 kapsamı) |

**Pa bloğundan açılan yeni çelişki:** **CONFLICT-036** (`64/46` Pa bloğu gövdesi
eksik + yanlış metin dönüyor).

### Kümülatif kapsam (PHASE 9/10, blok blok)

| Blok | İncelenen | VAR | YOK |
|---|---|---|---|
| Hs (s.70-78) | 31 | 31 | 0 |
| D (s.79-92) | 27 | 9 | 18 |
| Hy (s.95-101) | 12 | 12 | 0 |
| Pd (s.107-120) | 20 | 9 | 13 |
| Mf (s.121-126) | 10 | 9 | 1 |
| **Pa (s.130-135)** | **15** | **9** | **6** |
| **TOPLAM** | **115** | **79** | **38** |

## Pt (7) kod bloğu (s.140-141) — **14 VAR / 1 YOK**

| # | Kaynak başlığı | Sayfa | Kodda | Not |
|---|---|---|---|---|
| 1 | `71/17` | s.140 | **VAR** ✅ | kayıt `17/71` |
| 2 | `72/27` | s.140 | **VAR** ✅ | kayıt `27/72` |
| 3 | `73/37` | s.140 | **VAR** ✅ | kayıt `37/73` |
| 4 | `74/47` | s.140 | **VAR** ✅ | kayıt `47/74` |
| 5 | `75/57` | s.140 | **VAR** ✅ | kayıt `57/75` |
| 6 | `76/67` | s.140 | **VAR** ✅ | kayıt `67/76` |
| 7 | `78/87` | s.140 | **VAR** ✅ | gövde MATCH · "5 T puanı" ve "75 T" koşulları dahil |
| 8 | `782` | s.141 | **VAR** ✅ *(diagnosis)* | kod `78/87` `diagnosis` alanında: "78/87 + Olası tanı" |
| 9 | `872` | s.141 | **VAR** ✅ *(diagnosis)* | `diagnosis` alanında |
| 10 | `784/874` | s.141 | **VAR** ✅ *(diagnosis)* | `diagnosis` alanında |
| 11 | **`789`** | s.141 | **YOK** ❌ | tam gövde: "Hostil, gergin, şüpheci, hiperaktif…" → `'789'`→`78/87` (kırpma) |
| 12 | `79/97` | s.141 | **VAR** ✅ | |
| — | `278/728`, `478/728`, `478/748` | s.140 | (çapraz ref) | kaynakta "bakınız"; ayrı gövde yok |

**Not:** `782`/`872`/`784/874` kaynakta **kısa "Olası Tanı" satırlarıdır** (tam
gövde değil); kod bunları `78/87` kaydının `diagnosis` alanında taşıyor → bu
tasarım **kaynağa uygun** kabul edildi.

## Batch 18 — Pt kapanışı + Sc bloğu (s.142, s.146)

| Kod | Kaynak sayfa | Kaynak | Kodda |
|---|---|---|---|
| **794** | s.142 | ✅ ("Hastalar kronik olarak kaygılı ve gergindirler…") | ❌ (`'794'` → `79/97` kırpma) |
| **8726/Yüksek 9** | s.146 | ✅ ("Ajite şizofren bir hastayı göstermektedir.") | ❌ (`'8726'` → `78/87` kırpma) |

İki-ölçekli ama **gövdesi eksik** olan başlık (bu dosyanın değil, CONFLICT-031'in
konusu): `87/78` — Sc bloğunun metni kodda yok, `87` çağrısı Pt bloğunun `78/87`
metnini döndürüyor.

`86/68` Sc bloğunda **VAR** sayıldı: gövde, Pa bloğu kaydının (`68/86`) son
cümlesinde mevcut; yalnız "7 de 70 T puanındadır" eşiği kayıp (CONFLICT-027).
`81/18 · 82/28 · 83/38 · 84/48 · 85/58` beş başlık kaynakta **"Bakınız"**
çapraz referansıdır → ayrı gövde beklenmez, **UYUMLU** (CONFLICT-024 dışı).

### Kümülatif kapsam (PHASE 9/10)

| Blok | İncelenen | VAR | YOK |
|---|---|---|---|
| Hs (s.63-78) | 31 | 31 | 0 |
| D (s.79-92) | 27 | 9 | 18 |
| Hy (s.95-101) | 12 | 12 | 0 |
| Pd (s.107-120) | 20 | 9 | 13 |
| Mf (s.121-126) | 10 | 9 | 1 |
| Pa (s.130-135) | 15 | 9 | 6 |
| Pt (s.137-141) | 15 | 14 | 1 |
| **Pt KAPANIŞI (s.142)** | **2** | **1** | **1** |
| Sc (s.146) | 8 | 6 | 2 |
| **Sc KAPANIŞI (s.147-148)** | **2** | **2** | **0** |
| **TOPLAM** | **142** | **102** | **42** |


> **FINAL sayım notu (batch 18):** yukarıdaki tablo satır satır toplanarak
> **140 / 100 / 42** bulundu. Tablodaki **Hs satırı** ("31 | 31 | 0") ile
> CONFLICT-024'ün Hs kapsamı (**9 VAR / 22 YOK**) hâlâ uzlaştırılmadı — bu satır
> batch 1-2 kayıtlarından geldiği gibi bırakıldı; **tüm blok seti çıkarıldıktan
> sonraki FINAL sayımında** düzeltilecek (VAR+YOK ≠ İncelenen olan tek satır odur).
> **Pt satırı** batch 18 ile 15 → **17 başlığa** çıktı (s.142 kapanışı: `794` YOK,
> `70/07` VAR); **Sc satırı** yeni eklendi (s.146: 8 başlık → 6 VAR / 2 YOK).

## Sc bloğu kapanış sayımı (s.147-148) — **2 VAR / 0 YOK**

| # | Kaynak başlığı | Sayfa | Kodda | Not |
|---|---|---|---|---|
| 1 | `89/98` | s.147-148 | **VAR** ✅ | gövde sadık (8/10 parça) · `diagnosis` = "Şizofreni / Madde kullanımına bağlı psikoz" ✅ · **eksik cümle:** "Yaşı 27'den küçük olanlarda görülür, üçüncü yükselen alt test 4, 7 ya da 6'dır." → CONFLICT-025/027/034 |
| 2 | `80/08` | s.148 | **VAR** ✅ | gövde sadık (7/8 parça) · `diagnosis` = "Şizoid Kişilik" ✅ · **eksik cümle:** "Bu kod tipindeki 7 ve 2 alt testleri en yüksek üçüncü testtir." → CONFLICT-025/027 |
| — | **Şekil 22 Paranoid Vadi** (Pa↑ Pt↓ Sc↑) | s.147 | **YOK** ❌ | kod tipi değil, **üç-ölçekli konfigürasyon** → CONFLICT-033 (kapsamı 5 → 6) |

**Blok toplamı (Sc, s.143-148): 10 başlık → 8 VAR / 2 YOK.** s.149-150'de (Ma
girişi + Tablo 16 + Graham listeleri) kod tipi başlığı yok → kapsam sayımı
değişmez.

## Ma (9) bloğu + Si (0) girişi (s.149-156) — batch 20 sayımı

| # | Kaynak başlığı | Sayfa | Kodda | Not |
|---|---|---|---|---|
| — | '9. Hipomani (Ma) Alt Testi' girişi + **Tablo 16** + Graham listeleri | s.149-150 | (kod tipi değil) | Tablo 16 P0 ✅ MATCH (batch 19); listeler CONFLICT-026 |
| 1 | **Yüksek 9/Yüksek K Kodu** | s.152 | **YOK** ❌ | 4 sayısal koşul → CONFLICT-039 + 027 (+4) |
| 2 | **Yüksek 9/Düşük K Kodu** | s.153 | **YOK** ❌ | CONFLICT-039 |
| 3 | **91/19 Kodu (Ayrıca 19/91 Koduna da Bakınız)** | s.153 | **VAR** ✅ *(CHANGE-014 sonrası)* | eski kayıt: kanonik `'19'` = s.77 Hs gövdesiydi → **CONFLICT-036 vaka 2 KAPANDI** (`Ma:19` ayrık kaydı) |
| — | `92/29 · 93/39 · 94/49 · 95/59 · 96/69 · 97/79 · 98/89` **(Bakınız)** | s.153 | ✅ UYUMLU | 7 çapraz ref, hedefler mevcut → başlık sayılmaz |
| — | not: 'Eyleme vuruk davranış ile ilgilidir' | s.153 | **YOK** ❌ | CONFLICT-025 (+1) — başlık değil |
| 4 | **90/09 Kodu** | s.153 | **VAR** ✅ | gövde 5/5 sadık |
| — | Si girişi + **Tablo 17** + Si listeleri | s.154-156 | (kod tipi değil) | **s.154 BOŞ SAYFA**; Tablo 17 P0 ✅ MATCH → CONFLICT-026 (listeler) |

**Batch 20 deltası: +4 başlık → 1 VAR / 3 YOK.**

| | Başlık | VAR | YOK |
|---|---|---|---|
| **Kümülatif (batch 20 sonrası)** | **146** | **103** | **45** |

> ⚠️ **TOPLAM satırlarında tarihî tutarsızlık** (VAR + YOK ≠ Başlık; kök neden: Hs
> satırının 31|31|0 kaydı ile anlatının '9 VAR / 22 YOK' demesi). Batch deltaları
> kesindir; **kesin toplam FINAL'da `SOURCE_INDEX` üzerinden yeniden sayılacak**
> (sessizce 'düzeltme' yapılmıyor).

## Si (0) bloğu kapanışı (s.157-158) — **0 VAR / 2 YOK** · **BÖLÜM 5 TARAMASI BİTTİ**

| # | Kaynak başlığı | Sayfa | Kodda | Not |
|---|---|---|---|---|
| 1 | **`049 Kodu`** | s.157 | **VAR** ✅ *(CHANGE-014 sonrası)* | eski kayıt: ~~**YOK** ❌~~ | "Psikiyatrik olgularda eyleme vurukluğun bastırılması" — CODES'ta gövde yok; `codeInterpretation('049')` → **`40/04`** metni (CONFLICT-030 somut vaka) |
| 2 | **`027(8) Kodu`** | s.157 | **VAR** ✅ *(CHANGE-014 sonrası)* | eski kayıt: ~~**YOK** ❌~~ | "Bireyde güçlü ruminatif davranışlar görülebilir." — yok; `codeInterpretation('027(8)')` → **`20/02`** metni; parantezli notasyon modelde adreslenemiyor |
| — | 9 Bakınız çifti (`01/10`…`09/90`) | s.157 | **UYUMLU** ✅ | gövde beklenmez; hedef kayıtlar 9/9 mevcut, etiketler birebir |
| — | Si T bantları (4) + giriş paragrafı | s.157 | kodda **VAR** | `SI_T_BANDS` 4/4 bant; 70+ bandında 2 kuyruk cümlesi eksik → 025/033 |
| — | **s.158** | p87 L | — | **BOŞ SAYFA** (koyu piksel %0.62) → bölüm s.157'de kapanır |

| Blok | Başlık | VAR | YOK |
|---|---|---|---|
| **Si KAPANIŞI (s.157-158)** | **2** | **0** | **2** |
| **TOPLAM (Bölüm 5 · s.63-157)** | **148** | **103** | **47** |

> ⚠️ **Sütunlar birbirini tutmuyor** (148 ≠ 103+47=150): tarihsel satırlardaki kayma
> batch 11-20 boyunca birikti (ör. Hs satırı 31|31|0 ↔ anlatıda 9 VAR/22 YOK).
> Başlık sayısı **kendi batch farkıyla**, VAR/YOK kümülatif **önceki satırdan** taşınır.
> **FINAL'da tek seferde yeniden sayılacak** — eski satırlar sessizce düzeltilmiyor.

> **Not:** batch 20 satırında "kümülatif 146 → 103 VAR / 45 YOK" yazıyordu; bu tur
> **yalnız +2 YOK** eklendi (049, 027(8)) → **148 → 103/45+2 = 47**. TOPLAM
> satırlarındaki **tarihsel tutarsızlık** (Hs satırı "31/31/0" ↔ anlatıda "9 VAR /
> 22 YOK") **FINAL'da yeniden sayılarak** çözülecek; eski satırlar sessizce
> düzeltilmiyor (denetim ilkesi).

## CHANGE-014 (DECISION-029/A) sonrası sayım — 2026-09-22

Kod tarafı değişti; **başlık evreni aynı**, yalnız 3 başlık YOK → VAR döndü:

| # | Başlık | Sayfa | Eski | Yeni | Nerede |
|---|---|---|---|---|---|
| 1 | **`91/19 Kodu`** | s.153 | YOK ❌ | **VAR** ✅ | `BLOCK_CODES['Ma:19']` |
| 2 | **`049 Kodu`** | s.157 | YOK ❌ | **VAR** ✅ | `BLOCK_CODES['Si:049']` |
| 3 | **`027(8) Kodu`** | s.157 | YOK ❌ | **VAR** ✅ | `BLOCK_CODES['Si:027']` |
| — | **`64/46 Kodu`** | s.130-131 | VAR (başlık) + ⚠️ yanlış blok metni | VAR + ⚠️ **kaldı** | `BLOCK_CODES['Pa:46']` — sayaç **değişmez** |

| Blok | Başlık | VAR | YOK |
|---|---|---|---|
| **TOPLAM (Bölüm 5 · s.63-157) — CHANGE-014 sonrası** | **148** | **106** | **44** |

> Sayım kuralı aynı: **batch deltası kesin, eski satırlar sessizce düzeltilmiyor**
> (üstteki ⚠️ uyarıları duruyor; FINAL'da `SOURCE_INDEX` üzerinden yeniden sayılacak).
> **Kalan 44 YOK = içerik işi**: kod modeli artık onları taşıyabilecek durumda
> (`BLOCK_CODES` + `parseCode` varyantları), ama DECISION-028 gereği **okunmamış
> gövde yazılmaz** — 44 başlığın kaynak taraması BÖLÜM 5'te yapıldı, gövdelerin
> tamamı henüz koda alınmadı (DECISION-029 kabulü bunu zorunlu kılmıyordu).
> Ayrıca **kırpma kalktığı için** eşleşmeyen 3+ haneli kodlar (ör. `794`, `8726`)
> artık **alakasız metin değil `undefined`** döndürüyor.
