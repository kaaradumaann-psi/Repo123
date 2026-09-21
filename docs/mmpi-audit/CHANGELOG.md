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

---

## 2026-09-21 — Oturum 4: PHASE 3 KAPANIŞI + PHASE 6 NORM DOĞRULAMASI

### PHASE 3 — DONE

- Kitap s.41-42 okundu ve **Bölüm 3 tamamlandı**
- Kitap s.42'nin boş olduğu görsel olarak doğrulandı (Bölüm 4'ün karşı sayfası)
- K T bantları TAM görsel doğrulandı: `72+` / `61-72` / `46-60` / `27-45`
- Yapısal kural teyit edildi: "K, profili geçersiz yapacak belirgin değerlerin
  olmadığı **tek** alt testtir" → bugünkü kod bu davranışı doğru uygular

### PHASE 6 — EN ÖNEMLİ BULGU: NORM KAYNAĞI BULUNDU

- **Tablo 30** (kitap s.195, PDF p105 R) bulundu ve tam sayfa görsel okundu:
  "Normal Türk, Erkek ve Kadınların MMPI Alt Testlerindeki Ortalama ve
  Standart Sapmaları", N = 1003 erkek / **663 kadın**
- OCR bu sayfayı **boş** döndürmüştü → yalnızca görsel okuma ile elde edildi
- Yeni araç: `scripts/mmpi-audit/compare-norms.py`
- **SONUÇ: `TURKISH_NORMS` 26/26 HÜCRE BİREBİR MATCH**

### ⚑ İKİ P0 ÇELİŞKİ REJECTED — kod doğruydu

| Çelişki | Sanılan | Gerçek |
|---|---|---|
| CONFLICT-001 (F kadın) | Kod 9.38 yanlış, kaynak 10.11 | **Kod doğru** (Tablo 30); geçerlik dipnotu (s.34) Tablo 30 ile çelişiyor |
| CONFLICT-002 (K normları) | Kod 13.98/11.82 yanlış | **Kod doğru** (Tablo 30); geçerlik dipnotu (s.38) Tablo 30 ile çelişiyor |

**Kitap kendi içinde tutarsız**: geçerlik bölümü dipnotları (s.34, s.38)
standardizasyon tablosu (s.195) ile uyuşmuyor. Kod standardizasyon tablosunu
izler — bu **doğru seçimdir**.

> `DECISION-004` ("kaynağı tam doğrulamadan kod değiştirme") burada kritik oldu:
> iki "P0 hata" erken düzeltilseydi **doğru olan kod bozulacaktı.**

### Ek doğrulama: K düzeltmesi tasarımı

Tablo 30, K düzeltmesi **uygulanmış ve uygulanmamış** satırları ayrı verir
(Hs+.5K, Pd+.4K, Pt+1K, Sc+1K, Ma+.2K). Kod T dönüşümünden önce K düzeltmesini
uyguladığı için **doğru satırları** kullanır → `K_CORRECTION` tasarımı
bağımsız olarak doğrulandı.

### Ek 10 — tanımlandı, norm kaynağı DEĞİL

Ek 10 (s.257-260), **tanı gruplarına** ait ortalamaları verir (Psikopati,
Şizofreni Akut/Kronik, Depresif Psikoz, Borderline, Psikotik, Nevrotik…).
Normal popülasyon değildir → `DECISION-016`. Kodda karşılığı yok.

### Örneklem sınırı (yorum katmanı için uyarı)

Norm örneklemi "normal Türk toplumu" değil: **16-30 yaş ağırlıklı, eğitimli,
kentli** (%85 bekâr, %84.88 büyük kent, orta+lise %54.29 + üniversite %47.21).
Kaynak kitap da 31-50 yaş aralığının **yetersiz temsil edildiğini** söyler
(s.192). Bu, yorum metinlerinde "norm sınırı" iddiaları için önemlidir
→ PHASE 10/13'te ele alınacak.

### Kod değişikliği

**YOK.** Bu oturumda yalnızca test (+3) ve dokümantasyon eklendi.
`compare-norms.py` aracı eklendi.

### Testler

**297/297 PASS** · typecheck **PASS** · build **PASS** · REGRESSION **YOK**

### Güncel çelişki tablosu

| ID | Öncelik | Konu | Durum |
|---|---|---|---|
| CONFLICT-001 | P0 | F kadın normu | ✅ **REJECTED** (kod doğru) |
| CONFLICT-002 | P0 | K normları | ✅ **REJECTED** (kod doğru) |
| CONFLICT-003 | P1 | L T bandı alt sınırı (59 ↔ 56) | OPEN |
| CONFLICT-004 | P1 | F ham bant sınırları | OPEN |
| CONFLICT-005 | P1 | L/K ham bant tabloları kaynakta yok | INVESTIGATING |
| CONFLICT-006 | P2 | F/K T bant sınır yazımı | CONFIRMED (kabul) |
| CONFLICT-007 | P2 | `docs/kaynak-denetimi.md` depoda yok | CONFIRMED |
| CONFLICT-008..012 | P0 | 5 anahtar hatası | ✅ FIXED |

**P0 açık çelişki kalmadı.** Kalan: 3 P1 + 2 P2.

---

## PHASE 4 — batch 1: Geçerlik konfigürasyonları, K+, F-K, TR endeksi

Tarih: 2026-09-21 · Kaynak: kitap **s.56-61** (PDF p36 L – p38 R)
Sayfa doğrulaması: her sayfanın numarası görsel olarak okundu
(p036_L=56, p036_R=57, p037_L=58, p037_R=59, p038_L=60, p038_R=61) —
eşleme formülüyle (`leaf = sayfa + 15`) tutarlı.

### İşlenen sayfalar

| Kitap s. | PDF | İçerik | Sonuç |
|---|---|---|---|
| 56 | p36 L | Konfigürasyon 14 (L>55, F<60, K 59-64) + Şekil 14 | ✅ birebir MATCH |
| 57 | p36 R | Konfigürasyon 15 (L=60, F>70, K<40) + Şekil 15 + **K+ profili** | ⚠️ CONFLICT-014 → **REJECTED** |
| 58 | p37 L | **F-K endeksi** (kesim 11→9, 0-9 geçerli, >9 sahte-kötülük, 0 sahte-iyilik) | ✅ MATCH (bir gerilim: CONFLICT-013) |
| 59 | p37 R | **TR kesme puanı ≥3** + F-K 8-11 / >16 bantları + Greene 1979 | ❌ CONFLICT-015 → **FIXED** |
| 60 | p38 L | **Tablo 6 — 16 tekrarlanmış madde çifti** | ✅ 16/16 birebir |
| 61 | p38 R | **Tablo 7 — Dikkatsizlik alt testi 12 çift + yön** | ✅ 12/12 birebir |

### Yeni SOURCE_FACT'ler

`SOURCE-FK-001..004` · `SOURCE-CONFIG-014` · `SOURCE-CONFIG-015` ·
`SOURCE-TR-001..003` · `SOURCE-CL-001` (9 yeni fact)

### Çelişkiler

| ID | Konu | Öncelik | Sonuç |
|---|---|---|---|
| CONFLICT-013 | F-K = 0: sahte-iyilik etiketi ↔ geçerlilik sınırı | P2 | **REJECTED** (kaynak içi gerilim, kod doğru) |
| CONFLICT-014 | Konf. 15: kaynak L=60 noktası ↔ kod 55-65 bandı | P2 | **REJECTED** (ilk P1 bulgum **hatalıydı**, düzeltildi) |
| CONFLICT-015 | TR kesme puanı 1 puan kaymış (3 tutarlı sayılıyordu) | P1 | **FIXED** (CHANGE-007) |

### Kod değişikliği

**CHANGE-007** — `src/scoring/mmpiConsistency.ts`:
`consistent = score <= 3` → `score <= 2`; kaynakta olmayan "üç-dört"
iddiası ve Gravitz & Gerton atfı kaldırıldı; +4 regresyon testi.

### Önemli süreç olayı

