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

---

## 2026-09-21 — Oturum 2 (devam)

- **PHASE 3 kapanışı:** K T bantları (kitap s.40) görsel olarak doğrulandı →
  `72 T ve üstü` · `61-72` · `46-60` · `27-45`. Yapısal kural da teyit edildi:
  "K alt testi, profili geçersiz yapacak belirgin değerlerin olmadığı tek alt testtir."
- L tablosu (s.31) + normlar (6.45 / 6.00) görsel doğrulandı
- F tablosu (s.34) sütunlar arası boşluk kuralıyla yeniden okundu; normlar
  (8.30 / **10.11**) teyit edildi
- K tablosu (s.38) tam sayfa görüntüsüyle doğrulandı; **160 ve 322 maddelerinin
  dikişte kaybolmadığı** kanıtlandı; normlar (13.90 / 13.54) teyit edildi
- **PHASE 2 (madde anahtarları) işlendi:** Ek 9, kitap s.244-256 = PDF p130 L – p136 L
  - Yeni araç: `scripts/mmpi-audit/dump-keys.ts` (kod anahtarlarını JSON'a döker)
  - Yeni araç: `scripts/mmpi-audit/compare-keys.py` (46 anahtarı karşılaştırır)
  - **Sonuç: 41 MATCH / 5 DIFF / 0 MISSING**
- **5 yeni P0 çelişki bulundu ve görsel olarak doğrulandı:**
  - CONFLICT-008 — F anahtarında **69 ↔ 169** basamak hatası
  - CONFLICT-009 — Es (Ego Gücü) **13 madde yanlış yönde** (483, 488, 489, 494,
    510, 525, 541, 544, 548, 554, 555, 559, 561)
  - CONFLICT-010 — W_FEM **2 madde yanlış yönde** (126, 463)
  - CONFLICT-011 — AVD **13 madde eksik** (38 yerine 25)
  - CONFLICT-012 — HST **7 madde eksik** (20 yerine 13)
- Mf cinsiyet kuralı doğrulandı: kaynak dipnotundaki 5 glifli madde
  (69, 179, 231, 297, 133) kodda doğru şekilde ters çevrilmiş ✅
- MAC dipnotu doğrulandı: kitap #215 ve #460'ı çıkarıp 49 madde kullanır;
  kod aynısını yapar ✅ (DECISION-009)
- Ek 10 (s.257-260) OCR alındı ancak tablo yapısı çözülemedi → `NEEDS_REVIEW`
- **Kod değişikliği yine YOK** — 5 düzeltme `DECISION-008` ile PHASE 3
  kapanışından sonraya planlandı

### PHASE 2 sayısal özet

| Sonuç | Adet |
|---|---|
| MATCH | 41 |
| DIFF (hepsi P0) | 5 |
| MISSING | 0 |
| Toplam karşılaştırılan anahtar | 46 |
| Görsel doğrulanmış MATCH | 8 |
| OCR doğrulanmış MATCH (görsel bekliyor) | 33 |

### Güncel çelişki tablosu

| ID | Öncelik | Konu | Durum |
|---|---|---|---|
| CONFLICT-001 | P0 | F kadın normu (10.11 ↔ 9.38) | OPEN |
| CONFLICT-002 | P0 | K normları (13.90/13.54 ↔ 13.98/11.82) | OPEN |
| CONFLICT-003 | P1 | L T bandı alt sınırı (59 ↔ 56) | OPEN |
| CONFLICT-004 | P1 | F ham bant sınırları (3-9/16-25/26+ ↔ 3-7/16-22/23+) | OPEN |
| CONFLICT-005 | P1 | L/K ham bant tabloları kaynakta yok | INVESTIGATING |
| CONFLICT-006 | P2 | F/K T bant sınır yazımı | CONFIRMED (kabul) |
| CONFLICT-007 | P2 | `docs/kaynak-denetimi.md` depoda yok | CONFIRMED |
| **CONFLICT-008** | **P0** | **F anahtarı 69 ↔ 169** | **CONFIRMED** |
| **CONFLICT-009** | **P0** | **Es 13 madde yanlış yönde** | **CONFIRMED** |
| **CONFLICT-010** | **P0** | **W_FEM 2 madde yanlış yönde** | **CONFIRMED** |
| **CONFLICT-011** | **P0** | **AVD 13 madde eksik** | **CONFIRMED** |
| **CONFLICT-012** | **P0** | **HST 7 madde eksik** | **CONFIRMED** |

---

## 2026-09-21 — Oturum 3: DÜZELTME PAKETİ

**İlk kod değişiklikleri yapıldı.** `DECISION-008` uyarınca 5 P0 anahtar
hatası tek pakette düzeltildi ve kalıcı regresyon testi eklendi.

### Değişiklikler

| ID | Dosya | Ne |
|---|---|---|
| CHANGE-001 | `mmpiKeys.ts` | F: `69` → `169` (CONFLICT-008) |
| CHANGE-002 | `mmpiDerived.ts` | Es: 13 madde Doğru→Yanlış (CONFLICT-009) |
| CHANGE-003 | `mmpiDerived.ts` | W_FEM: `126, 463` Yanlış→Doğru (CONFLICT-010) |
| CHANGE-004 | `mmpiDerived.ts` | AVD: +13 madde, 25→38 (CONFLICT-011) |
| CHANGE-005 | `mmpiDerived.ts` | HST: +7 madde, 13→20 (CONFLICT-012) |
| CHANGE-006 | `tests/mmpiKeyIntegrity.test.ts` | **YENİ**: 7 test, anahtar bütünlüğü |

### Doğrulama

| Komut | Sonuç |
|---|---|
| `npx tsx scripts/mmpi-audit/dump-keys.ts` + `compare-keys.py` | **46/46 MATCH, 0 DIFF** |
| `npm run typecheck` | **PASS** |
| `npm test` | **294/294 PASS** (287 baseline + 7 yeni) |
| `npm run build` | **PASS** |

**REGRESSION: YOK.**

### Düzeltmelerin bilimsel etkisi

| Değişiklik | Önce | Sonra |
|---|---|---|
| F geçerlilik | Yanlış ölçek: madde 69 sayılıyor, 169 sayılmıyor → profil geçerlilik kararı hataya açık | Kaynakla birebir |
| Es ego gücü | 13 madde ters yönde → puan sistematik sapıyordu | Kaynakla birebir |
| W_FEM | 2 madde ters yönde | Kaynakla birebir |
| AVD çekingen kişilik | 25 madde → eşikler anlamsız, özellikler kaçırılıyordu | 38 madde, kaynakla birebir |
| HST histrionik | 13 madde → eşikler erişilemez | 20 madde, kaynakla birebir |

### Yeni keşif

Yeni `mmpiKeyIntegrity` testi ilk çalıştırmasında **OH ölçeğinde kaynak içi
tutarsızlık** buldu: başlık "Madde sayısı: 33", tablo 31 madde listeler.
Yüksek DPI görsel doğrulamayla teyit edildi → `SOURCE-INTERNAL-OH-001`,
`DECISION-012`. Kod tabloyu doğru izliyor, **değişiklik yok**.

### Güncel çelişki tablosu

| ID | Öncelik | Konu | Durum |
|---|---|---|---|
| CONFLICT-001 | P0 | F kadın normu (10.11 ↔ 9.38) | OPEN |
| CONFLICT-002 | P0 | K normları (13.90/13.54 ↔ 13.98/11.82) | OPEN |
| CONFLICT-003 | P1 | L T bandı alt sınırı (59 ↔ 56) | OPEN |
| CONFLICT-004 | P1 | F ham bant sınırları | OPEN |
| CONFLICT-005 | P1 | L/K ham bant tabloları kaynakta yok | INVESTIGATING |
| CONFLICT-006 | P2 | F/K T bant sınır yazımı | CONFIRMED (kabul) |
| CONFLICT-007 | P2 | `docs/kaynak-denetimi.md` depoda yok | CONFIRMED (ertelendi) |
| **CONFLICT-008..012** | **P0** | **5 anahtar hatası** | **✅ FIXED** |

Kalan açık: **7 çelişki** (2 P0 norm, 3 P1, 2 P2).
