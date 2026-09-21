# Source Index

Kaynak: `docs/MMPI Kitap (1) (1).pdf` — *Minnesota Çok Yönlü Kişilik Envanteri,
Değerlendirme Kitabı*, 2. Baskı, Ankara 2003, Ceyhun & Oral.
Ölçek sürümü: **MMPI (orijinal / MMPI-1), 566 maddelik kitap formu.**

## Sayfa eşleme (zorunlu formül)

```
leaf        = kitap_sayfası + 15
PDF sayfası = ceil(leaf / 2)
yarı        = "R" (sağ)  eğer leaf çift,  "L" (sol) eğer leaf tek
```

Doğrulanmış örnekler: kitap s.1 = PDF p8 R · kitap s.34 = PDF p25 L ·
kitap s.244 (Ek 9) = PDF p130 L · kitap s.257 (Ek 10) = PDF p136 R.

> **Merkez kırpma uyarısı:** Tarama sayfasının tam ortasından bölündüğünde
> bazı tablo sütunları kaybolur (bkz. `OCR_ISSUES.md` → SPINE-CLIP).
> Tablolarda `--half both` yerine **bindirme payı olan** kırpma kullanılmalıdır.

## Bölüm haritası

| Kitap s. | PDF (yarı) | Bölüm / Konu | Durum |
|---|---|---|---|
| i-vi | p3 R – p6 R | İçindekiler | **DONE** |
| vii-viii | p7 R | Önsöz | DONE |
| 1-4 | p8 R – p9 R | Bölüm 1: Tanım, MMPI'ın geliştirilmesi | DONE |
| 4-6 | p9 R – p10 R | Geçerlik testlerinin geliştirilmesi; ? / L / F / K tanıtımı | DONE |
| 7-16 | p11 L – p15 R | Klinik alt testlerin geliştirilmesi (Hs…Si), norm grupları | IN_PROGRESS |
| 17-28 | p16 R – p22 L | Bölüm 2: Formlar ve Uygulaması (test yönergesi, puanlama, profil çizimi) | NOT_STARTED |
| 29 | p22 R | Bölüm 3 girişi + **(?) Bir şey diyemem** alt testi | **DONE** |
| 30 | p23 L | **Tablo 2 — ? alt testi yorumu** (0 / 1-5 / 6-30 / 31+) | **DONE** |
| 31 | p23 R | **Tablo 3 — L maddeleri (15 madde)** + L alt testi | **DONE** |
| 32-33 | p24 L-R | **L T bantları** (69+ / 64-68 / 59-63 / 36-55 / ≤35) + L–klinik ilişkisi | **DONE** |
| 34 | p25 L | **F alt testi + Tablo 4 — F maddeleri (64 madde)** + F normu | **DONE** |
| 35 | p25 R | **F ham puan bantları** (0-2 / 3-9 / 10-15 / 16-25 / 26+) | **DONE** |
| 36 | p26 L | F yükselme nedenleri, araştırma özetleri | DONE |
| 37 | p26 R | **F T bantları** (≥80 / 70-79 / 55-69 / 44-54 / <45) + K alt testi girişi | **DONE** |
| 38 | p27 L | **Tablo 5 — K maddeleri (30 madde)** + K normu + K yüksek/ortalama | **DONE** |
| 39 | p27 R | K düşük puan profili; K ekleme tartışması | DONE |
| 40 | p28 L | **K T bantları** (≥72 / 61-72 / 46-60 / 27-45) + K'nin tek gecersiz-yapmayan alt test olmasi | **DONE** (gorsel dogrulandi) |
| 41-42 | p28 R – p29 L | K–klinik ilişkisi, K düzeyi–SED etkileşimi | IN_PROGRESS |
| 43-56 | p29 R – p36 L | Bölüm 4: Geçerlik konfigürasyonları (V, tersine V, tümü doğru/yanlış, rastgele) | NOT_STARTED |
| 57-58 | p36 R – p37 L | **K+ profilleri**, **F-K endeksi** | NOT_STARTED |
| 59-62 | p37 R – p39 L | Test-tekrar test endeksi, **dikkatsizlik (TR) alt testi** | NOT_STARTED |
| 63-66 | p39 R – p41 L | Bölüm 5 girişi, klinik ölçek değerlendirmesi genel kuralları | NOT_STARTED |
| 67-78 | p41 L – p46 R | Hs (1) alt testi + kod tipleri (12/21, 123, 1234, 13/31, 138/318 …) | NOT_STARTED |
| 79-94 | p47 L – p54 R | D (2) alt testi + kod tipleri (21/12, 23, 213/231, 24/42, 28/82 …) | NOT_STARTED |
| 95-110 | p55 L – p62 R | Hy (3) alt testi + kod tipleri (32, 321, 34/43, 346, 39/93, 30/03) | NOT_STARTED |
| 103 | p59 L | **Nevrotik üçlü profilleri** | NOT_STARTED |
| 111-120 | p63 L – p67 R | Pd (4) alt testi + kod tipleri (45/54, 468, 48/84, 489, 49/94 …) | NOT_STARTED |
| 121-129 | p68 L – p72 L | Mf (5) alt testi, **erkeklerde/kadınlarda Mf değerlendirmesi** | NOT_STARTED |
| 130-136 | p72 R – p75 R | Pa (6) alt testi + kod tipleri (64/46, 678, 68/86, 60/06) | NOT_STARTED |
| 137-145 | p76 L – p80 L | **456 alt testlerinin örüntüsü**, Pt (7) alt testi + kod tipleri | NOT_STARTED |
| 146-151 | p80 R – p83 L | Sc (8) alt testi + kod tipleri (86/68, 8726, 80/08) | NOT_STARTED |
| 152-156 | p83 R – p85 R | Ma (9) alt testi + kod tipleri (91/19, 90/09) | NOT_STARTED |
| 155-158 | p85 L – p86 R | Si (0) alt testi, 049 / 027(8) kodları | NOT_STARTED |
| 159-170 | p87 R – p93 L | Bölüm 6: Yorumlama (kod tipi belirleme, konversiyon V, paranoid V, kuş kanadı …) | NOT_STARTED |
| 171-177 | p93 R – p96 R | Bölüm 7: Kişilik bozuklukları, intihar davranışı, alkol ölçekleri | NOT_STARTED |
| 178-181 | p97 L – p98 R | **Wiggins içerik skalaları** | NOT_STARTED |
| 182-188 | p98 R – p102 L | Aşırı Kontrol-Hostilite, Ego gücü, Welsh A/R, Üstünlük, Bağımlılık | NOT_STARTED |
| 189-190 | p102 R – p103 L | Bölüm 8: Türkiye uyarlanması, tarihçe | NOT_STARTED |
| 191-195 | p103 R – p105 R | **Standardizasyon çalışması** ← norm kaynağı | NOT_STARTED |
| 196-200 | p106 L – p108 L | Türk toplumu için geçerlik çalışması | NOT_STARTED |
| 201-208 | p108 R – p112 L | Bölüm 9: Türkiye'de kullanıldığı araştırma ve yayınlar | NOT_STARTED |
| 209-214 | p112 R – p115 L | Bölüm 10: Kaynaklar (künye listesi) | NOT_STARTED |
| 215-233 | p115 L – p124 L | **Ek 1: MMPI test kitabı (566 madde metni)** | NOT_STARTED |
| 234-235 | p124 R – p125 R | Ek 2-3: Kitap / bilgisayar formu cevap kağıdı | NOT_STARTED |
| 236-239 | p125 R – p127 L | Ek 4-6: Kart formu işaretleme, profil örnekleri (E/K) | NOT_STARTED |
| 240-243 | p127 R – p129 L | Ek 7-8: Madde değişim tabloları (kart↔kitap formu) | NOT_STARTED |
| 244-247 | p130 L – p131 R | **Ek 9a: MMPI madde numaraları ve puanlama yönü** ← PHASE 2 | **DONE** (görsel doğrulandı) |
| 248-250 | p132 L – p133 L | Ek 9b: Kişilik bozuklukları testi maddeleri | **DONE** (11 ölçek; 2'si görsel) |
| 251-256 | p133 R – p136 L | Ek 9c: Alkol, Wiggins, OH, Es, A, R, Do, Dy maddeleri | **DONE** (21 ölçek; 4'ü görsel) |
| 257-260 | p136 R – p138 L | **Ek 10: Ayrıntılı tanılara göre ortalama ve SD (Tablo 35-38)** ← PHASE 6 | **NEEDS_REVIEW** (OCR alındı, tablo yapısı çözülemedi) |
| — | p138 R, p139 | Kapak / arka sayfa | DONE |

## Durum kodları

`NOT_STARTED` · `IN_PROGRESS` · `DONE` · `NEEDS_REVIEW` · `BLOCKED`

## Bağımlılık notu

Projenin `src/scoring/mmpiSource.ts` içindeki yorum bantları yorum satırlarında
**"klinik yorum rehberi s.X"** kaynağına atıf yapar; `mmpiKeys.ts` ise normlar
için **Savaşır (1981)** der. Bu kitap (Ceyhun & Oral 2003) Savaşır 1981
değerlerini Tablo 3/4/5 dipnotlarında **doğrudan** vermektedir. Bu nedenle
`SOURCE_FACTS.md` içindeki norm değerleri birincil kanıttır.
`src/scoring/mmpiSource.ts` içindeki yorum metinleri ise bu kitaptan çevrilmiş
gibi görünmekle birlikte **sayfa numaraları bu kitaba değil** başka bir
rehbere ("klinik yorum rehberi") işaret etmektedir → bkz. `UNVERIFIED_DATA.md`.
