# Tooling — OCR ve sayfa görüntüsü araç zinciri

Denetim tamamen yeniden üretilebilir olmalıdır: `.audit/` klasörü silinse bile
aşağıdaki komutlarla aynı çıktı geri üretilebilir.

## Kurulum (sandbox'ta doğrulandı)

```bash
# node tarafı
npm install

# python tarafı (apt deposu sandbox'ta erişilemez: tesseract kurulamaz)
pip3 install --break-system-packages pymupdf rapidocr-onnxruntime opencv-python-headless
```

`opencv-python-headless` şart: `rapidocr-onnxruntime` normalde
`opencv-python` çeker ve bu paket headless olmayan libGL gerektirir
(`ImportError: libGL.so.1`). Headless sürüm sorunu çözer.

Kurulu sürümler (2026-09-21): PyMuPDF 1.28.2, Python 3.11.

## Kullanım

```bash
# görsel çıkarma (tablo doğrulaması için)
python3 scripts/mmpi-audit/extract.py render --pages 25 --half left --dpi 300

# OCR (yalnızca istenen aralık; DONE sayfalar atlanır)
python3 scripts/mmpi-audit/extract.py ocr --pages 26-29 --dpi 200

# yeniden OCR zorlamak (yalnızca NEEDS_REVIEW için)
python3 scripts/mmpi-audit/extract.py ocr --pages 26 --force
```

## Çıktılar (git'e girmez)

```
.audit/pages/pNNN_L.png / pNNN_R.png     sayfa yarımları
.audit/pages/v_*.png, tbl_*.png          doğrulama kırpmaları
.audit/ocr/pNNN_L.txt / pNNN_R.txt       OCR metni (<LOWCONF> işaretli)
```

`.gitignore` içinde `.audit/` kayıtlıdır (telif + boyut).

## Bilinen kısıtlar

| Kısıt | Etki | Önlem |
|---|---|---|
| Türkçe OCR modeli yok | aksan/birleşik kelime hataları | sayısal veride görsel doğrulama |
| Tesseract kurulamıyor | ikinci OCR motoru yok | iki bağımsız **kırpma** ile çapraz okuma |
| Merkez dikişi | tablo sütunu kaybı | bindirme paylı kırpma (DECISION-003) |
| OCR hızı ~5.5 sn/yarım sayfa | uzun PDF'te maliyet | yalnızca sıradaki batch işlenir |

## Puanlama / test komutları

```bash
npm run typecheck    # tsc --noEmit
npm test             # 287 test (baseline) → güncel: **375/375 · 36 suite** (batch 24'ten beri; batch 25 test eklemedi)
npm run build        # tsc --noEmit && node scripts/build.mjs
```

Bir scoring değişikliğinden sonra üçü de çalıştırılır ve sonuç
`TEST_AUDIT.md` + `CODE_CHANGES.md` içine yazılır.

## Mutabakat (kaynak ↔ kod) araçları — hepsi salt-okunur

```bash
npx tsx scripts/mmpi-audit/cmp-b6-batch23.ts   # BÖLÜM 6 eşikleri + 9 kayıt (CHANGE-015) → 0 FARK
npx tsx scripts/mmpi-audit/cmp-b6-batch24.ts   # desen kartlarında source/quote (CHANGE-016)   → 0 FARK
npx tsx scripts/mmpi-audit/cmp-b6-batch22.ts   # tarihsî: CHANGE-015 ÖNCESİ yokluk kanıtı (7 FARK)
npx tsx scripts/mmpi-audit/final-count.ts      # FINAL sayımları: (A) Ek 9 V/O · (B) kayıt
                                               # defteri · (C) KAPSAM başlık evreni → HATA 0 · NOT 7
```

`final-count.ts` üç sayımı birden **kayıttan** ölçer (bellekten değil): markdown tablolarını
başlık satırıyla ayrıştırır, **sınıflandırılamayan satırı tek tek basar** (sessiz düşürme yok),
durum için “son satır geçerli” kuralını uygular ve sayısal başlıkları
`resolveCodeInterpretation()` ile çapraz sorgular. Beklenen çıktı (2026-09-22):

- **(A)** 46 satır · 46 MATCH · 0 DIFF · 0 MISSING · **V 14 / O 32** · belirsiz 0
- **(B)** `KNOWN_CODES 45 + KNOWN_BLOCK_CODES 4 = 49` · **12 koşullu yorum** · model sınırı
  `resolve('46') → 46/64` ↔ `64/46`
- **(C)** 164 başlık satırı → **152 eşsiz etiket** · dışlanan 9 · tablo-dışı 57 ·
  defter 148 (VAR+YOK 150) · **çözümlenemeyen YOK: iki haneli 0 / 3+ haneli 81**

Çıkış kodu: `HATA = 0` → **0**; parser bir satırı hiç sınıflandıramazsa veya iki haneli bir
“VAR” başlık kodda resolve edilmiyorsa **1**. `NOT` satırları belge tarafı düzeltme önerisidir;
araç hiçbir dosyayı yazmaz.