CONFLICT-014 ilk kaydedildiğinde **hatalıydı**: "kaynak başlığı 60 der, şekil 55
gösterir" iddiası, şeklin yüksek DPI okumasıyla **çürütüldü** (şekilde L noktası
tam 60'ta; kaynakta "55" diye bir değer yok). Kayıt silinmedi; **düzeltme geçmişi
korunarak** REJECTED'a çevrildi (Previous finding / New evidence / Resolution /
Reason). Aynı hata sınıfı için kural eklendi: **şekil içi eğri/ızgara değerleri
200 DPI OCR ile okunamaz, yüksek DPI görsel doğrulama zorunludur.**

### Güncel çelişki tablosu

| ID | Öncelik | Konu | Durum |
|---|---|---|---|
| CONFLICT-001 | P0 | F kadın normu | ✅ **REJECTED** (kod doğru) |
| CONFLICT-002 | P0 | K normları | ✅ **REJECTED** (kod doğru) |
| CONFLICT-003 | P1 | L T bandı alt sınırı (59 ↔ 56) | OPEN |
| CONFLICT-004 | P1 | F ham bant sınırları | OPEN |
| CONFLICT-005 | P1 | L/K ham bant tabloları kaynakta yok | INVESTIGATING |
| CONFLICT-006 | P2 | F/K T bant sınır yazımı | CONFIRMED (kabul) |
| CONFLICT-007 | P2 | `docs/kaynak-denetimi.md` depoda yok | CONFIRMED |
| CONFLICT-008..012 | P0 | 5 anahtar hatası | ✅ FIXED |
| CONFLICT-013 | P2 | F-K = 0 etiketi | ✅ **REJECTED** |
| CONFLICT-014 | P2 | Konf. 15 L nokta ↔ bant | ✅ **REJECTED** |
| CONFLICT-015 | P1 | TR kesme puanı | ✅ **FIXED** |

**P0 açık çelişki yok.** Kalan: 6 açık (4 P1 + 2 P2) · 4 REJECTED · 6 FIXED.

### Testler

`typecheck` 0 · `npm test` **301/301 PASS** (21 suite, 113 383 ms) ·
`build` 0 · **REGRESSION YOK**.

### Git kurtarma notu

Bu oturumun başında sandbox sıfırlaması nedeniyle yerel git geçmişi kaybolmuştu;
`git fetch` + `FETCH_HEAD` karşılaştırması içeriğin remote'ta **birebir aynı**
olduğunu gösterdi (`git diff FETCH_HEAD HEAD` boş) → `git reset --hard FETCH_HEAD`
ile geçmiş geri alındı. **Force-push gerekmedi.**

---

## PHASE 4 — batch 2: Bölüm 4 geçerlik konfigürasyonları 1-5

Tarih: 2026-09-21 · Kaynak: kitap **s.43-47** (PDF p29 R – p31 R)

### İşlenen sayfalar

| Kitap s. | PDF | İçerik | Sonuç |
|---|---|---|---|
| 43 | p29 R | Bölüm 4 girişi + **Konfigürasyon 1 — Tersine V** | ✅ birebir MATCH |
| 44 | p30 L | **Konfigürasyon 2** (L,K ≥60; F ≈50) | L,K ✅ · F ⚠️ → CONFLICT-016 |
| 45 | p30 R | **Konfigürasyon 3 — "V" / Çok Kapalı** | ✅ birebir MATCH |
| 46 | p31 L | **Konfigürasyon 4 — Yükselen Eğilim** | sıra+L+K ✅ · F ⚠️ → CONFLICT-016 |
| 47 | p31 R | **Konfigürasyon 5 — Azalan Eğilim** | sıra+L ✅ · F/K ⚠️ → CONFLICT-016 |

### Yeni SOURCE_FACT'ler

`SOURCE-CONFIG-001` … `SOURCE-CONFIG-005` (+ Bölüm 4 giriş kuralı:
"? alt testi standart profil kağıdına işaret edilmez")

### Sayısal görsel doğrulama (zorunlu adım)

Konfigürasyon 4'ün **K değeri** ilk OCR'da dikişte kesildi ("Kalttesti6").
Bindirmeli yüksek DPI kırpma ile netleştirildi: **K alt testi 60 T puanındadır**
(L=40, F=45-55). Sayı OCR'dan kabul edilmedi.

### Yeni çelişki

