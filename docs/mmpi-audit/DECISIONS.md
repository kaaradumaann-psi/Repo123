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

---

## DECISION-015

Date: 2026-09-21
Issue: CONFLICT-001 ve CONFLICT-002 — norm farkları (başlangıçta 2 P0)

Decision:
**İki çelişki de REJECTED.** Kod değişikliği **yapılmaz.**
`TURKISH_NORMS` içindeki 26 hücrenin tamamı kaynakla birebir uyuşmaktadır.

Reason:
Kitap, F ve K normlarını iki farklı yerde **tutarsız** verir:

| Değer | Geçerlik bölümü | **Tablo 30 (s.195)** | Kod |
|---|---|---|---|
| F kadın X̄ | 10.11 (s.34) | **9.38** | 9.38 ✔ |
| K erkek X̄ | 13.90 (s.38) | **13.98** | 13.98 ✔ |
| K kadın X̄ | 13.54 (s.38) | **11.82** | 11.82 ✔ |

**Tablo 30, standardizasyon çalışmasının normatif veri tablosudur**
(N=1003 erkek / 663 kadın, "Normal Türk, Erkek ve Kadınların MMPI Alt
Testlerindeki Ortalama ve Standart Sapmaları"). Geçerlik bölümündeki dipnotlar
ikincil aktarımlardır ve Tablo 30 ile uyuşmazlar.

Ek olarak Tablo 30, K düzeltmesi uygulanmış/uygulanmamış satırları **ayrı ayrı**
verir; kod T dönüşümünden önce K düzeltmesini uyguladığı için
(`computeT`) **doğru satırları** kullanmaktadır. Bu, `K_CORRECTION`
tasarımını bağımsız olarak doğrular.

Action:
- `CONFLICT-001`, `CONFLICT-002` → `REJECTED`
- `SOURCE-NORM-001` oluşturuldu (Tablo 30 tam sayfa görsel okuması)
- `scripts/mmpi-audit/compare-norms.py` eklendi (26 hücre karşılaştırması)
- `VERIFIED_DATA.md` normlar bölümü VERIFIED'a yükseltildi
- Kod değişikliği yok

> **Denetim dersi:** `DECISION-004` ("kaynağı tam doğrulamadan kod değiştirme")
> burada işe yaradı. İki P0 sanılan fark, kaynağın **kendi içi tutarsızlığı**
> çıktı; erken düzeltilseydi **doğru olan kod bozulacaktı.**

Status: **APPROVED**

---

## DECISION-016

Date: 2026-09-21
Issue: Ek 10 (kitap s.257-260) norm kaynağı mı?

Decision:
**Ek 10 norm kaynağı DEĞİLDİR.** `TURKISH_NORMS` ile karşılaştırılmaz.
Yalnızca tanı grubu referansı olarak `SOURCE_FACTS.md`'ye kaydedilir.

Reason:
Başlık: "Ek 10: Ayrıntılı tanılara göre ortalama ve standart sapmalar
(Tablo 35-38)". Tablolar **tanı gruplarına** aittir (Psikopati N=48/16,
Şizofreni Akut N=115/55, Şizofreni Kronik N=128/27, Depresif Psikoz N=51/12,
Borderline N=20/5, Psikotik, Nevrotik, Kişilik Bozukluğu …) — **normal
popülasyon değil**.

Normların kaynağı **Tablo 30** (kitap s.195, Bölüm 8) ve doğrulandı
(`SOURCE-NORM-001`).

Action:
Ek 10 hücre hücre okunmadan `VERIFIED` sayılmaz; kodda karşılığı olmadığı için
şu an düzeltme gerektirmez.

Status: **APPROVED**

---

## DECISION-017 — F-K = 0: kod değişikliği YOK (CONFLICT-016 REJECTED)

Tarih: 2026-09-21 · PHASE 4

**Durum:** Kitap s.58 aynı paragrafta iki ifade kullanıyor:
1. "F-K puanı **0-9 arasında ise profil geçerlidir**"
2. "**0 ise sahte-iyiliktir**"

