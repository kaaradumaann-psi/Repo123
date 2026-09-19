# MMPI PROJESİ — KALICI PROJE DURUMU / DEVİR DOKÜMANI

> **Bu dosya projenin tek gerçek durum/devir kaynağıdır.**
> Son güncelleme: 2026-09-19 · Güncelleyen: Arena.ai Agent (oturum: `arena/01a0b91f-repo123`)
> Bu dokümandaki her madde gerçek repository incelemesi, gerçek test çıktıları ve
> `docs/kaynak-denetimi.md` kaynak denetimiyle doğrulanmıştır. Uydurma bilgi yoktur;
> doğrulanamayan her şey `[?]` ile işaretlenmiştir.

## Durum etiketleri

```text
[✓] TAMAMLANDI
[~] KISMEN TAMAMLANDI
[ ] YAPILMADI
[!] SORUN VAR
[?] DOĞRULANAMADI
[→] DEVAM EDİYOR
[-] GEREKLİ DEĞİL
```

---

## 1. PROJE ÖZETİ

```text
Proje:      MMPI-566 uzman çalışma platformu (repo adı: kaaradumaann-psi/Repo123, paket: mmpi-566-optik-formu v2.0.0)
Amaç:       Psikologların MMPI-566 uygulamalarını yönetmesi: optik form üretimi,
            OMR okuma, cevap doğrulama, puanlama, geçerlik, profil, rapor, kayıt arşivi.
Ana kullanıcı: Psikolog (PSYCHOLOG rolü) + Yönetici (ADMIN rolü). Public kayıt YOK.
Temel akış: Giriş → İşlem (danışan bilgisi → yöntem seçimi [hızlı giriş / ham puan / OMR]
            → veri → kontrol → kaydet) → anlık profil → Kayıtlar → Testi İncele
            → sekmeli sonuç ekranı → Yazdır/PDF raporu.
```

**Mevcut aşama (5-10 cümle):**
Proje olgun ve çalışır durumdadır. React 19 + TypeScript + Vite tek-sayfa uygulaması;
tarayıcıda çalışan tam OMR hattı, Türk normlarına dayalı MMPI puanlama/yorum motoru,
Supabase Auth + RLS tabanlı kayıt sistemi ve print-CSS tabanlı PDF raporu içerir.
192 test geçiyor, typecheck temiz, production build + verify:pdf çalışıyor (bkz. §46 Test Durumu).
Repo daha önce 24 PR'lık bir geliştirme geçmişinden geçmiş (tek squash-merge zinciri,
`git log` sadece merge commit `fea1f19` gösteriyor; PR listesi `gh pr list --state merged`
ile görülebilir). Bu oturumda "final sürüm" denetimi yapıldı ve iki P1 iş TAMAMLANDI:
**B1 — üç durumlu geçerlik sınıflandırması (GEÇERLİ/ŞÜPHELİ/GEÇERSİZ) scoring motoruna
eklendi VE tüm UI bileşenlerine bağlandı** (MMPIResultsPanel, MMPIValidityTab,
RecordDetailPage, MMPIPrintReport + `.is-suspect` CSS + testler);
**B2 — `src/scoring/version.ts` oluşturuldu ve `scoringVersion`/`normSource` kayıt
meta'sına yazılıp kayıt detayında gösteriliyor.** Değişiklikler bu oturumun sonunda
branch'e commit edildi (bkz. §43 Git Durumu). İkinci turda B3–B10 backlog'unun
TAMAMI kapatıldı: reviewHistory kayda taşındı (B3), uzman notu + rapora aktarım
(B4, yeni migration), CSP connect-src (B5), rapor sayfa numarası (B6), Ries atıf
düzeltmesi (B7), audit_logs tablosu + trigger (B8), kayıt listelerinde tarih
aralığı filtresi (B9), admin erişim kararı belgelenip denetim iziyle dengelendi
(B10), MMPIValidityTab eşikleri VALIDITY_CUTOFFS'tan tekilleştirildi, bayat
"puanlama motoru bağlı değil" metni düzeltildi, verify:pdf lokalde koşuldu.
Kod-düzeyi backlog SIFIR; kalan işler yalnızca canlı ortam doğrulamaları ve
kaynak-doğrulama işleridir (bkz. §38–39).

---

## 2. TEKNOLOJİ STACK

`package.json` (gerçek):

| Alan | Teknoloji | Not |
| --- | --- | --- |
| Framework | React 19.2.0 + react-dom | |
| Dil | TypeScript 5.9.3 (strict; `any` yalnızca 2 yerde: `mmpiScoring.ts:205,407`) | |
| Build | Vite 7.3.6 (dev) + esbuild 0.25.12 (`scripts/build.mjs` tek dosya production build) | |
| Test | `tsx --test` (Node test runner), 26 test dosyası, 192 test | |
| Database/Auth | Supabase (`@supabase/supabase-js` 2.x), RLS, Edge Function | |
| OMR/QR | jsQR 1.4.0 (QR okuma), qrcode 1.5.4 (QR üretme); OMR motoru tamamen kendi TS kodu (`src/omr/`) | |
| PDF (form) | Kendi PDF yazıcısı `src/print/pdfDocument.ts` + TTF gömme — harici PDF lib YOK | |
| PDF (rapor) | `window.print()` + `@media print` CSS (`MMPIPrintReport`) — pdf lib YOK | |
| PDF okuma | pdfjs-dist 6.3.289 (taranmış PDF girişi için, worker sertleştirilmiş) | |
| Grafik | Kendi SVG bileşeni `MMPIScoreChart` — chart lib YOK | |
| Hash | @noble/hashes 2.4.0 | |
| Storage | YOK (dosya/bucket kullanılmıyor; görüntüler yalnızca istemcide işlenir) | |
| Deployment | Statik tek dosya `optik-form.html` / `dist/index.html`; CI: `.github/workflows/ci.yml` | |

[-] Gereksiz dependency bulunmadı; hepsi kullanılıyor.

---

## 3. DOSYA VE KLASÖR HARİTASI (gerçek, `find` çıktısından)

```text
Repo123/
├── index.html                      → Vite dev shell
├── optik-form.html                 → TEK DOSYA production çıktısı (commit'li; build ile birebir olmalı, CI kontrol eder)
├── MMPI-566-optik-cevap-formu.pdf  → Hazır 4 sayfalık A4 optik form PDF'i (testlerle doğrulanır)
├── package.json / tsconfig.json / vite.config.ts
├── .env.example                    → VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (yalnızca isim; secret yok)
├── .github/workflows/ci.yml        → typecheck + test + verify:pdf + build + optik-form.html drift kontrolü
├── docs/
│   ├── kaynak-denetimi.md          → BİLİMSEL KAYNAK DENETİMİ (A–E statü tabloları) — ÇOK ÖNEMLİ, OKU
│   └── tasarim-dili.html           → UI tasarım dili referansı
├── scripts/
│   ├── build.mjs                   → esbuild tek dosya build + CSP hash
│   ├── generate-pdf.ts / verify-pdf.ts / printFonts.ts → form PDF üretim/doğrulama
│   └── run-photos.mts              → gerçek telefon fotoğrafı regresyon harness'i (prod zincirinde değil)
├── src/
│   ├── main.tsx / App.tsx          → giriş; hash-router (#/test/<id>, #/onizleme, #/sss, #/gizlilik, #/kullanim, #/kaynaklar)
│   ├── auth/
│   │   ├── supabaseClient.ts       → createClient (sessionStorage, PKCE); supabaseConfig.configured
│   │   ├── supabaseAuth.ts         → signIn/signOut/profileForUser/userFromSession (pasif hesap reddi)
│   │   ├── adminApi.ts             → Edge Function 'admin-users' çağrıları (create/set_active/delete)
│   │   ├── authStorage.ts / authTypes.ts / userDisplay.ts
│   ├── components/
│   │   ├── AuthGate.tsx            → oturum kapısı; 60 sn'de bir + focus'ta profil re-validasyonu
│   │   ├── CaseWorkspace.tsx       → ANA İŞ AKIŞI (1504 satır): home→intake→method→entry→review
│   │   ├── ScannerWorkspace.tsx / ScanResultPreview.tsx / CameraCapture.tsx / RecordCapture.tsx → OMR UI
│   │   ├── QuickEntry.tsx / RawScoreEntry.tsx → hızlı giriş (klavye 1/2/0) ve ham puan girişi
│   │   ├── MyRecordsPanel.tsx      → psikoloğun kendi kayıtları (arama + silme onayı)
│   │   ├── AdminPanel.tsx          → tüm kayıtlar + psikolog yönetimi + yeni psikolog formu
│   │   ├── RecordDetailPage.tsx    → #/test/<id> tam sayfa kayıt inceleme + Yazdır/PDF
│   │   ├── results/                → MMPIResultsPanel (8 sekme), MMPIScoreChart (SVG profil),
│   │   │                             MMPIValidityTab, MMPIClinicalTab, MMPICodeTab, MMPIDerivedSection,
│   │   │                             MMPIExtraTab, MMPICriticalSection, MMPIAnswersTab,
│   │   │                             MMPIPrintReport (yalnızca baskı raporu), Disclosure (aç/kapa altyapısı)
│   │   ├── FormKit.tsx / FormPage.tsx / PaperHeader.tsx / PageQr.tsx / RegistrationMarks.tsx → optik form
│   │   ├── ConfirmDialog.tsx / ConnectivityBanner.tsx / Icon.tsx
│   │   ├── SiteFooter.tsx / InfoPageShell.tsx / FaqPage.tsx / PrivacyPolicyPage.tsx / TermsPage.tsx / PolicyDoc.tsx
│   │   ├── SourcesPage.tsx         → Kaynakça sayfası (#/kaynaklar) — A–E statüleriyle dürüst kaynak listesi
│   │   └── DesignPreviewPage.tsx   → #/onizleme (yalnızca Supabase YAPILANDIRILMAMIŞKEN açılır)
│   ├── form/                       → layout.ts (tek import yüzeyi), formSet, headerLayout, pageIdentity, attribution
│   ├── omr/                        → omrTypes, formDefinition, qrDecoder, pageIsolation, perspectiveCorrection,
│   │                                 alignmentDetector, alignmentVerification, imageQuality, markDetector,
│   │                                 bubbleRingRefinement, analyzePage, orientation
│   ├── scanner/                    → imageIO, pdfIO, pageSequence (sayfa kabul + manuel inceleme + geri alma), reviewGeometry
│   ├── results/                    → scanResultTypes (ItemReadResult, ManualReview, ManualReviewEvent),
│   │                                 resultValidator, resultNormalizer, recordProfile (kayıttan profil)
│   ├── scoring/                    → BKZ. §16; mmpiKeys, mmpiScoring, mmpiSource, mmpiSourceCodes,
│   │                                 mmpiInterpretation, mmpiConsistency, mmpiValidityConfigs,
│   │                                 mmpiDerived, mmpiCritical, omrAnswers, version.ts (YENİ, henüz bağlanmadı)
│   ├── records/supabaseRecords.ts  → kayıt CRUD (createRecord/createDataRecord/listOwn/listAll/getDetail/delete)
│   ├── workspace/                  → caseTypes (domain modelleri + doğrulama), draftStorage (localStorage taslak
│   │                                 30 gün TTL + çevrimdışı outbox), useOnlineStatus
│   ├── preview/demoProfile.ts      → #/onizleme örnek verisi (gerçek puanlama hattıyla üretilir)
│   ├── print/                      → pdfDocument, ttfFont, renderFormPdf, formPdf (form PDF üretimi)
│   └── styles/                     → theme, screen, workspace (sonuç+print raporu CSS), scanner, form, auth, site, print
├── supabase/
│   ├── config.toml
│   ├── README.md                   → kurulum: db push, ilk Admin SQL, Edge Function deploy, signup kapatma
│   ├── migrations/20260915000000_initial_schema.sql → TEK migration (profiles + mmpi_records + RLS)
│   └── functions/admin-users/index.ts → Edge Function (service role yalnızca sunucuda)
└── tests/                          → 26 test dosyası + fixtures/omrSynthetic.ts (bkz. §46)
```