**CONFLICT-016 (P1, OPEN)** — Kaynak Konf. 2/4/5'te F ve K için **aralık**
verir (F 45-55; K 40-45; F ≈50), kod ise aralıkları **tek yönlü** uygular
(Konf. 4'te F için hiç sınır yok; Konf. 5'te K'nın alt sınırı yok).
→ Yorum katmanı etkisi; puanlama etkilenmez.
**Karar bilinçli olarak ertelendi:** tüm konfigürasyon seti (s.48-55) okunmadan
kural sıkılaştırılmamalıdır — CONFLICT-014'ün dersi.

### Gözlem (ileride karar için)

Kaynak çoğu konfigürasyonda **nokta değer** verir (40, 60, 50); kod bu noktaları
**±5 tolerans bandına** çevirir ve kaynak değeri daima bandın içinde kalır
(DECISION-018 ile tutarlı, kabul edilebilir). Sorun yalnızca kaynağın **açık
aralık** verdiği hâllerde ortaya çıkar.

### Durum

Bu batch'te **kod değişikliği yok** · yeni test yok.
Önceki doğrulama zinciri geçerli: 301/301 PASS · typecheck 0 · build 0.

---

## PHASE 4 — batch 3: Bölüm 4 konfigürasyonları 6-13 — **BÖLÜM TAMAMLANDI**

Tarih: 2026-09-21 · Kaynak: kitap **s.48-55** (PDF p32 L – p35 R)

| s. | PDF | İçerik | Sonuç |
|---|---|---|---|
| 48 | p32 L | Konf. 6 — Rastgele cevaplama (L,K=55; F>105) | ✅ MATCH |
| 49 | p32 R | Konf. 7 — Tümüne "doğru" (L,K≤35; F>120) | L,K düzeltildi · F **ulaşılamaz** → CONFLICT-019 |
| 50 | p33 L | Konf. 8 — Tümüne "yanlış" (L,F,K>80) | kaynak içi tutarsızlık → **REJECTED** |
| 51 | p33 R | Konf. 9 — Yardım isteği (L,K<66; F≈100↓) | ✅ düzeltildi |
| 52 | p34 L | Konf. 10 — Geleneksel olmayan (L<66; F>69; K>65) | ✅ **birebir MATCH** |
| 53 | p34 R | Konf. 11 — Açık ve tavizsiz (L<55; F≈64; K<45) | ✅ MATCH |
| 54 | p35 L | Konf. 12 — Güvenilir cevaplayıcı (L≈50; F<70; K>50) | ✅ MATCH |
| 55 | p35 R | Konf. 13 — Akut/süreğen (L>50; F≈K>55) | ✅ **birebir MATCH** |

**Bölüm 4 (15/15 konfigürasyon) tamamlandı.**

### Kod değişikliği

**CHANGE-008 (P1)** — `ascending` +F 45-55 · `descending` +K ≥ 40 ·
`all-true` 40→**35** · `help-seeking` 105→**100**. +6 regresyon testi.

### Çelişkiler

| ID | Konu | Sonuç |
|---|---|---|
| CONFLICT-017 | Konf. 4/5/7/9 eşikleri kaynaktan sapmış | ✅ **FIXED** (CHANGE-008) |
| CONFLICT-018 | Konf. 8 eşiği (80) kaynak içi tutarsız | ✅ **REJECTED** (DECISION-020) |
| CONFLICT-019 | Konf. 7 hiç tetiklenemiyor (F>120 vs [20,120] kırpma) | ⚠️ OPEN |
| CONFLICT-020 | Konf. 2/9/12'de kaynakta olmayan sınırlar | ⚠️ OPEN |

### Ampirik kanıtlar (bu turda koşuldu)

- **Tümüne "Yanlış"** → L 81.2 · **F 75.3** · K 82.3 → kaynağın "F>80" koşulu
  gerçek bir "tümüne yanlış" yanıtlayıcıda **sağlanamaz** → kaynak içi tutarsızlık.
- **Tümüne "Doğru"** → F 120.0 (kırpma sınırı) → kaynağın "F>120" koşulu
  **matematiksel olarak imkânsız** → konfigürasyon hiç raporlanmıyor.

### Testler

`typecheck` 0 · `npm test` **307/307 PASS** (22 suite) · `build` PASS ·
**REGRESSION YOK**.

### Güncel çelişki tablosu

Açık **8** (5 P1: 003/004/005/016-kısmi/019 · 3 P2: 006/007/020) ·
FIXED **7** (008-012, 015, 017) · REJECTED **5** (001, 002, 013, 014, 018).
**P0 açık çelişki yok.**

---

## PHASE 4 KAPANIŞI — kitap s.62-63

Tarih: 2026-09-21 · Kaynak: kitap **s.62** (p39 L) + **s.63** (p39 R)

### s.62 — Dikkatsizlik endeksi kesin sayıları (GÖRSEL DOĞRULANDI)

| Kaynak | Kod | Sonuç |
|---|---|---|
| "**12 çift** görgül yolla seçilmiş madde" | `CARELESS_PAIRS` = 12 çift | ✅ MATCH |
| "en yüksek puan **12**'dir" | 12 çift × 1 puan = 12 | ✅ MATCH |
| "**Greene (1980)** … **4'ün kesim puanı**" | `normal = score < 4` (≥4 uyarı) | ✅ MATCH |

→ **`UNVERIFIED-TR-001` KAPANDI** (DECISION-022). Kayıt: SOURCE-CL-002.

### s.63 — BÖLÜM 5 başlangıcı

"Minnesota Çok Yönlü Kişilik Envanteri **Klinik Testlerin Değerlendirilmesi**";
kod yorumlarının temel kaynak listesi (Archer, Butcher, Ceyhun, Dahlstrom,
Erol, Friedman & Graham, Greene, Lachar, Levitt, Savaşır, Webb); kapsam
sözleşmesi: "ikili kodların **hepsi**, üçlü ve dörtlü kodların **çoğunluğu**";
"kodların yorumlanması alt testlerin **sayısal sıralamasına** göre".
Kayıt: SOURCE-CL-003.

### Durum

**PHASE 4 (K düzeltmesi + geçerlik konfigürasyonları) ✅ DONE** — s.43-62
tamamen işlendi. Açık çelişki **8** (5 P1 · 3 P2), **açık P0 yok**.
Testler: **307/307 PASS** (22 suite) · typecheck 0 · build PASS · REGRESSION YOK.

---

## CONFLICT-016/019/020 kararları — konfigürasyon erişilebilirlik turu

Tarih: 2026-09-21

**Yöntem:** `detectValidityConfig` ilk-eşleşen-kazanır olduğu için önce 15
konfigürasyonun sırası/koşulları döküldü, sınır davranışı sınandı; kararlar
erişilebilirlik kanıtına dayandırıldı (DECISION-023).

| Çelişki | Karar |
|---|---|
| CONFLICT-019 (Konf. 7 ölü kural) | ✅ **FIXED** — `F > 120` → **`F >= 120`** (CHANGE-009) |
| CONFLICT-020 (Konf. 12 `K ≤ 65`) | ✅ **FIXED** — sınır **kaldırıldı** (CHANGE-010) |
| CONFLICT-020 (Konf. 9 `F ≥ 70`) | ⚠️ **korundu** — kaldırılırsa `frank`+`credible` erişilemez |
| CONFLICT-016 (Konf. 2 `F ≤ 55`) | ✅ **REJECTED** — `closed-v` sırası zaten F∈[50,55] verir |

**Kanıt (kod içi koşum):** tümüne-"Doğru" profili (L 26.5 / F 120.0 / K 22.1)
ve L=50, F=65, K=70 profili önceden **hiçbir konfigürasyona girmiyordu**;
her ikisi de artık doğru örüntüye eşleşiyor.

**Doğrulama:** typecheck 0 · `mmpiKeyIntegrity` 22/22 (+2 test) · tam suite
**309/309 PASS** (22 suite) · build PASS · `optik-form.html` senkron ·
**REGRESSION YOK**.

**Güncel çelişki tablosu:** açık **5** (3 P1: 003/004/005 · 2 P2: 006/007) ·
FIXED **9** · REJECTED **6**. **Açık P0 yok.**

---

## PHASE 8 — Wiggins normları doğrulandı (kitap s.178-181)

Tarih: 2026-09-21 · PDF p97 L – p98 R

### Bulgular

| Konu | Sonuç |
|---|---|
| **Tablo 20** (s.179) normları ↔ `WIGGINS_NORMS` | ✅ **26/26 BİREBİR MATCH** (Normal Grup n=1000) |
| Madde sayıları (13 skala) | ✅ 12/13 match · SOC metin "26" ↔ kitabın listesi 27 → **kaynak içi tutarsızlık** (DECISION-024) |
| SOC yorum yönü | ⚠️ **CONFLICT-022** (P2, OPEN) — kaynak "yüksek = kendinden emin" der; kod "yüksek = ketlenmiş". PHASE 10'da karar |
| Madde listeleri | ✅ Ek 9c karşılaştırması zaten **46/46 MATCH** |
| Türkçe uyarlama (s.181) | Akça & Ceyhun 1994 · n=2000 (400 K + 600 E hasta; 578 K + 422 E normal) |

### Yöntem (kalıcı ders)

Tablo ~**2.87° dönük** taranmış → sütunlar arası ~29 px dikey kayma → OCR
satırları 4. sütunda **bir alt satıra** yazıyordu (sessiz ±1 satır hatası).
**Çözüm:** deskew + sütun y-merkezi doğrulaması → `OCR_ISSUES.md`
**ROTATED-TABLE**.

### Kapanan kısıt

`AUDIT_STATE`: "WIGGINS_NORMS (13 ölçek) için hiç kaynak kanıtı yok" →
**KAPANDI** (DECISION-025). PHASE 8 tamamlandı.

### Güncel durum

Açık çelişki **6** (3 P1: 003/004/005 · 3 P2: 006/007/022) · FIXED **9** ·
REJECTED **7**. **Açık P0 yok.** Sonraki: **Bölüm 5 — kod tipleri (s.64+)**.

---

## PHASE 2/5 — Ek 1: MMPI madde metinleri (kitap s.215-233)

Tarih: 2026-09-21 · Kaynak: **Ek 1, s.215-233** (PDF p115 R – p124 R)

### Yöntem

- 19 sayfa **iki aşamalı OCR** (200 dpi → 300 dpi) ile alındı.
- **Kritik bulgu:** OCR, madde numarası ile metni farklı bloklarda ve
  sayfadan sayfaya **değişen sırada** döndürüyor → satır başı eşlemesi 1-2
  madde kayıyor. Bu yüzden madde metinleri **görselden** okundu.
- Yeni araç: **`scripts/mmpi-audit/verify-items.py`** — OCR yalnız numara
  **konumu** için; metin ≥300 dpi görselden; 13'lük parçalar hâlinde çıktı.
- Yeni OCR kuralları: `OCR_ISSUES.md` → **ITEM-ORDER**, **PAGE-NUMBER-AS-ITEM**.

### Bulgular

| Bulgu | Sonuç |
|---|---|
| Madde numaralandırması | **1 → 566 kesintisiz** (boşluk/kopya yok) |
| Kaynakta kritik madde listesi | **YOK** → `SOURCE-ITEM-002` (liste kaynak dışı) |
| 39 kritik madde kaydı (38 madde) | metinler görsel doğrulandı |
| Etiketi tutarlı | **24 kayıt** ✓ |
| Etiketi uyuşmayan | **14 kayıt** ❌ → **CONFLICT-023 (P2, OPEN)** |
| OCR'da kayıp madde | 25 numara → `UNVERIFIED_DATA.md` (2'si görsel okundu: 66, 139) |

