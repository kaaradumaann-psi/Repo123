# MMPI Audit State

> Bu dosya her işlemde güncellenir. Bir sonraki oturum **yalnızca bu dosyayı
> okuyarak** nerede kalındığını anlayabilmelidir.

## Source

Source file:
`docs/MMPI Kitap (1) (1).pdf`

Book:
Minnesota Çok Yönlü Kişilik Envanteri — Değerlendirme Kitabı (2. Baskı, Ankara 2003)

Authors:
Prof. Dr. Birsen CEYHUN, Uz. Psk. Nursen ORAL

Scale version:
**MMPI (orijinal / MMPI-1), 566 maddelik kitap formu** — proje sürümüyle uyumlu
`VERSION-CONFLICT YOK`

Total PDF pages:
139 (görüntü tabanlı; gömülü metin yok; her PDF sayfası = 2 kitap sayfası)

Total book pages:
~260 gövde + i-vi içindekiler

Sayfa eşleme:
`leaf = kitap_sayfası + 15` · `PDF = ceil(leaf/2)` · yarı = R (leaf çift) / L (leaf tek)

## Phase durumu

| Phase | Konu | Durum |
|---|---|---|
| 0 | Denetim altyapısı | **DONE** |
| 1 | Kaynak yapısı / indeks | **DONE** |
| 2 | Madde anahtarları (Ek 9, kitap s.244-256) | NOT_STARTED |
| 3 | Validity (kitap s.29-42) | **IN_PROGRESS** (~70%) |
| 4 | K correction (kitap s.37-42, 57-58) | NOT_STARTED |
| 5 | Clinical scales (kitap s.63-158) | NOT_STARTED |
| 6 | Norms (kitap s.191-195, 257-260) | NOT_STARTED |
| 7 | Subscales | NOT_STARTED |
| 8 | Derived scales (Bölüm 7, kitap s.171-188) | NOT_STARTED |
| 9 | Code types (Bölüm 5-6) | NOT_STARTED |
| 10 | Interpretation (Bölüm 6) | NOT_STARTED |
| 11 | AI interpretation | NOT_STARTED |
| 12 | UI | NOT_STARTED |
| 13 | Report | NOT_STARTED |
| 14 | Tests | NOT_STARTED |

## Current position

Current book page:
**42** (Bölüm 3 sonu / K–klinik ilişkisi) — PDF p29 L

Last completed book page:
**39** (K düşük puan profili) — PDF p27 R

Current section:
Bölüm 3 — Geçerlik testlerinin değerlendirilmesi

Current subsection:
K alt testi — T bantları ve K–klinik ilişkisi

Current task:
Bölüm 3'ü kapatmak: K T bantlarını (s.40) **görsel doğrulamak** ve s.41-42'yi
okuyup PHASE 3'ü DONE yapmak.

Status:
**IN_PROGRESS**

## Next action

Continue from:
kitap s.40 → **PDF p28 L (OCR alındı, görsel doğrulama bekliyor)**
Hemen ardından kitap s.41-42 → **PDF p28 R + p29 R**

Sıradaki batch'ler (öncelik sırası):

1. **PDF p28 R + p29 R** — kitap s.41-42 (K T bantları görsel teyit + Bölüm 3 sonu) → PHASE 3 DONE
2. **PDF p29 R – p31 L** — kitap s.43-48, Bölüm 4 geçerlik konfigürasyonları → PHASE 4/9
3. **PDF p36 R – p38 R** — kitap s.57-61, K+ profilleri + F-K endeksi + TR endeksi → PHASE 4
4. **PDF p130 L – p133 L** — kitap s.244-250, **Ek 9 madde anahtarları** → PHASE 2 (en yüksek değer)
5. **PDF p136 R – p138 L** — kitap s.257-260, **Ek 10 ortalama/SD tabloları** → PHASE 6

## Last completed task

Compared:
Kaynak kitap s.29-39 (PDF p22 R – p27 R) ↔ `src/scoring/mmpiSource.ts`,
`src/scoring/mmpiKeys.ts`

Topic:
? / L / F / K geçerlik alt testleri — madde anahtarları, normlar, bantlar

Result:
**3 P0 çelişki bulundu** (F kadın normu, K kadın normu, K erkek normu yazımı);
madde anahtarlarının üçü de **birebir MATCH**; ? ham bantları MATCH.

## Current blocking issue

**Yok.** OCR ve görsel doğrulama akışı çalışıyor.

Bilinen kısıtlar (engelleyici değil):
- Türkçe OCR modeli yok → tüm sayısal fact'ler görsel doğrulamalı (DECISION-003)
- Merkez dikişi sütun kaybı → bindirmeli kırpma zorunlu (OCR_ISSUES SPINE-CLIP)
- `docs/kaynak-denetimi.md` depoda yok (CONFLICT-007, PHASE 12-13'te çözülecek)

## Code changes so far

**0 (sıfır).** `DECISION-004` gereği PHASE 4 + PHASE 6 tamamlanmadan
CONFLICT-001/002 nedeniyle kod değiştirilmedi. Uygulama kodu değişmedi;
yalnızca denetim klasörü ve `scripts/mmpi-audit/extract.py` eklendi.

## Tests

Baseline: `npm test` → **287 pass / 0 fail** (2026-09-21, değişiklik öncesi).
`typecheck` ve `build` ilk kod değişikliğinde çalıştırılacak.

## Last update

2026-09-21 — Oturum 1 (altyapı + PHASE 1 DONE + PHASE 3 %70)

## CHECKPOINT

```
Phase:          0 (altyapı) + 1 (kaynak yapısı) — DONE
                PHASE 3 (geçerlik) — IN_PROGRESS %70
Completed:      PDF p1-p8 (künye + içindekiler), p8-p16 (Bölüm 1),
                p22-p27 (kitap s.29-39: ? / L / F / K)
Verified:       ? , L , F , K  (madde anahtarları + normlar + bantlar)
Open conflicts: 7 toplam → P0: 2 (CONFLICT-001, CONFLICT-002)
                            P1: 3 (003, 004, 005)
                            P2: 2 (006 kabul edildi, 007 doküman)
Unverified:     kod yorum katmanının "klinik yorum rehberi" künyesi (yok),
                L/K ham bant tabloları, K_ADDITION_TABLE, Ek 9, Ek 10
Code changes:   0
Tests:          287/287 PASS (baseline)
Next:           PDF p28 L görsel teyit → p28 R + p29 R → PHASE 3 DONE
Blocking:       none
```