**Karar:** Kod mevcut hâliyle (0 → "Hafif Savunuculuk (Geçerli)", uyarı yok)
**korunur**.

**Gerekçe:**
- Kaynağın kesme kuralı cümlesi 0'ı geçerli aralığa **dahil eder**; kod bunu izler.
- "0 ise sahte-iyilik" ifadesi tek bir noktaya (0) ilişkin etiketlemedir; kaynak
  negatif değerler için **hiçbir sayısal eşik vermez**.
- Kaynak içi tutarsızlıkta DECISION-015'in kuralı uygulanır: kaynağın **birincil
  kesme kuralı** esas alınır; kod değiştirilmez, gerilim kayda geçirilir.
- Kodun sahte-iyilik uyarısı negatif bölgede zaten vardır (`value < -8`); `-8`
  eşiği kaynakta doğrulanamadı → `UNVERIFIED_DATA.md`.

**Sonuç:** CONFLICT-016 **REJECTED**. Kod değişikliği yok.

---

## DECISION-018 — Konfigürasyon 15: ±5 tolerans bandı kabul edilir

Tarih: 2026-09-21 · PHASE 4

**Durum:** Kaynak (s.57) Konfigürasyon 15 için "L alt testi **60 T puanında**"
(nokta) der; Şekil 15 grafiği de L noktasını tam 60'ta çizer (görsel doğrulandı).
Kod `55 ≤ L ≤ 65` bandı kullanır.

**Karar:** Kod **korunur** (bant = kaynak noktasının ±5 toleransı).

**Gerekçe:**
- Bant, kaynak değerini (60) **dışlamaz**, tam merkezine alır.
- Kaynak aralık vermek istediğinde açıkça verir (Konfigürasyon 14: K = 59-64,
  s.56 → kodla birebir MATCH); 15'te nokta vermesi üslup farkıdır.
- `L === 60` katı eşitliği pratikte hiçbir profili yakalamaz → örüntü işlevsiz
  kalırdı; bant yakalayıcıyı **genişletir**, profil dışlamaz.