**Örnek uyuşmazlıklar (görsel kanıtlı):**
- `#33` kod: "Sosyal Çekilme" ↔ kaynak: *"Başımdan çok garip ve tuhaf şeyler geçti"*
- `#151` kod: "Sosyal Çekilme / Yabancılaşma" ↔ kaynak: *"Biri beni zehirlemeye çalışıyor"*
- `#337` kod: "Depresif Çökkünlük" ↔ kaynak: *"Çoğunlukla bir takım şeyler ve kimseler için meraklanıp huzursuzlaşırım"*
- `#334` kod: "Depresif Çökkünlük" ↔ kaynak: *"Bazen tuhaf kokular duyarım"*
- `#20` kod: "Alkol/Madde Sorunları" ↔ kaynak: *"Cinsel yaşamımdan memnunum"*

**Lehte delil:** `#74` cinsiyet koşullu yön ayrımı kaynakla **tutarlı**;
24 kayıt doğru etiketli → liste tümüyle hatalı değil.

### Durum

- **Kod değişikliği YOK.** CONFLICT-023 kararı bekliyor (a) etiketleri kaynak
  metnine göre düzelt, (b) listeyi kaldır, (c) kaynak dışı işaretleyerek koru.
- Testler etkilenmedi (yalnız doküman + yeni araç eklendi).

---

## CONFLICT-023 kapanışı — kritik madde etiketleri (CHANGE-011)

Tarih: 2026-09-21 · Karar: DECISION-026 · Öncelik: P2

- **14 etiket** kaynak madde metnine göre düzeltildi (kanıt: 300-350 dpi görsel,
  s.216-226) — ör. `#151` "Sosyal Çekilme / Yabancılaşma" → **"Zehirlenme
  Sanrısı / Şüphecilik"**.
- Liste **kaynak dışı** olduğu için kod başlığında belgelendi (kaynakta kritik
  madde listesi yok — `SOURCE-ITEM-002`).
- Madde numaraları ve D/Y yönleri **değişmedi**; `#74` cinsiyet ayrımı korundu.
- Doğrulama: `typecheck` 0 · `mmpiKeyIntegrity` **26/26** · `npm test`
  **313/313 PASS** (23 suite) · `build` PASS · **REGRESSION YOK**.

---

## PHASE 9/10 — batch 1: Hs yorumu + ilk kod tipleri (kitap s.66-69)

Tarih: 2026-09-21 · Kaynak: kitap **s.66-69** (PDF p41 L – p42 R)

| s. | PDF | İçerik | Sonuç |
|---|---|---|---|
| 66 | p41 L | Tablo 8 (Hs maddeleri) + Hs düşük puan 5 maddesi + madde 22/23 | ✅ Tablo 8 teyit · 5 madde **eksik** (026) |
| 67 | p41 R | Hs T-puan bantları (85+/75-84/60-74/50-59/21-49) + Hs ilgili ölçekler | ✅ **5/5 bant sınırı birebir MATCH** |
| 68 | p42 L | 12/21 kodu (gövde + ergen paragrafları) + 123/213 başlangıcı | ✅ gövde MATCH · ergen **eksik** (025) · 123/213 **kodda yok** |
| 69 | p42 R | 12/21 koşullu ek yorumlar + 1234 + 1236 başlangıcı | ❌ **üçlü kodlar kodda yok** (024) |

### Kritik bulgu — CONFLICT-024 (P1)

Kaynak, Hs kod tipi bölümünde **üçlü ve dörtlü kodlar** tanımlıyor
(`123/213`, `1234`, `1236`, `1237`, `2134`, `213/231`) ve bunlar iki noktalı
kodlardan **farklı** yorumlar taşıyor. Kodda:
- `CODES` sözlüğünde **45 iki noktalı kod** var, **hiç üçlü kod yok**
- Kod üretimi `mmpiScoring.ts:258` → `slice(0, 2)` = yalnızca **en yüksek 2 ölçek**
- 12/21 için kaynağın **"5 T puanı fark"** kuralı yalnızca metin olarak var,
  **tespit edilmiyor**

Bu, kaynağın yorum katmanının önemli bir bölümünün hiç üretilmediği anlamına
gelir. Karar, kaynağın **tam üçlü kod seti** çıkarıldıktan sonra verilecek
(s.70-158).

### Diğer bulgular

- **CONFLICT-025 (P2):** 12/21 yorumunda "lise öğrencileri" ve "üniversite öncesi
  ergenler" paragrafları + koşullu Pd/Ma/Mf/L yorumları eksik.
- **CONFLICT-026 (P3):** Hs düşük puanın 5 özelliği, 40 yaş notu, "doktor doktor
  gezerler" cümlesi ve 21-49 bandının `2,6,7,8,0 > 70` örüntü koşulu eksik.

### Doğrulama

Görsel okuma (**≥300 dpi tam sayfa**, `v_p041_full.png`, `v_p042_full.png`) —
Tablo 8, Hs bant sayıları, 12/21 ve üçlü kod başlıkları **gözle teyit edildi**;
sayısal iddialar OCR'a bırakılmadı (OCR_ISSUES.md FIGURE-CURVE kuralı).

### Çelişki tablosu

Açık **9** (4 P1: 003/004/005/024 · 4 P2: 006/007/022/025 · 1 P3: 026) ·
FIXED 10 · REJECTED 7. **P0 açık çelişki yok.**

---

## PHASE 9/10 — batch 2: Hs kod bloğu TAMAMI (kitap s.70-78) + D girişi (s.79)

Tarih: 2026-09-21 · Kaynak: kitap **s.70-79** (PDF p43 L – p47 R)

### Hs (1) alt testi kod bloğu — KAPANDI (s.67-78)

**31 kod tipi bölümü** görsel olarak okundu. Kaynak bulguları
`SOURCE-CODE-005..010`, kapsam analizi `CONFLICT-024_KAPSAM.md`.

| Grup | Kodlar |
|---|---|
| **Kodda VAR (9)** | `12`, `13`, `14`, `15`, `16`, `17`, `18`, `19`, `01` — **gövdeler sadık MATCH** ✅ |
| **Kodda YOK (22)** | `123`, `1234`, `1236`, `1237`, `1270`, `12378`, `128`, `129`, `120`, `132`, `134`, `1342`, `136`, `137`, `138`, `1382`, `139`, `146`, `1469` + 3 alt-kod (`13/31 Yüksek K`, `13/31 Düşük 2`, `Yüksek 1/Düşük 4`) |
| **Yalnız atıf (kodda yok)** | `2134`, `213/231`, `182/812`, `183/813`, `187/817`, `143/413`, `142/412`, `172/712`, `173/713` |

### İki kök neden

1. **CONFLICT-024 (P1) — kod modeli 2 ölçekli.** `mmpiScoring.ts:258`
   `slice(0, 2)` yalnızca en yüksek 2 ölçeği alıyor; `CODES` sözlüğünde
   0 üçlü kod var. Kaynağın yorum katmanının büyük bölümü üretilmiyor.
2. **CONFLICT-025 (P2) — koşullu cümleler düşmüş.** Mevcut 9 kodun gövdesi
   sadık, ancak kaynak yorumu **üçüncü ölçeğe ve profilin geri kalanına** göre
   ayrıştırıyor ("8 ve 6 birlikte yükselmişse", "L ve K da yükselirse",
   "erkeklerde 2 ve 4'ün, kadınlarda 3 ve 8'in olduğu üçlü yükselme",
   "143/413 ve 142/412", "172/712 ve 173/713", "182/812, 183/813, 187/817").
   7 kodda belgelendi.

### Kritik sayısal koşullar (kaynaktan, görsel doğrulanmış)

- **13/31 Yüksek K:** 2, 7, 8 testleri **70'in altında** ∧ F **50'nin altında**
- **13/31:** "L ve K alt testleri de yükselirse" → ayrı yorum
- **136/316:** "Pa, Hy'den **10 T puanından** daha yüksekse şüphecilik ve
  kızgınlık"; "**Hy, Pa'dan 10 ya da daha fazla T puanı** yüksekse paranoid
  özellikler daha az belirgin olmak üzere fiziksel yakınmalar ön plana çıkar"
