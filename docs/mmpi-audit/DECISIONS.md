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