---

## 4. MİMARİ

```text
Browser (React SPA, hash-router)
 ├── Supabase Auth (oturum: sessionStorage, PKCE, autoRefresh)
 ├── Supabase DB (yalnızca 2 tablo: profiles, mmpi_records) — RLS zorunlu
 ├── Supabase Edge Function 'admin-users' (yalnızca Admin; service_role sunucuda)
 └── TÜM HESAPLAMA İSTEMCİDE:
     OMR hattı (src/omr) → cevaplar → scoring (src/scoring) → sonuç ekranları → print raporu
```

**Kritik mimari karar (bilinçli, README'de belgeli):** Sunucuya hiçbir klinik skor
yazılmaz. `mmpi_records.raw_omr_answers` yalnızca ham cevap/veri yükünü tutar; profil
her açılışta istemcide yeniden hesaplanır. `summarizeResults()` her zaman
`clinicalTransferAllowed: false` döndürür. Bu, "authoritative scoring backend'de olsun"
hedefiyle çelişir — bkz. §53 Riskler.

- Backend API endpoint'i YOK (Supabase PostgREST + 1 Edge Function dışında).
- Storage bucket YOK; taranan görüntüler sunucuya gitmez.
- Tek dosya build offline CSP ile kilitli: `default-src 'none'; script-src 'sha256-…'`.
  [!] DİKKAT: CSP'de `connect-src` YOK → `default-src 'none'` nedeniyle tek dosya
  build'de Supabase'e bağlantı ancak CSP'ye rağmen çalışmaz gibi görünebilir;
  gerçekte `connect-src` yönergesi yoksa `default-src` geçerli olur = bağlantı engellenir.
  Ancak testler ve README bu build'i "offline deliverable" olarak tanımlıyor;
  Supabase'li kullanım Vite dev/host üzerinden. [?] Tek dosya build + Supabase birlikte
  hiç canlı test edilmedi (bu sandbox'ta gerçek Supabase yok). Sonraki AI: gerçek
  ortamda doğrula; gerekiyorsa build CSP'sine `connect-src https://*.supabase.co` ekle
  ve `tests/build.test.ts` CSP assert'lerini güncelle.

---

## 5. AUTHENTICATION — [✓] (canlı Supabase testi hariç)

- Sistem: Supabase Auth, e-posta+şifre, `signInWithPassword`. Public signup YOK
  (dashboard'dan kapatılması `supabase/README.md`'de talimatlı; uygulamada kayıt ekranı yok).
- Oturum: `persistSession: true`, **sessionStorage** (`authStorage.ts`) → F5 korur,
  sekme kapanınca düşer. `flowType: 'pkce'`, `detectSessionInUrl: false`.
- Login: `signIn()` profil çeker; profil yoksa/pasifse **local signOut + hata** (`supabaseAuth.ts`).
- Logout: `AuthGate` içinde `signOut()`; hata yutulur, state temizlenir.
- Session kontrolü: `AuthGate` 60 saniyede bir + `window` focus'ta profili yeniden doğrular;
  pasifleştirilen kullanıcı düşürülür. `onAuthStateChange` dinlenir.
- Password reset: [ ] YOK (bilinçli olabilir; Admin şifreyi Edge Function'dan yeniden
  oluşturamıyor — sadece create/set_active/delete var). Şifre sıfırlama akışı istenirse
  Supabase resetPasswordForEmail entegre edilmeli. PLANLANDI DEĞİL.
- Unauthorized: yapılandırılmamışsa kurulum ekranı; oturum yoksa login ekranı;
  `#/test/<id>` yetkisiz kayıtta RLS boş döner → "Kayıt açılamadı … erişim yetkiniz yok".
- [?] Canlı Supabase ile login/logout/expired-session bu sandbox'ta test EDİLEMEDİ
  (gerçek proje yok). Kod yolu birim testli değil; RLS'e dayanıyor.

## 6. AUTHORIZATION / ROLLER — [✓] kod düzeyinde

Roller (migration'daki enum): `ADMIN`, `PSYCHOLOG`.

| İşlem | PSYCHOLOG | ADMIN | Uygulama noktası |
| --- | --- | --- | --- |
| Kayıt (işlem) oluşturma | ✓ | ✗ (UI'da hesaplar ama kaydetmez: `saved.id==='local'`) | `upsertRecord` istemci kontrolü + RLS insert `created_by = auth.uid()` |
| Kendi kayıtlarını görme | ✓ | ✓ (tümünü) | RLS select |
| Başkasının kaydını görme | ✗ | ✓ | RLS select `is_admin()` |
| Kayıt silme | ✓ (kendi) | ✓ (hepsi) | RLS delete |
| Kullanıcı yönetimi (oluştur/pasifleştir/sil) | ✗ | ✓ | Edge Function caller-role kontrolü |
| Admin hesabını Edge Function ile silme/pasifleştirme | ✗ | ✗ (yalnızca PSYCHOLOG hedefi kabul) | `admin-users` `target.role !== 'PSYCHOLOG'` reddi |
| Sekmeler | İşlem, Form, Kayıtlar | İşlem, Form, Yönetim | `App.tsx` |

[!] NOT: Admin, kayıt detayını (`#/test/<id>`) açtığında **test cevaplarını ve profili
görebilir** (RLS admin'e tam select verir). Final prompt "admin bile gereksiz yere test
cevaplarına erişmemeli" der. Bu bilinçli mevcut tasarım; değiştirilecekse RLS select
politikasında admin için kolon kısıtlaması (view) gerekir. KARAR VERİLMEDİ.

## 7. SUPABASE / DATABASE — [✓]

Tek migration: `supabase/migrations/20260915000000_initial_schema.sql`.

**Tablo: `public.profiles`**
- Amaç: Auth kullanıcısının rol/aktiflik profili.
- Kolonlar: id (uuid, auth.users FK, cascade), email, first_name, last_name,
  role (enum, default PSYCHOLOG), active (bool, default true), created_at, updated_at.
- Trigger: `handle_new_auth_user` (yeni auth kullanıcısına en düşük yetkiyle profil),
  `set_updated_at`.
- İndeks: `(role, active)`.
- RLS: select = kendi satırı VEYA admin; update/delete = yalnızca admin. Insert
  politikası YOK (yalnızca security-definer trigger yazar) → [✓] doğru.
- `revoke all ... from anon` var. [✓]

**Tablo: `public.mmpi_records`**
- Amaç: danışan meta + ham cevap yükü (`raw_omr_answers` jsonb array).
- Kolonlar: id (uuid gen_random_uuid → tahmin edilemez), idempotency_key (unique),
  client_first_name/last_name, gender (check: 4 değer), age (0–120 check),
  occupation, education, application_date (date), requested_by,
  raw_omr_answers (jsonb, `jsonb_typeof='array'` check), created_by (profiles FK), created_at.
- İndeks: `(created_by, created_at desc)`. [✓] Liste sorgusuyla uyumlu.
- RLS: select = admin VEYA (sahibi VE aktif); insert = `created_by = auth.uid()` VE aktif;
  update = yalnızca sahibi+aktif (idempotent upsert için); delete = admin VEYA sahibi+aktif.
- [✓] `created_by` asla formdan alınmaz (payload'da istemci gönderir ama RLS
  `with check created_by = auth.uid()` ile zorlar).

**Yok olanlar (bilinçli/eksik):**
- [ ] Ayrı `patients` tablosu YOK — danışan alanları kayıt satırının içinde. Bir danışanın
  birden çok değerlendirmesi ayrı `mmpi_records` satırlarıdır; danışan bazında gruplama
  UI'da YOK (arama isimle yapılır). Final prompt'un "danışan yönetimi" maddesi bu modelde
  kısmen karşılanır. [~]
- [✓] `audit_logs` tablosu EKLENDİ (2026-09-19, migration 20260919000000): security-definer
  trigger her mmpi_records insert/update/delete olayını (aktör, eylem, hedef, zaman)
  yazar; yalnızca Admin okur, istemci yazamaz/silemez. Canlı doğrulama [?].
- [✓] `expert_notes` + `notes_updated_at` kolonları EKLENDİ (B4; ≤4000 karakter,
  sahibi RLS ile yazar, rapora aktarılır).
- [ ] Soft-delete / `deleted_at` YOK — silme kalıcıdır (iki adımlı onay UI'da var);
  audit_logs silme olayını artık kalıcı olarak kaydeder.
- [ ] `updated_at/archived_at` mmpi_records'ta YOK (yalnızca created_at + notes_updated_at).
- [~] Scoring/norm versiyonu ayrı kolon değil; payload meta'sında (B2, scoringVersion).

## 8. RLS / GÜVENLİK DEĞERLENDİRMESİ

- RLS her iki tabloda AÇIK. Politikalar yukarıda. `is_admin()` / `is_active_user()`
  security-definer, `search_path = public` sabitli, `authenticated`'a grant'li. [✓]
- [?] **RLS canlı cross-user testi YAPILMADI** (sandbox'ta gerçek Supabase yok).
  Politikalar SQL okumasıyla doğru görünüyor; başka kullanıcının assessment ID'siyle
  doğrudan PostgREST isteği canlı ortamda denenmeli.
- IDOR: kayıt ID'leri uuid; `#/test/<id>` erişimi RLS'e dayanır. [✓ tasarım] / [?] canlı test.
- Secret taraması: repo'da service_role/apikey/token YOK (grep yapıldı; `optik-form.html`
  içindeki `eyJ...` eşleşmeleri minified kod parçalarıdır, JWT değildir — doğrulandı).
  `.env` gitignore'da. [✓]
- XSS: `dangerouslySetInnerHTML`/`innerHTML` kullanımı YOK (grep 0 sonuç). React escape. [✓]
- CSRF: cookie tabanlı oturum yok (bearer token) → klasik CSRF yüzeyi yok. [-]
- File upload: görüntüler yalnızca istemcide işlenir, sunucuya dosya gitmez; boyut/tip
  sınırları `src/scanner/imageIO.ts`/`pdfIO.ts`'de. Sunucu tarafı upload YOK. [-]
- [!] `raw_omr_answers` içeriği sunucuda ŞEMA DOĞRULAMASIZ (yalnızca "array" check).
  Bozuk/aşırı büyük payload'ı istemci normalize eder ama kötü niyetli istemci istediğini
  yazabilir (yalnızca kendi kaydına). Okuma tarafı `parseRecordPayload` savunmacı. Orta risk.
- [!] KVKK açısından danışan adı-soyadı + psikolojik test verisi Supabase'de düz metin.
  Şifreleme-at-rest Supabase'in altyapısına bırakılmış. Aydınlatma/koşullar sayfaları var
  (`#/gizlilik`, `#/kullanim`); hukuki metinler "hukuki tavsiye değildir" çerçevesinde. [~]

## 9. SCANNER / OMR — [✓] (sentetik + PDF doğrulamalı; gerçek kağıt değil)

Gerçek hat (`src/omr/analyzePage.ts` zinciri):
görüntü/PDF yükleme (`scanner/imageIO.ts`, `pdfIO.ts`; kamera: `CameraCapture.tsx`)
→ sayfa izolasyonu (`pageIsolation`) → QR sayfa kimliği (`qrDecoder`; set/sayfa/şablon
doğrulama, yabancı-set reddi) → köşe hizalama işaretleri (`alignmentDetector`,
çoklu eşik, karelik 0.84) → homografi/perspektif düzeltme (`perspectiveCorrection`)
→ kalite kontrol (`imageQuality`: ideal/inceleme/okunamaz; fatal'de CEVAP ÜRETMEZ)
→ bubble ölçümü (`markDetector` + `bubbleRingRefinement`: merkez/çevre/zemin örnekleme,
komşu izolasyonu) → madde durumu.

Madde durumları (`ReadStatus`): `blank | single | multiple | ambiguous | reliable | invalid | unread`.
**Yalnızca `reliable` otomatik cevap sayılır; `single` ve `ambiguous` daima insan onayı ister.**

| OMR yeteneği | Durum |
| --- | --- |
| Boş cevap | [✓] `blank` |
| Çift işaret | [✓] `multiple` → inceleme |
| Belirsiz işaret | [✓] `ambiguous` → inceleme |
| Düşük kalite görüntü | [✓] üç kademeli; fatal'de sayfa reddi |
| Eğik/dönük tarama | [✓] 90/180/270° + 17° + projektif çarpıklık testli |
| Eksik/yabancı/yinelenen sayfa | [✓] QR set kimliği + `pageSequence` reddi |
| Manuel düzeltme | [✓] bkz. §10 |
| Confidence | [✓] sezgisel işaret gücü (olasılık DEĞİL — README'de açık) |
| Gerçek kamera/kağıt kalibrasyonu | [?] YAPILMADI — yalnızca sentetik raster + depo PDF'inin rasterleştirilmesi test edildi |

## 10. MANUEL DÜZELTME / AUDIT İZİ (OMR) — [✓] kayıt içinde + kayda taşınıyor (B3)

- Yer: `ScanResultPreview.tsx` (madde seç → D / Y / Boş).
- Model: `ManualReview { choiceId, reviewedAt }` + **`ManualReviewEvent`**:
  `{ itemId, action: 'review'|'undo', reviewerId, recordedAt, previous, next }` —
  eski değer, yeni değer, kullanıcı, zaman TUTULUYOR (`pageSequence.ts`).
- `reviewHistory` sayfayla birlikte taslağa (`draftStorage`) yazılır ve
  kayıt payload'ına girer.
- [✓] B3 (2026-09-19): `toSavedPage` artık `reviewHistory`'yi derin kopyayla
  `SavedAnswerPage.reviewHistory` alanına taşır; denetim izi sunucuda kalıcıdır.
  Eski kayıtlarda alan yoktur (opsiyonel, geriye uyumlu). Test: tests/savedPage.test.ts.
- [✓] B8 (2026-09-19): ayrıca sunucu taraflı `audit_logs` tablosu + trigger eklendi (bkz. §34).

## 11. MMPI SCORING MOTORU — [✓] merkezi, [~] bazı kaynaklar doğrulanamadı

**Dosyalar ve görevleri (src/scoring/, toplam ~3037 satır):**

| Dosya | Görev |
| --- | --- |
| `mmpiKeys.ts` | MERKEZİ VERİ: `SCORING_KEYS` (L,F,K,Hs…Si D/Y anahtarları; Mf cinsiyetli), `K_CORRECTION` (Hs .5, Pd .4, Pt 1, Sc 1, Ma .2), `K_ADDITION_TABLE` (klasik ekleme tablosu), `TURKISH_NORMS` (Erkek/Kadın M/SD), `SCALE_META`, `T_INTERPRETATION` |
| `mmpiScoring.ts` | Motor: `answersToResponseMap`, `computeRawFromResponses`, `buildProfileFromRaw`, `buildProfileFromAnswers`, `buildProfileFromRawScoresObject`, `analyzeValidity`, profil kodu. **YENİ (uncommitted): `ValidityStatus` = GECERLI/SUPHELI/GECERSIZ, `validityAnalysis.status`** |
| `mmpiSource.ts` | Geçerlik ham/T bant tabloları (?, L, F, K), `VALIDITY_CUTOFFS` (boş≥31, F≥23 geçersiz; F 16–22 şüpheli; F-K>16), klinik ölçek T bantları, FK notu — kaynağı yerel `kaynak.pdf` (künyesiz) → statü C |
| `mmpiSourceCodes.ts` | İki noktalı kod yorumları + olası tanılar (kaynak metnine sadık) |
| `mmpiInterpretation.ts` | Bant eşleme, tek ölçek yükselmeleri, desenler, kod yorum yardımcıları, `tColor`. **YENİ (uncommitted): `validityStatusDisplay()` — henüz hiçbir bileşen KULLANMIYOR** |
| `mmpiConsistency.ts` | TR endeksi (16 çift), Dikkatsizlik endeksi (12 çift), F-K (Gough) |
| `mmpiValidityConfigs.ts` | 15 L/F/K T-konfigürasyonu (V şekli, ters V, tümü-D/Y…) |
| `mmpiDerived.ts` | 11 kişilik bozukluğu ölçeği, MAC/ICAS/SAP, 13 Wiggins (+`WIGGINS_NORMS` **kaynağı D**), O-H, Es, Welsh A/R, Do, Dy; Goldberg/Taulbee/Peterson endeksleri |
| `mmpiCritical.ts` | 39 kritik madde taraması + 16 klinik izlenim |
| `omrAnswers.ts` | OMR maddelerinden cevap dizisi |
| `version.ts` | **YENİ (uncommitted): SCORING_ENGINE_VERSION='2.0.0', NORM_SOURCE_LABEL — HENÜZ HİÇBİR YERDEN IMPORT EDİLMİYOR** |

**Girdi/Çıktı:** 566'lık `ItemAnswer[]` ('D'|'Y'|null|undefined) VEYA `RawScores`
→ `MMPIProfile { scales, validity, clinical, cannotSayScale, validityAnalysis,
profileCode, maxT, minT, itemLevel? }`. `itemLevel` yalnızca cevap dizisi varsa dolar
(ham puan girişinde türetilmiş katman YOK — UI bunu açıkça söyler).

## 12. RAW SCORE — [✓]

- Cevap anahtarları: `SCORING_KEYS` (mmpiKeys.ts), trueItems/falseItems listeleri.
- Mapping: D=1, Y=0, null=-1 (bilinçli boş), undefined=girilmedi; her ikisi boş sayılır
  (`countBlank`). Raw = anahtar yönünde eşleşen cevap sayısı.
- Geçersiz cevap OMR katmanında elenir (yalnızca reliable/manuel onaylı değer gelir).
- Manuel ham puan girişi: `RAW_SCORE_FIELDS` üst sınır kontrollü (L≤15, F≤64, K≤30, …).

## 13. K CORRECTION — [✓]

- Ölçekler/oranlar: Hs +0.5K, Pd +0.4K, Pt +1K, Sc +1K, Ma +0.2K.
- Uygulama: `buildProfileFromRaw` → `kAddition(kRaw, ratio)` tablodan okur
  (`K_ADDITION_TABLE`), T'den ÖNCE eklenir. UI'da "K Eklemesi (K+)" satırı gösterilir.
- [?] `.4K` kolonunda K=3→+2, K=4→+1 monotonik olmayan çift var; basılı klasik tabloyla
  birebir karşılaştırılamadı (kaynak-denetimi.md'de kayıtlı; DEĞİŞTİRİLMEDİ).

## 14. T SCORE — [✓] formül, [~] norm sayıları birebir doğrulanamadı

- Formül: `T = 50 + 10·(X−M)/SD`; **Mf-Kadın ters**: `50 + 10·(M−X)/SD`. Clamp 20–120, 0.1 hassasiyet.
- Norm: `TURKISH_NORMS` — cinsiyete göre M/SD; yaş ayrımı YOK.
- Kaynak: Savaşır (1981) El Kitabı — künye A statüsünde doğrulandı;
  [?] norm SAYILARI kitapla birebir karşılaştırılamadı (kitap erişimi yok).
- '?' ölçeğinin "T"si gerçek norm dönüşümü değil, `min(30 + boş×2, 120)` görselleştirme
  değeridir; ValidityFinding'de `t: null` (doğru). Grafikte '?' ayrı renkte.

## 15. NORMLAR — envanter

| Norm | Dosya | Kaynak | Doğrulama |
| --- | --- | --- | --- |
| Klinik+geçerlik M/SD (E/K) | mmpiKeys.ts TURKISH_NORMS | Savaşır (1981) | Künye A; sayılar [?] |
| Wiggins M/SD (13 çift) | mmpiDerived.ts WIGGINS_NORMS | **KAYNAK YOK** | **[?] D statü — SourcesPage'de dürüstçe bildirildi** |
| Welsh A/R T sabitleri (A: M15/SD8, R: M16/SD5) | mmpiDerived.ts | **KAYNAK YOK** | **[?] D statü** |
| Türetilmiş kesimler (MAC≥28, ICAS≥5, SAP≥16, O-H≥19, Es, Do, Dy, kişilik Hafif/Belirgin) | mmpiDerived.ts | Kısmen (MAC≥22: Ceyhun & Palabıyıkoğlu 1989 B statü); geri kalanı KAYNAKSIZ | [?] D statü |

Ayrıntı: `docs/kaynak-denetimi.md` Tablo 1-2 (A–E statüleri) ve `SourcesPage.tsx`
bölüm 05 "Doğrulanamayan yorum/kesim bileşenleri — dürüstlük kaydı".

## 16. VALIDITY SİSTEMİ — [✓] hesap + üç-durum UI bağlantısı TAMAM

Göstergeler: `?`, L, F, K (ham + T bantları, ValidityFinding), F-K (Gough), TR endeksi,
Dikkatsizlik endeksi, 15 L/F/K konfigürasyonu.

Kurallar (`VALIDITY_CUTOFFS`, mmpiSource.ts — kaynak: yerel rehber, C statü):
- Boş ≥ 31 → GEÇERSİZ
- F ham ≥ 23 → GEÇERSİZ
- F ham 16–22 → "profil geçersiz olabilir" (ŞÜPHELİ)
- F-K > 16 → dikkat uyarısı
- L ≥ 8, K ≥ 21 / ≥16 / ≤9 / ≤4 → bant uyarıları

**Sınıflandırma durumu: [✓] TAMAMLANDI (bu oturum, B1)**
- `validityAnalysis.status: 'GECERLI'|'SUPHELI'|'GECERSIZ'` scoring'de
  (mmpiScoring.ts) + `validityStatusDisplay()` helper (mmpiInterpretation.ts).
- UI bağlantıları: `MMPIResultsPanel` rozeti, `RecordDetailPage` rozeti,
  `MMPIPrintReport` "Geçerlik Durumu" (üç renk: #0c8a5c/#96660a/#c2372c),
  `MMPIValidityTab` banner'ı ("PROFİL ŞÜPHELİ — DİKKATLİ DEĞERLENDİRİLMELİ",
  F ham 16–22 bandı metniyle) + "Genel Değerlendirme" paneli — hepsi üç-durumlu.
- `.mmpi-validity-pill.is-suspect` CSS sınıfı workspace.css'e eklendi
  (--warning-tint/--warning-border, #7c5407).
- Testler: tests/mmpiInterpretation.test.ts — F=16/18/22→SUPHELI, F=23→GECERSIZ,
  boş≥31→GECERSIZ, boş=30 + temiz→GECERLI, isValid tutarlılığı.
- [~] NOT: MMPIValidityTab hâlâ yerel sabit kopyaları taşıyor
  (CANNOT_SAY_CUTOFF=31, F_CUTOFF=23, F_SUSPECT=16) — VALIDITY_CUTOFFS ile
  tekilleştirme sonraki oturuma bırakıldı.

Geçersiz profilde: `interpretation` metni yeniden uygulama/klinik doğrulama önerir;
klinik sekmeler yine erişilebilir (uzman aracı olduğu için gizlenmez) ama durum şeridi
en üstte kırmızı uyarı verir. Tanısal kesin ifade üretilmez; kod yorumlarındaki
"Olası Tanı" satırları kaynak metnin aktarımıdır ve "tanı koymaz, klinik karar uzmanındır"
dipnotlarıyla çerçevelenir.

## 17. SCALE LİSTESİ (gerçekten hesaplananlar)

| Grup | Ölçekler | Raw | T | K corr | Norm | UI | Yorum |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Geçerlik | ?, L, F, K | ✓ | L/F/K ✓ ('?' yok) | — | Savaşır | Geçerlik sekmesi + grafik | bant metinleri (C) |
| Klinik | Hs D Hy Pd Mf Pa Pt Sc Ma Si | ✓ | ✓ | Hs Pd Pt Sc Ma | Savaşır | Klinik sekmesi + grafik + baskı | T bantları (C), tek yükselme, 2'li kod |
| Türetilmiş | 11 PD ölçeği, MAC, ICAS, SAP, O-H, Es, A, R, Do, Dy | ✓ | yalnız A/R + Wiggins | — | kısmen kaynaksız | Türetilmiş sekmesi | kısa özetler |
| İçerik | 13 Wiggins | ✓ | ✓ | — | **kaynaksız M/SD [?]** | Türetilmiş sekmesi | eşik notları |
| Endeks | Goldberg, Taulbee, Peterson, F-K, TR, Dikkatsizlik | ✓ | — | — | makale (A/B) | Geçerlik+Türetilmiş | endeks kartları |
| Kritik | 39 madde + izlenimler | ✓ | — | — | liste kimliği [?] D | Kritik sekmesi + baskı | madde metni YOK (telif) |

## 18. PROFİL GRAFİĞİ — [✓]

`MMPIScoreChart.tsx`: SVG, sıra `? L F K | Hs D Hy Pd Mf Pa Pt Sc Ma Si`,
T ekseni 24–122, ızgara 30–120, **T=70 klinik sınır** ve **T=50 ortalama** referans
çizgileri, geçerlik/klinik ayracı, T≥70 noktaları kırmızı, lejant var, `aria-label` var.
Baskı raporunda aynı bileşen kullanılır. [ ] Hover tooltip yok (etiket+renk+lejant var;
baskıda tooltip anlamsız — düşük öncelik).

## 19. YORUM MOTORU — [✓] ayrık, [~] kaynak statüleri karışık

- Yorumlar scoring hesabından AYRI dosyalarda: `mmpiSource.ts` (bantlar),
  `mmpiSourceCodes.ts` (2'li kodlar), `mmpiInterpretation.ts` (eşleme),
  `mmpiCritical.ts` (izlenimler), `mmpiDerived.ts` (türetilmiş özetler).
- Tetikleme: T bandı / ham bandı / kod eşleşmesi / endeks eşiği — hepsi veri tablosu üzerinden.
- Dil: "düşündürebilir/ilişkili olabilir/uzmana aittir" çerçevesi; ekran ve baskıda
  "kesme puanları tanı koymaz" dipnotları mevcut.
- Kaynak: geçerlik/klinik/kod metinleri yerel `kaynak.pdf` rehberinden (künyesiz, C statü);
  endeksler hakemli makalelerle (A/B). Hepsi SourcesPage'de statüleriyle listeli.
- [!] `mmpiCritical.ts` "Reis (1966)" yazımı — gerçek soyad "Ries" (kaynak-denetimi.md'de
  kayıtlı, kodda DÜZELTİLMEDİ; yalnızca kozmetik/atıf düzeltmesi).

## 20. BİLİMSEL KAYNAKLAR — [✓] denetlendi

- Tam denetim: `docs/kaynak-denetimi.md` (18 Eylül 2026) — bileşen→kaynak eşleştirme,
  A–E statüleri, "audit sırasında değişmeyen bulgular" bölümü.
- Kullanıcıya açık liste: `SourcesPage.tsx` (#/kaynaklar) — yalnızca kodda gerçekten
  kullanılan kaynaklar, doğrulanamayanlar D/E statüleriyle açıkça işaretli.
- **Kaynak uydurulmadı.** Doğrulanamayan eşikler değiştirilmedi, yalnızca raporlandı.

### Kaynak eksikleri (özet)
```text
[?] Wiggins Türk M/SD — kaynak yok (D)
[?] Welsh A/R T sabitleri — kaynak yok (D)
[?] Türetilmiş ölçek kesimleri (MAC≥28, ICAS≥5, SAP≥16, O-H≥19, Es/Do/Dy, PD Hafif/Belirgin) — kaynak yok (D)
[?] Kritik madde listesinin kimliği (39) — künye yok (D)
[?] Geçerlik/klinik bant metinleri — belge birebir ama künyesiz (C)
[?] Savaşır (1981) norm SAYILARI — kitapla birebir karşılaştırılamadı
[?] Profil kodunda Mf/Si hariç tutma — uygulama kararı, künyesiz (D)
[?] K ekleme tablosu .4K kolonundaki monotonik olmayan değerler (E)
[?] Dy 56 madde vs klasik 57 (E)
```

## 21. DANIŞAN / ASSESSMENT SİSTEMİ — [~]

- Model: danışan ayrı entity DEĞİL; her `mmpi_records` satırı = 1 değerlendirme + gömülü
  danışan bilgisi. Aynı danışana yeni değerlendirme = yeni satır (üzerine yazma imkânsız:
  yeni idempotency key). Eski sonuç kaybolmaz. [✓]
- Oluşturma: İşlem akışı (intake doğrulamalı: yaş≥16, eğitim≥ortaokul, tarih ileri olamaz,
  süre makullük bandı, boş>30 kaydı engeller + koşul onay kutusu). [✓]
- Arama: Kayıtlar'da ad/soyad/ID/meslek; Admin'de + psikolog adı. [✓]
- [ ] Tarih/durum filtresi YOK (yalnızca metin arama; kayıtlar tarih sıralı).
- [ ] Durum makinesi (TASLAK/TAMAMLANDI/ARŞİV) YOK — kayıt tek atımlık yazılır; taslak
  aşaması localStorage'dadır (30 gün TTL + çevrimdışı outbox, idempotent tekrar gönderim). 
- [ ] Kayıt düzenleme YOK (bilinçli: veri bütünlüğü; silme var).
- [ ] Arşivleme YOK (yalnızca silme).

## 22. VERİ VERSİYONLAMA — [✓] scoringVersion TAMAMLANDI (B2)

- [✓] `CaseMeta.version: 1`, `QuickEntryPayload.version: 1`, `RawScoresPayload.version: 1` payload'da var.
- [✓] Form şablonu sürümlü (`MMPI566-DY-3C48-V2` / 2.0.0 / SHA-256 yerleşim özeti).
- [✓] `src/scoring/version.ts` (SCORING_ENGINE_VERSION='2.0.0', NORM_SOURCE_LABEL):
  `buildCaseMeta` artık `scoringVersion` + `normSource` yazıyor (CaseMeta'da opsiyonel
  additive alanlar — eski kayıtlar kırılmaz), `parseRecordPayload` toleranslı okuyor
  (legacy payload'da `undefined`), `RecordDetailPage` "Puanlama motoru / v…" satırı
  gösteriyor (yalnızca alan mevcutsa). Testler: tests/caseWorkspace.test.ts.
- [ ] Hesaplama zaman damgası kayıtta yok (yalnızca created_at).
- [ ] Tekrar hesaplama versiyonlama (Calculation #1/#2) YOK — profil her açılışta
  deterministik yeniden hesaplandığı için "eski sonuç kaybı" riski düşük; ancak motor
  değişirse eski görünüm üretilamez. scoringVersion alanı bu yüzden önemli.

## 23. RAPORLAMA / PDF — [✓]

- Yöntem: `RecordDetailPage` → "Yazdır / PDF" → `window.print()` → yalnızca
  `MMPIPrintReport` basılır (`print-only`/`screen-only` + workspace.css @media print).
- İçerik sırası: başlık/kimlik (danışan, tarihler, uzman, yöntem, geçerlik durumu,
  profil kodu) → profil grafiği → klinik tablo+yorumlar → geçerlik → kod →
  türetilmiş → kritik bulgular → **"Raporu Hazırlayan / Onaylayan Uzman" + İmza/Kaşe alanı**
  → yöntem dipnotu (tanı sınırı açık).
- Dosya adı: `MMPI_Klinik_Raporu_<Danisan>_<gg-AA-yyyy>` (document.title, TR karakter
  translitere). Türkçe karakterler ekranda/baskıda sistem fontuyla sorunsuz.
- A4 `@page` kuralı `print.css`'te (margin 0 — form için; rapor kendi padding'ini taşır).
- [ ] Sayfa numarası YOK (CSS counter eklenmedi).
- [ ] Uygulama içi düzenlenebilir "uzman değerlendirme/notu" alanı YOK — rapora yalnızca
  intake'teki "Kısa öykü / klinik bağlam" ve başvuru nedeni taşınır; sonuç ekranında
  sonradan not ekleme/düzenleme mekanizması YOK. (Final prompt bunu istiyor; yapılmadı.)
- Form PDF'i (optik form) ayrı ve tam doğrulanmış: `scripts/generate-pdf.ts` +
  `tests/pdfForm.test.ts` (geri okuma) + `tests/pdfScanPipeline.test.ts` (raster→OMR).

## 24. UZMAN NOTLARI — [ ] EKSİK

- Kayıt SONRASI not ekleme/düzenleme yok; `clinicalContext` yalnızca kayıt ÖNCESİ girilir.
- DB'de `notes` tablosu/kolonu yok. Eklenmek istenirse: `mmpi_records`'a `expert_notes
  jsonb/text` + sahibi-güncelleyebilir RLS update politikası (zaten var) + RecordDetailPage
  düzenleme alanı + baskıda "Uzman Değerlendirmesi" bölümü.

## 25. AUDIT LOG — [ ] MEVCUT DEĞİL

- Merkezi audit_logs tablosu yok. Login/scoring/report olayları loglanmıyor.
- Kısmi iz: OMR manuel düzeltme olayları oturum içinde tutulur (bkz. §10) ama sunucuya
  yalnızca son hali gider. Supabase Auth kendi oturum loglarını tutar (platform düzeyi).

## 26. STORAGE — [-] KULLANILMIYOR

Bucket yok, dosya upload yok, signed URL ihtiyacı yok. Tarama görüntüleri istemcide kalır,
kayda görüntü DEĞİL okunmuş madde verisi gider. (Prompt'un dosya güvenliği maddesi bu
mimaride konu dışı.)

## 27. API YÜZEYİ

| Endpoint | Method | Amaç | Auth | Durum |
| --- | --- | --- | --- | --- |
| Supabase PostgREST `profiles` | select/update/delete | profil/rol | JWT + RLS | [✓] |
| Supabase PostgREST `mmpi_records` | select/insert(upsert)/update/delete | kayıtlar | JWT + RLS | [✓] |
| Edge Function `admin-users` | POST (create / set_active / delete) | psikolog yönetimi | Bearer + sunucuda admin-rol kontrolü + ALLOWED_ORIGINS CORS | [✓] kod okuması; [?] canlı test yok |

Başka endpoint YOK.

## 28. ENV / SECRET

```text
Frontend (.env, gitignore'lu):
  VITE_SUPABASE_URL       = yapılandırılmalı (yalnızca isim; değer repoda YOK)
  VITE_SUPABASE_ANON_KEY  = yapılandırılmalı (publishable/anon; service_role ASLA)
Edge Function (Supabase secrets):
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (platform sağlar), ALLOWED_ORIGINS (opsiyonel CORS listesi)
```
[✓] Repoda hiçbir secret değeri yok (taramayla doğrulandı).

## 29. FRONTEND ROTALARI (hash tabanlı; klasik path routing YOK)

| Rota | Amaç | Yetki |
| --- | --- | --- |
| `#` (boş) | AuthGate → login veya çalışma alanı (İşlem/Form/Kayıtlar/Yönetim sekmeleri) | oturum |
| `#/test/<uuid>` | Kayıt detayı + rapor | oturum + RLS |
| `#/onizleme` | Tasarım önizleme (örnek veri) | YALNIZCA Supabase yapılandırılmamışken |
| `#/sss`, `#/gizlilik`, `#/kullanim`, `#/kaynaklar` | bilgi sayfaları | herkese açık |

Final prompt'un `/patients`, `/assessments`… şeması birebir yok; işlevsel karşılıkları
sekme/rota olarak mevcut (prompt "mevcut routing farklıysa bozma" diyor). [-]

## 30. UI/UX DURUMU

- [✓] Loading state'ler: kayıt listesi, kayıt detayı, oturum doğrulama, silme (busy),
  kaydetme ("Kaydediliyor…" + disabled → çift tıklama korumalı), Admin işlemleri.
- [✓] Empty state'ler: kayıt yok / arama sonuçsuz / psikolog yok.
- [✓] Hata mesajları Türkçe ve kullanıcı-dostu; teknik ayrıntı `cause` zincirinde kalır.
  Konsolda gereksiz `console.log` YOK (yalnızca scripts/ araçlarında).
- [✓] Erişilebilirlik: sekmelerde roving tabindex + ok tuşları, aria-selected/controls,
  role=tablist/tab/tabpanel, form label'ları, aria-label'lı grafik, ConfirmDialog odak yönetimi.
  [?] Ekran okuyucuyla uçtan uca test edilmedi; kontrast ölçümü yapılmadı.
- [✓] Responsive: tablolar `table-responsive` sarmalayıcıda; workspace.css/screen.css
  breakpoint'leri var. [?] Gerçek cihaz/mobil testi bu oturumda yapılmadı.
- [✓] Mock/demo veri yalnızca `#/onizleme`'de ve yalnızca yapılandırılmamış kurulumda;
  "Örnek Danışan" etiketli, gerçek kayda yazamaz.
- [✓] Geçerlik rozeti artık üç-durumlu ("Geçerli Profil" / "Şüpheli Profil" /
  "Geçersiz Profil") — B1 bu oturumda tamamlandı (bkz. §16).

## 31. PERFORMANCE

- 566 maddelik scoring anlıktır (saf dizi işlemleri; testlerde ms düzeyi).
- `useMemo` kullanımı RecordDetailPage/CaseWorkspace'te var; liste sorguları limitli
  (100/200) ve indeksli. N+1 yok (tek join'li select).
- [!] Tek dosya build büyük (optik-form.html ~4.3 MB: React + pdf.js + gömülü form PDF'i).
  Bilinçli takas (offline tek dosya teslimat). Vite dev'de sorun değil.

## 32. GÜVENLİK DENETİM TABLOSU

```text
[✓] RLS açık ve politikalar doğru yazılmış (kod okuması)      [?] canlı cross-user testi yok
[✓] IDOR: uuid ID + RLS                                        [?] canlı test yok
[✓] Public data exposure yok (anon revoke)
[-] Storage exposure (storage yok)
[✓] Secret exposure yok (tarama yapıldı)
[~] Client-side trust: skorlar istemcide; sunucu yalnızca ham veri saklar (tasarım kararı — bkz. §4 not)
[✓] API authorization: Edge Function sunucu tarafı rol kontrolü
[-] File upload (yok)
[✓] XSS: innerHTML yok; CSP hash-pinned
[-] CSRF (bearer token)
[✓] Session handling: sessionStorage + periyodik re-validasyon + pasif hesap düşürme
[✓] Privilege escalation: trigger en düşük yetkiyle açar; rol yükseltme yalnızca SQL operatörü
[!] raw_omr_answers sunucuda şemasız (yalnızca array check) — orta risk
[!] Admin'in test cevabı görme yetkisi tasarım gereği tam (prompt minimizasyon istiyor) — karar bekliyor
```

## 33. TEST DURUMU (bu oturumda GERÇEKTEN çalıştırıldı — 2026-09-19)

```text
[✓] npm run typecheck  → temiz (0 hata)
[✓] npm test           → 192/192 pass, 0 fail (26 dosya, ~85 sn) — B1–B10 dahil son haliyle
[✓] npm run build      → başarılı; optik-form.html yeniden üretildi
[✓] npm run verify:pdf → koşuldu (2026-09-19): 4 A4 sayfa, 566 madde koordinatı doğrulandı
[ ] Canlı Supabase login/RLS/Edge Function testi → ortam yok, YAPILMADI
[ ] Gerçek kağıt/kamera OMR testi → YAPILMADI (yalnızca sentetik + depo PDF raster)
[ ] Tarayıcıda manuel print/PDF çıktısı görsel kontrolü → YAPILMADI (SSR render testleri var)
```

Test dosyaları kapsamı: form geometrisi, sayfa kimliği, homografi, OMR (boş/silik/çift/
düşük ışık/gölge/bulanık/rotasyonlar/perspektif), güvenlik red yolları, sonuç doğrulama,
manuel inceleme + undo + reviewer, taslak/outbox, PDF geri-okuma, PDF→raster→OMR,
pdf.js worker sertleştirme, build CSP hash, scoring (tüm-D, tüm-Y, boşlar, karışık,
K düzeltme, Mf ters), geçerlik bantları/eşikleri, kod kanonikleştirme, türetilmiş
ölçekler, kritik maddeler, sonuç paneli SSR ("kaynak.pdf" adı asla ekranda görünmez).

## 34. BUG / RİSK LİSTESİ

| ID | Önem | Başlık | Dosya | Durum |
| --- | --- | --- | --- | --- |
| B1 | P1 | Üç-durum geçerlik UI'ya bağlanmadı (status alanı sahipsiz) | results/*.tsx, workspace.css | [✓] TAMAMLANDI (2026-09-19, testli) |
| B2 | P1 | scoringVersion kayda yazılmıyor (version.ts sahipsiz) | caseTypes.ts, version.ts | [✓] TAMAMLANDI (2026-09-19, testli) |
| B3 | P2 | reviewHistory (OMR düzeltme denetim izi) kayda gitmiyor | supabaseRecords.ts toSavedPage | [✓] TAMAMLANDI (2026-09-19; derin kopya + test) |
| B4 | P2 | Uzman notu (kayıt sonrası) ve rapora aktarımı yok | RecordDetailPage, MMPIPrintReport, migration 20260919000000 | [✓] TAMAMLANDI (expert_notes ≤4000, RLS sahibi yazar, baskıda koşullu bölüm, test) |
| B5 | P2 | Tek dosya build CSP'sinde connect-src yok → Supabase'li dağıtımda bağlantı engellenebilir | scripts/build.mjs | [✓] TAMAMLANDI (VITE_SUPABASE_URL varsa origin+wss allowlist, yoksa tam offline; test) — canlı dağıtım doğrulaması hâlâ [?] |
| B6 | P3 | Rapor sayfa numarası yok | workspace.css @media print | [✓] TAMAMLANDI (isimli @page mmpi-report + @bottom-center counter; desteklemeyen tarayıcıda zarifçe yok sayılır) |
| B7 | P3 | "Reis (1966)" → "Ries" yazım/atıf düzeltmesi | mmpiCritical.ts, SourcesPage.tsx | [✓] TAMAMLANDI (kod atfı Ries; ikincil-yazım notu korundu) |
| B8 | P3 | Audit log tablosu yok | supabase/migrations/20260919000000 | [✓] TAMAMLANDI (audit_logs + security-definer trigger; yalnız Admin okur, istemci yazamaz) — canlı test [?] |
| B9 | P3 | Kayıt listesinde tarih filtresi yok | MyRecordsPanel/AdminPanel | [✓] TAMAMLANDI (uygulama tarihi aralık filtresi + temizle) |
| B10 | P3 | Admin'in ham cevap erişimi minimize edilmedi | RLS / ürün kararı | [✓] KARAR VERİLDİ: Admin erişimi denetim/silme görevi için bilinçli ürün; dengeleme B8 audit_logs ile sağlandı (her erişimli yazma izlenir). Ham cevap SELECT kısıtlaması istenirse ileride kolon-düzeyi görünüm gerekir — şu an kapsam dışı. |

Bilinen ÇÖKME/BOZULMA yok; mevcut akış uçtan uca çalışıyor (test kanıtlı).

## 35. YAPILDIĞI GÖRÜLEN AMA TAM DOĞRULANMAYANLAR

```text
[?] RLS politikaları doğru yazılmış ancak canlı cross-user erişim testi yapılmadı.
[?] Edge Function kodu doğru görünüyor ancak deploy edilip canlı çağrılmadı.
[?] Savaşır (1981) norm sayıları kod ↔ kitap birebir karşılaştırılamadı.
[?] Ölçek anahtarları klasik set ile uyumlu ancak telifli orijinalle madde madde kontrol edilmedi.
[?] OMR gerçek kağıt/kalem/fotokopi üzerinde kalibre edilmedi (yalnızca sentetik).
[?] Tek dosya build'in Supabase'e bağlanabilirliği canlıda doğrulanmadı (CSP connect-src kod tarafı B5 ile eklendi; canlı dağıtım testi bekliyor).
```

## 36. ARAŞTIRILDI / UYGULANMADI

```text
- Wiggins Türk M/SD kaynağı arandı (Wiggins, Goldberg & Apelbaum 1971 dahil) → bulunamadı → değerler değiştirilmedi, D statüyle raporlandı.
- MAC ≥28, ICAS ≥5, SAP ≥16 vb. kesimler için birincil kaynak arandı → bulunamadı → D.
- Hathaway & McKinley manual 1942/1943 tarihi araştırıldı → 1942 benimsendi (yayınevi kaydı).
- Ceyhun & Palabıyıkoğlu (1989) MAC Türkiye kesimi 22 → ikincil kaynakçadan doğrulandı (B).
- Üç-durumlu geçerlik: scoring katmanı + UI bağlantısı tamamlandı (B1, 2026-09-19).
```

## 37. YANLIŞ / RİSKLİ BULUNANLAR

```text
[!] K_ADDITION_TABLE .4K kolonunda monotonik olmayan çift (K=3→+2, K=4→+1) — klasik tabloyla karşılaştırılamadı; DOKUNULMADI.
[!] Dy ölçeği 56 madde (klasik 57) — fark açıklanamadı; DOKUNULMADI.
[!] '?' ölçeğinin grafik "T"si gerçek T değil (görsel formül) — findings'te doğru şekilde t:null; grafikte ayrı renk/lejantla işaretli. Yanıltma riski düşük ama bilinmeli.
[!] Kod yorumlarındaki "Olası Tanı" satırları kaynak aktarımı — çerçeve dipnotları mevcut; yine de ürün sahibiyle teyit edilmeli.
```

---

## 38. NEXT AI — BURADAN DEVAM ET

1. **Bu dosyayı tamamen oku.** Sonra `docs/kaynak-denetimi.md` ve `README.md` oku.
2. B1–B10 backlog'unun TAMAMI kapatıldı ve branch'e commit edildi (bkz. §34, §42–43).
   Working tree temiz olmalı; `git status` ile doğrula.
3. Her değişiklikten sonra: `npm run typecheck && npm test && npm run build`
   (build şart — `optik-form.html` drift'ini CI reddeder; build çıktısını commit'e dahil et).
4. **Bilimsel veri DEĞİŞTİRME:** normlar, anahtarlar, eşikler, K tablosu, yorum metinleri
   yalnızca doğrulanmış kaynakla değiştirilebilir. Kaynak yoksa D/E statüsüyle raporla.
5. Commit/push YALNIZCA `arena/01a0b91f-repo123` branch'ine.
6. YENİ migration `20260919000000_expert_notes_and_audit.sql` henüz canlı projeye
   push edilmedi (`supabase db push` operatör işidir). İstemci kodu migration'sız
   ortamda da kırılmaz (expert_notes toleranslı okunur) ama not kaydetme, migration
   uygulanana kadar sunucu hatası döndürür.

### Devam etme sırası (kalan işler — hepsi ortam/kaynak işi, kod işi DEĞİL)
```text
1. Canlı Supabase: `supabase db push` (yeni migration) + RLS cross-user testi,
   Edge Function testi, login/expired session, audit_logs doğrulaması
2. Canlı dağıtımda tek dosya build'in Supabase bağlantısı (B5 CSP) doğrulaması
3. Gerçek kağıt/kamera OMR pilotu ve kalibrasyon
4. Kaynak doğrulama: Savaşır norm sayıları, Wiggins M/SD, K tablosu .4K çifti,
   türetilmiş kesimler (yalnızca doğrulanmış kaynakla; yoksa D/E statüde bırak)
5. Ürün kararları: password reset akışı, rapor sayfa numarasının tarayıcı
   desteği genişletmesi (istenirse JS tabanlı alternatif)
```

## 39. FINAL TODO

- [x] B1: `status`/`validityStatusDisplay` UI bağlantısı + `.is-suspect` CSS + testler (2026-09-19)
- [x] B2: `scoringVersion` kayıt meta'sına + görünüme (2026-09-19)
- [x] B3: `reviewHistory` kayda taşı (toSavedPage derin kopya + tests/savedPage.test.ts) (2026-09-19)
- [x] MMPIValidityTab yerel eşik sabitleri → VALIDITY_CUTOFFS tekilleştirme (2026-09-19)
- [x] B4: Uzman notu — expert_notes kolonu + RecordDetailPage editörü + MMPIPrintReport bölümü + testler (2026-09-19)
- [x] B5: CSP `connect-src` — build.mjs koşullu allowlist + build testi (2026-09-19); canlı dağıtım doğrulaması hâlâ açık
- [x] B6: Rapor sayfa numarası (isimli @page + @bottom-center) (2026-09-19)
- [x] B7: "Ries (1966)" atıf düzeltmesi (mmpiCritical.ts + SourcesPage.tsx) (2026-09-19)
- [x] B8: audit_logs tablosu + security-definer trigger (migration 20260919000000) (2026-09-19)
- [x] B9: Kayıt listelerinde tarih aralığı filtresi (MyRecordsPanel + AdminPanel) (2026-09-19)
- [x] B10: Admin erişim kararı belgelendi; denetim izi (B8) ile dengelendi (2026-09-19)
- [x] verify:pdf lokalde koşuldu — 4 sayfa, 566 madde koordinatı doğrulandı (2026-09-19)
- [x] CaseWorkspace bayat metin düzeltmesi ("puanlama motoru bağlı değildir" → gerçek durum) (2026-09-19)
- [ ] Canlı Supabase: `supabase db push` + RLS cross-user testi, Edge Function testi, login/expired session
- [ ] Gerçek kağıt/kamera OMR doğrulaması
- [ ] Kaynak doğrulama işleri (Savaşır normları, Wiggins M/SD vb. — bkz. §36)
- [ ] Ürün kararı: password reset akışı

### Tamamlananlar (bu dokümana kadar)
- [x] Tam repo denetimi (mimari, auth, RLS, OMR, scoring, validity, rapor, UI, testler)
- [x] typecheck + 192 test + build + verify:pdf doğrulaması (2026-09-19)
- [x] Secret/XSS/console taramaları
- [x] B1–B10 backlog'unun tamamı (ayrıntı: §34 tablo)
- [x] Bu devir dokümanı

## 40. PRODUCTION READINESS

| Alan | Durum | Kritik problem |
| --- | --- | --- |
| Auth | [✓] kod / [?] canlı | canlı test yok; password reset yok |
| Authorization | [✓] | admin veri minimizasyonu ürün kararı |
| Database | [✓] | raw_omr_answers şemasız (orta) |
| RLS | [✓] kod / [?] canlı | cross-user canlı testi yok |
| OMR | [✓] sentetik / [?] gerçek kağıt | kalibrasyon yok |
| Scoring | [✓] | K tablosu .4K anomalisi kayıtlı |
| Validity | [✓] hesap + üç-durum UI + eşik tekil kaynak | — |
| Norms | [~] | Savaşır sayıları birebir doğrulanamadı; Wiggins M/SD kaynaksız |
| Interpretation | [~] | ana metin kaynağı künyesiz (C) |
| Reports | [✓] | uzman notu + sayfa numarası eklendi |
| Security | [✓] | audit_logs eklendi; CSP connect-src koşullu allowlist — canlı doğrulama [?] |
| Performance | [✓] | tek dosya build büyük (bilinçli) |
| Responsive | [~] | gerçek cihaz testi yok |
| Testing | [✓] otomatik / [~] canlı | canlı ortam testleri eksik |
| Deployment | [✓] statik + CI | Supabase'li dağıtımda canlı CSP doğrulaması açık |

## 41. PROJECT STATUS

```text
Overall:
KOD-DÜZEYİ BACKLOG SIFIR — B1–B10 kalemlerinin tamamı kapatıldı (typecheck temiz,
192/192 test, build + verify:pdf başarılı). Kalan eksikler yalnızca ortam ve
kaynak doğrulama işleridir:
 1) Canlı Supabase testi (db push + RLS cross-user + Edge Function + oturum +
    audit_logs + CSP connect-src) hiç yapılmadı — kod hazır, ortam yok.
 2) Gerçek kağıt OMR kalibrasyonu yok (yalnızca sentetik + PDF raster).
 3) Bazı bilimsel eşiklerin kaynağı yok — bilinçli olarak D/E statüsüyle
    raporlanıyor; sayı DEĞİŞTİRİLMEDİ, UYDURULMADI.
"Production hazır" beyanı 1–2 kapanmadan YAZILAMAZ; kod tarafında bilinen
açık iş kalmamıştır.
```

## 42. CHANGELOG

| Tarih | Değişiklik | Dosyalar | Neden | Sonuç |
| --- | --- | --- | --- | --- |
| ≤2026-09-18 | 24 PR'lık geliştirme (form, OMR, auth/RLS, işlem akışı, sonuç panelleri, yorum katmanı, kaynak denetimi, bilgi sayfaları) | tüm repo | — | tek merge commit `fea1f19` (squash zinciri; ayrıntı: `gh pr list --state merged`) |
| 2026-09-19 | Final denetim; tam repo audit; typecheck/test/build koşuldu | — | final sürüm talebi | 190/190 pass |
| 2026-09-19 | B1: `ValidityStatus` + `validityAnalysis.status` + `validityStatusDisplay()` + üç-durum UI (rozet/banner/baskı) + `.is-suspect` CSS | mmpiScoring.ts, mmpiInterpretation.ts, MMPIResultsPanel.tsx, MMPIValidityTab.tsx, RecordDetailPage.tsx, MMPIPrintReport.tsx, workspace.css | üç-durum sınıflandırma (prompt §8) | COMMIT edildi; testli (F 16/18/22→ŞÜPHELİ, F≥23→GEÇERSİZ, boş≥31→GEÇERSİZ) |
| 2026-09-19 | B2: `src/scoring/version.ts` + `scoringVersion`/`normSource` meta alanları + kayıt detayında "Puanlama motoru" satırı | version.ts, caseTypes.ts, RecordDetailPage.tsx | veri bütünlüğü (prompt §41) | COMMIT edildi; legacy-toleranslı; testli |
| 2026-09-19 | Test güncellemeleri: üç-durum status testleri + scoringVersion round-trip + render regex'leri üç etikete genişletildi | tests/mmpiInterpretation.test.ts, tests/caseWorkspace.test.ts | B1/B2 kapsama | 190/190 pass |
| 2026-09-19 | build yan ürünü yeniden üretildi | optik-form.html | kaynak değişti → CI drift kontrolü | COMMIT edildi |
| 2026-09-19 | Bu devir dokümanı (oluşturuldu + B1/B2 sonrası güncellendi) | MMPI_PROJECT_STATUS.md | token/devir güvenliği | COMMIT edildi |
| 2026-09-19 | B3: reviewHistory → SavedAnswerPage (derin kopya) + test | supabaseRecords.ts, tests/savedPage.test.ts | denetim izi kalıcılığı | 2. commit; testli |
| 2026-09-19 | B4: expert_notes/notes_updated_at kolonu + updateExpertNotes + RecordDetailPage not editörü + MMPIPrintReport "Uzman Değerlendirme Notu" bölümü + CSS | migration 20260919000000, supabaseRecords.ts, RecordDetailPage.tsx, MMPIPrintReport.tsx, workspace.css | uzman iş akışı + rapora aktarım | 2. commit; testli (dolu not basılır, boş not basılmaz) |
| 2026-09-19 | B5: build CSP'ye koşullu connect-src (Supabase origin + wss); yapılandırılmamışsa tam offline | scripts/build.mjs, tests/build.test.ts | Supabase'li dağıtımda bağlantı | 2. commit; testli |
| 2026-09-19 | B6: rapor sayfa numarası (isimli @page mmpi-report + @bottom-center counter) | workspace.css | rapor bütünlüğü | 2. commit; tarayıcı desteği sınırlıysa zarifçe yok sayılır |
| 2026-09-19 | B7: "Reis 1966" → "Ries 1966" atıf düzeltmesi (ikincil-yazım notu korundu) | mmpiCritical.ts, SourcesPage.tsx | kaynak doğruluğu | 2. commit |
| 2026-09-19 | B8: audit_logs tablosu + log_mmpi_record_change security-definer trigger + yalnız-Admin SELECT RLS | migration 20260919000000, supabase/README.md | denetim izi (sunucu taraflı, istemci atlayamaz) | 2. commit; canlı test [?] |
| 2026-09-19 | B9: kayıt listelerinde uygulama tarihi aralık filtresi + temizle düğmesi | MyRecordsPanel.tsx, AdminPanel.tsx, screen.css | uzman iş akışı | 2. commit |
| 2026-09-19 | B10 kararı: Admin kayıt erişimi bilinçli ürün; audit_logs ile dengelendi; gerekçe kodda ve bu dokümanda | supabaseRecords.ts (yorum), bu doküman §34 | ürün kararının belgelenmesi | 2. commit |
| 2026-09-19 | MMPIValidityTab eşikleri VALIDITY_CUTOFFS'tan (yerel kopya kaldırıldı) | MMPIValidityTab.tsx | tek doğruluk kaynağı | 2. commit |
| 2026-09-19 | supabaseClient: import.meta.env güvenli erişim (Node test ortamı toleransı) | supabaseClient.ts | test edilebilirlik | 2. commit |
| 2026-09-19 | CaseWorkspace bayat metin düzeltmesi ("klinik puanlama motoru bağlı değildir" → skorlama aynı ekranda) | CaseWorkspace.tsx | doğruluk (metin gerçek durumu yansıtmıyordu) | 2. commit |
| 2026-09-19 | verify:pdf lokalde koşuldu | — | FINAL TODO maddesi | 4 sayfa/566 madde doğrulandı |
| 2026-09-19 | 3. tur: '?' grafik netleştirme (lejant + SVG title "T skoru değildir"), rapor footer'ına scoringVersion, final doğrulama raporu (§44) | MMPIScoreChart.tsx, MMPIPrintReport.tsx, RecordDetailPage.tsx, bu doküman | Faz 5/11/19 kapanışı | 3. commit; 192/192 test |
| 2026-09-19 | 4. tur: alt bilgi düzen cilası — yasal şerit tek sarma akışından iki hizalı kolona geçti (solda telif + sorumluluk, sağda kredi + iletişim; · ayraçları kalktı), alt bilgi ölçüsü bulunduğu kabuğun içerik genişliğini izliyor (uygulama 1440, bilgi sayfaları 1080); 1440 px'te 150 → 134 px, SSS/Kaynakça'da içerikle hizalı ve 169 px | src/styles/site.css, optik-form.html | UX: alt bilgi sayfayı fazla kaplıyor ve dağınık sarıyordu | 4. commit; 226/226 test, typecheck temiz |

## 43. GİT DURUMU (2026-09-19)

```text
branch:         arena/01a0b91f-repo123  (oturum bu branch'e kilitli; başka branch'e geçme)
base commit:    fea1f19 (main) — "Merge pull request #24 ..."
commit 1:       1272e15 — B1 + B2 + testler + optik-form.html + bu doküman (2026-09-19)
commit 2:       B3–B10 + eşik tekilleştirme + metin düzeltmesi + testler +
                optik-form.html + bu doküman güncellemesi (2026-09-19).
                Working tree commit sonrası temiz.
kapsam (2):     supabase/migrations/20260919000000_expert_notes_and_audit.sql (yeni),
                supabase/README.md, src/records/supabaseRecords.ts,
                src/components/RecordDetailPage.tsx, MyRecordsPanel.tsx, AdminPanel.tsx,
                CaseWorkspace.tsx, SourcesPage.tsx, results/MMPIPrintReport.tsx,
                results/MMPIValidityTab.tsx, src/scoring/mmpiCritical.ts,
                src/auth/supabaseClient.ts, src/styles/screen.css, workspace.css,
                scripts/build.mjs, tests/savedPage.test.ts (yeni), tests/build.test.ts,
                tests/mmpiInterpretation.test.ts, optik-form.html, MMPI_PROJECT_STATUS.md
```

## 44. FINAL DOĞRULAMA RAPORU (2026-09-19, 3. tur — production-ready kapanış)

### COMPLETED (kodda uygulandı + otomatik testle doğrulandı)
- Faz 1 (üç-durum geçerlik UI), Faz 2 (scoringVersion), Faz 3 (reviewHistory + audit_logs),
  Faz 4 (uzman notu), Faz 5 (rapor: geçerlik durumu + uzman notu + sayfa no + motor sürümü
  footer'da + tarih/vaka bilgisi + metodoloji/kaynak yönlendirmesi), Faz 6 (CSP connect-src
  koşullu allowlist), Faz 11 ('?' grafik açıklaması: lejant "? — Boş madde sayısı (klinik
  T skoru değildir)" + SVG title; t:null findings'te korunuyor), Faz 12 (Ries düzeltmesi),
  Faz 14 (geriye uyumluluk: legacy payload testleri), Faz 16 (güvenlik taramaları),
  Faz 18 (kod taramaları: console.log yok, dangerouslySetInnerHTML yok, TODO/FIXME yok,
  hardcoded secret yok).

### VERIFIED (bu ortamda gerçekten koşuldu)
- typecheck: PASS · test: 192/192 PASS · build: PASS · verify:pdf: PASS
  (4 A4 sayfa, 566 madde koordinatı, kimlik alanları yalnız 1. sayfada).
- OMR güvenli davranış: omrSafety/omrEngine/pdfScanPipeline testleri PASS
  (yanlış/eksik/yinelenen sayfa reddi, düşük kalite, eğik/gölge, boş/çift işaret →
  inceleme kuyruğu, QR kimlik reddi, manuel düzeltme + undo).

### NOT VERIFIED (bu ortamda test EDİLEMEDİ — başarısız değil, ortam yok)
- Canlı Supabase: RLS cross-user (Faz 7 TEST 1-4), logout/expired session (TEST 5-6),
  Edge Function canlı çağrı (TEST 7). Ortam değişkenleri/credential yok; kod ve
  politika düzeyinde doğru, canlıda koşulmadı.
- CSP'nin gerçek tarayıcıda console-violation'sız çalışması (build testi origin
  allowlist'ini doğruluyor; gerçek tarayıcı oturumu bu ortamda yok).
- Gerçek kağıt/kalem/telefon fotoğrafı OMR kalibrasyonu (Faz 9): sentetik test
  başarılı, gerçek kamera/kağıt kalibrasyonu bekliyor.

### SCIENTIFIC ITEMS REQUIRING SOURCE VERIFICATION (Faz 10 — DEĞER DEĞİŞTİRİLMEDİ)
| Konu | Koddaki değer | Bulunan kaynak | Aynı mı? | Eminlik |
| --- | --- | --- | --- | --- |
| K oranları (Hs .5K, Pd .4K, Pt 1K, Sc 1K, Ma .2K) | mmpiKeys.ts K_CORRECTION | Meehl & Hathaway 1946; Butcher ve ark. 2001 (oranlar) | Oranlar EVET | Yüksek (oranlar) |
| .4K tablosu K=3→+2, K=4→+1 (monotonik değil) | K_ADDITION_TABLE.ratio4 | Klasik tablonun hücre değerleri açık kaynakta bulunamadı | Doğrulanamadı | Kaynak doğrulaması gerekli — DOKUNULMADI |
| Dy 56 madde (klasik 57 olabilir) | mmpiDerived.ts | Birincil madde listesi bulunamadı | Doğrulanamadı | Kaynak doğrulaması gerekli — DOKUNULMADI |
| '?' grafik gösterimi | t:null; grafikte ayrı renk + "T skoru değildir" açıklaması | — | Uyumlu | Faz 11 ile netleştirildi |
| Wiggins TR M/SD | mmpiDerived.ts WIGGINS_NORMS | Bulunamadı | — | Kaynak doğrulaması gerekli (D statü, SourcesPage'de bildirildi) |
| MAC≥28 / ICAS≥5 / SAP≥16 | mmpiDerived.ts | Birincil kaynak bulunamadı (MAC≥22 Ceyhun & Palabıyıkoğlu 1989 doğrulandı) | Kısmen | Kaynak doğrulaması gerekli |
| Savaşır (1981) norm sayıları | TURKISH_NORMS | Kitap erişimi yok | Doğrulanamadı | Kaynak doğrulaması gerekli |
| Ölçek item key'leri | mmpiKeys.ts | Telifli orijinal erişimi yok | Doğrulanamadı | Kaynak doğrulaması gerekli |

### PRODUCTION DEPLOYMENT REQUIREMENTS
1. `.env` ile VITE_SUPABASE_URL/ANON_KEY tanımla; `npm run build` (CSP origin'i build'de gömülür).
2. `supabase db push` — 20260919000000 migration'ı (expert_notes + audit_logs) canlıya uygula.
3. Edge Function deploy + ilk Admin bootstrap (supabase/README.md).
4. Canlı RLS/oturum/CSP testlerini (yukarıdaki NOT VERIFIED listesi) gerçek ortamda koş.

### REMAINING RISKS
- Canlı ortam testleri koşulmadan RLS/CSP güvencesi yalnız kod düzeyindedir.
- Gerçek kağıt OMR kalibrasyonu yapılmadan optik okuma sahada %100 kabul edilemez.
- Kaynak doğrulaması gerekli bilimsel değerler (üstteki tablo) uzman literatür
  erişimiyle kapatılmalıdır; uygulama bu değerleri D/E statüsüyle şeffaf raporlar.

---
*Bu doküman kanıt-temellidir: her [✓] gerçek kod/test çıktısına, her [?] gerçek bir
doğrulama boşluğuna karşılık gelir. Pazarlama dili bilinçli olarak kullanılmamıştır.*
