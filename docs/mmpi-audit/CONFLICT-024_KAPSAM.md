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

### Güncel genel toplam

| Blok | Kodda VAR | Kodda YOK |
|---|---|---|
| Hs (s.63-78) | 9 | 22 (+3 alt-kod) |
| D (s.79-92) | 9 | 18 |
| Hy (s.95-101) | 8 | 8 |
| Nevrotik üçlü profilleri (s.103-106) | 0 | 4 |
| **Pd (s.111-113) — batch 11** | **5** | **4** |
| **Toplam** | **31** | **56** |