- **1382:** 138'e ek depresyon/konfüzyon/alkol/intihar
- **19/91:** "2 ve 3 alt testlerinin değerleri **5 T puanından aşağıda ise**
  129 ve 139 koduna bakınız"
- **12/21:** "1 ve 2 arasında **5 T puanı** fark varsa 21'e bakılır"
- **10/01:** "**T değeri 70'in üstünde ise** destek sistemleri zayıflamıştır"

### D (2) alt testi başlangıcı (s.79)

`SOURCE-CL-009`: D alt testi girişi + **"D alt testinde yüksek puan alan bir
birey (Graham 1987)" 21 maddelik listesi** kayda geçti. Kod karşılaştırması
sonraki batch'te (s.80-94, Tablo 9).

### Kod değişikliği

**YOK** — CONFLICT-024/025 tasarım kararı gerektiriyor; kaynağın **tüm** kod
seti (10 klinik ölçek × kod bloğu) çıkarılmadan karar verilmeyecek.

### Çelişki tablosu

Açık **9** (4 P1: 003/004/005/024 · 4 P2: 006/007/022/025 · 1 P3: 026) ·
FIXED 10 · REJECTED 7. **P0 açık çelişki yok.**

---

## PHASE 5/9 — batch 3: D (2) alt testi anahtarı + normu (kitap s.79-83)

Tarih: 2026-09-21 · Kaynak: kitap **s.79-83** (PDF p47 R – p49 R)

### P0 katmanı doğrulandı — Tablo 9 BİREBİR MATCH ✅

| Katman | Sonuç |
|---|---|
| Madde sayısı 60 | ✅ |
| Doğru 20 madde | ✅ **BİREBİR MATCH** |
| Yanlış 40 madde | ✅ **BİREBİR MATCH** |
| Norm Erkek 20.63 | ✅ MATCH |
| Norm Kadın 23.86 | ✅ MATCH |

**OCR hatası yakalandı:** Ham OCR Yanlış listesinin ilk maddesini "6" okudu;
420 dpi görsel doğrulama **"9"** olduğunu gösterdi. Yeni kural kaydı:
`OCR_ISSUES.md` → **DIGIT-6-9** (6/9, 0/8, 1/7, 5/6 görsel teyit zorunlu).

### D T-puan bantları — MATCH

Kaynak: 85+ / 79+ / 70-79 / 60-69 / 45-59 / 28-44 ·
Kod: 85+ / 79-84 / 70-78 / 60-69 / 45-59 / 28-44(min 0)
→ Bant **etiketleri birebir**; kaynağın **79 çakışması** (79 hem "79 ve üstü" hem
"70-79" içinde) kodda **ilk-eşleşen-kazanır** sırasıyla tek anlamlı hâle gelmiş.

### Kaynak bulguları

- `SOURCE-CL-010`: Tablo 9 (anahtar + norm)
- `SOURCE-CL-011`: D düşük puan 18 maddelik liste → kodda **yok**
- `SOURCE-CL-012`: "Alt test 2 ile ilişkin **açık davranışsal belirtiler yoksa,
  intihar riskine karşı dikkatli olmak gerekir**" → yorum katmanı kuralı
- `SOURCE-CL-013`: D T-bantları

### CONFLICT-024 kapsamı genişledi (D bloğu)

