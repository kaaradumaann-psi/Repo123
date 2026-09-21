# Test Audit

Test/regresyon sonuçları. Bir scoring değişikliğinden sonra
`npm run typecheck` + `npm test` + `npm run build` çalıştırılır ve sonuç
buraya + `CODE_CHANGES.md`'ye yazılır.

---

## BASELINE — 2026-09-21 (Oturum 1, değişiklik öncesi)

Komut:
```bash
npm install     # 74 paket, 4 sn
npm test        # tsx --test tests/*.test.ts
```

Sonuç:
```
# tests  287
# suites 18
# pass   287
# fail   0
# duration_ms 118802
```

Yorum:
Denetim öncesi motor sağlıklı. Bu baseline, ileride yapılacak scoring
değişikliklerinde **regresyon referansı** olarak kullanılacaktır.

`npm run typecheck` ve `npm run build` bu oturumda çalıştırılmadı
(kod değişikliği yok); ilk kod değişikliğinde çalıştırılacaktır.

### Regresyon riski notu

CONFLICT-001/002 (norm düzeltmeleri) uygulandığında:
- `tests/` içinde T puanı doğrulayan fixture'lar varsa bunlar **kırılacaktır**
  (beklenen: norm değişirse T puanı değişir). Bu bir regresyon **değil**,
  kasıtlı davranış değişikliğidir; ama testlerin hangi normları varsaydığı
  kayda geçirilmelidir.
