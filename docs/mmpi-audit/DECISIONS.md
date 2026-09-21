# Decisions

Alınan teknik/bilimsel kararlar. Bir karar buraya yazıldıktan sonra
**tekrar tartışılmaz**; değişecekse yeni bir karar kaydı açılır ve eskisi
`SUPERSEDED` olarak işaretlenir.

---

## DECISION-001

Date: 2026-09-21
Issue: Kaynak sürümünün belirlenmesi
Context: `SOURCE-VERSION-001`, `SOURCE-VERSION-002`

Decision:
Birincil kaynak **MMPI (orijinal), 566 maddelik kitap formu** kabul edilir.
MMPI-2 / MMPI-2-RF bilgisi bu kaynaktan **devralınmaz**, projeye sokulmaz.

Reason:
Kitap s.1 açıkça 550 madde + 16 tekrar = 566 der; ölçek listesi MMPI-1
yapısındadır. Proje de MMPI-566 optik formu ve MMPI-1 ölçek adlarını kullanır.

Action:
Tüm SOURCE_FACT kayıtlarına sürüm etiketi `MMPI-1/566` yazılır.

Status: **APPROVED**

---

## DECISION-002

Date: 2026-09-21
Issue: Tarama düzeni — her PDF sayfasında iki kitap sayfası
Context: `SOURCE_INDEX.md` sayfa eşleme formülü

Decision:
Sayfa eşlemesi `leaf = kitap_sayfası + 15`, `PDF = ceil(leaf/2)` formülüyle
yapılır ve **her kayıt bu formülle adreslenir**. Denetim dosyalarında hem
kitap sayfası hem PDF sayfası/yarısı yazılır.

Reason:
TOC ve gövde sayfa numaraları doğrulandı (kitap s.1 = p8 R, s.34 = p25 L,
s.244 = p130 L, s.257 = p136 R).

Action:
`extract.py` aracı varsayılan `--split both` çalışır.

Status: **APPROVED**

---

## DECISION-003

Date: 2026-09-21
Issue: OCR güvenilirliği ve tablo doğrulaması
Context: `OCR_ISSUES.md`

Decision:
Tek başına OCR metni **bilimsel veri kaynağı sayılmaz**. Her sayısal fact için
(1) OCR okuması + (2) yüksek DPI görsel kırpma okuması yapılır; tablolar
**merkez dikişine bindirme payı** bırakılarak kırpılır.

Reason:
RapidOCR Türkçe aksanları düşürüyor ve merkez dikişinde sütun kaybettiriyor:
F tablosunda 169, 177, 197, 246, 53; K tablosunda 160, 217, 322, 383 maddeleri
ilk kırpmada görünmedi. Ayrıca K kadın normu OCR'da "13.54" ↔ kod "11.82"
farkı yalnızca görsel okumayla kesinleşti.

Action:
`SOURCE_FACTS.md` içinde her kayıt `Visual:` alanı taşır.

Status: **APPROVED**

---

## DECISION-004

Date: 2026-09-21
Issue: Bulunan farklar karşısında kod davranışı
Context: CONFLICT-001, CONFLICT-002 (P0 norm farkları)

Decision:
Bu aşamada **hiçbir kod değiştirilmez.** CONFLICT-001/002 `OPEN` kalır ve
PHASE 4 (K düzeltmesi) + PHASE 6 (normlar, `Ek 10` + Bölüm 8) tamamlandığında
karara bağlanır.

Reason:
Görev talimatı: "İlk aşamada kodu değiştirme." Ayrıca mevcut normların hangi
belgeye dayandığı belirsizdir (`UNVERIFIED_DATA.md`); kaynak kitabın kendi
Bölüm 8/Ek 10 teyidi alınmadan P0 bir sabit değiştirmek regresyon riski taşır.

Action:
CONFLICT-001/002 durumu OPEN; PHASE 6 sonunda DECISION açılacak.

Status: **APPROVED**

---

## DECISION-005

Date: 2026-09-21
Issue: `docs/kaynak-denetimi.md` eksik (CONFLICT-007)

Decision:
Doğru bilgi bu klasörde (`docs/mmpi-audit/`) üretilir. UI/doküman metinlerinin
düzeltilmesi PHASE 12-13'e ertelenir; **şimdi** UI metni değiştirilmez.

