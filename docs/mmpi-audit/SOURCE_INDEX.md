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
| 41-42 | p28 R – p29 L | K–klinik ilişkisi, K düzeyi–SED etkileşimi | **DONE** (s.42 boş doğrulandı) |
| **43** | **p29 R** | **Bölüm 4 girişi + Konfigürasyon 1 — Tersine V** (L,K 50-60 ∧ F>70) | **DONE** |
| **44** | **p30 L** | **Konfigürasyon 2** (L,K ≥60 ∧ F ≈50) + Şekil 2 | **DONE** |
| **45** | **p30 R** | **Konfigürasyon 3 — "V" (Çok Kapalı)** (F<50 ∧ L,K>60) + Şekil 3 | **DONE** |
| **46** | **p31 L** | **Konfigürasyon 4 — Yükselen Eğilim** (L=40, F 45-55, K=60) + Şekil 4 | **DONE** (K değeri görsel doğrulandı) |
| **47** | **p31 R** | **Konfigürasyon 5 — Azalan Eğilim** (L=60, F≈50, K 40-45) + Şekil 5 | **DONE** |
| **48** | **p32 L** | **Konfigürasyon 6 — Rastgele cevaplama** (L,K=55; F>105) | **DONE** (görsel doğrulandı) |
| **49** | **p32 R** | **Konfigürasyon 7 — Tümüne "doğru"** (L,K≤35; F>120) | **DONE** (görsel doğrulandı) |
| **50** | **p33 L** | **Konfigürasyon 8 — Tümüne "yanlış"** (L,F,K>80) | **DONE** (görsel doğrulandı) |
| **51** | **p33 R** | **Konfigürasyon 9 — Yardım isteği** (L,K<66; F≈100 veya altı) | **DONE** (görsel doğrulandı) |
| **52** | **p34 L** | **Konfigürasyon 10 — Geleneksel olmayan** (L<66; F>69; K>65) | **DONE** (görsel doğrulandı) |
| **53** | **p34 R** | **Konfigürasyon 11 — Açık ve tavizsiz** (L<55; F≈64; K<45) | **DONE** (görsel doğrulandı) |
| **54** | **p35 L** | **Konfigürasyon 12 — Güvenilir cevaplayıcı** (L≈50; F<70; K>50) | **DONE** |
| **55** | **p35 R** | **Konfigürasyon 13 — Akut/süreğen** (L>50; F≈K>55) | **DONE** |
| 56 | p36 L | **Konfigürasyon 14** | **DONE** (görsel) |
| 57 | p36 R | **Konfigürasyon 15** + **K+ profili** (Mark & Seeman 1963) | **DONE** (görsel) |
| 58 | p37 L | **F-K Endeksi** (kesim 9; 0-9 geçerli / >9 sahte-kötülük / 0 sahte-iyilik) | **DONE** (görsel ×2) |
| 59 | p37 R | F-K bantları (8-11 abartma / >16) + **TR endeksi** (≥3 risk, Dahlstrom 1972) | **DONE** (görsel) |
| 60 | p38 L | **Tablo 6** — TR endeksi 16 çifti | **DONE** (16/16 MATCH) |
| 61 | p38 R | **Tablo 7** — Dikkatsizlik 12 çifti | **DONE** (12/12 MATCH) |
| **62** | **p39 L** | **Dikkatsizlik kapanışı** (12 çift · max 12 · kesim 4, Greene 1980) | **DONE** (görsel) |
| 63 | p39 R | **BÖLÜM 5 başlangıcı** — klinik testler/kod tipleri; kaynak listesi; kapsam sözleşmesi | **DONE** (görsel) |
| **56** | **p36 L** | **Konfigürasyon 14 — erdemli görünme isteği** (L>55, F<60, K 59-64) + Şekil 14 | **DONE** (görsel doğrulandı) |
| 57 | p36 R | **Konfigürasyon 15** (L=60, F>70, K<40) + Şekil 15 + **K+ profili** tanımı (Mark & Seeman 1963) | **DONE** (şekil görsel doğrulandı) |
| 58 | p37 L | **F-K endeksi** (kesim 11→9; 0-9 geçerli, >9 sahte-kötülük, 0 sahte-iyilik; X̄ 8.66/SD 5.94) | **DONE** (görsel doğrulandı) |
| 59 | p37 R | **TR endeksi kesme puanı (≥3)** + F-K 8-11 / >16 bantları + Greene 1979 | **DONE** (görsel doğrulandı) |
| 60 | p38 L | **Tablo 6 — TR: aynı olan 16 madde çifti** | **DONE** |
| 61 | p38 R | **Tablo 7 — Dikkatsizlik alt testi: 12 çift + puanlama yönü** | **DONE** |
| 62 | p39 L | TR/dikkatsizlik kapanışı (dikkatsizlik kesmesi 4 — DECISION-022) | **DONE** |
| 63-66 | p39 R – p41 L | Bölüm 5 girişi + **Tablo 8 (Hs: 11 Doğru / 22 Yanlış, madde 33; X̄ 13.19/15.89)** | **DONE** (Tablo 8 görsel doğrulandı) |
| **67-69** | **p41 R – p42 R** | **Hs T-puan bantları** (85+/75-84/60-74/50-59/21-49) + Hs yorumu + **12/21**, **123/213**, **1234**, **1236** kodları | **DONE** (görsel doğrulandı) |
| **70-78** | **p43 L – p47 L** | **Hs kod bloğu TAMAMI** — 1237, 1270, 12378, 128/218, 129/219, 120/210, 13/31 (+Yüksek K, Düşük 2), 132/312, 134/314, 1342, 136/316, 137, 138/318, 1382, 139, 14/41, Yüksek1/Düşük4, 146, 1469, 15/51, 16/61, 17/71, 18/81, 19/91, 10/01 | **DONE** (görsel doğrulandı) · 22 kod tipi kodda YOK → CONFLICT-024 |
| **79** | **p47 R** | **D (2) alt testi girişi** + yüksek puan 21 maddesi (Graham 1987) | **DONE** (görsel doğrulandı) |
| **80-87** | **p48 L – p51 R** | **Tablo 9 (D anahtarı, 60 madde) + D T bantları + D kod bloğu (23, 24/42, 243/432, 247/427, 248, 25/52, 26/62, 27/72 …)** | **DONE** (görsel doğrulandı) · anahtar/norm/norm bantları MATCH · 12+ kod tipi kodda YOK → CONFLICT-024 · **T-eşiği koşulları** → CONFLICT-027 |
| **88-89** | **p52 L – p52 R** | **D kod bloğu IV-V**: 273/723, 274/724, 275/725, **278/728** + T-eşiği koşulları (5 T fark; K/Hs<50 T) | **DONE** (300 dpi görsel doğrulandı) · 4 kod kodda YOK · **CONFLICT-030** · CONFLICT-027 genişletildi |
| **90-92** | **p53 L – p54 L** | **D kod bloğu VI + kapanış**: 270, 28/82, 281/821, 284/824, 482/842, 287/827, 29/92, **20/02**, **207** | **DONE** · 29/92 ve 20/02 içeriği ✓ MATCH · 6 kod YOK · **D kod bloğu KAPANDI** |
| **93-94** | **p54 R – p55 L** | **Hy (3) alt testi girişi + Tablo 10 (Hy anahtarı)** | **DONE** (birebir MATCH — `SOURCE-CL-014/015`) |
| **95** | **p55 R** | **Hy (3) T-puan bantları** (85+/76-85/70-75/60-69/45-59/24-44) + "Sadece Hy yükselmesi" kuralı | **DONE** (300 dpi görsel ×4) · **6/6 bant + tek-yükselme MATCH** |
| **96-99** | **p56 L – p57 R** | **Hy kod bloğu I**: Yüksek3/YüksekK, `31`, **`32`**, `321`, `34/43`, Yüksek3/Düşük4, `34`, **`345/435/534`**, `346/436`, `35/53`, `36/63`, `54/45` notu | **DONE** (300 dpi görsel doğrulandı) · **CONFLICT-031** (blok-bazlı kod) · CONFLICT-027 genişletildi |
| 100-110 | p58 L – p62 R | Hy kod bloğu devamı | NOT_STARTED |
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
| 178-179 | p97 L – p97 R | **Wiggins içerik skalaları** — tanımlar + **Tablo 20 (normlar)** | **DONE** (deskew görsel; normlar 26/26) |
| 180-181 | p98 L – p98 R | Wiggins madde sayıları (FAM 16 · HOS 27 · PHO 27) + Türkçe uyarlama (Akça & Ceyhun 1994) | **DONE** (görsel) |
| 182-188 | p98 R – p102 L | Aşırı Kontrol-Hostilite, Ego gücü, Welsh A/R, Üstünlük, Bağımlılık | NOT_STARTED |
| 189-190 | p102 R – p103 L | Bölüm 8: Türkiye uyarlanması, tarihçe | NOT_STARTED |
| 191-194 | p103 R – p105 L | Standardizasyon çalışması: örneklem, yöntem, demografi (N=1003 E / 663 K) | **DONE** |
| **195** | **p105 R** | **Tablo 30 — NORMAL TÜRK NORMLARI** ← **norm kaynağı** | **DONE** (görsel; OCR boş döndü) |
| 196-200 | p106 L – p108 L | Türk toplumu için geçerlik çalışması | NOT_STARTED |
| 201-208 | p108 R – p112 L | Bölüm 9: Türkiye'de kullanıldığı araştırma ve yayınlar | NOT_STARTED |
| 209-214 | p112 R – p115 L | Bölüm 10: Kaynaklar (künye listesi) | NOT_STARTED |
| 215-233 | p115 R – p124 R | **Ek 1: MMPI test kitabı (566 madde metni)** | **DONE** (yapı; madde 1-566 kesintisiz) · kritik madde metinleri görsel doğrulandı (39 kayıt) → **CONFLICT-023** (14 etiket uyuşmuyor) |
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

---

## Norm kaynağı — kesin referans (Oturum 4)

**`TURKISH_NORMS`'un kaynağı: Tablo 30, kitap s.195 (PDF p105 R).**

> Bölüm 8 standardizasyon (s.191-194) + Tablo 30 (s.195), birlikte norm künyesini
> oluşturur. Ek 10 (s.257-260) norm kaynağı **değildir** (`DECISION-016`).

Metinde geçen diğer tablolar (norm olmayan): Tablo 23-29 demografi (s.192-194),
Tablo 35-38 tanı grupları = Ek 10 (s.257-260).