- Etkilenecek test dosyaları kod değişikliğinden önce tarandı mı? → **HAYIR**
  (PHASE 6'da yapılacak).

---

## MEVCUT TEST KAPSAMI (keşif)

`tests/` altında MMPI puanlamasıyla doğrudan ilgili test dosyaları
tarandı mı? → **PARTIAL**: 20+ test dosyasının adı görüldü
(`comparison.test.ts`, `fixtures/omrSynthetic.ts`, `build.test.ts` …).

Not: `SCORING_ENGINE_VERSION = '2.0.0'` ve `version.ts` içindeki
"NORM_SOURCE_LABEL" testlerde doğrulanıyor olabilir; norm değişikliği
etkisi PHASE 6'da tam listelenecek.

Kapsam boşluğu (aday):
Kaynak kitabın Tablo 3/4/5 madde anahtarlarına karşı bir **"key integrity"
testi** yok gibi görünüyor: kod anahtarlarının madde sayıları (L=15, F=64,
K=30) ve toplam madde sayıları test edilmiyor. PHASE 14'te bu testin
eklenmesi önerilecek (kaynak tablosundan üretilen golden fixture ile).

---

## PHASE 2 bulguları için regresyon analizi (2026-09-21)

Henüz kod değiştirilmedi; aşağısı **düzeltme uygulanmadan önce** yapılan
etki analizidir. Amaç: hangi testlerin kırılacağını önceden bilmek.

### Etkilenecek kod dosyaları

| Değişiklik | Dosya | Etki alanı |
|---|---|---|
| CHANGE-001 (F: 69→169) | `src/scoring/mmpiKeys.ts` | F ham puanı → geçerlilik eşikleri, F T puanı, F-K endeksi, `fkIndexAnalysis`, Es/Do anahtarlarıyla kesişim |
| CHANGE-002 (Es yön) | `src/scoring/mmpiDerived.ts` | Es ham puanı → `SPECIAL_META`, `specialInterpretation` |
| CHANGE-003 (FEM yön) | `src/scoring/mmpiDerived.ts` | W_FEM ham → `WIGGINS_NORMS.FEM` T puanı |
| CHANGE-004 (AVD anahtar) | `src/scoring/mmpiDerived.ts` | AVD ham → `PERSONALITY_CUTOFFS.AVD` eşikleri, eşik çipleri |
| CHANGE-005 (HST anahtar) | `src/scoring/mmpiDerived.ts` | HST ham → `PERSONALITY_CUTOFFS.HST` eşikleri |

### Taranan test dosyaları (anahtar/norm bağımlılığı)

`grep -l "SCORING_KEYS\|TURKISH_NORMS\|SPECIAL_KEYS\|PERSONALITY_KEYS\|WIGGINS_" tests/`:

| Test dosyası | Risk |
|---|---|
| `tests/mmpiScoring.test.ts` | **YÜKSEK** — F ham puanı ve geçerlilik eşikleri doğrulanıyorsa CHANGE-001 kırar |
| `tests/mmpiExtended.test.ts` | **YÜKSEK** — türetilmiş ölçekler (Es/FEM/AVD/HST) doğrulanıyorsa CHANGE-002..005 kırar |
| `tests/rawScoreRoundTrip.test.ts` | **ORTA** — ham puan ↔ cevap matrisi turu; anahtar değişirse fixture güncellenmeli |
| `tests/build.test.ts` | **DÜŞÜK** — yalnızca derleme/PDF eşleşmesi |

### Ön koşul (düzeltme öncesi yapılacak)

1. `tests/mmpiScoring.test.ts` ve `tests/mmpiExtended.test.ts` içindeki
   fixture'ların hangi **sabit ham puanı / T puanını** beklediği çıkarılacak.
2. Kaynak değerlere göre **doğru beklenen çıktı** elle hesaplanacak.
3. Düzeltme sonrası kırılan testler ya fixture güncellemesi (kasıtlı davranış
   değişikliği) ya da **REGRESSION** (istenmeyen yan etki) olarak sınıflanacak.

### Yeni test önerisi (PHASE 14)

Kaynak anahtarlarından üretilen **"key integrity" golden testi** eklenmeli:

```
L=15, F=44+20, K=30, Hs=33, D=60, Hy=60, Pd=50, Mf=60/60, Pa=40, Pt=48,
Sc=78, Ma=46, Si=70, PAR=22, SZD=22, STY=36, ANT=25, BDL=22, HST=20, NAR=31,
AVD=38, DEP=20, CPS=15, PAG=14, MAC=49, ICAS=8, SOC=27, DEP_W=33, FEM=30,
MOR=23, REL=12, AUT=20, PSY=48, ORG=36, FAM=16, HOS=27, PHO=27, HYP=25,
HEA=28, OH=33, Es=68, A=39, R=40, Do=28, Dy=57
```

Bu test, başlıktaki madde sayısı ile `dogru.length + yanlis.length` uyuşmazlığını
**derleme zamanında değil test zamanında** yakalar. HST (13 vs 20) ve
AVD (25 vs 38) hataları bu testle otomatik yakalanırdı.

Mevcut durumda böyle bir test **yoktur** → bu, test kapsamındaki en büyük boşluktur.

---

## Düzeltme paketi sonrası — 2026-09-21 (Oturum 3)

### Komut sonuçları

| Komut | Sonuç |
|---|---|
| `npm run typecheck` | **PASS** (tsc --noEmit, hata yok) |
| `npm test` | **294 / 294 PASS** (18 → **19 suite**) |
| `npm run build` | **PASS** (`dist/index.html` + `optik-form.html` üretildi) |

Baseline 287 testti; **+7 yeni test** (`tests/mmpiKeyIntegrity.test.ts`).

### REGRESSION kaydı

**REGRESSION YOK.** Düzeltme paketinden sonra hiçbir mevcut test kırılmadı.

Neden beklenen kırılma olmadı:
- `tests/mmpiScoring.test.ts` F için yalnızca **uzunluk** doğrular
  (`trueItems.length === 44`, `falseItems.length === 20`) → 69→169 değişimi
  uzunluğu değiştirmez.
- Doğrudan `69` / `169` madde numarasına bağlı hiçbir assertion yok
  (`grep -rn "\b69\b\|\b169\b" tests/*.ts` → yalnızca sayısal değer olarak
  kullanılanlar).
- Türetilmiş ölçekler (`Es`, `FEM`, `AVD`, `HST`) için **madde düzeyi doğrulama
  yapan test yoktu**; yalnızca `derivedScales.length === 33` sayısı kontrol
  ediliyordu, o da değişmedi.

> **Test kapsamı bulgusu:** Yukarıdaki üç madde, 5 P0 hatasının neden
> yıllarca görünmez kaldığını açıklar. Düzeltmeden önceki `TEST_AUDIT.md`
> analizi bunu doğru öngörmüştü ("hangi testler kırılacak" listesi boş çıktı —
> çünkü kapsam yoktu).

### `optik-form.html` değişikliği

`npm run build` çıktısı olarak yeniden üretildi. Diff **yalnızca** CSP
`script-src` sha256 hash'idir:

```
- script-src 'sha256-pdI1uXrCpu0+Y5Uqz9b2zYlM/Wde1Trr0lYHPlc1U/g='
+ script-src 'sha256-tEjXQus+swxg+7Kj/G4kPRq2vXry2YGHh/5SHiLSPvg='
```

Kaynak kod değiştiği için beklenen ve zorunludur (`DECISION-014`).
`tests/build.test.ts` bu dosyanın gömülü PDF ile tutarlılığını doğrular → PASS.

### Yeni test — `tests/mmpiKeyIntegrity.test.ts` (7 test)

Testin **denetim değeri** kanıtlandı: ilk çalıştırmada daha önce bilinmeyen
bir kaynak içi tutarsızlığı ortaya çıkardı (`OH`: başlık 33, tablo 31).

| Test | Ne doğrular |
|---|---|
| geçerlik + klinik ölçekler | 12 ölçeğin madde sayısı = kaynak Ek 9 başlığı |
| Mf cinsiyet çifti | İki anahtar 60 madde + **aynı madde kümesi** (yalnızca yön farkı) |
| kişilik bozuklukları | 11 ölçek (PAR…PAG) madde sayısı |
| alkol ölçekleri | MAC 49 (dipnot kuralı), ICAS 8 |
| Wiggins | 13 içerik skalası |
| özel ölçekler | OH 31, Es 68, A 39, R 40, Do 28, Dy 57 |
| regresyon koruması | CONFLICT-008..012 düzeltmeleri kalıcı mı |

Ek yapısal kontroller (tüm ölçekler): tekrarlanan madde yok, Doğru/Yanlış
kümeleri ayrık, tüm maddeler 1-566 aralığında.

### Sıradaki test işleri (PHASE 14)

1. `tests/mmpiScoring.test.ts` içine **madde düzeyi** doğrulama eklenmeli
   (şu an yalnızca uzunluk). Öneri: `compare-keys.py` çıktısından üretilen
   golden fixture ile F/Es/FEM/AVD/HST için tam liste karşılaştırması.
2. `TURKISH_NORMS` 24 hücresi için kaynak kanıtı (Ek 10 + Bölüm 8) → PHASE 6.

---

## Norm denetimi sonrası — 2026-09-21 (Oturum 4)

| Komut | Sonuç |
|---|---|
| `npm run typecheck` | **PASS** |
| `npm test` | **297 / 297 PASS** (20 suite) |
| `npm run build` | **PASS** |

Test sayısı: 294 → **297** (+3 norm testi, `mmpiKeyIntegrity.test.ts` içinde).

### Yeni norm testleri (aynı dosyaya eklendi)

| Test | Ne doğrular |
|---|---|
| 26 norm hücresi | `TURKISH_NORMS` = Tablo 30 (kitap s.195) birebir |
| K-eklenmiş satır kontrolü | K düzeltmeli ölçekler ham (K'sız) satırları kullanmıyor |
| Regresyon koruması | Geçerlik bölümünün **tutarsız** dipnotları (10.11 / 13.90 / 13.54) koda sızmamış |

Üçüncü test kasıtlı olarak bir **"yanlış düzeltme önleyici"** testtir: gelecekte
biri kitabın s.34/s.38 dipnotuna bakıp "kod yanlış" diye düzeltme yaparsa,
test kırmızıya döner ve gerekçeyi (`CONFLICT-001/002 → REJECTED`) hatırlatır.

### REGRESSION kaydı

**REGRESSION YOK.** Bu oturumda **hiç kod değişikliği yapılmadı** — yalnızca
test ve dokümantasyon eklendi. Denetim sonucu iki P0 çelişki **REJECTED**
(kod doğruydu).

### Test kapsamı boşluğu — KAPANDI

`TEST_AUDIT.md` (Oturum 1) şunu kaydetmişti:
> "`TURKISH_NORMS` (13 ölçek × 2 cinsiyet = 26 hücre) ve `WIGGINS_NORMS` buradan
> doğrulanacak. `mmpiKeys.ts` içinde L, F, K dışındaki 24 norm hücresi için şu an
> **hiçbir kaynak kanıtı yok**."

Artık 26 hücrenin tamamı kaynaklı ve testle korunuyor.

Kalan açık: **`WIGGINS_NORMS`** (13 ölçek) için hâlâ kaynak kanıtı yok.
Wiggins normları kitapta Ek 9'da verilmez; Bölüm 7 (s.178-181) metni
okunmalıdır → PHASE 8.

---

# Oturum 3 (devam) — PHASE 4: konfigürasyonlar, F-K, TR endeksi

Tarih: 2026-09-21 · Kapsam: kitap s.56-61 (PDF p36 L – p38 R)

## Yapılan kod değişikliği

`CHANGE-007` — TR endeksi kesme puanı kaynağa çekildi (P1):
`consistent = score <= 3` → `score <= 2`; kaynakta olmayan yorum iddiaları
kaldırıldı. Ayrıntı: `CODE_CHANGES.md`.

## Komutlar ve sonuçlar

| Komut | Sonuç |
|---|---|
| `npm run typecheck` | **0 hata** |
| `npx tsx --test tests/mmpiKeyIntegrity.test.ts` | **14/14 PASS** (10 mevcut + 4 yeni) |
| `npm test` (tam suite) | **301/301 PASS** · 21 suite · 113 383 ms |
| `npm run build` | **0** — `dist/index.html` + `optik-form.html` üretildi |

Önceki tur: 297/297 (20 suite). Şimdi 301/301 (21 suite) → **+4 test, +1 suite**.

## Yeni testler (PHASE 4 suite — `tests/mmpiKeyIntegrity.test.ts`)

1. **TR = 3 → uyarı var / TR = 2 → uyarı yok.** Kaynak s.59'daki "3 puan ya da
   daha fazla" kuralını sabitler. Eski kodda 3 puan uyarısızdı → bu test o
   kaymayı bir daha geri getirmez.
2. **Tablo 6 → `TR_PAIRS` birebir** (16 çift, sıra dahil). Kaynak tablosundaki
   çift değişirse kırmızıya döner.
3. **Tablo 7 → `CARELESS_PAIRS` birebir** (12 çift + 12 yön: Aynı/Farklı).
4. **F-K bantları**: 9 geçerli · 10 sahte-kötülük · 17 kritik · 8-11 notu her iki
   dalda. Kaynağın 8-11 ve >16 bantlarını sabitler.

## Neden bu testler gerekliydi

- TR kesme puanı kayma sınıfı **görünmezdi**: kod kendi yorumunda Dahlstrom 1972'ye
  atıf yapıyordu ama sayıyı 1 puan kaydırmıştı; bunu kontrol eden test yoktu.
- Tablo 6/7 çiftleri **madde numarası** verisidir; tek basamak hatası (ör. 24↔42)
  sessizce yanlış tutarlılık puanı üretir. Artık kaynak tabloya bağlıdır.

## REGRESSION kaydı

**REGRESSION YOK.**
- Mevcut TR testleri (1 puan uyarısız, 4 puan uyarılı) yeni kesme puanında da
  doğrudur → değişmedi.
- Başka hiçbir suite etkilenmedi (301/301).
- `optik-form.html` build ile yeniden üretildi ve **senkron** durumda
  (`build.test.ts` bu senkronu zorunlu kılar).

## Kapsam boşlukları (açık)

- **`WIGGINS_NORMS`** (13 ölçek): hâlâ kaynak kanıtı yok → PHASE 8 (s.178-181).
- **Dikkatsizlik kesme puanı (4)** ve **F-K negatif eşiği (−8)**: kaynakta
  bulunamadı → `UNVERIFIED_DATA.md`.
- **K+ profili örüntüsü**: kaynakta tanımlı, kodda yok → `MISSING-KPLUS-001` (P3).

---

# Oturum 3 (devam) — PHASE 4 batch 3: Konfigürasyon 6-13

Tarih: 2026-09-21 · Kapsam: kitap s.48-55 (PDF p32 L – p35 R)

## Kod değişikliği

`CHANGE-008` (P1) — dört konfigürasyon eşiği kaynağa çekildi:
`ascending` (+F 45-55) · `descending` (+K ≥ 40) · `all-true` (40→35) ·
`help-seeking` (105→100). Ayrıntı: `CODE_CHANGES.md`.

## Komutlar ve sonuçlar

| Komut | Sonuç |
|---|---|
| `npm run typecheck` | **0 hata** |
| `npx tsx --test tests/mmpiKeyIntegrity.test.ts tests/mmpiExtended.test.ts` | **46/46 PASS** |
| `npm test` (tam suite) | **307/307 PASS** · 22 suite · ~120 s |
| `npm run build` | **PASS** — `optik-form.html` senkron |

Önceki tur: 301/301 (21 suite) → **+6 test, +1 suite**.

## Yeni testler (PHASE 4 batch 3 — 6 test)

1. Konf. 7: L,K = 30 → "tümüne doğru"; L,K = 38 → değil (kaynak 35)
2. Konf. 9: F = 100 → "yardım isteği"; F = 101 → değil
3. Konf. 4: F = 50 → "yükselen"; F = 62 → değil (kaynak aralığı 45-55)
4. Konf. 5: K = 42 → "azalan"; K = 35 → değil (kaynak aralığı 40-45)
5. Konf. 10: F = 70 → "geleneksel olmayan"; F = 69 → değil (sınır > 69)
6. Konf. 13: |F−K| = 2 → "akut/süreğen"; |F−K| = 10 → değil (sınır ≤ 6)

Ayrıca `mmpiExtended.test.ts` içindeki "tümüne yanlış" testi, kaynak içi
tutarsızlığı (DECISION-020) yorumlayacak biçimde gerekçelendirildi.

## Ampirik keşif (bu turda koşuldu)

| Yanıt | L T | F T | K T | Konfigürasyon |
|---|---|---|---|---|
| Tümüne "Yanlış" | 81.2 | **75.3** | 82.3 | "Tümüne yanlış" ✅ |
| Tümüne "Doğru" | 26.5 | **120.0** (kırpma sınırı) | 22.1 | **YOK** → CONFLICT-019 |

Bu iki koşum, kaynağın Konf. 8 (80) ve Konf. 7 (120) eşiklerinin
uygulanabilirliğini **kanıta dayalı** olarak değerlendirmeyi sağladı:
biri kaynak içi tutarsızlık (REJECTED), diğeri gerçek bir uygulama boşluğu
(OPEN).

## REGRESSION kaydı

**REGRESSION YOK.** 307/307 geçti; `optik-form.html` build ile yeniden
üretildi ve senkron.

---

# Oturum 3 (devam 2) — PHASE 4 kapanışı + CONFLICT-019/020 düzeltmeleri

Tarih: 2026-09-21

## Kod değişiklikleri

- `CHANGE-009` (P1): `all-true` `F > 120` → `F >= 120` (T kırpma nedeniyle ölü
  kural canlandırıldı)
- `CHANGE-010` (P2): `credible` `K <= 65` sınırı kaldırıldı (kaynakta yok)

## Komutlar ve sonuçlar

| Komut | Sonuç |
|---|---|
| `npm run typecheck` | **0 hata** |
| `npx tsx --test tests/mmpiKeyIntegrity.test.ts` | **22/22 PASS** (+2 test) |
| `npm test` (tam suite) | **309/309 PASS** · 22 suite · ~116 s (301 → 307 → 309) |
| `npm run build` | **PASS** — `optik-form.html` yeniden üretildi ve senkron |

## Yeni testler (+2)

1. **Konf. 7 kırpma farkındalığı:** `detectValidityConfig(26.5, 120, 22.1)` →
   "Tümüne Doğru" (end-to-end profil değerleriyle; önceden `YOK` dönüyordu)
2. **Konf. 12 sınır düzeltmesi:** `detectValidityConfig(50, 65, 70)` →
   "Güvenilir Cevaplayıcı" (önceden `YOK` dönüyordu)

## Erişilebilirlik analizi (regresyon güvencesi)

`detectValidityConfig` ilk-eşleşen-kazanır olduğundan, sınır değişikliklerinin
diğer örüntüleri erişilemez kılmadığı **15 konfigürasyonun sırası ve koşulları
dökülerek** doğrulandı (DECISION-023). Etkilenmeyenler: `reverse-v`,
`closed-v`, `v-shape`, `ascending`, `descending`, `random`, `all-false`,
`help-seeking`, `unconventional`, `frank`, `acute-chronic`, `virtuous`,
`rigid`.

## REGRESSION kaydı

**REGRESSION YOK.** 309/309; `optik-form.html` build ile güncel.

---

# Oturum 4 — PHASE 9/10 batch 1 (s.66-69): kod değişikliği YOK

Tarih: 2026-09-21 · Kapsam: kitap s.66-69 (PDF p41 L – p42 R)

## Kod değişikliği

**Yok.** Bu batch yalnızca kaynak okuma + karşılaştırma + çelişki kaydıdır.
CONFLICT-024 (üçlü kod tipleri) **tasarım kararı** gerektirdiği ve kaynağın
tam üçlü kod seti henüz çıkarılmadığı için kod değiştirilmedi.

## Testler

Bu batch'te kod dosyaları değişmedi; regresyon riski yok. Kaynak okuma
sırasında koşulan doğrulama:

| Komut | Sonuç |
|---|---|
| `python3 scripts/mmpi-audit/extract.py ocr --pages 41-42 --dpi 200` | 4 dosya üretildi (p041_L/R, p042_L/R) |
| Görsel doğrulama (pymupdf dpi 135, tam sayfa) | `v_p041_full.png` · `v_p042_full.png` |
| `grep` kod karşılaştırması | `CODES`: 45 iki noktalı, 0 üçlü kod · `slice(0, 2)` |

**REGRESSION: YOK** (kod değişmedi).

## Ortam notu

Sandbox sıfırlanması sonrası ortam yeniden kuruldu:
`npm install` (58 paket) · `pip3 install --break-system-packages pymupdf
opencv-python-headless rapidocr-onnxruntime` · `opencv-python-headless`
**force-reinstall** (libGL.so.1 hatası → çözüldü).


---

# Oturum 5 — PHASE 9/10 batch 7: D kod bloğu kapanışı (s.88-92)

Kod değişikliği **YOK** (salt okuma + karşılaştırma turu; CONFLICT-024/027/030
kararı tüm kod seti çıkarıldıktan sonra verilecek).

| Komut | Sonuç |
|---|---|
| `npx tsc --noEmit` | **0 hata** |
| `npm test` (tam suite) | **313/313 PASS** · 23 suite |
| `npm run build` | **PASS** — `optik-form.html` **değişmedi** (senkron korundu) |

**REGRESSION YOK.**

Yeni araç: `scripts/mmpi-audit/cmp-d-batch7.ts` — `codeInterpretation()` çağrısının
**kırpma davranışını** (CONFLICT-030) kanıtlayan karşılaştırma scripti
(`273/723` → `27/72` vb. eşlemesi + `seeAlso` döngü testi).

---

# Oturum 5 — PHASE 9/10 batch 8: Hy T bantları + Hy kod bloğu I (s.95-99)

Kod değişikliği **YOK** (salt okuma + karşılaştırma; CONFLICT-024/030/031 kararı
tüm klinik ölçek blokları çıkarıldıktan sonra verilecek).

| Komut | Sonuç |
|---|---|
| `npx tsc --noEmit` | **0 hata** |
| `npx tsx --test tests/mmpiKeyIntegrity.test.ts` | **26/26 PASS** |
| `npm test` (tam suite) | **313/313 PASS** · 23 suite |
| `npm run build` | **PASS** — `optik-form.html` senkron |

**REGRESSION YOK.**

Yeni araç: `scripts/mmpi-audit/cmp-hy-batch8.ts` — Hy bloğu kod kimliği
çakışmasını kanıtlar (`32` → `23`, `321` → `23`, `345/435` → `34/43`,
`346/436` → `36/63`); CONFLICT-031'in ampirik dayanağı.

---

# Oturum 5 — PHASE 9/10 batch 9: Hy bloğu kapanışı + nevrotik üçlü (s.100-107)

Kod değişikliği **YOK** (salt okuma + karşılaştırma; CONFLICT-024/030/031/033
kararı tüm klinik ölçek blokları çıkarıldıktan sonra verilecek).

| Komut | Sonuç |
|---|---|
| `npx tsc --noEmit` | **0 hata** |
| `npx tsx --test tests/mmpiKeyIntegrity.test.ts` | **26/26 PASS** |
| `npm test` (tam suite) | **313/313 PASS** · 23 suite |
| `npm run build` | **PASS** — `optik-form.html` senkron |

**REGRESSION YOK.**

Yeni araç: `scripts/mmpi-audit/cmp-hy-batch9.ts` — Hy bloğu II kod
karşılaştırması (`37/73`, `38/83`, `39/93`, `30/03` → hepsi kendi kaydına
eşleşiyor; `394/934` → `39/93`e kırpılıyor).