**Sonuç:** CONFLICT-014 **REJECTED** (ilk P1 kaydı hatalıydı; düzeltme kaydı
CONFLICTS.md'de tarihsel olarak korunur).

**Süreç dersi (DECISION-004/015 ile aynı çizgide):** Şekil içi eğri/ızgara
okumaları 200 DPI OCR ile güvenilmezdir. Sayısal bir CONFLICT yazmadan önce
**yüksek DPI görsel doğrulama zorunludur**; bu olayda ilk kayıt bu kural
çiğnendiği için hatalı çıktı ve düzeltildi.

---

## DECISION-019 — TR endeksi kesme puanı kaynağa çekildi (CODE CHANGE)

Tarih: 2026-09-21 · PHASE 4

**Durum:** Kaynak (s.59, görsel doğrulanmış): "TR endeksi üzerinde **3 puan ya
da daha fazla** bir puanın, geçersiz profil olasılığını arttırdığı ileri
sürülmüştür (Dahlstrom 1972)."
Kod: `consistent = score <= 3` → 3 puanda **uyarı yok**.

**Karar:** Kod **kaynağa çekilir**: `consistent = score <= 2` (yani TR ≥ 3 →
"Tutarsız Yanıt Örüntüsü", `isWarning: true`).

**Gerekçe:**
- Kaynak cümlesi tek anlamlıdır ve kesme puanını **3** olarak verir.
- Kodun kendi atfı (Dahlstrom 1972) kaynağın atfıyla **aynıdır** → bu bir
  yorum farkı değil, uygulama (off-by-one) hatasıdır.
- Kod yorumundaki "normal bireyler üç-dördüne değişik yanıt verir" ve
  "Gravitz & Gerton 1976" **kaynakta yok** → kaldırıldı (kaynakta olmayan
  olgusal iddia taşınamaz).

**Sonuç:** CHANGE-007 uygulandı; CONFLICT-015 → **FIXED**.
Mevcut testler (1 puan uyarı yok, 4 puan uyarı var) etkilenmedi; 3 puan için
yeni regresyon testi eklendi.

---

## DECISION-020 — Konfigürasyon 8: kaynak eşiği uygulanmaz, kod korunur

Tarih: 2026-09-21 · PHASE 4 batch 3

**Durum:** Kaynak (s.50, görsel doğrulanmış) "tümüne yanlış" konfigürasyonu için
**L, F ve K tümü > 80 T** der. Kod `≥ 75` kullanır.

**Ampirik bulgu:** Kitabın kendi anahtarı + Tablo 30 normlarıyla **gerçek bir
"tümüne yanlış" yanıtlayıcı** şu değerleri üretir:
`L = 81.2` · **`F = 75.3`** · `K = 82.3` → kaynağın **F > 80** koşulu sağlanamaz.

**Karar:** Kod **korumuş** (75 eşiği). Kod içinde gerekçe yorumu belgelendi.

**Gerekçe:**
- Kaynak kendi kuralını kendi verisiyle çürütür (kaynak içi tutarsızlık →
  DECISION-015 sınıfı).
- Kaynağın eşiği uygulanırsa örüntü **hiçbir zaman tespit edilemez** (ölü kural);
  bu, kaynağın amacına hizmet etmez.
- Fark, örüntünün **tanınmasını** etkiler, kaynağın sayısal bir değerini
  yanlış göstermez.

**Sonuç:** CONFLICT-018 **REJECTED**. Kaynaktan sapma belgelendi (bilinçli).

---

## DECISION-021 — Konfigürasyon eşikleri kaynağa çekildi (CHANGE-008)

Tarih: 2026-09-21 · PHASE 4 batch 3

**Durum:** Dört konfigürasyonda kod, kaynağın **açıkça verdiği** sayıdan
sapıyordu (CONFLICT-017).

**Karar:** Kaynakta açık sayı olarak verilen dört sınır **uygulanır**:

| Konf. | Kaynak | Yeni kod |
|---|---|---|
| 4 (`ascending`) | "F alt testi **45-55 T**" | `F ≥ 45 ∧ F ≤ 55` **eklendi** |
| 5 (`descending`) | "K alt testi **40-45 T puanı arasındadır**" | `K ≥ 40` **eklendi** |
| 7 (`all-true`) | "L ve K alt testinin **35 T puanını aşmasını**" | `L ≤ 35 ∧ K ≤ 35` (40 → **35**) |
| 9 (`help-seeking`) | "F alt testi **100 T puanına yakın ya da altında**" | `F ≤ 100` (105 → **100**) |

**Ölçüt (bu oturumda benimsenen kural):** Kod, kaynağın **açık sayısına**
uydurulur. Kaynağın **niteliksel** verdiği yerlerde ("yakın", "hemen hemen
eşit") ±5 tolerans uygulanır ve bu tolerans `UNVERIFIED` olarak belgelenir.
Kaynakta **hiç olmayan** sınırlar (CONFLICT-020) **bu karara dahil edilmedi**,
çünkü sınır ekleme/çıkarma konfigürasyon **sırası** nedeniyle başka örüntülerin
erişilebilirliğini değiştirir → ayrı karar gerekir.

**Neden acele edilmedi (CONFLICT-014 dersi):** Her değişiklik yalnızca kaynağın
birebir söylediği sayıyla sınırlandı; "mantıklı görünen" ek sıkılaştırmalar
yapılmadı (ör. `credible` için K üst sınırını kaldırmak) — bunlar ayrı bir
kararın konusudur.

**Sonuç:** CHANGE-008 uygulandı; CONFLICT-017 **FIXED**; +6 regresyon testi.

---

## DECISION-022 — Dikkatsizlik kesmesi 4 doğrulandı; `UNVERIFIED-TR-001` kapatıldı

Tarih: 2026-09-21 · PHASE 4 kapanışı (kitap s.62)

**Durum:** Dikkatsizlik (carelessness) endeksi kesme puanı kodda `score < 4`
(normal) / `≥ 4` (uyarı) olarak uygulanıyordu; kaynak atfı eksikti
(`UNVERIFIED-TR-001`).

**Kaynak kanıtı (s.62, p39 L, görsel doğrulandı):**
- "Dikkatsizlik alt testi … **12 çift** görgül yolla seçilmiş maddeden
  oluşmaktadır."
- "Hastanın dikkatsizlik alt testinden alacağı **en yüksek puan 12'dir**."
- "**Greene (1980)** geçersiz profilleri belirlemede **4'ün kesim puanı**
  olarak alınabileceğini belirtmiştir."

**Karar:** Kod **değişmez**. 12 çift · max 12 · kesim 4 üçlüsü birebir
uyuşuyor → `UNVERIFIED-TR-001` **VERIFIED** olarak kapatılır.

**Gerekçe:** Sayılar kaynakta açık; kod zaten bu değerleri uyguluyor. Kaynak
atfı (Greene 1980) artık belgeli. Değişiklik gereksiz.

**Sonuç:** Kayıt `VERIFIED_DATA.md`'ye taşındı; SOURCE-CL-002 eklendi.

---

## DECISION-023 — Konfigürasyon erişilebilirlik kararı (CHANGE-009 + CHANGE-010)

Tarih: 2026-09-21 · PHASE 4 sonrası (CONFLICT-016/019/020)

**Yöntem:** `detectValidityConfig` **ilk eşleşen kazanır** sırasını kullanır →
her sınır değişikliği başka örüntüleri erişilemez kılabilir. Bu yüzden önce
15 konfigürasyonun sırası ve koşulları döküldü, sonra sınır davranışı
sınandı; **kararlar erişilebilirlik kanıtına dayandırıldı**.

### Karar 1 — `all-true`: `F > 120` → **`F >= 120`** (CHANGE-009) ✅

- Kaynak (s.49) F > 120 ister; T puanı [20,120] kırpıldığı için kural **ölü**.
- Ampirik: tümüne-"Doğru" profili F = 120.0 üretir → örüntü hiç raporlanmıyordu.
- Kırpma altında "> 120"nin tek temsili tam üst sınırdır.
- **Not:** T kırpması ileride kaldırılırsa koşul `> 120`'ye **geri alınmalıdır**
  (kod içine yorum düşüldü). Kırpmanın kendisi ayrı bir `UNVERIFIED` konudur
  (`UNVERIFIED-CONFIG-T-001`) ve bu kararın kapsamı dışındadır.

### Karar 2 — `credible`: `K <= 65` sınırı **kaldırıldı** (CHANGE-010) ✅

- Kaynak (s.54) K için yalnız alt sınır verir ("K, T 50'nin üstünde") → 65
  kaynakta **yok**.
- Kanıt: L=50, F=65, K=70 profili kaynağa göre Konf. 12 iken kodda **hiçbir
  konfigürasyona girmiyordu**.
- Erişilebilirlik: `unconventional`, `frank`, `reverse-v`, `virtuous`, `rigid`
  etkilenmez (bantlar ayrık); `acute-chronic` için davranış değişmez
  (L ∈ (50,55] zaten `credible` tarafından alınıyordu).

### Karar 3 — Değiştirilmeyenler (bilinçli)

| Konu | Karar | Gerekçe |
|---|---|---|
| Konf. 2 `v-shape` F ≤ 55 (CONFLICT-016) | **REJECTED** | `closed-v` (F<50) + `v-shape` sırası pratikte F ∈ [50,55] verir; üst sınır kaldırılırsa Konf. 10/14 profilleri yanlış etiketlenir |
| Konf. 9 `help-seeking` F ≥ 70 (CONFLICT-020) | **KORUNDU** | kaldırılırsa `frank` ve `credible` örüntüleri erişilemez olur; `UNVERIFIED` olarak belgeli |
| Konf. 5 `descending` F sınırı | **eklenmedi** | kaynak niteliksel der ("F yaklaşık 50"); L>F>K sıralaması zaten sınırlar |
| T kırpması [20,120] | **ertelendi** | geniş etki (UI/grafik/test); ayrı karar gerekir |

**Sonuç:** CONFLICT-016 **REJECTED** · CONFLICT-019 **FIXED** ·
CONFLICT-020 **FIXED kısmen** (1/4; kalan 3 belgeli-gerekçeli).

---

## DECISION-024 — Wiggins SOC madde sayısı: kaynak içi çelişki, kod korunur

Tarih: 2026-09-21 · PHASE 8 (kitap s.178-181)

**Durum:** Wiggins SOC skalasının madde sayısı için iki kaynak ifadesi var:
- Metin (s.178): "**Toplam 26 maddeden** oluşan…"
- Kitabın kendi madde listesi (Ek 9c, s.251-256): **27 madde** — PHASE 2'de
  `compare-keys.py` ile 46/46 MATCH olarak doğrulandı.

**Karar:** Kod **değişmez** (`WIGGINS_KEYS.SOC` = 27 madde).

**Gerekçe:**
- Madde listesi, sayısal bir düzyazı ifadesinden daha güçlü kanıttır ve
  bağımsız olarak (madde madde) doğrulanmıştır.
- 13 skalalık toplam kontrolü: kaynak metin toplamı 351 ↔ doğrulanmış liste
  toplamı 352 → tek fark SOC'tur; sistemik bir hata değil, tek noktalı dizgi
  hatası.
- Aynı sınıf: CONFLICT-018/DECISION-020 (kaynak kendi verisiyle çelişiyor).

**Sonuç:** CONFLICT-021 **REJECTED**; kaynak içi tutarsızlık belgelendi.

## DECISION-025 — `WIGGINS_NORMS` kaynağa bağlandı (verified)

Tarih: 2026-09-21 · PHASE 8

**Durum:** `WIGGINS_NORMS` (13 ölçek) bugüne dek **kaynak kanıtı olmadan**
duruyordu (`AUDIT_STATE` kısıtı: "WIGGINS_NORMS için hiç kaynak kanıtı yok").

**Kaynak:** Tablo 20 — "Türk örneklemi Wiggins içerik skalaları ortalama ve
standard sapmaları" (s.179), Normal Grup (n=1000) sütunları.

**Karar:** Kod **değişmez**; 13/13 skala × 2 değer = **26/26 birebir MATCH**.

**Yöntem notu:** Tablo ~2.87° dönük tarandığı için sütunlar arası dikey kayma
var; **deskew edilerek** ve sütun y-merkezleri programatik doğrulanarak okundu
(`OCR_ISSUES.md` → ROTATED-TABLE). Kısıt listesindeki ilgili madde kapatıldı.

---

## DECISION-026 — Kritik madde etiketleri kaynak metnine göre düzeltildi, liste "kaynak dışı" olarak işaretlendi

Tarih: 2026-09-21 · PHASE 2/5 (Ek 1 denetimi)

**Durum:** `src/scoring/mmpiCritical.ts` → `CRITICAL_ITEMS` (39 kayıt / 38 madde).
Kritik madde listesi **kaynakta yoktur** (`SOURCE-ITEM-002`). 38 maddenin
14'ünde etiket, işaret ettiği maddenin **gerçek metniyle** çelişiyordu
(CONFLICT-023).

**Karar:** Üç yönlü karar uygulandı:
1. **Etiketler düzeltildi** (14 kayıt) — her yeni etiket o maddenin **görsel
   doğrulanmış metninin** konusunu birebir yansıtır (ör. `#151` "Sosyal Çekilme
   / Yabancılaşma" → **"Zehirlenme Sanrısı / Şüphecilik"**, çünkü kaynak metin
   *"Biri beni zehirlemeye çalışıyor"*).
2. **Liste korundu** — kaldırmak, raporda/ekranda kullanılan bir klinisyen
   kontrol listesini işlevsiz bırakırdı; liste tanı değil uyarı listesidir.
3. **Kaynak dışı olduğu kod içinde belgelendi** — dosya başlığına, listenin
   kaynak dışı bir derleme olduğu ve etiketlerin kaynak madde metinleriyle
   uyumlu tutulduğu yazıldı.

**Ölçüt:** Etiket = maddenin **metninde geçen** konunun adı. Kaynak metniyle
desteklenmeyen hiçbir etiket bırakılmadı; yorum/tanı iddiası eklenmedi.

**Değişmeyenler:** Madde **numaraları ve D/Y yönleri** (kaynak yok, dokunulmadı);
`#74` cinsiyet koşullu yön ayrımı (kaynakla tutarlı, korundu).

**Sonuç:** CHANGE-011 · CONFLICT-023 **FIXED** · +4 regresyon testi
(`tests/mmpiKeyIntegrity.test.ts`).

---

## DECISION-028 — Norm katmanında kanonik kaynak: **Tablo 30** (üçüncü teyit)

Tarih: 2026-09-21 · PHASE 9/10 batch 6

**Durum:** Kitap, aynı norm değerleri için **iki farklı sayı** veriyor:
- **Gövde metni** (bölüm içi atıflar, "Savaşır, 1981")
- **Tablo 30** (s.195) — "Normal Türk Erkek ve Kadınların MMPI Alt Testlerindeki
  Ortalama ve Standart Sapmaları"

Çelişki **üç kez** bulundu:

| # | Ölçek | Metin | Tablo 30 |
|---|---|---|---|
| 001 | F kadın | 10.11 | **9.38** |
| 002 | K erkek / kadın | 13.90 / 13.54 | **13.98 / 11.82** |
| 028 | Hy kadın | 22.33 | **18.12** |

**Karar:** Norm katmanının **kanonik kaynağı Tablo 30'dur.** Kod Tablo 30'u
izler ve **değişmez**.

**Gerekçe:**
1. Tablo 30 başlığı gereği **asıl norm tablosudur** (örneklem n=1003 erkek /
   663 kadın, Bölüm 8 standardizasyonu).
2. Metin atıfları **ikincil**dir ve **3 farklı hata** içerirler → güvenilirlikleri
   sistematik olarak düşük.
3. Tablo 30'un **26/26 hücresi** doğrulanmıştır; metin atıfları ise
   doğrulanmamış aralıklı sayılardır.
4. Tek kanonik kaynak, iç tutarsızlığı önler.

**Sonuç:** CONFLICT-001, 002 ve **028** → **REJECTED (kod doğru)**.
Bu kural, norm katmanında ortaya çıkacak **her yeni metin/Tablo 30 çelişkisi**
için öncelikli olarak uygulanır.

---

## DECISION-027 — 40/04 kodundaki tıbbi terim kaynağa göre düzeltilir

Tarih: 2026-09-21 · PHASE 9/10 batch 13

**Durum:** `CODES['04']` (40/04 Kodu) metninde "gerçek psikomotor retardasyon ya
da **negatifik** depresyon belirtileri yerine…" yazıyor. Kaynak (s.120, **400 dpi
görsel**, `v_pd120_0404e.png`): "…gerçek psikomotor retardasyon ya da **vegetatif**
depresyon belirtileri yerine…"

**Karar:** Kaynak terim **aynen uygulanır** → `negatifik` → **`vegetatif`**.
(CHANGE-012)

**Gerekçe:**
1. Kaynak **açık ve görsel doğrulanmış**; sapma tek kelime.
2. **"Negatifik depresyon" yerleşik bir tanı/terim değildir**; kaynağın kastettiği
   DSM'deki **vegetatif belirtiler**dir. Cümle, depresyonun **tipini ayırt eden**
   işlevsel bir ayrım yapıyor → yanlış terim yorumu saptırır.
3. Bu bir **"eksik içerik"** değil **"yanlış içerik"**tir. Eksik koşullu cümleler
   (CONFLICT-025) tüm kod seti çıkarılana kadar bilinçli bekletiliyor; **yanlış
   bilgi bekletilmez** (kaynak otoritesi ilkesi).
4. Düzeltme **tek kelime**, başka hiçbir kaydı etkilemez, geri alınabilir.

**Sonuç:** CONFLICT-035 → **FIXED**. Regresyon testi: `mmpiKeyIntegrity.test.ts`
→ kaynak teriminin kodda bulunduğu ve yanlış terimin **bulunmadığı** doğrulanır.
