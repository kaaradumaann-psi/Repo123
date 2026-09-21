# Interpretation Audit (PHASE 10)

Yorum katmanı denetimi. **Scoring düzeltilmeden yorum katmanı düzeltilmez**
(görev talimatı §38). Bu nedenle bu dosya şu an çoğunlukla keşif/kayıt içerir.

---

## Denetlenen modüller

| Modül | İşlev | Durum |
|---|---|---|
| `src/scoring/mmpiInterpretation.ts` | Klinik ölçek yorumu | NOT_STARTED |
| `src/scoring/mmpiSource.ts` | Kaynak tabanlı bant metinleri | IN_PROGRESS |
| `src/scoring/mmpiValidityConfigs.ts` | L/F/K konfigürasyon örüntüleri | NOT_STARTED |
| `src/scoring/mmpiCritical.ts` | Kritik maddeler + klinik izlenimler | NOT_STARTED |
| `src/scoring/mmpiConsistency.ts` | TR endeksi, dikkatsizlik, F-K | NOT_STARTED |

---

## Bugüne kadar bulunan yapısal bulgular

### FINDING-I-001 — Künye sayfa numaraları bu kitapla uyuşmuyor

`mmpiSource.ts` başlığı der ki: "tüm kesme noktaları, aralıklar ve yorum
metinleri depodaki **klinik yorum rehberi** raporundan alınmıştır."
Yorum satırları `s.1-3`, `s.3-47`, `s.48-52` gibi sayfa numaraları verir.

Sorun:
Bu kitapta L bantları s.33, F bantları s.37, K bantları s.40'tadır. Yani
atıf yapılan "klinik yorum rehberi" **bu kitap değildir** ve depoda yoktur.

Etki:
- Yorum **içerikleri** bu kitapla yüksek oranda örtüşüyor (çeviri/aynı gelenek),
  ama bant **sınırlarında** farklar var (CONFLICT-003, CONFLICT-004).
- Kullanıcıya/yapay zekâya "kaynak: klinik yorum rehberi s.X" demek
  doğrulanabilir bir kaynak izi değildir.

Status: OPEN → PHASE 10/13

### FINDING-I-002 — Geçerlik konfigürasyonları bu kitabın Bölüm 4'ünde

`mmpiValidityConfigs.ts` içindeki 13 konfigürasyonun (V, tersine V, tümü
doğru/yanlış, rastgele, yardım isteği …) kaynağı **kitap Bölüm 4**
(kitap s.43-62, PDF p29 R-p39 L) olmalıdır.

**Kanıt (2026-09-21):** kitap s.43 okundu →
"Konfigürasyon 1: L ve K alt testlerinin T değerinin 50-60 ve F alt testinin T
değerinin 70'in üzerinde olduğu durumlar" + "Şekil 1. **Tersine V**."
Kodun `VALIDITY_CONFIGS[0]` (id `reverse-v`) kuralı birebir aynıdır:
`L 50-60 ∧ K 50-60 ∧ F > 70` ✅ **MATCH**.

Ayrıca kaynak şunu söyler: "**(?)** alt testi standart profil kağıdına işaret
edilmez." → kodda `?` ölçeğinin geçerlik konfigürasyonuna girmemesi doğrudur ✅

Kalan iş (PHASE 4/9):
`VALIDITY_CONFIGS` içindeki diğer 12 örüntünün (V, yükselen/azalan eğilim,
rastgele, tümü doğru/yanlış, yardım isteği, geleneksel olmayan, açık, güvenilir,
akut/süreğen, erdemli, katı) adı, sırası ve T eşikleri kitap Bölüm 4'te
**birebir** bulunmalıdır. Bulunamayan her örüntü `EXTRA`, eşiği farklı olan
her örüntü P1 `CONFLICT` olur.

Status: IN_PROGRESS → PHASE 4/9

### FINDING-I-003 — K düzeltmesinin kullanımı kaynakta eleştirel

Kaynak (s.39) K eklemeli profillerin uygunluğunun yeterince
araştırılmadığını açıkça yazar; ayrıca yüksek K durumunda (ham 16-20, 21+)
**"K ile düzeltilmemiş profilleri kullanmalıdır"** der (`K_RAW_BANDS` metni
kodda zaten bu uyarıyı taşıyor ✅).

Denetim sorusu (PHASE 4):
Kod K düzeltmesini koşulsuz uyguluyor mu, yoksa yüksek K durumunda
düzeltilmemiş profili de raporluyor mu? — `mmpiScoring.ts` içinde hem
`rawScore` hem `kCorrectedRaw` tutulduğu görülüyor; rapor/UI tarafı kontrol
edilecek.

Status: OPEN → PHASE 4/13

---

## Sonraki eylem

1. PHASE 4 (K düzeltmesi + konfigürasyonlar) tamamlanınca bu dosya
   `mmpiValidityConfigs.ts` için madde-madde karşılaştırmayla doldurulur.
2. PHASE 10'da klinik ölçek bant metinleri (s.67-158) doğrulanır.
3. Kaynak izi (source trace) alanları FINAL raporuna taşınır.
