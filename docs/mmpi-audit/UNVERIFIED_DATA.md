# Unverified Data

Kaynakta **henüz bulunamayan** veya **OCR ile kesinleşmeyen** her şey burada.
Bu listedeki bir veri için kod değiştirilmez.

---

## Projenin yorum katmanı kaynağı ("klinik yorum rehberi")

Status:
**UNVERIFIED**

Reason:
`src/scoring/mmpiSource.ts`, `mmpiInterpretation.ts`, `mmpiValidityConfigs.ts`
yorumlarının tümü künyede **"klinik yorum rehberi"** adlı bir belgeye atıf
yapar (`s.1-3`, `s.3-47`, `s.48-52` gibi sayfa numaraları ile). Bu belge
depoda **yoktur** ve bu kitabın sayfa numaralarıyla uyuşmaz (kitapta L
bantları s.33, F bantları s.37'dedir; kod "s.1-3" der).

Do not modify code until verified.

Etki:
- Kodun yorum **içerikleri** bu kitapla büyük ölçüde örtüşüyor (metinler
  benzer/çeviri), ancak bant sınırlarında farklar var (CONFLICT-003/004).
- Kaynak izi iddiası (report/AI katmanı) doğrulanabilir değil.

Sonraki adım:
PHASE 3 kapanışında kitap s.29-42 tamamen okunduktan sonra, kod bantları
kitap bantlarıyla **madde madde** karşılaştırılacak; fark yoksa "MATCH",
varsa CONFLICT. Kaynağı bulunamayan bantlar için `UNVERIFIED` etiketi
kullanıcıya gösterilecek.

---

## Ham puan bantları — L ve K

Status:
**UNVERIFIED** (bu kaynakta yok)

Reason:
Kitap, L ve K alt testlerini ham puan bandı tablosuyla değil, T puanı bandı
(`L_T_BANDS`, `K_T_BANDS`) ve niteliksel betimlerle yorumlar.
`L_RAW_BANDS` (0-2/3-5/6-7/8-15) ve `K_RAW_BANDS` (0-4/5-9/10-15/16-20/21+)
kodda vardır ama bu kitapta karşılığı bulunamadı.

Do not modify code until verified.
→ bkz. `CONFLICTS.md` CONFLICT-005

---

## K düzeltmesi ekleme tablosu (`K_ADDITION_TABLE`)

Status:
**UNVERIFIED**

Reason:
Kod, oranları (Hs .5K, Pd .4K, Pt 1K, Sc 1K, Ma .2K) klasik ekleme tablosundan
okur ve oran tablolarına **otomatik yuvarlama** uygular. Kitabın K düzeltmesi
bölümü (s.37-41, özellikle s.40-42 ve Bölüm 4 "K+ profilleri" s.57-58) henüz
okunmadı.

Not:
Kitap s.39, K eklemeli profillerin uygunluğunun yeterince araştırılmadığını
açıkça yazar (Hathaway & Meehl 1951; Ries 1966) — yani kaynak K düzeltmesini
koşullu/eleştirel sunar. Bu, düzeltmenin **nasıl** uygulandığına dair kararı
etkiler.

Sonraki adım:
PHASE 4 (PDF p29 R – p42) okunacak.

---

## Ek 9 — tüm ölçeklerin madde numaraları (kitap s.244-256)

Status:
**UNVERIFIED**

Reason:
Henüz işlenmedi. Bu bölüm **orijinal MMPI madde numaraları ve puanlama
yönünü** tüm ölçekler için verir → PHASE 2'nin birincil kanıtıdır.
`mmpiKeys.ts` (13 ölçek), `mmpiDerived.ts` (Wiggins, MAC, ICAS, SAP, OH, Es,
A, R, Do, Dy, kişilik bozuklukları) anahtarlarının tümü bu ekle
karşılaştırılacak.

Do not modify code until verified.

---

## Ek 10 — tanılara göre ortalama ve SD (kitap s.257-260, Tablo 35-38)

Status:
**UNVERIFIED**

Reason:
Henüz işlenmedi. `TURKISH_NORMS` (13 ölçek × 2 cinsiyet = 26 hücre) ve
`WIGGINS_NORMS` buradan doğrulanacak. `mmpiKeys.ts` içinde L, F, K dışındaki
24 norm hücresi için şu an **hiçbir kaynak kanıtı yok**.

Do not modify code until verified.

---

## Bölüm 8 — Standardizasyon çalışması (kitap s.191-195)

Status:
**UNVERIFIED**

Reason:
Türk normlarının **nasıl** elde edildiğini (örneklem, tarih, cinsiyet ayrımı)
açıklar. CONFLICT-001 ve CONFLICT-002'nin hakemi bu bölümdür.

---

## Sürüm kontrolü

Status:
**VERIFIED (kaynak tarafı)** — kaynak MMPI-1/566.
Kod tarafı: `mmpiKeys.ts` başlığı "MMPI-566 Türk Standardizasyonu" der,
`SCALE_META` MMPI-1 ölçek adlarını kullanır, 566 maddelik cevap formu vardır
(`MMPI-566-optik-cevap-formu.pdf`). **VERSION-CONFLICT yok.**

Ancak:
`Si` alt testi kodda 34+36=70 madde ile tanımlıdır (MMPI-1 Si = 70 madde ✓).
`Mf` cinsiyete göre ayrı anahtar kullanır ✓ (MMPI-1 davranışı).
Bu iki nokta Ek 9 okunduğunda sayısal olarak doğrulanacak.

---

## Projede MMPI-2 / MMPI-2-RF kalıntısı taraması

Status:
**PARTIAL**

Reason:
`src/`, `supabase/`, `functions/`, `worker/`, `public/` üzerinde MMPI-2/RF
kaynaklı madde/norm/yorum araması henüz yapılmadı.
Sonraki adım: PHASE 5 sonrası toplu tarama (DECISION-006'ya bağlı).

---

## GÜNCELLEME (2026-09-21, Oturum 2) — Ek 9 işlendi

Ek 9 (kitap s.244-256) **tamamı işlendi** ve 46 anahtarın tamamı kodla
karşılaştırıldı → 41 MATCH / 5 DIFF. Ayrıntı: `VERIFIED_DATA.md` (Ek 9 bölümü),
`CONFLICTS.md` (CONFLICT-008..012).

Kalan açık nokta: 41 MATCH'in 33'ü yalnızca **OCR** ile doğrulandı.
Bunlar için görsel doğrulama yapılana kadar `OCR-CONFIRMED` statüsündedir;
`VERIFIED` sayılmazlar. Yüksek riskli oldukları için **değil** (hepsi MATCH),
ancak dürüstlük kaydı olarak açık tutulur.

---

## ~~TURKISH_NORMS 24 hücre~~ → **ÇÖZÜLDÜ (VERIFIED)**

Status:
**RESOLVED (2026-09-21, Oturum 4)**

Önceki kayıt: "`TURKISH_NORMS` içindeki L, F, K dışındaki 24 norm hücresi için
şu an hiçbir kaynak kanıtı yok."

Çözüm: Norm kaynağı bulundu → **Tablo 30, kitap s.195** (Bölüm 8,
standardizasyon çalışması, N=1003 erkek / 663 kadın). 26 hücrenin tamamı
görsel okumayla doğrulandı ve `compare-norms.py` ile karşılaştırıldı →
**26/26 MATCH**. Ayrıntı: `VERIFIED_DATA.md` (Norm katmanı), `SOURCE-NORM-001`.

---

## Ek 10 — tanılara göre ortalama ve SD (kitap s.257-260) — TANIMLANDI

Status:
**IDENTIFIED — norm kaynağı DEĞİL**

Çözüm (2026-09-21, Oturum 4): Ek 10, **tanı gruplarına** ait ortalamaları verir
(Psikopati N=48/16, Şizofreni Akut N=115/55, Şizofreni Kronik N=128/27,
Depresif Psikoz N=51/12, Borderline N=20/5, Psikotik, Nevrotik, Kişilik
Bozukluğu…). **Normal popülasyon değildir**, `TURKISH_NORMS` ile
karşılaştırılmaz → `DECISION-016`.

Kodda karşılığı olmadığı için düzeltme gerektirmez. Hücre hücre okunması
PHASE 10 (yorumlama) karşılaştırmaları için yararlı olabilir.

---

## (eski kayıt) Ek 10 — OCR yapısı

Status:
**NEEDS_REVIEW** (OCR alındı, yapı çözülemedi)

Page: PDF p136 R = kitap s.257
Bulgu: **Tablo 35. Genel tanılara göre ortalama ve standart sapmalar**
Sayfada çok sütunlu, satır etiketleri sayfa altında/sağında kalan bir tablo var.
OCR çıktısı sütun-satır ilişkisini bozuyor (ör. `Ma+.2K`, `Pd+.4K`, `Hs+.5K`,
`Sc+1K`, `Pt+1K`, `D`, `K` etiketleri sayfa sonunda toplanmış).

Görülen tanı grupları: **Borderline, Psikotik, Nevrotik, Kişilik Bozukluğu**
ve cinsiyet/örneklem kırılımları (N=20, N=19, N=56, N=105, N=290, N=361).

Do not modify code until verified.

Sonraki adım:
Bu tablo **hücre hücre görsel okunmalıdır** (1-3 sayfa/batch kuralı). Tek OCR
ile asla `VERIFIED` sayılmayacak. Tablo 36-38 de (s.258-260) aynı şekilde.

Not: `TURKISH_NORMS` içindeki 24 hücre (L/F/K dışındaki 12 ölçek × 2 cinsiyet)
için **hâlâ hiçbir kaynak kanıtı yoktur**. Bölüm 8 (s.191-195) ve Ek 10
birlikte okunmalıdır.