Kaynakta: `213/231`, **`231/321`, `234/324`, `237/327`** ("**en sık üçlü
kodlar**"), `237`, `239` … → kodda **hiçbiri yok**. Kaynak üçlü kodlar için
**frekans sıralaması** bile veriyor.

### Kod değişikliği

**YOK** — anahtar/norm/bant katmanı zaten MATCH; eksik olan **yorum katmanı**
(CONFLICT-024/025) tasarım kararı bekliyor.

---

## PHASE 9/10 — batch 4: D kod bloğu (kitap s.84-87)

Tarih: 2026-09-21 · Kaynak: kitap **s.84-87** (PDF p50 L – p51 R)

### 🔴 Yeni P1 çelişki — CONFLICT-027

Kaynak, kod yorumlarını **T-puan eşiklerine** bağlıyor; kodun veri modeli
(`CodeInterpretation = { code, text, diagnosis?, seeAlso? }`) **koşul taşımıyor**:

| Kod | Kaynak koşulu |
|---|---|
| `26/62` | "**Pa alt testi belirgin bir biçimde yükseldiğinde ve/veya 4 ve 8 alt testi 70 T puanının üzerinde ise**, bireyin psikozun erken dönemlerinde olma olasılığı artar." |
| `27/72` | "**Çok fazla yükselmeler (örneğin, 85 T puanının üstünde)** … **daha etkili müdahale formları (ilaç gibi) gerekli olabilir.**" |

→ Ayrıca `13/31` (2,7,8 < 70 ∧ F < 50), `138` (4 yüksek ∧ K düşük),
`19/91` (2,3 < 5 T farkı), `136/316` (Pa−Hy ≥ 10), `12/21` (1-2 farkı ≥ 5)
koşulları da kodda tespit edilmiyor. **7 örnek belgelendi.**

### Kaynak bulguları (SOURCE-CODE-011/012)

D kod bloğu: `23`, `24/42`, `243/432`, `247/427/472` + `742` + `274`,
`248` (+`Yüksek F` alt-kodu), `25/52`, `26/62`, `27/72` (+`275/725`,
`278/728`, `273/723`, `271/721`, `270/720`).
Kaynak ayrıca **"en sık üçlü kodlar"** listeleri veriyor (s.83, s.87).

### CONFLICT-024 kapsamı

Hs bloğu: 9 kod VAR / 22 YOK · **D bloğu: 4 kod VAR / 12+ YOK**
→ Bu artık **sistemik** bir eksik: kod modeli yalnızca **2 ölçekli**.

### Yeni araç

`scripts/mmpi-audit/inventory.py` — OCR metinlerinden **yalnızca kod başlıklarını
ve sayısal kuralları** çıkarır (bağlam ekonomisi: tam OCR metni okunmaz).

### Kod değişikliği

**YOK** — kanıt toplama aşaması sürüyor (kaynağın kalan klinik ölçek blokları).

---

## PHASE 9/10 — batch 7: D kod bloğu KAPANIŞI (kitap s.88-92)

Tarih: 2026-09-21 · Kaynak: **s.88-89 (p52)** + **s.92 (p54 L)**

| s. | PDF | İçerik | Sonuç |
|---|---|---|---|
| 88 | p52 L | `273/723`, `274/724`, `275/725` + **T-eşiği:** "test 4 ve 7 birbirlerinin **5 T puanı** alanı içindeyse" | 3 kod **kodda YOK** |
| 89 | p52 R | **`278/728`** + **T-eşiği:** "**K ve Hs, 50 T puanının altında** olduğunda ve/veya Ma yükseldiğinde intihar olasılığı dikkatle değerlendirilmelidir" | kod **YOK** (görsel doğrulandı) |
| 92 | p54 L | `29/92` kapanışı (3 tip birey) · **`20/02`** · **`207`** | `29/92` ✓ MATCH · `20/02` ✓ MATCH · `207` **YOK** |

**D (2) alt testi kod bloğu KAPANDI** (s.82-92).

### ⚠️ Kritik bulgu — CONFLICT-030 (P1, OPEN)

`src/scoring/mmpiSourceCodes.ts:305`:
```ts
return CODES[canonicalCode(code.slice(0, 2))];
```
**3+ ölçekli her kod ilk 2 haneye kırpılıyor.** Amprik olarak koşuldu: `273/723`,
`274/724`, `275/725`, `278/728`, `270` → hepsi **`27/72`** kaydını döndürüyor;
`207` → `20/02`; `213/231` → `12/21`; `231/321` → `23`; `248` → `24/42`;
`742` → `47/74`.

**Kapalı döngü kanıtı:** `27/72` kaydının `seeAlso` alanı *"273/723, 274/724,
275/725, 278/728, 270 kodlarına da bakınız"* diyor → kullanıcı `274/724` için
`27/72` metnini görür ve metin onu **tekrar `274/724`'e** yollar. **Bu kod
tiplerinin içeriği kullanıcıya asla ulaşmaz.**

**Yanlış metin eşlemesi:** `27/72` kaydının **6 cümlesinin tamamı** kaynağın
s.88'deki **`273/723`** metniyle birebir aynıdır; kaynağın `27/72` **ana kod**
metni (s.87) kodda **hiç yoktur** → `UNVERIFIED-CODE-001`.

### CONFLICT-027 genişletmesi

Altı yeni koşul belgelendi (`278/728` K·Hs<50 T; `274/724` 5 T fark;
`275/725` 4 düşük; `273/723` Hs yükselmiş; `274/724` 3 yükselmiş; `284/824`
4·2·8 5 T alanı) → kapsam **13 örneğe** çıktı. `CodeInterpretation` tipinde
**koşul alanı yok**.

### Yeni OCR kuralı

`OCR_ISSUES.md` → **SENTENCE-SKIP**: OCR, s.92'de bir cümleyi
("Çoğu (özellikle test 1 düşük ise) fiziksel olarak çekici olmadığını da düşünür.")
**tamamen atladı**; kod bu cümleyi içerdiği için OCR'a güvenilseydi **sahte
"kaynakta yok" bulgusu** üretilecekti.

### Kapsam tablosu (CONFLICT-024)

| Blok | Kodda VAR | Kodda YOK |
|---|---|---|
| Hs (s.63-78) | 9 | 22 (+3 alt-kod) |
| D (s.79-92) | 9 | 18 |
| **Toplam** | **18** | **40** |

### Doğrulama

Kod değişikliği **YOK** (karar tüm kod seti çıkarıldıktan sonra verilecek).
`npm run typecheck` · `npm test` · `npm run build` → aşağıda.

### Çelişki tablosu

Açık **11** → 0 P0 · **6 P1** (003, 004, 005, 024, 027, **030**) · 4 P2 (006,
007, 022, 025) · 1 P3 (026). FIXED 10 · REJECTED 7.

---

## PHASE 9/10 — batch 8: Hy (3) T bantları + Hy kod bloğu I (kitap s.95-99)

Tarih: 2026-09-21 · Kaynak: **s.95 (p55 R)** + **s.96-99 (p56 L – p57 R)**

### P0 katmanı — Hy T bantları **6/6 MATCH** ✅

| Bant | Kod | Sonuç |
|---|---|---|
| 85 T ve üstü | `85–∞` | ✅ |
| 76-85 T | `76–84` | ✅ metin birebir |
| 70-75 T | `70–75` | ✅ |
| 60-69 T | `60–69` (iki örüntü) | ✅ |
| 45-59 T | `45–59` ("özgü tanımlama yok") | ✅ |
| 24-44 T | `0–44` | ✅ metin · etiket kodda `T 22-44` |

**"Sadece Hy alt testinin yükselmesi"** kuralı — kaynak: "Sadece **3'ün yüksek**
olduğu ve **diğer hiçbir alt testin 70 T puanının üstünde olmadığı** durumda" ↔
kod `SINGLE_HY.rule` → **birebir MATCH** ✅ (metin de MATCH).

Doğrulama: **300 dpi görsel, 4 ayrı kadraj** (`v_s95_a..d.png`).

### Yorum katmanı — Hy kod bloğu I

Okunan kod tipleri: **Yüksek3/YüksekK**, `31`, **`32`**, `321`, `34/43`,
**Yüksek3/Düşük4**, `34`, **`345/435/534`**, `346/436`, `35/53`, `36/63`,
`54/45` notu → `SOURCE-CODE-017`.

### ⚠️ Yeni çelişki — CONFLICT-031 (P1, OPEN): kod yorumları **blok-bazlı**

Kaynak, iki-ölçekli kod yorumlarını **o ölçeğin blok başlığı altında** verir ve
**aynı rakam çifti farklı bloklarda farklı metin** taşır:

| Blok | Kaynak başlığı | Kodda dönen |
|---|---|---|
| D (s.82) | `23 Kodu` | `23` ✅ |
| **Hy (s.96)** | **`32 Kodu`** — "**23 kod tiplerinin aksine**… **menapoz güçlükleri**…" | **`23`** ❌ D bloğunun metni |

→ `codeInterpretation('32')` **yanlış ölçeğin metnini** döndürür. Kaynağın kendisi
`31 Kodu` için "(Bakınız 13/31 Kodu)" diyerek **bloklar arası atıf** yaptığından,
bu katman kaynağın yapısal bir özelliğidir; kodun tek `Record` modeli temsil edemez.

Ayrıca **CONFLICT-032 (P3, kayıt):** s.99 başlığı görselle **`345/435/534`**
(3 varyant) doğrulandı; kod `34/43`e düştüğü için `534` varyantı **erişilemez**.

### CONFLICT-027 genişletmesi (19 koşul)

Yeni: Hy 60-69 T (D 10 T düşük · Hy, Hs'ten 10 T yüksek) · `345/435/534`
(**3>4 ∧ K>50 T**) · `32` (2, 3'ün 5 T sınırında) · `346/436` (6, 3'ün 5 T
sınırında) · `34/43` (göreceli yükseklik) · "üçüncü en yüksek test" koşulları.

### Kapsam (CONFLICT-024)

| Blok | Kodda VAR | Kodda YOK |
|---|---|---|
| Hs (s.63-78) | 9 | 22 (+3 alt-kod) |
| D (s.79-92) | 9 | 18 |
| Hy (s.95-100) | 4 | 8 |
| **Toplam** | **22** | **48** |

### Doğrulama

Kod değişikliği **YOK**. `typecheck` · `npm test` · `build` → `TEST_AUDIT.md`.

### Çelişki tablosu

Açık **13** → 0 P0 · **7 P1** (003, 004, 005, 024, 027, 030, **031**) · 4 P2
(006, 007, 022, 025) · 2 P3 (026, **032**). FIXED 10 · REJECTED 7.

---

## PHASE 9/10 — batch 9: Hy bloğu KAPANDI + **NEVROTİK ÜÇLÜ PROFİLLERİ** (kitap s.100-107)

Tarih: 2026-09-21 · Kaynak: **s.100-101 (p58)** + **s.102-106 (p59-p61 L)** + **s.107 (p61 R)**

### Hy kod bloğu kapandı (s.100-101) — **5/5 kod kodda VAR ve MATCH**

| Kod | İçerik | Sonuç |
|---|---|---|
| `36/63` devamı | baş ağrıları/Gİ yakınmaları, aile üyelerine kızgınlık | ✅ MATCH |
| `37/73` | gerginlik/anksiyete/düşük akademik başarı + otistik geri çekilme + psikotik epizodlar | ✅ MATCH |
| `38/83` | ruhsal karmaşa + **Olası Tanı: Şizofreni** | ✅ MATCH |
| `39/93` | girişken/dışadönük + **Si 40 T altı** koşulu | ✅ MATCH |
| `30/03` | nadir + pasif/bağımlı | ✅ MATCH |

### 🆕 YENİ BÖLÜM — **NEVROTİK ÜÇLÜ PROFİLLERİ** (s.103-106)

Kaynak: "**Nevrotik üçlü içindeki üç alt testin ilişkileri çerçevesinde en sık
karşılaşılan DÖRT KONFİGÜRASYON vardır.**"

| # | Konfigürasyon | Koşul (**300-340 dpi görsel doğrulandı**) | Şekil |
|---|---|---|---|
| 1 | **Konversiyon vadisi** | Hs ↑ ∧ Hy ↑ ∧ **D ↓** | 17 |
| 2 | **Basamak orantısı** | **üçü de > 70 T** ∧ Hs > D > Hy | 18 |
| 3 | **Şapka** | **Hs < 70 T** ∧ **D > 70 T** ∧ **Hy > 70 T** (D en yüksek) | 19 |
| 4 | **Yükselen eğilim** | **üçü de > 70 T** ∧ Hs < D < Hy | 20 |

→ **CONFLICT-033 (P1, OPEN):** kodda üç ölçekli konfigürasyon tespiti **yok**
(yalnızca tek-ölçek bantları + iki noktalı kodlar). 4 konfigürasyon da
kullanıcıya gösterilmiyor.

### Diğer bulgular

- **s.102 boş sayfa** — `p059_L` OCR 1 satır döndürdü; görselle doğrulandı →
  yeni OCR kuralı **BLANK-PAGE-OCR** (boş sayfa iddiası görselle teyit edilir).
- **s.107:** Pd (4) alt testi girişi + Graham 1987 maddeleri (1-19) okundu → Pd
  bloğuna geçiş.
- CONFLICT-027 **23 koşula** genişletildi (s.100-101 örnekleri).
- CONFLICT-024 kapsamı: **26 VAR / 52 YOK** (nevrotik üçlü dahil).

### Doğrulama

Kod değişikliği **YOK**. `typecheck` · `npm test` · `build` → `TEST_AUDIT.md`.

### Çelişki tablosu

Açık **14** → 0 P0 · **8 P1** (003, 004, 005, 024, 027, 030, 031, **033**) ·
4 P2 (006, 007, 022, 025) · 2 P3 (026, 032). FIXED 10 · REJECTED 7.

---

## PHASE 9/10 — batch 10: Pd (4) anahtarı + T bantları (kitap s.107-110)

Tarih: 2026-09-21 · Kaynak: **s.107 (p61 R)** + **s.108-110 (p62 L – p63 L)**

### P0 katmanı — **Tablo 11 Pd anahtarı BİREBİR MATCH** ✅

| | Kaynak (s.108) | Kod (`SCORING_KEYS.Pd`) | Sonuç |
|---|---|---|---|
| Doğru | 24 madde | 24 madde | ✅ fazla/eksik yok |
| Yanlış | 26 madde | 26 madde | ✅ fazla/eksik yok |
| **Toplam** | **50** (kitabın "Madde Sayısı: 50") | 50 | ✅ |

- Araç: `cmp-tablo11.ts`
- Doğrulama: **400 dpi** okuma + **600 dpi dikiş kadrajı** — spine tablonun
  **5. sütunundan** geçiyor (`35/215`, `96/231` civarı); ayrı kadrajla teyit edildi
  (`33, 35, 38, 42` / `127, 215, 216, 224`).
- **Ek 9 ile çapraz doğrulama** ✓ · norm **16.62 / 18.12** ✓

### Pd T bantları **5/5 MATCH** ✅

`80+` · `70-79` · `60-69` · `45-59` · `20-44` — sınırlar **300 dpi görselle**
doğrulandı (`v_pd_band_a/b.png`).

### Ek içerik (s.107-109)

- Graham 1987 **Pd yüksek**: 43 madde (toplum kuralları, impulsivite, yalan/çalma,
  otoriteye isyankârlık, "**psikoterapi prognozu kötüdür**" dahil).
- **Pd düşük**: 12 madde (geleneksel/itaatkâr, pasif, samimi ve güvenilir,
  enerji düzeyi düşük, inatçı ve kuralcı…).
- "**Yüksek 4 profilleri (yetişkin normları kullanıldığında)**" → norm/yaş
  ilişkisi notu (CONFLICT-027).

### Doğrulama

Kod değişikliği **YOK**. `typecheck` · `npm test` · `build` → `TEST_AUDIT.md`.

### Çelişki tablosu

Değişmedi: açık **14** (0 P0 · 8 P1 · 4 P2 · 2 P3). Bu batch **yeni çelişki
üretmedi** — aksine bir P0 katmanını (Pd anahtarı) **doğrulayarak kapattı**.

---

## PHASE 9/10 — batch 11: Pd (4) kod bloğu I (kitap s.111-113)

Tarih: 2026-09-21 · Kaynak: **s.111-113** (PDF p63 R – p64 R)

| s. | PDF | İçerik | Sonuç |
|---|---|---|---|
| 111 | p63 R | Sadece Pd yükselmesi (en az 10 T) + Pd ilişkileri | ✅ metin MATCH · `Pd>=70` **UNVERIFIED** |
| 111-112 | p63 R–p64 L | **Yüksek 4/Düşük 5 Kodu** | ❌ **kodda YOK** |
| 112 | p64 L | **45/54 Kodu** + yaş/eğitim/cinsiyet zorunluluğu | ✅ gövde MATCH · ❌ direktif **YOK** |
| 113 | p64 R | **456 Kodu** | ❌ **kodda YOK** (üstelik `45/54` metnini döndürüyor) |
| 113 | p64 R | **46/64 Kodu** | ✅ gövde + diagnosis MATCH |

### Yeni bulgular

- **CONFLICT-034 (P2, OPEN):** "Bu kod tipi hastanın **yaşı, eğitimi ve
  cinsiyeti dikkate alınarak** yorumlanmalıdır." direktifi kod kayıtlarında yok.
  **Kaynak:** s.112.
- **CONFLICT-024 · genişletme:** Pd bloğunda **4 YOK** (Yüksek 4/Düşük 5, 456,
  468/648, 463/643) → kod seti toplamı **31 VAR / 56 YOK**.
- **CONFLICT-030 · genişletme:** kurpma ampirik kanıtı — `'456'`→`45/54`,
  `'468'`→`46/64`, `'463748'`→`46/64`, `'943'`→`49/94`. Örnek **13 → 17**.
- **CONFLICT-027 · genişletme:** `SINGLE_PD` kodda `Pd >= 70` koşulu ekliyor;
  kaynak cümlesinde yalnızca "en az 10 T yukarıda" var.
- **🆕 OCR kuralı `LOWCONF-GAP`:** OCR `<LOWCONF>` belirteci **tam bir cümleyi
  düşürmüş**; 340 dpi kadraj cümleyi kurtardı. Bu kural olmadan CONFLICT-034
  hiç bulunamazdı.

### Kod değişikliği

**YOK** (salt okuma + doğrulama turu).

### Testler

Değişiklik olmadığı için tam suite koşulmadı; karşılaştırma script'i
`scripts/mmpi-audit/cmp-pd-batch11.ts` eklendi (yeniden koşulabilir kanıt).

---

## PHASE 9/10 — batch 12: Pd (4) kod bloğu II (kitap s.114-117)

Tarih: 2026-09-21 · Kaynak: **s.114-117** (PDF p65 L – p66 R)

| s. | İçerik | Sonuç |
|---|---|---|
| 114-115 | 46/64 kapanışı (40 T koşulu) | ✅ gövde MATCH |
| 115 | **468/648 Kodu** | ❌ **YOK** (paranoid şizofreni + 3 sayısal koşul) |
| 115 | **469 Kodu** | ❌ **YOK** (tek cümle: test 9 > 70 T) |
| 115-116 | `47/74` | ✅ VAR · "en sık 3'lü kodlar 478/748 ve 472/742" **eksik** |
| 116 | **478/748**, **472/742**, **247/427**, **274** | ❌ **YOK** |
| 116-117 | `48/84` | ✅ VAR · `482/842`, `486/846`, `489/849` **YOK** |

### Yeni ampirik kanıt (CONFLICT-030 — kapalı döngü)

| Çağrı | Dönen | Beklenen |
|---|---|---|
| `'468'`,`'469'`,`'462'`,`'463'` | `46/64` | 468/648 · 469 · 462/642 · 463/643 |
| `'472'`,`'478'` | `47/74` | 472/742 · 478/748 |
| `'482'`,`'486'`,`'489'` | `48/84` | 482/842 · 486/846 · 489/849 |
| `'247'` | `24/42` | 247/427 · `'274'` → `27/72` |

→ **11 kod** hiç yok; `seeAlso` alanları **var olmayan kayıtlara** işaret ediyor.
CONFLICT-030: **17 → 28 örnek** · CONFLICT-024 toplamı: **33 VAR / 64 YOK** ·
CONFLICT-027: **23 → 26 koşul**.

### Görsel doğrulamalar

- `v_pd115_469.png` — 468/648 gövdesi (340 dpi)
- `v_pd115_469b.png` — **K<50 ∧ 5/4/6 5 T alanı ∧ 9&2>70 T** koşulu (birebir)
- `v_pd115_469c.png` — 469 kuralı ("test 9 da 70 T puanının üzerinde")

### Kod değişikliği

**YOK** (salt okuma + doğrulama turu).

---

## PHASE 9/10 — batch 13: Pd (4) kod bloğu III + **Pd BLOĞU KAPANIŞI** + Mf geçişi (kitap s.118-121)

Tarih: 2026-09-21 · Kaynak: **s.118-121** (PDF p67 L – p68 R)

| s. | İçerik | Sonuç |
|---|---|---|
| 118 | **482/842/824** Kodları | ❌ **YOK** |
| 118 | **489/849** Kodları | ❌ **YOK** |
| 118-119 | `49/94` Kodu + koşullar | ✅ VAR (gövde + diagnosis MATCH) · koşullar ❌ |
| 119 | **493/943** | ❌ **YOK** |
| 119 | **495/945** | ❌ **YOK** |
| 120 | **496/946** | ❌ **YOK** |
| 120 | **498/948** | ❌ **YOK** |
| 120 | `40/04` | ✅ VAR · **terim sapması** → CONFLICT-035 |
| **121** | **5. Mf Alt Testi girişi** | **yeni blok başladı** (Tablo 12 → sıradaki) |

### 🎯 Pd (4) bloğu TAMAMLANDI (s.107-120)

**20 kod incelendi · 7 VAR / 13 YOK** (kod kaydı olarak 9 VAR).
Pd bloğundan **2 yeni çelişki**: CONFLICT-034 (yaş/eğitim/cinsiyet direktifi),
CONFLICT-035 (terim sapması).

### Kod değişikliği — **CHANGE-012 (P2)**

`CODES['04']` → "**negatifik**" → "**vegetatif**" depresyon (kaynak s.120,
400 dpi görsel; DECISION-027). Gerekçe: **yanlış içerik bekletilmez**.

### Genişletilen çelişkiler

| ID | Önce | Sonra |
|---|---|---|
| CONFLICT-024 (kod seti kapsamı) | 33 VAR / 64 YOK | **36 VAR / 70 YOK** |
| CONFLICT-025 (koşullu cümle) | 7 örnek | **10 örnek** |
| CONFLICT-027 (T-eşiği koşulu) | 26 örnek | **32 örnek** |
| CONFLICT-030 (kırpma) | 28 örnek | **34 örnek** |

### Görsel doğrulamalar (hepsi 340-400 dpi)

`v_pd119_cond.png` (49/94 koşul cümlesi) · `v_pd120_496.png` (496/946 K<50) ·
`v_pd120_0404c/d/e.png` (40/04 üçüncü yüksek test + **vegetatif** terimi)

### Testler

`typecheck` 0 · `npm test` **316/316 PASS** (24 suite) · `build` PASS ·
**REGRESSION YOK**.

---

## PHASE 9/10 — batch 14: Mf (5) bloğu — Tablo 12 + T bantları + kodlar (kitap s.122-125)

Tarih: 2026-09-21 · Kaynak: **s.122-125** (PDF p69 L – p70 R)

### 🎯 P0 katmanı — **Tablo 12 (Mf anahtarı) BİREBİR MATCH**

| | Kaynak | Kod | Sonuç |
|---|---|---|---|
| Doğru (erkek) | 28 madde | 28 | ✅ |
| Yanlış (erkek) | 32 madde | 32 | ✅ |
| **Toplam** | **60** | **60** | kitabın "(Madde Sayısı: 60)" başlığıyla uyumlu |
| (*) kadınlarda ters (69, 179, 231, 297, 133) | 5 | `female` listelerinde **5/5 ters** | ✅ |
| Norm erkek / kadın | 29.21 / 32.98 | 29.21 / 32.98 | ✅ |

**Okuma yöntemi:** Tablo 12 **450 dpi, satır satır kadraj** (`v_mf_r12.png`,
`v_mf_r23.png`) — dönük/sıkışık tablo kuralı uygulandı.

### T bantları — tam MATCH

| Cinsiyet | Bant sayısı | Sonuç |
|---|---|---|
| Erkek | 5 (80+, 70-79, 60-69, 41-59, 26-40) | ✅ **5/5 MATCH** |
| Kadın | 4 (>65, 56-65, 41-55, 26-40) | ✅ **4/4 MATCH** |

### Yeni çelişki girdisi — **CONFLICT-027 genişletildi (P1)**

Kaynak (s.125): "Erkeklerde **5 testinde 75 T puanı ve üstü**…"
Kod (`mmpiInterpretation.ts:231`): `single('Mf')` = **`t >= 70`**
→ **5 puan erken tetikleme.** `SINGLE_MF_MALE` **metni** kaynağın 75'ini doğru
taşıyor, ama **tespit kuralı** 70 kullanıyor → metin ile kod çelişiyor.
CONFLICT-027: **32 → 33 örnek**.

### Mf kod bloğu

6/7 VAR ✅ (`51/15`, `52/25`, `53/35`, `54/45`, `56/65`, `57/75`) ·
**`564/654` YOK** ❌ → CONFLICT-024 (**36 VAR / 71 YOK**) · CONFLICT-030
(**34 → 35 örnek**, `'564'` → `56/65`).

### OCR kuralı — `LOWCONF-GAP` **2. kez doğrulandı**

İki Mf T bandı **etiketi** OCR'da `<LOWCONF>` ile kaybolmuştu:
"**26-40 T puanı:**" (s.124) ve "**80 ve üstü T puanı:**" (s.123).
360 dpi kadrajlarla kurtarıldı → kural, iki bant sınırının doğrulanmasını sağladı.

### Kod değişikliği

**YOK** (salt okuma + doğrulama; eşik farkı CONFLICT-027'de kayıtlı, karar
tüm kod seti çıkarıldıktan sonra verilecek).

---

## PHASE 9/10 — batch 15: Mf kodları II + **Pa (6) anahtarı ve bantları** (kitap s.126-130)

Tarih: 2026-09-21 · Kaynak: **s.126-130** (PDF p71 L – p73 L)

### 🎯 İki P0 katmanı daha TAM MATCH

| | Kaynak | Kod | Sonuç |
|---|---|---|---|
| **Tablo 13 (Pa anahtarı)** | 25 + 15 = **40** | 25 + 15 = 40 | ✅ **BİREBİR MATCH** |
| Pa normları | 11.12 / 11.93 | 11.12 / 11.93 | ✅ MATCH |
| **Pa T bantları** | 80+/70-79/60-69/45-59/27-44 | `PA_T_BANDS` | ✅ **5/5 MATCH** |

### Mf bloğu tam kapandı (s.121-126)

`58/85` ✅ · `59/95` ✅ · `50/05` ✅ → **Mf bloğu 9 VAR / 1 YOK**
(yalnız `564/654` eksik).

### Yeni bulgu — CONFLICT-026 genişletmesi

Kaynağın **Pa kontrol listeleri** kodda **yok** (4 liste):
- yüksek puan (Graham 1987, 8 madde)
- **orta düzeyde yüksek** puan, **T: 65-70** (6+ madde)
- **düşük** puan, **T: 35-45** (13+5 madde)
- **aşırı derecede düşük** puan, **T<35** (5+12 madde)

**Ek sorun:** kodun en düşük Pa bandı **T 27-44** olduğu için **T: 35-45** ve
**T<35** ayrımı **hiç üretilemez** (band ikisini de kapsıyor).

### Görsel doğrulamalar

`v_pa_tablo13_full.png` (125 dpi tam sayfa — Tablo 13 + Pa listeleri + 80+ bandı)

### Kod değişikliği

**YOK** (salt okuma + doğrulama).