Reason:
Kaynakça metni kullanıcıya "depoda dosya var" diyor; önce doğru içerik
üretilmeli, sonra metin ya dosyaya ya da yeni klasöre yönlendirilmeli.
Yanlış sırayla yapılırsa geçici olarak daha kötü bir durum oluşur.

Action:
PHASE 13'te `SourcesPage.tsx` metni ve `README.md`/`SYSTEM.md` atıfları
`docs/mmpi-audit/` ile hizalanacak.

Status: **APPROVED (ertelenmiş uygulama)**

---

## DECISION-006

Date: 2026-09-21
Issue: MMPI-2 / MMPI-2-RF kalıntı taraması

Decision:
Tüm depo taraması (src, supabase, functions, worker, public) PHASE 5 sonunda
tek seferde yapılır; her turn'de tekrarlanmaz.

Reason:
Context tasarrufu; tarama sonucu `UNVERIFIED_DATA.md` içinde tutulur.

Status: **APPROVED**

---

## DECISION-007

Date: 2026-09-21
Issue: (?) alt testi kesme noktası — kaynak içi çelişki

Decision:
**Tablo 2 (kitap s.30)** yapılandırılmış veri kabul edilir: `0 / 1-5 / 6-30 /
31+`. s.29 prose ifadesi ("30 ya da daha fazla … profili bozulur") bir kayıt
notu olarak saklanır (`SOURCE-INTERNAL-001`).

Reason:
Kodun `VALIDITY_CUTOFFS.cannotSayInvalid = 31` değeri Tablo 2 ile birebir
uyuşur; prose ifadeyi koda uygulamak mevcut doğru davranışı bozardı.

Action:
Kod değişikliği yok. Çelişki kayıt altında.

Status: **APPROVED**

---

## DECISION-008

Date: 2026-09-21
Issue: Ek 9 madde anahtarları — 5 P0 fark bulundu

