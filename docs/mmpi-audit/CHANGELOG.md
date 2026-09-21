# CHANGELOG

Denetim günlüğü. Her oturum buraya bir kayıt ekler.

---

## 2026-09-21 — Oturum 1

- Denetim altyapısı kuruldu: `docs/mmpi-audit/` (15 dosya) + `scripts/mmpi-audit/extract.py`
- Kaynak künyesi doğrulandı: Ceyhun & Oral (2003), 2. Baskı, **MMPI-1 / 566 madde**
- PDF profillendi: 139 sayfa, **gömülü metin yok** (görüntü tabanlı tarama),
  yatay düzen; her PDF sayfası **iki kitap sayfası** içeriyor
- **Sayfa eşleme formülü** kuruldu ve doğrulandı: `leaf = kitap s. + 15`
- İçindekiler (kitap i-vi → PDF p3 R-p6 R) OCR ile çıkarıldı → `SOURCE_INDEX.md`
- OCR altyapısı kuruldu (RapidOCR); tesseract kurulamadı (apt erişilemez)
- Batch 1 işlendi: PDF p8-16 → Bölüm 1 tanımı, geçerlik testlerinin geliştirilmesi
- Batch 2 işlendi: PDF p22-29 → **Bölüm 3 (geçerlik değerlendirmesi), kitap s.29-42**
- **? / L / F / K** geçerlik alt testleri doğrulandı (madde anahtarları + normlar + bantlar)
- 6 SOURCE_FACT grubu oluşturuldu; hepsi görsel doğrulamalı
- **3 P0 çelişki bulundu**:
  - CONFLICT-001: F kadın normu (kaynak 10.11 ↔ kod 9.38)
  - CONFLICT-002: K normları (kaynak 13.90/13.54 ↔ kod 13.98/11.82)
  - (aynı kayıtta) K erkek normundaki yazım farkı
- 4 P1/P2 çelişki/kayıt: L ve F ham-T bant sınırları, kaynakta bulunmayan
  L/K ham bant tabloları, eksik `docs/kaynak-denetimi.md`
- **Kod değişikliği YOK** (DECISION-004); testler 287/287 PASS
- Sonraki: PDF p26 R → K alt testi devamı, sonra PHASE 4 ve Ek 9

### Doğrulanan hızlı özet

| Öğe | Sonuç |
|---|---|
| L madde anahtarı (15 madde) | ✅ birebir MATCH |
| F madde anahtarı (44 D + 20 Y) | ✅ birebir MATCH |
| K madde anahtarı (1 D + 28 Y) | ✅ birebir MATCH |
| L normu (6.45 / 6.00) | ✅ MATCH |
| F normu (8.30 / **10.11**) | ⚠️ kadın P0 CONFLICT |
| K normu (**13.90** / **13.54**) | ⚠️ iki P0 CONFLICT |
| (?) ham bantları (0/1-5/6-30/31+) | ✅ MATCH |

### Ek bulgu (aynı oturum)

- Kitap s.43 (PDF p29 R) okundu: **Bölüm 4 = geçerlik konfigürasyonlarının kaynağı**.
  "Konfigürasyon 1" = "Şekil 1. Tersine V" → kodun `VALIDITY_CONFIGS[0]` kuralıyla
  birebir aynı (`L 50-60 ∧ K 50-60 ∧ F > 70`) ✅ MATCH.
  → `SOURCE-VALIDITY-CONFIG-001`, `INTERPRETATION_AUDIT.md`
- Kaynak: "**(?)** alt testi standart profil kağıdına işaret edilmez" → kodda da
  ? ölçeği konfigürasyona girmez ✅
