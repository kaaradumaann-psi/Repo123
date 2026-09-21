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
