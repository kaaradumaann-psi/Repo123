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