Decision:
CONFLICT-008 (F: 69↔169), 009 (Es: 13 madde yön), 010 (FEM: 2 madde yön),
011 (AVD: 13 madde eksik), 012 (HST: 7 madde eksik) **CONFIRMED** statüsüne
alınır ve **düzeltilmeye hazırdır**. Ancak düzeltme PHASE 3 kapanışından
*(yani PHASE 2-3 checkpoint'inden)* sonra tek bir toplu değişiklikle yapılır.

Reason:
- Beş farkın tamamı **görsel olarak doğrulandı** (Ek 9 tabloları yüksek
  çözünürlükte, dikişten bağımsız okundu).
- F'deki 69↔169 basamak hatası ve Es/FEM yön hataları **klasik MMPI
  anahtarlarıyla da** uyuşmaz; kaynak tablo nettir.
- HST ve AVD başlıkları kendi içinde tutarlıdır (20 ve 38 madde başlığı,
  aynı sayıda liste) → kodun 13 ve 25 maddesi eksiktir.
- Toplu düzeltme, tek bir test/regresyon turunda doğrulanmayı sağlar
  (her değişiklikte 287 testi tekrar çalıştırmak yerine).

Action:
PHASE 3 DONE olduğunda: `mmpiKeys.ts` (F), `mmpiDerived.ts` (Es, FEM, AVD, HST)
güncellenecek; ardından `npm run typecheck && npm test && npm run build`.
Kayıtlar `CODE_CHANGES.md` CHANGE-001..005 olarak açılacak.

Status: **APPROVED**

---

## DECISION-009

Date: 2026-09-21
Issue: MacAndrew (MAC) maddesi — kaynak tablo 51 madde, kod 49 madde

Decision:
Kod **doğru kabul edilir**; MAC için CONFLICT açılmaz.

Reason:
Kitap s.251 dipnotu açıkça şöyle der: "iki madde doğrudan alkolle ilişkili
olduğundan (#215 ve #460) çıkarılmıştır, madde sayısı 49 olarak
kullanılmaktadır." Kod bu kuralı birebir uygular.

Action:
`compare-keys.py` içinde kaynak değeri 49 madde olarak modellendi ve
dipnot `NOT` alanına yazıldı. Kod değişikliği yok.

Status: **APPROVED**

---

## DECISION-010

Date: 2026-09-21
Issue: Sc alt testinde kaynak içi tutarsızlık (başlık 78, Doğru sütunu 59)

Decision:
Kayıt amaçlı not; **kod değişikliği yok.**

Reason:
Kitap s.246 "Şizofreni alt testi: Sc (Madde sayısı: 78)" der; Doğru sütunu 59
madde listeler, Yanlış sütunu 19 madde. Kod da 59+19=78 kullanır → scoring
sonucu etkilenmez. Olası açıklama: 78 maddelik ölçeğin bir kısmı başka bir
sütun düzeninde gösterilmiştir. Aynı durum D (başlık 60 ✔), Hs (33 ✔) için
geçerli değil — yalnızca Sc'de görüldü.

Action:
`SOURCE_FACTS.md` SOURCE-KEY-SC-001 içine "kaynak içi not" olarak yazıldı.

Status: **APPROVED**

---

## DECISION-011

Date: 2026-09-21
Issue: OCR-only doğrulanmış 33 MATCH anahtarının statüsü

Decision:
OCR ile eşleşen ama görsel doğrulanmayan anahtarlar **`OCR-CONFIRMED`**
statüsünde kalır; `VERIFIED` sayılmaz ve FINAL raporunda "görsel doğrulama
bekliyor" notuyla listelenir.

Reason:
Görev talimatı §7 ve §21: sayısal veride çift doğrulama zorunlu. 33 anahtarın
tamamını şimdi görsel doğrulamak oturum bütçesini tüketir; ancak bunları
"sessizce doğrulanmış" saymak denetimin dürüstlüğünü bozar.

Action:
`VERIFIED_DATA.md` ve `SOURCE_FACTS.md` tablolarında `Doğrulama: O` sütunu
korunur. FINAL raporunda:
`SOURCE-ALIGNED-WITH-UNVERIFIED` (bkz. §47).

Status: **APPROVED**

---

## DECISION-012

Date: 2026-09-21
Issue: OH ölçeğinde kaynak başlığı (33) ile tablo (31) çelişiyor

Decision:
**Kod doğru kabul edilir; değişiklik yapılmaz.** Kaynak çelişkisi
`SOURCE-INTERNAL-OH-001` olarak kaydedilir. Yeni testte beklenen değer
**31** olarak yazılır (tablo, yapılandırılmış veri kabul edilir).

Reason:
Aynı yöntem (?) alt testi çelişkisinde de uygulandı (`DECISION-007`):
yapılandırılmış tablo, düz metin/başlıktan üstündür. Kod tabloyu birebir
yansıtır. Başlığa uymak için koda 2 uydurma madde eklemek kaynağa aykırı olur.

Action:
`tests/mmpiKeyIntegrity.test.ts` → `EXPECTED_SPECIAL.OH = 31` + açıklama yorumu.
`SOURCE_FACTS.md` → `SOURCE-INTERNAL-OH-001`.
Kod değişikliği yok.

Status: **APPROVED**

---

## DECISION-013

Date: 2026-09-21
Issue: Düzeltme paketinin kapsamı ve sırası

Decision:
CONFLICT-008..012 tek pakette düzeltildi (CHANGE-001..005) ve aynı pakette
kalıcı regresyon testi eklendi (CHANGE-006).

Reason:
Beş hata da aynı sınıftandır (madde anahtarı hataları) ve aynı doğrulama
turunda test edilebilir. Test eklemesi aynı pakette olursa, hatanın geri
gelme olasılığı paket kapanışında kapatılmış olur.

Action:
`npm run typecheck && npm test && npm run build` → üçü de PASS.
Test sayısı 287 → **294**.

Status: **APPROVED**

---

## DECISION-014

Date: 2026-09-21
Issue: `optik-form.html` derleme çıktısı değişti

Decision:
`optik-form.html` (yeniden üretilen tek dosya teslim) commit'e dahil edilir.

Reason:
Depoda izlenen ve `npm run build` tarafından üretilen bir çıktıdır;
`tests/build.test.ts` bu dosyanın gömülü PDF ile tutarlılığını doğrular.
Değişiklik yalnızca CSP `script-src` sha256 hash'idir (kaynak kod değiştiği
için beklenen ve zorunlu).

Status: **APPROVED**
