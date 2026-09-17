# Mühendislik Raporu — MMPI-566 Uzman Çalışma Alanı

- **Tarih:** 17 Eylül 2026
- **Branch:** `arena/01a0afbb-repo123` (temel: `main @ 103d45d`, PR #13 birleşimi)
- **Kapsam:** Kullanıcı istemleri, şikayetler, tespit edilen sorunlar, alınan tasarım/mimari kararlar, bu oturumdaki değişiklikler, veri tutarlılık matrisi, doğrulama sonuçları ve kalan işler.

---

## 1. Yönetici Özeti

Kullanıcı, uzmanların (psikolog/yönetici) kullandığı MMPI-566 çalışma alanının **İşlem** akışını "çok klasik" buldu ve üç somut eksik bildirdi: (1) MMPI'nin gerçek uygulama koşullarının (yaş, eğitim, süre, boş madde) formda zorunlu/uyarı olarak uygulanmaması, (2) geri çıkma butonunun olmaması ve yöntemin değiştirilememesi, (3) tasarımın sade/ilgi çekici olmaması ve subdomain'den ana siteye dönüş yolunun bulunmaması.

Bu oturumda:

- Türkiye'de kullanılan **566 maddelik klasik MMPI formunun (MMPI-1 Türkiye uyarlaması; MMPI-2 DEĞİL)** gerçek uygulama koşulları form doğrulamasına bağlandı: **16 yaş ve üzeri**, **ilkokul reddi (en az ortaokul)**, **süre 60–120 dk referanslı uyarılar**, **boş madde > 30 engeli**. (Kullanıcı kararıyla **IQ gibi veriler formda istenmez** — eklenmiş taslak kaldırıldı.)
- İşlem akışı yeniden yapılandırıldı: hero ana ekran, **adım çubuğu (Geri + adım haritası + ileri eylemi)**, yöntem kartlarında seçim durumu, yöntemin her an değiştirilebilmesi, OMR oturumunun geri-gidişte yitirilmemesi.
- Tasarım, halilkaraduman.com.tr tasarım dilinin **mevcut patternine bağlı kalarak** derinleştirildi (serif başlıklar, numaralı kicker çipleri, veri satırları, ilerleme çubuğu). Yeni özellik butonu eklenmedi.
- Header'a **halilkaraduman.com.tr** ana site bağlantısı eklendi.
- OMR adımının altındaki **ikinci danışan formu (RecordCapture) ve ikinci kayıt yolu kaldırıldı** (çift kayıt riski).
- 108/108 test geçti, `tsc` temiz, `npm run build` başarılı.

Kullanıcının son talimatı gereği uygulama çalışması raporlama ile durduruldu; bu dosya o raporun ta kendisidir ve **commit edilmiştir**.

---

## 2. Kullanıcı İstemleri (Baştan Sona)

### 2.1 Orijinal prompt (özet)

Sistem, normal halka açık bir MMPI sitesi **değildir**; yalnızca yetkili psikologlar/yöneticiler için profesyonel bir çalışma alanıdır.

| İstem | Durum |
|---|---|
| Mevcut auth sistemi korunacak, değiştirilmeyecek | ✅ Korundu (Supabase Auth, roller, public kayıt yok) |
| Mevcut OMR algoritması/koordinatları/kamera hattı korunacak | ✅ Korundu (`src/omr/*`, `src/scanner/*` bu oturumda dokunulmadı) |
| Klinik scoring uydurmayacak (`clinicalTransferAllowed: false`) | ✅ Korundu; "puanlama motoru bağlı değil" notu korunuyor |
| Aynı optik form PDF'si kullanılacak | ✅ Korundu |
| Ana web sitesiyle birleştirilmeyecek (ayrı sistem) | ✅ Korundu; header'dan ana siteye tek yönlü link eklendi (yeni sekme) |
| Akış: giriş → yeni işlem → danışan/test bilgisi → yöntem (hızlı/ham/OMR) → kontrol → analiz | ✅ Kuruldu (bu oturumda nav/UX derinleştirildi) |
| Danışan alanları: cinsiyet*, yaş*, test tarihi*, süre, meslek, izlem, eğitim, medeni durum, başvuru nedeni, kısa öykü | ✅ (IQ **istenecek** şeklinde eklendikten sonra kullanıcı kararıyla **çıkarıldı**) |
| Hızlı giriş: 1 Doğru / 2 Yanlış / 0 Boş, otomatik ilerleme, 566 harita, geri dönüp değiştirme; soru metni yok | ✅ Mevcut; bu oturumda ilerleme çubuğu + boş>30 uyarısı eklendi |
| Ham puan: geçerlik (Boş/L≤15/F≤64/K≤30) + klinik tavanları; Hs/Pd/Pt/Sc/Ma K'sız | ✅ Mevcut; tavanlar testlerle sabitlendi |
| OMR: kamera + dosya; büyük form önizlemesi yok; indir/yazdır/kısa talimat | ✅ Mevcut |
| Gereksiz framework/UI kütüphanesi, yeni dosya, norm uydurması yok | ✅ Uyuldu |

### 2.2 İkinci istem — veri bütünlüğü (önceki oturum)

"Veritabanına gönderilen veriler vs kaydedilen veriler vs her şey buna göre düzenlendi mi, baştan sona kontrol et; ardından PR oluştur ve merge et."

→ Önceki oturumda tamamlandı, **PR #13** birleşti (`bd15246`): form → sütunlar + `case-meta` JSON → geri okuma (detay modal/list) hizalandı; isteğe bağlı alanlar boş string (sahte tire yok); kayıt sonrası "Kayıtlar" listesi yenilendi. Bu oturumda yol **yeniden doğrulandı** (Bkz. §7).

### 2.3 Bu oturumdaki istem (orijinal metinden)

- "İşlem form kısmı çok klasik geldi."
- "MMPI şartları var: **13 yaş derse yaşa takılmalı**, **ilkokul derse kabul etmemeli**, **test süresi ortalama alınmalı** (kaç dk sürüyorsa Türkiye örnekleminde); mesela **566 soruyu 20 dk'da çözemez, kısa demeli**. Tüm bunlar **gerçek veriye dayandırılmalı**."
- "Yöntem kısmı çok garip. **Geri çıkma butonu yok. Yöntem değiştiremiyor.**"
- "Site kullanışı işlevsiz, çok sade ve ilgi çekici değil. **Şu anki tasarımsal pattern'e bağlı kal**, daha ilgi çekici yapabilirsin. **Butonlar ekleme** vs. En kullanışlı site nasıl olacaksa onu yap."
- "**halilkaraduman.com.tr reposundaki tasarıma bağlı kalmalısın**."
- "Bu site direkt **subdomain** üzerinde olacak; **önceki siteye de geri dönebilmeli** (halilkaraduman.com.tr ana site; Çalışmalar kısmından buraya gelinir)."
- "Önceki branchları da incele, OMR kısmının tasarımı nasıldı vs."
- "Yaptıkların sandboxta kaybolmamalı — **kesinlikle commit yap**."

### 2.4 Düzeltmeler (oturum içi müdahaleler)

1. **"Türkiye'de MMPI-1 formu kullanılıyor, 2 değil."** → Tüm arayüz/mesaj metinlerindeki "MMPI-2" ifadeleri kaldırıldı; kurallar Türkiye'deki 566 maddelik klasik MMPI uyarlamasına göre yazıldı.
2. Kullanıcının paylaştığı **resmi uygulama kriterleri** (Türkiye örneklemini):
   - Yaş: **16 ve üzeri** (16 altı sonuçlar geçerli kabul edilmez).
   - Eğitim: okuryazarlık şartı; tercih edilen en düşük düzey **ortaokul (6–8 yıllık eğitim)** → uygulama kararı: **İlkokul reddi**.
   - **IQ 80+** kriteri → bir sonraki mesajda **düşer**: "iq gibi veriler isteme."
   - Süre: **60–120 dk (1–2 saat)** beklenen tamamlanma; çok uzaması profil bütünlüğünü bozar.
   - **Boş bırakılan (?) madde sayısı 30'u geçmemeli**; aşarsa test geçersiz sayılabilir.
   - Klinik/ortam koşulları: akut psikotik durum, madde-sedatif etkisi, yalnız uygulama, yetkin uygulayıcı → kontrol adımında **bilgi notu** olarak gösterilir (form alanı değil).
3. **"yapmaya çalıştıklarını bırak ... baştan sona md dosyasına raporla, mühendislik raporu istiyorum eksiksiz ... ve commitle, kesinlikle commitle!"** → Uygulama çalışması durduruldu, bu rapor yazıldı, tüm değişiklikler commit edildi.

### 2.5 Paylaşılan "istemci tarafında şifreli, sunucuya aktarım yok" cümlesi hakkında not

Paylaşılan metindeki *"Girdiğiniz tüm yanıtlar ... yalnızca bu tarayıcıda istemci tarafında şifreli olarak işlenir. Sunucu aktarımı veya analitik kaydı yapılmaz"* ifadesi, **ücretsiz çevrimiçi MMPI formlarının** gizlilik cümlesidir ve **bu sisteme uymaz**: bu platform, kayıtları yetkili psikolog hesabıyla **Supabase veritabanına yazar** (bu, ürünün ta kendisidir; arşiv/detay/silme bu sayede çalışır). Yanlış bir gizlilik iddiası arayüze konmamıştır; gerçek davranış §7'de belgelemiştir.

---

## 3. Kullanıcı Şikayetleri, Kök Nedenler, Çözümler

| # | Şikayet (kullanıcı sözüyle) | Kök neden (kodda) | Çözüm (bu commit) |
|---|---|---|---|
| 1 | "13 yaş derse yaşa takılmalı" | `validateIntake` yaş 1–120 kabul ediyordu | **16+ sert kural**: 16 altı reddedilir; mesaj Türkiye normlarına atıflı (`caseTypes.ts`) |
| 2 | "İlkokul derse kabul etmemeli" | Eğitim select'ında İlkokul serbestti | **İlkokul reddi** + alan altı canlı hata; en az ortaokul (6–8 yıl) mesajı |
| 3 | "566 soruyu 20 dk'da çözemez, kısa demeli" | Süre alanı serbest metin, hiçbir yönlendirme yok | Sayısal dk girdisi; **<45 dk "çok kısa" (kırmızı)**, 45–59 "kısa", >180 "uzun" (amber) uyarıları; 60–120 dk Türkiye referansı |
| 4 | "Geri çıkma butonu yok" | Geri butonu yalnızca sayfanın **altında** nav çubuğunda; OMR adımında içerik çok uzun olunca ulaşması zor | Her adımda **üstte adım çubuğu**: Geri + tıklanabilir adım haritası + ileri eylemi; alt nav da korunuyor |
| 5 | "Yöntem değiştiremiyor" | Yöntem adımında seçili yöntem görünmüyordu; veri adımından yönteme dönüş zayıftı | Yöntem kartlarında **"Seçili" çipi + ink çerçeve**, "yöntemi her an değiştirebilirsiniz" notu; veri/kontrol adımlarından Geri → Yöntem |
| 6 | "Site çok sade ve ilgi çekici değil" | Akış düz formlardan ibaretti; sitenin serif/kicker/hero dili akışta kullanılmıyordu | Hero ana ekran (kicker + serif başlık + gerçek veri satırı), 01–04 numaralı adım kickleri, ikonlu yöntem kartları, ilerleme çubuğu — **mevcut token setiyle**, yeni kütüphane/renk yok |
| 7 | "Önceki siteye de geri dönebilmeli (subdomain)" | Ana site linki yalnızca footer'da | **Header'da** `halilkaraduman.com.tr ↗` pill bağlantısı (yeni sekme) |
| 8 | "Diğerlerini (hızlı/ham) deneme fırsatım olmadı" | Üç yolun UX'i eşit değildi (OMR'ın altında ikinci danışan formu + arşiv paneli) | OMR gömülü modda artık sadece okuma hattı; üç yol da aynı adım çubuğu + kontrol özetinden geçiyor |

---

## 4. Teknik Denetim Bulguları (kodda tespit edilen sorunlar)

1. **Çift kayıt yolu (kritik):** `ScannerWorkspace` gömülü (`embedded`) modda bile alta `RecordCapture` (ikinci danışan formu) ve `MyRecordsPanel` çiziyordu. Yeni akışta danışan bilgisi zaten 1. adımda alınıp 4. adımda `case-meta`'lı kayıt yapılıyor; OMR adımındaki ikinci form, `case-meta` **olmadan** ve **farklı idempotency anahtarıyla** ikinci bir kayıt yaratabiliyordu. → `embedded` modda bu iki bölüm artık çizilmiyor.
2. **OMR oturum kaybı / bayat "hazır" durumu:** Yöntem ekranına Geri'ye gidilip tekrar girildiğinde `ScannerWorkspace` yeniden montlanıyor, tarama sıfırlanırken üst bileşende eski `scan` kalabiliyordu (eski sayfa "Kontrol"u geçici olarak etkinleştirir gibiydi). → OMR paneli yöntem `'omr'` olduğu sürece **monte kalır** (diğer adımlarda gizlenir); başka yönteme geçildiğinde `scan` sıfırlanır ve oturum anahtarı yenilenir.
3. **MMPI uygulama koşullarının hiç doğrulanmaması:** Yaş 1–120, İlkokul serbest, süre serbest metin. → §5.3'teki kurallar.
4. **Boş madde kuralının yokluğu:** Türkiye kriterindeki "boş ≤ 30" hiçbir yerde denetlenmiyordu. → Hızlı girişte canlı uyarı + ham puan/OMR dahil üç yolda da **>30'ta kayıt engeli** (hata banner'ı).
5. **Navigasyon:** Adım çubuğu yoktu; "güvenli çıkış" (ana site) yalnızca footer'daydı. → Çözüldü (§3).
6. **Önceki OMR tasarımı (kullanıcının sorduğu):** `59f6fbc` (PR #12) öncesinde "Test Değerlendirme" sekmesi tam sayfa OMR'dı: tara → 4 sayfa → `RecordCapture` danışan formu → kaydet. Danışan bilgisi **sonra** alınıyor, yöntem seçimi yoktu. Yeni akışta danışan bilgisi **önce** alınıyor; OMR, üç veri giriş yönteminden biri olarak korunduğu motorla çalışıyor.
7. **Veri yolu (PR #13 sonrası yeniden denetlendi):** `createRecord` ek yükleri `case-meta` **önde**, OMR sayfaları arkada diziyor; `parseRecordPayload` kind'le ayırt ediyor; eski `client-context`/`entry-method` kayıtları hâlâ okunuyor; `RecordDetailModal` tüm alanları metadan okuyor; kayıt sonrası `recordsTick` listeyi yeniliyor. **Tutarlı, kırılma yok.**

---

## 5. Alınan Kararlar

### 5.1 Tasarım dili (halilkaraduman.com.tr'ye bağlı kalınarak)

- Sitenin pattern'i (PR #12'de portal'a aktarılan): **kâğıt beyazı yüzeyler, mürekkep siyahı metin, kıl payı (#E9E9EB) çizgiler, tek mavi vurgu (#0A84FF yalnızca durum), DM Sans gövde + Newsreader serif başlıklar, hap (pill) düğmeler, 14px kartlar, "01 — ..." numaralı bölümler, neredeyse sıfır gölge.**
- Bu oturumda eklenen (hepsi mevcut token'larla, yeni renk/kütüphane yok):
  - **Hero ana ekran:** kicker çipi → serif başlık (`Yeni bir MMPI *işlemi* başlatın`) → alt metin → tek ink CTA → kıl payı çizgiyle ayrılmış **gerçek veri satırı** (566 madde · 4 sayfa A4 · 60–120 dk · 16+ yaş). Kısmi bir işlem varsa CTA "İşleme devam et / Yeni işlem" olur (veri yitimi yok).
  - **Adım çubuğu:** yumuşak pill iz içinde `Geri` + adım haritası (tamamlanan adımlar tıklanarak geri atlanır; ileriye sıçrama yok) + adımın ileri eylemi (`Devam` / `Kontrol` / `Analizi başlat`).
  - **Serif adım başlıkları + numaralı kickler:** `01 · Danışan`, `02 · Yöntem`, `04 · Kontrol` (sitedeki `01 — Hakkımda` dilinin çalışma alanı karşılığı).
  - **Yöntem kartları:** ikon kutusu + başlık + açıklama; seçimde ink çerçeve + "Seçili" çipi; hover'da 2px kalkma.
  - **Form bölümleri:** "Danışan" / "Test" mikro etiketleri (sitedeki `Eğitim / Deneyim` etiket dili).
  - **Hızlı giriş:** 566 haritasının üstünde 3px ink ilerleme çubuğu.
- "Buton ekleme" kuralına uyuldu: eklenen tek buton tipi **nav** (Geri/Devam/Kontrol/Analizi başlat); hiçbir özellik butonu, pazarlama öğesi veya süs düğmesi yok.

### 5.2 Akış

```
Ana ekran → 1 Danışan → 2 Yöntem → 3 Veri → 4 Kontrol (kayıt)
                ↑___________Geri (her adımda)______________|
```

- Yöntem her an değiştirilebilir; hızlı giriş cevapları ve ham puanlar üst bileşen state'inde tutulur (kaybolmaz). OMR taraması yöntemin `'omr'` olduğu sürece canlı tutulur.
- 4. adımda kayıt; klinik puanlama motoru bağlı değil (not korunuyor).

### 5.3 Doğrulama kuralları (Türkiye örnekleminde gerçek veriye dayalı)

| Kural | Davranış | Gösterim | Dayanak |
|---|---|---|---|
| Yaş **≥ 16** | 16 altı **engellenir** | alan altı kırmızı + form banner'ı | Türkiye normları: 16 yaş altı sonuçlar geçerli kabul edilmez (psamer, psikolojibursa) |
| Yaş sağlamlık ≤ 120 | aşırı girdi "doğrulanamadı" | banner | girdi sağlamlığı (norm koşulu değil) |
| Eğitim: **İlkokul reddi** | İlkokul seçimi **engellenir** | alan altı kırmızı + banner | okuryazarlık şartı; tercih edilen en düşük düzey ortaokul (6–8 yıl) → uygulama kararı: ilkokul reddi |
| Süre **60–120 dk** | engellemez, **uyarı verir**: <45 "çok kısa" (kırmızı), 45–59 "kısa" (amber), >180 "uzun" (amber) | alan altı ipucu + kontrol adımında banner | Türkiye uygulamaları: ortalama 1–2 saat; 566 madde 20 dk'da cevaplanamaz |
| **Boş (?) ≤ 30** | üç yolda da (hızlı/ham/OMR) **>30'ta kayıt engellenir** | hızlı girişte canlı uyarı + kontrolde hata banner'ı | Cannot Say/? ölçeği 30'u aşırsa test geçersiz sayılabilir |
| Klinik/ortam koşulları (akut psikoz, madde-sedatif, yalnız uygulama, yetkin uygulayıcı) | form alanı **değil**; klinik yargı | kontrol adımında bilgi notu | paylaşılan kriterler |
| **IQ** | **istenmez** (kullanıcı kararı) | — | "iq gibi veriler isteme" |

### 5.4 Subdomain / ana site

- Header'da `halilkaraduman.com.tr ↗` (yeni sekme, `SITE_URL` tek kaynaktan).
- Footer'daki mevcut yazar linkleri korunuyor.
- Karşılıklı bağlantı notu: ana sitedeki "Çalışmalar → MMPI" kartının bu subdomain'e yönlendirilmesi **halilkaraduman.com.tr** deposunda yapılacak bir değişikliktir (bkz. §8).

### 5.5 Veri sözleşmesi (şema değişikliği YOK)

- DB sütunları aynen: `client_first_name, client_last_name, gender, age, occupation, education, application_date, requested_by, raw_omr_answers, created_by, idempotency_key`.
- İsteğe bağlı alanlar (`follow_up`, `marital_status`, `test_duration`, `application_reason`, `clinical_context`, yöntem) `raw_omr_answers[]` içindeki **`case-meta` (v1)** objesinde; eski `client-context`/`entry-method` kayıtları geriye dönük okunabilir.
- Boş isteğe bağlı alanlar **boş string** ile yazılır (sahte "—" karakteri yok).

---

## 6. Bu Oturumdaki Değişiklikler (dosya dosya)

| Dosya | Değişiklik |
|---|---|
| `src/workspace/caseTypes.ts` | MMPI uygulama koşulları: `MMPI_AGE_MIN/MAX`, `MMPI_DURATION_RANGE (60–120)`, `MMPI_MAX_BLANK (30)` + mesajlar; `parseDurationMinutes`, `assessDuration` (çok kısa/kısa/ok/uzun); `validateIntake` güncellendi. (IQ taslağı eklendikten sonra **tamamen kaldırıldı**.) |
| `src/components/CaseWorkspace.tsx` | Yeniden yazım: hero ana ekran + veri satırı; üst **adım çubuğu** (Geri, tıklanabilir adım haritası, ileri eylemi); yöntem kartları (seçim durumu, "Seçili" çipi, ikon kutusu); form bölümleri (Danışan/Test); yaş/eğitim/süre **canlı yönlendirmeler**; boş>30 kayıt engeli + banner; uygulama koşulları notu; OMR paneli yöntem süresince monte kalır (gizlenir), yöntem değişiminde sıfırlanır. |
| `src/components/ScannerWorkspace.tsx` | `embedded` modda `RecordCapture` + `MyRecordsPanel` çizilmez (çift kayıt yolu kaldırıldı). Motor/kod aynen. |
| `src/components/QuickEntry.tsx` | İlerleme çubuğu; boş>30 canlı uyarısı. |
| `src/components/Icon.tsx` | `external` (↗) ikonu — ana site linki için. |
| `src/App.tsx` | Header'a `halilkaraduman.com.tr` bağlantısı. |
| `src/styles/workspace.css` | Yeni akış stilleri (flowbar, stepper, hero, facts, method kartları, hints, conditions note, qe progress) — mevcut token'larla. |
| `src/styles/theme.css` | `.home-site-link` header stili. |
| `tests/caseWorkspace.test.ts` | Yaş 16+ (13 reddi, 16 kabul, 121 sağlamlık), eğitim İlkokul reddi / Ortaokul kabulü, süre ayrıştırma + 60–120 dk değerlendirme testleri; mevcut testler yeni kurallarla hizalandı. |
| `optik-form.html` | `npm run build` ile yeniden üretildi (tek dosya yayın). |
| `MUHENDISLIK-RAPORU-2026-09-17.md` | Bu rapor. |

**Değişmeyen:** `src/omr/*`, `src/scanner/*`, `src/results/*`, `src/auth/*`, `src/print/*`, optik form PDF'si/şablonu, DB şeması, scoring (bağlı değil).

---

## 7. Veri Tutarlılık Matrisi (yazılan ↔ okunan)

| Form alanı | DB sütunu | JSON (`raw_omr_answers`) | Okunuş |
|---|---|---|---|
| Ad, Soyad, Cinsiyet, Yaş, Test tarihi | `client_first_name, client_last_name, gender, age, application_date` | `case-meta.client` | Detay modal + liste |
| Meslek, Eğitim, Başvuru nedeni | `occupation, education, requested_by` (boş string serbest) | aynı meta | Detay modal |
| Süre, İzlem, Medeni durum, Kısa öykü | sütun yok (şema korunur) | `case-meta.client` | Detay modal |
| Hızlı giriş (566) | — | `quick-entry.answers` | Detay modal ızgarası |
| Ham puan (14 ölçek) | — | `raw-scores.scales` | Detay modal |
| OMR (4 sayfa + manuel düzeltmeler) | — | OMR sayfa objeleri | Detay modal sayfa sekmeleri |
| Yöntem | — | `case-meta.method` | Detay modal (eski `entry-method` da okunur) |
| Kaydı yapan uzman | `created_by` | — | Yönetim paneli (profil join) |

Kayıt sonrası `onSaved → recordsTick` ile "Kayıtlar" sekmesi yenilenir. İdempotency: işlem başına tek UUIDv4; aynı işlemle çift kayıt oluşmaz.

---

## 8. Doğrulama

| Kontrol | Sonuç |
|---|---|
| `npm run typecheck` (tsc --noEmit) | ✅ temiz |
| `npm test` (tsx --test) | ✅ **108/108** geçti |
| `npm run build` | ✅ `dist/index.html` + `optik-form.html` üretildi |
| OMR motoru / kamera hattı | Dokunulmadı (önceki 105+ test hâlâ içeride, geçiyor) |

---

## 9. Kalan İşler / Sonraki Adımlar

1. **Kullanıcı onayı:** yeni İşlem akışının canlı önizlemede denenmesi (hızlı / ham / OMR üçü de). Tasarım beğenilmezse halilkaraduman.com.tr dilinde ince ayar yapılabilir.
2. **PR birleştirme:** bu branch için PR açıldı; onay sonrası merge edilebilir.
3. **Ana site (ayrı repo):** `halilkaraduman.com.tr`'nin "Çalışmalar → MMPI Değerlendirme Aracı" kartının `onMmpi` toast'ı yerine `https://mmpi.halilkaraduman.com.tr`'ye yönlendirme yapılması (o repoda 1 satırlık değişiklik).
4. **Klinik puanlama motoru:** kapsam dışı; `clinicalTransferAllowed: false` korunuyor. Motor bağlandığında 4. adımın "Analizi başlat" aksiyonu o motora bağlanacak şekilde tasarlandı.
5. **16 yaş altı danışanlar:** şu an akış reddediyor; gerekirse ayrı bir MMPI-A (ergen) formu olarak yeni bir ürün kararı olur — mevcut form/soru seti için kapsam dışı.
6. **OMR boş>30:** OMR'da boşlar taramadan çıkar; >30 engeli üç yol için de aynı (kural tutarlı). İsteğe bağlı olarak OMR'da "boş" sayısının ayrı bir rozeti eklenebilir.

---

## 10. Kaynaklar (Türkiye örneklemindeki MMPI uygulama koşulları)

Kullanıcının paylaştığı kriter metni ve aşağıdaki Türkçe kaynaklar; tüm doğrulama mesajları bu verilere dayanır (uydurma norm yok):

- https://www.psamer.com/duzce-minnesota-cok-yonlu-kisilik-envanteri-mmpi-rehberi/ (16 yaş ve üzeri)
- https://www.psikolojibursa.com/mmpi-kisilik-testi/ (16+, 566 madde, ortalama 60–120 dk)
- https://psikohelp.com/psikolojik-testler/mmpi-kisilik-testi-coz-ucretsiz-online-mmpi-kisilik-testi (ilkokul okuryazarlığı şartı, tercih ortaokul; IQ ≥ 80)
- https://www.dilgem.com.tr/en/makaleler/mmpi-cok-yonlu-kisilik-envanteri/ (yalnız uygulama)
- https://www.pskbilgekilinckaya.com.tr/minnesota-cok-yonlu-kisilik-envanteri-mmpi/ , https://yetkinpsikoloji.com/mmpi-testi-nedir/ (akut psikotik durum, madde/sedatif)
- https://prezi.com/73qkkmvpane5/mmpi-uygulamapuanlamaprofil-olusturma/ (6–8 yıllık eğitim tercihi)
- https://www.giuntipsy.com.tr/mmpi-2-minnesota-cok-yonlu-kisilik-envanteri.html (tamamlama süresi 1 saat)
- https://drhuseyindogan.com/mmpi-2-minesota-cok-yonlu-kisilik-envanteri/ (16 yaş üstü + en az ortaöğretim)
- https://npistanbul.com/en/minnesota-multiphasic-personality-inventory-mmpi (16+, en az orta öğretim, 566 madde)

> Adlandırma notu: Türkiye'de bu 566 maddelik **klasik MMPI** formu kullanılır; arayüz ve bu rapordaki "MMPI" ifadesi bu formu kasteder (MMPI-2 değil).

---

## 11. Commit/Birlikte Çalışma Notu

- Tüm değişiklikler `arena/01a0afbb-repo123` branch'inde commit edilip push edildi (sandbox kaybına karşı).
- Önceki oturumların OMR/tasarım geçmişi git geçmişinde korunuyor (`fed1a20`, `6aa6ca2`, `59f6fbc` vb.); bu rapor §4.6'da önceki OMR tasarımını özetliyor.

---

## 12. Ek — Taşıma, İkinci Eksiksiz Denetim ve Son Durum (17 Eylül 2026, `arena/01a0afd1-repo123`)

Bu raporun çalışması, `arena/01a0afd1-repo123` branch'ine (temel: `main @ 103d45d`) dosya dosya taşınmış; raporun **her iddiası kodun son durumuyla satır satır denetlenmiştir**. Orijinal raporun yazıldığı andan beri farklar şunlardır:

### 12.1 Denetim Düzeltmeleri (kod)

1. **Adım haritasında tamamlanan TÜM adımlar tıklanabilir:** Önceki uygulama adım haritasında yalnızca "Danışan" ve "Yöntem" adımlarına tıklamayla dönme izni veriyordu. §3.4 ifadesiyle ("tamamlanan adımlar tıklanarak geri atlanır") uyum için **tüm tamamlanmış adımlar (Kontrol adımından "3. Veri" dahil) tıklanabilir** yapıldı; ileriye sıçrama hâlâ yok.
2. **OMR boş > 30 canlı göstergesi (§9.6 isteğe bağlı maddesi tamamlandı):** OMR metrik şeridinde boş bırakılan madde sayısı 30'u aştığında değer kırmızıya döner ve etikete "· 30 sınırı aşıldı" notu eklenir. Böylece boş>30 kuralı üç yolda da (hızlı giriş canlı uyarısı, OMR canlı göstergesi, kontrolde hata banner'ı + kayıt engeli) aynı sıkılıkla görünür. OMR motoru/okuma kodu değişmedi.
3. **"Yöntem" ve "Veri" adımlarında alt nav (rapor §3.4: "alt nav da korunuyor"):** Önceki uygulamada alt nav yalnızca "Danışan" ve "Kontrol" adımlarındaydı; yöntem/veri adımlarında eksikti. Her iki adıma da alt nav (Geri + ileri eylemi) eklendi; OMR modunda nav, OMR bloğunun **altına** yerleştirildi — uzun tarama içeriğinden sonra "Kontrol" eylemine en kısa yoldan erişim.

### 12.2 İkinci Denetim — Veri Yolu ve Şema (rapor §7)

Veri tutarlılık matrisi, `supabase/migrations/20260915000000_initial_schema.sql` şeması ve yazan/okuyan kodla sütun sütun karşılaştırıldı:

- §5.5'teki 11 sütun şema ile birebir aynı; `upsertRecord` payload'u aynı adları kullanıyor. `occupation/education/requested_by` şemada `NOT NULL` — yazımda her zaman string (isteğe bağlı alanlarda boş string, `null` asla).
- `gender`: form Erkek/Kadın ⊂ şemanın 4 değeri. `age`: form 16+ (daha sıkı) ⊂ şemanın 0–120 sınırı. `application_date`: ISO tarih, şemada `date`. `raw_omr_answers`: jsonb array — `createRecord` her zaman `[case-meta, …, OMR sayfa nesneleri]` sırasıyla (meta önde, sayfa nesneleri arkada) doldurur; `createDataRecord` `[case-meta, quick-entry|raw-scores]`. Boş payload `upsertRecord` içinde engellenir.
- İdempotency: işlem başına tek UUIDv4; `idempotency_key` (unique) üzerinden upsert. RLS politikaları insert/update/delete'i `created_by = auth.uid()` ile sınırlar — kullanıcılar arası geçiş imkânsız; `created_by` form alanından değil, oturumdan alınır.
- Kayıt sonrası `onSaved → recordsTick` "Kayıtlar" sekmesini yeniler; eski `client-context`/`entry-method` kayıtları `parseRecordPayload` ile geriye dönük okunur.
- **Sonuç: §7 matrisi geçerli; yazılan ↔ okunan tutarlı, kırılma yok.**

### 12.3 Yeniden Doğrulama Sonuçları

| Kontrol | Sonuç |
|---|---|
| `npm run typecheck` (tsc --noEmit) | ✅ temiz |
| `npm test` (tsx --test) | ✅ **108/108** geçti |
| `npm run build` | ✅ `dist/index.html` + `optik-form.html` üretildi |
| Bundle içerik doğrulaması | ✅ Yeni arayüz parçaları (adım çubuğu, ana site pill'i, "Seçili" çipi, "İşleme devam et", 16 yaş / ilkokul reddi / 60–120 dk / boş>30 mesajları, OMR "sınırı aşıldı" göstergesi) derlenmiş tek dosyalı bütünde tek tek doğrulandı |
| Şema ↔ payload ↔ okuma | ✅ Bkz. 12.2 |

### 12.4 Pull Request ve İş Birliği Durumu

- Önceki oturumun **PR #14**'ü (`arena/01a0afbb-repo123`) **kopya olarak kapatıldı** — çalışmanın tamamı (bu rapor dahil) yeni branch'e taşındı.
- **PR #15** (`arena/01a0afd1-repo123` → `main`) bu çalışmaya ait tek PR'dır; bu ek, PR #15 ile birlikte `main`'e girer.
- §9.1 (kullanıcı onayı): canlı önizleme sandbox'ta çalıştırıldı; sandbox'ta Supabase ortam değişkenleri tanımlı olmadığı için önizleme kurulum ekranını gösterir — akışın üç yolu (hızlı/ham/OMR), env yapılandırılmış yayın ortamında tam denenebilir durumda.
- §9.6 (OMR boş rozeti): **tamamlandı** (bkz. 12.1/2).
- Değişmeyen kapsam dışı maddeler: §9.3 (ana site yönlendirmesi — ayrı repo), §9.4 (klinik puanlama motoru — `clinicalTransferAllowed: false`), §9.5 (16 yaş altı / MMPI-A — ayrı ürün kararı).
