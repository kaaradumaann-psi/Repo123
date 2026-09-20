# MMPI-566 Çalışma Alanı — Sistem Dokümanı

**Belgenin amacı:** Bu dosya, depo kodundan türetilmiş güncel mimari ve üretim işletim sözleşmesidir. Yeni bir özellik tasarımı değildir; uygulamanın gerçekten yaptığı şeyleri, güvenlik sınırlarını, doğrulanmış kontrolleri ve doğrulanamayan üretim bağımlılıklarını ayırır.

**Denetim snapshot'ı:** 20 Eylül 2026 · branch `arena/01a0beda-repo123` · bu audit turundaki yerel doğrulama: `npm ci`, `npm run typecheck`, `npm test` **239/239**, `npm run verify:pdf`, `npm run build`, `npm audit --audit-level=high` ve `git diff --check` başarılıdır.

Durum etiketleri:

- **DOĞRULANDI:** Bu checkout'ta komutla veya kod/test incelemesiyle görüldü.
- **TASARIM:** Kodda uygulanmış sözleşme; canlı altyapı davranışı ayrıca sınanmış değildir.
- **DOĞRULANMADI:** Bu ortamda gerekli gerçek proje, cihaz, tarayıcı veya manuel akış yoktu.
- **SINIR:** Ürünün bilinçli veya mevcut teknik kısıtı.

> `MMPI_PROJECT_STATUS.md`, 19 Eylül tarihli tarihsel devir kaydıdır. Güncel rota, dosya haritası, test durumu ve üretim checklist'i için bu dosya yetkili kaynaktır.

---

## 1. Ürün kapsamı ve güven sınırı

MMPI-566 Çalışma Alanı, yetkili ruh sağlığı profesyonellerinin 566 maddelik bir cevap formu akışını yönetmesi için hazırlanmış tek sayfalı bir web uygulamasıdır:

1. danışan/uygulama bilgileri alınır;
2. veri yöntemi seçilir: hızlı cevap girişi, ham puan veya OMR/kamera;
3. OMR ise dört sayfalık aynı baskı seti okunur, düşük güvenli maddeler insan tarafından incelenir;
4. doğrulanmış veri cihazda puanlanır ve sonuç ekranı gösterilir;
5. psikolog kaydı Supabase'e yazar; Admin kayıtları ve uzman hesaplarını yönetir;
6. kaydedilmiş kayıt yeniden hesaplanır, incelenir ve profesyonel rapor olarak yazdırılır.

**Güven sınırı:** Tarayıcı istemcisi OMR ve puanlama hesabını yapar; Supabase Auth kimliği, PostgreSQL RLS'si ve migration trigger'ları kayıt erişimini ve yazma bütünlüğünü sınırlar. İstemci doğrulaması yetki kanıtı değildir. Kritik kurallar istemcide, RLS/Edge Function'da ve mümkün olduğunda veritabanı trigger'ında tekrar edilir.

Uygulama tanı koyan, tedavi öneren veya klinik kararı otomatik veren bir sistem olarak konumlandırılmaz. Ekran ve yazdırma raporu, kaynak tabanlı yorumlar ve uyarılar sunar; nihai değerlendirme uygulayıcı uzmana aittir. Uzman notu alanında tanısal kesin ifadelerden kaçınılması istenir ve sunucu tarafında **4.000 karakter** sınırı vardır.

Form tanımı kod içinde `source: 'unverified-template'` olarak işaretlidir. Depodaki form, lisanslı/yetkili MMPI materyalinin birebir eşdeğeri olduğu iddiasını taşımaz.

---

## 2. Çalışma zamanı ve frontend mimarisi

### 2.1 Giriş ve kabuk

- `src/main.tsx` React 19 root'unu, StrictMode'u ve stil katmanlarını yükler; `installLinkInterceptor()` aynı origin bağlantıları History API'ye taşır.
- `src/App.tsx` bilgi sayfalarını, yapılandırılmamış kurulum/önizleme ekranını, 404'ü ve oturum açılmış uygulama kabuğunu seçer.
- `src/components/AuthGate.tsx` Supabase oturumunu hydrate eder, profil/aktiflik durumunu doğrular ve yeni giriş ile mevcut session hydration'ını ayırır. Profil sorgusu asenkron olduğu için eski bir cevap logout veya yeni session sonrasında kullanıcıyı geri yükleyemez.
- `src/components/ConnectivityBanner.tsx` ağ durumunu görünür kılar.
- `src/components/SiteFooter.tsx` çalışma alanı, giriş/kurulum ve bilgi sayfalarında ortak footer'ı sağlar.

### 2.2 Gerçek rotalar

Router hash router değildir; `src/router.ts` `window.location.pathname` okuyup History API `pushState`/`replaceState` kullanır. Aynı origin `<a>` tıklamaları SPA olarak yakalanır; `mailto:`, `tel:`, `target="_blank"`, modifier tuşları ve dış origin'ler normal davranır.

| Rota | Davranış | Erişim |
| --- | --- | --- |
| `/` | Temiz landing (`home`); persisted taslağı otomatik açmaz | Oturum kapalıysa login/kurulum, açık ise workspace |
| `/index.html`, `/optik-form.html` | Landing alias'ı | Aynı |
| `/islem` | Case workspace; mevcut taslak bu rotada session hydration ile açılabilir | Yetkili oturum |
| `/form` | Doğrulanmış optik form PDF hazırlık ekranı | Yetkili oturum |
| `/kayitlar` | Psikoloğun kendi kayıtları | Yalnız `PSYCHOLOG`; Admin `/yonetim`e yönlendirilir |
| `/kayitlar/<id>` | Tam kayıt inceleme, not ve yazdırma | RLS belirler; Admin tüm kayıtları, psikolog erişebildiği kaydı görür |
| `/yonetim` | Admin kullanıcı/kayıt yönetimi | Yalnız aktif `ADMIN` |
| `/sss` | SSS | Public |
| `/gizlilik` | Gizlilik & KVKK | Public |
| `/kullanim` | Kullanım Koşulları | Public |
| `/kaynaklar` | Kaynakça ve kaynak denetimi | Public |
| `/onizleme` | Deterministik sonuç tasarım önizlemesi; gerçek kayıt yazmaz | Yalnız Supabase yapılandırılmamışken |
| bilinmeyen | 404 | Public kabuk |

Bilgi sayfasındaki üst **Geri dön**, marka bağlantısı ve 404 düğmesi doğrudan `/`e gider. Bu eylemler son taslağı resume ederek iç rotaya yönlendirmez. Footer'daki **Yeni Veri Girişi** ise oturum açık uygulamada bilinçli olarak `/islem`e gider.

Production'da pathname rotalarının doğrudan açılabilmesi için hosting tarafında SPA fallback gerekir. `npm run build`, `dist/_redirects` içinde `/* /index.html 200` kuralını üretir; Vercel/nginx/S3 benzeri ortamlarda eşdeğer fallback ayrıca yapılandırılmalıdır.

### 2.3 Kaynak haritası

| Alan | Gerçek kaynaklar |
| --- | --- |
| Shell/auth/routing | `src/main.tsx`, `src/App.tsx`, `src/router.ts`, `src/components/AuthGate.tsx` |
| Case lifecycle | `src/components/CaseWorkspace.tsx`, `src/workspace/caseTypes.ts`, `src/workspace/draftStorage.ts` |
| Auth | `src/auth/supabaseClient.ts`, `supabaseAuth.ts`, `authStorage.ts`, `adminApi.ts` |
| Form/layout/identity | `src/omr/formDefinition.ts`, `src/form/layout.ts`, `form/pageIdentity.ts`, `form/formSet.ts` |
| OMR | `src/omr/*`, özellikle `analyzePage.ts`, `alignmentDetector.ts`, `perspectiveCorrection.ts`, `markDetector.ts` |
| Scanner | `src/scanner/*`, `CameraCapture.tsx`, `ScannerWorkspace.tsx`, `ManualCornerEditor.tsx` |
| Results/safety boundary | `src/results/*`, `src/scoring/omrAnswers.ts`, `src/results/recordProfile.ts` |
| Scoring/interpretation | `src/scoring/*` |
| Records | `src/records/supabaseRecords.ts`, `RecordDetailPage.tsx`, `MyRecordsPanel.tsx`, `AdminPanel.tsx` |
| Form PDF | `src/print/*`, `scripts/generate-pdf.ts`, `scripts/verify-pdf.ts` |
| Screen/PDF styles | `src/styles/screen.css`, `theme.css`, `site.css`, `workspace.css`, `scanner*.css`, `form.css`, `print.css` |
| Tests/diagnostics | `tests/*.test.ts`, `tests/fixtures/omrSynthetic.ts`, `scripts/validation/*` |
| Backend/deployment | `supabase/migrations/*`, `supabase/functions/admin-users/index.ts`, `scripts/build.mjs`, `.github/workflows/ci.yml` |

`src/components/FormPage.tsx` ve ilgili HTML form bileşenleri runtime Form sekmesinin ana yolu değildir; HTML/PDF geometri eşdeğerliğini test etmek için korunur. Tracked `scripts/validation/out/*.png` dosyaları görsel regresyon kanıtı olarak belgelenmiştir; generated göründükleri için silinmemiştir.

---

## 3. Kimlik, roller ve çalışma yaşam döngüsü

### 3.1 Oturum ve roller

- Supabase Auth `persistSession: true`, `autoRefreshToken: true`, `flowType: 'pkce'`, `detectSessionInUrl: false` ile çalışır.
- Auth storage, `sessionStorage` kullanır: aynı sekmede F5 oturumu korur; sekme kapanınca storage kaybolur. Storage erişilemezse no-op memory store kullanılır ve uygulama güvenli şekilde yapılandırılmamış/oturumsuz kalır.
- `VITE_SUPABASE_URL` yalnızca HTTPS origin'i (localhost/127.0.0.1 geliştirme istisnası) kabul eder. Frontend'de yalnız publishable/anon key bulunabilir; service-role anahtarı istemciye girmez.
- Profil `id`, e-posta, ad, soyad, `role` ve `active` alanlarında runtime doğrulanır. Pasif profil session'dan çıkarılır.
- Roller migration enum'unda `ADMIN` ve `PSYCHOLOG` olarak tanımlıdır.

| Eylem | PSYCHOLOG | ADMIN |
| --- | --- | --- |
| Case akışında veri hazırlamak | Evet | UI'da inceleyebilir; veritabanı klinik kaydı oluşturamaz |
| Yeni `mmpi_records` oluşturmak | Yalnız aktif hesap | Hayır; RLS insert yalnız aktif psikolog içindir |
| Kendi kayıtlarını listelemek | Evet | Ayrı Admin listesi kullanır |
| Tüm kayıtları listelemek | Hayır | Evet |
| Kendi kaydına not/silme | Evet, aktif ve owner | Evet, görünür tüm kayıtlar |
| Uzman hesabı oluşturmak/aktiflik/silmek | Hayır | Yalnız Edge Function üzerinden |
| Audit log okumak | Hayır | Evet |

Admin'in kayıt ayrıntısında klinik cevap ve profil görmesi mevcut bilinçli yönetim tasarımıdır; RLS Admin'e tüm kayıtları seçme hakkı verir. Canlı ortamda bu kararın kurumun en az yetki ve KVKK politikasıyla ayrıca onaylanması gerekir.

### 3.2 Yeni giriş, F5 ve landing ayrımı

- Yeni `signIn` tamamlandığında `flowOrigin='signin'` olur ve URL `/`e replace edilir. Landing boş başlar; kullanıcıya aynı hesap için localStorage'da bulunan taslak varsa **Devam et** seçeneği gösterilir. Taslak otomatik açılmaz.
- F5 veya mevcut session hydration'ında `/islem` doğrudan açılırsa `CaseWorkspace` taslağı hydrate eder. `/` landing olarak açılırsa taslak state'e yüklenmez.
- Public SSS/gizlilik/kaynakça/üst geri akışı AuthGate'e girmeden `/`e döner; bu dönüş resume davranışını tetiklemez.
- Admin `/yonetim`, psikolog `/kayitlar` rol korumasıyla engellenir.

### 3.3 Taslak ve outbox

`src/workspace/draftStorage.ts`:

- Taslak anahtarı `mmpi566:case-draft:v1:<userId>`, outbox anahtarı `mmpi566:case-outbox:v1:<userId>`; kullanıcı anahtarı izolasyonu uygulanır.
- Taslak TTL'i 30 gündür. JSON parse öncesi 8 MiB sınırı, en fazla dört sayfa, canonical page key, batch/page tutarlılığı, UUID, review timestamp ve metin sınırları doğrulanır.
- `serializeScan()` cevap/ölçüm/review verisini tutar; normalize piksel buffer'ı, preview blob URL'i ve original blob URL'i yazmaz. Taslaktan geri gelen sayfa veriyle kullanılabilir, görsel inceleme için yeniden okutma gerekir.
- Hızlı cevap dizisi `D`, `Y`, `B` (bilinçli boş) ve `-` (henüz girilmedi) alfabesiyle 566 karakter saklanır; `null` ile `undefined` karışmaz.
- Ağ hatası sonrası outbox en fazla 10 kayıt tutar. Aynı UUID v4 idempotency anahtarıyla yeniden gönderir; `mmpi_records.idempotency_key` unique/upsert sınırı çift kayıt riskini azaltır.
- Validation/auth/sunucu hatası ağ hatası değildir; outbox'tan çıkarılır ve kullanıcıya gösterilir. Sadece bağlantı belirtileri kuyruğa alınır.
- “Yeni işlem” açık onayla draft'ı ve aktif case state'ini siler; kuyruktaki başka kayıtları silmez. Sayfa/stream/blob temizliği reset, page remove, manual editor kapanışı ve workspace unmount noktalarında yapılır.

### 3.4 Case yöntemleri ve kayıt kapısı

- **Hızlı giriş:** 566 D/Y/boş cevabı tamamlanmadan ilerlemez.
- **Ham puan:** `RAW_SCORE_FIELDS` alanlarının tamamı ve tanımlı maksimumlar gerekir.
- **OMR:** dört farklı page number, tek 24 haneli batch ID, doğru fingerprint ve her maddenin ölçülmüş reliable/blank veya açık manual review kararı gerekir.
- Danışan formunda yaş 16–120, yerel takvim tarihi bugün/öncesi, cinsiyet ve zorunlu metinler doğrulanır; klinik bağlam 2.000, başvuru nedeni 500, meslek/eğitim 120 karakter sınırındadır.
- Kaydetme öncesi boş madde eşiği `MMPI_MAX_BLANK=30` aşılırsa durur. `clinicalTransferAllowed` her zaman `false` olan teknik sonuç özeti klinik kararı otomatik yetkilendirmez.

---

## 4. Supabase veri modeli ve güvenlik

### 4.1 Migration sırası

`supabase/migrations/` dosyaları zaman sıralı uygulanmalıdır:

1. `20260915000000_initial_schema.sql`: `profiles`, `mmpi_records`, roller, Auth trigger'ı, temel RLS ve security-definer yardımcıları.
2. `20260919000000_expert_notes_and_audit.sql`: `expert_notes`, `notes_updated_at`, Admin okuyabilen `audit_logs`, kayıt değişiklik trigger'ı.
3. `20260919010000_record_integrity.sql`: profil browser mutation'larını kaldırır; yaş/payload sınırlarını ve aktif psikolog yazma politikasını güçlendirir.
4. `20260919020000_record_immutability.sql`: clinical intake/raw payload değişmezliği ve yeni payload şekli trigger'ı.
5. `20260920000000_record_actions.sql`: Admin not update'i ile Admin/owner delete action surface'ini açar; `expert_notes <= 4000` check'i ve son RLS sözleşmesini garanti eder.

Klinik kayıt alanlarını koruyan trigger, not güncellemesini mümkün kılarken danışan alanları, `created_by`, idempotency key, tarih ve raw JSON'un değiştirilmesini reddeder. Audit trigger'ı insert/update/delete olayını actor/action/target/time olarak kaydeder; audit tablosuna browser yazma/silme yetkisi verilmez.

### 4.2 `profiles`

`profiles.id` `auth.users(id)` foreign key'idir (`on delete cascade`); parola bu tabloda değildir. Auth kullanıcı trigger'ı yeni kullanıcıyı varsayılan düşük yetkiyle `PSYCHOLOG` profile ekler. İlk Admin, public signup kapalıyken Dashboard/SQL ile bir kez atanır. Browser'dan profile insert/update/delete yoktur; hesap yaşam döngüsü Edge Function'dadır.

### 4.3 `mmpi_records`

İlişkisel alanlar: UUID `id`, unique UUID `idempotency_key`, danışan adı/soyadı, dört izinli gender değeri, yaş, occupation, education, application date, requested_by, `raw_omr_answers` JSONB array, `created_by`, `created_at`, ayrıca uzman notu ve not zamanı. İstemci payload'ı kayıt meta/quick/raw/OMR şekillerinden biri olur:

- `[case-meta, quick-entry]` ve tam 566 cevap;
- `[case-meta, raw-scores]` ve tanımlı ölçekler;
- `[case-meta, dört SavedAnswerPage]`, distinct sayfa numarası ve aynı batch.

İstemci `TextEncoder` ile 8 MiB payload sınırı uygular; DB'de yeni write'lar için JSONB array/shape, yaş, tarih, payload byte ve immutability kontrolleri bulunur. Legacy kayıtlar okunabilir; parser legacy/current biçimleri birbirine karıştırmaz ve eksik/ambiguous OMR maddesini sessizce boş saymaz.

`updateExpertNotes()` ve `deleteRecord()` mutation yanıt gövdesi istemeden `count: 'exact'` kullanır. Hata yok ama RLS satırı etkilememişse `count !== 1` başarısız sayılır; UI sahte başarı göstermez. Bu, önceki `UPDATE/DELETE + ?select=id` kaynaklı 400 akışının yerine geçen bilinçli düzeltmedir. Canlı RLS ve PostgREST davranışı bu sandbox'ta **DOĞRULANMADI**.

### 4.4 Admin Edge Function

`supabase/functions/admin-users/index.ts`:

- `ALLOWED_ORIGINS`'i normalize eder; production'da boş allowlist yalnız localhost'a izin verir, yayın origin'i açıkça eklenmelidir.
- `OPTIONS`/POST method ve CORS varyantını kontrol eder.
- Bearer access token'ı service-role server client ile doğrular; çağıranın aktif Admin profile'ını arar.
- Request body'yi 32 KiB ile sınırlar; email/ad/soyad/parola/UUID/role dışı action'ları reddeder.
- Kullanıcı oluştururken Auth → profile kontrolü yapar; profile başarısızsa Auth user rollback edilir.
- Aktiflik değişikliğinde Auth ban durumu ile profile active yazımını eşler, ikinci yazım başarısızsa best-effort rollback dener.
- Silmede Auth user önce silinir; FK cascade uygulama verilerini temizler; istemciye iç hata ayrıntısı sızdırılmaz.

Service-role secret yalnız Supabase Function secret ortamında bulunmalıdır. `VITE_*` veya tracked HTML içine konmaz.

---

## 5. Form, scanner ve OMR hattı

### 5.1 Form sözleşmesi

Tek `FormDefinition` (`src/omr/formDefinition.ts`) HTML/PDF geometri ve OMR coordinate source'tur:

- A4 portrait: 210 × 297 mm;
- 4 sayfa, 1–144 / 145–288 / 289–432 / 433–566;
- 3 sütun × 48 satır, merkezler arası 4,25 mm;
- iki cevap alanı D/Y, toplam 566 × 2 = 1.132 bubble;
- 5 × 5 mm dört alignment mark; QR alanı x=164, y=18, 26 × 26 mm;
- canonical raster 8 px/mm = 1680 × 2376;
- QR metni `M566:<version>:<fingerprint>:<batchId>:<page>:<total>`; batch ID 24 uppercase hex.

`src/print/renderFormPdf.ts` aynı tanımdan bağımsız, canvas/browser gerektirmeyen PDF çizer; `tests/pdfForm.test.ts` ve `verify:pdf` PDF geometrisini dosyadan geri okur. Runtime Form sekmesi `MMPI-566-optik-cevap-formu.pdf` byte'larını kullanır. Bu PDF ve `FORM_SET_CODE`, farklı günlerde üretilen aynı doğrulanmış setin birbiriyle okunabilmesini sağlar; yeni danışan için scanner **Yeni Set / Sıfırla** ile eski sayfaları kilitler.

### 5.2 Dosya ve kamera girişleri

`src/scanner/imageIO.ts` dosyayı MIME/uzantıya güvenmeden magic-byte ile sınıflandırır: JPEG, PNG, WEBP, GIF, HEIC/HEIF, AVIF ve PDF. Görüntü decode edilmeden önce dosya/dimensions sınırları uygulanır. Kamera `getUserMedia` ile `facingMode: environment` idealini ister, canlı 700 ms advisory frame'i brightness/sharpness/contrast/page-box tahminiyle gösterir, capture sonrası stream'i durdurur. Kamera için HTTPS gerekir; localhost geliştirme istisnasıdır.

PDF `src/scanner/pdfIO.ts` içinde pdf.js worker'ı bundle içinden oluşturulur; remote/CDN worker veya remote PDF fetch kullanılmaz. Worker stream filter allowlist, JPX/JBIG2/Crypt reddi, decoded buffer budget, page/render timeout, abort ve worker/port/blob cleanup uygular. PDF görüntüleri browser canvas'ta rasterize edilip ortak scanner hattına girer.

Giriş limitleri (`src/scanner/imageIO.ts`):

| Limit | Değer |
| --- | ---: |
| Tek dosya | 24 MiB |
| Batch dosya sayısı | 12 |
| Batch byte | 96 MiB |
| Kaynak görüntü | 40 MP, 16.000 px kenar |
| OMR input | 12 MP, 8.000 px kenar |
| PDF dosya sayfası | 12 |
| İşlem toplam page budget | 24 |
| OMR canonical warp | 8.000.000 px |

### 5.3 Otomatik scanner ve OMR

Kamera/dosya görüntüsü `src/scanner/scanAndAnalyze.ts` strateji ladder'ından geçer:

1. document quad detection → paper crop → homography/perspective warp → shadow/white/contrast/sharpen cleanup;
2. 8 px/mm shadow-clean veya raw warp fallback;
3. gerekirse warp'sız isotropic upscale fallback.

Her strateji sonunda aynı `src/omr/analyzePage.ts` çağrılır; strategy ladder OMR karar sınırını bypass etmez. `analyzePage` sırasıyla grayscale/isolation, dört yön QR decode, page identity parse, QR-to-page prediction, four alignment square detection, homography, geometry/containment/QR consistency, canonical warp, bubble-ring refinement, image quality ve item mark detection yapar.

Alignment kareleri bağlı bileşen + çoklu threshold/square-likeness/salvage pass ile bulunur. Kalite raporu ideal/inceleme/fatal ayrımı yapar; fatal kalite cevap üretmeden sayfayı reddeder. Bubble detector merkez/peripheral/background örnekleri ve komşu izolasyonu kullanır. `confidence` işaret gücü sezgisidir; olasılık değildir.

### 5.4 Sonuç güvenlik sınırı ve manuel inceleme

`ReadStatus`: `unread`, `blank`, `single`, `multiple`, `ambiguous`, `reliable`, `invalid`.

- Yalnız measured `reliable` otomatik D/Y cevabıdır.
- Measured `blank`, gerçek boş (`?`) cevaptır.
- `single`, `multiple`, `ambiguous`, `unread`, `invalid` otomatik klinik D/Y/null'a çevrilmez.
- `ManualReview` D/Y/null ve timestamp taşır; `ManualReviewEvent` reviewer, recordedAt, previous/next ve undo olayını append-only history olarak tutar.
- Review hedefi form item'ı olmalı; timestamp geleceğe kaçamaz (en fazla 60 saniye clock skew). `canCreateRecord`, `isEffectiveItem`, `scanToAnswers` tüm maddelerin ölçülmüş veya açıkça insan tarafından çözümlenmiş olmasını ister.
- Original normalized görüntü ve manual crop yalnız client blob/canvas yaşam döngüsündedir; raw camera image Supabase'e gönderilmez.

Manual corner editor pointer/touch sürükleme, focusable corner handle'ları, düşük çözünürlüklü canlı warp preview ve confirm'da production-resolution warp kullanır. Bu fallback, kullanıcı köşeleri seçtikten sonra yine `analyzePage`'e döner; ayrı ve doğrulanmamış bir OMR motoru değildir. Keyboard/AT kod sözleşmesi uygulanmıştır; gerçek browser ve yardımcı teknolojiyle corner hareketi bu audit ortamında **DOĞRULANMADI**.

---

## 6. Puanlama, sonuç ve PDF raporu

- `src/scoring/mmpiKeys.ts` D/Y anahtarlarını, Türk norm M/SD değerlerini, cinsiyetli Mf dönüşümünü, K correction table'ı ve ölçek metadata'sını taşır.
- `src/scoring/mmpiScoring.ts` T dönüşümü, raw/k-corrected klinik ölçekler, `?`/L/F/K validity ve iki noktalı profil kodunu üretir. K düzeltmesi Hs, Pd, Pt, Sc, Ma için uygulanır.
- Geçerlik analizi: boş ≥31 veya F ham ≥23 geçersiz; F ham 16–22 şüpheli uyarı; F-K kritik sınırı 16; L/F/K kaynak bantları ve 15 validity configuration ayrıca gösterilir.
- Cevap dizisi varsa TR endeksi, Dikkatsizlik, Goldberg/Taulbee/Peterson, PDI-IV bağlamlı 11 ölçek, MAC/MAC-R/AAS/ICAS/SAP, Wiggins içerik, özel ölçekler, kritik madde ve otomatik izlenim katmanı hesaplanır. Ham puan girişinde madde düzeyi katman bulunmaz; kaynak tablo bantları gösterilir.
- `recordProfile.ts` kayıt ayrıntısında relational gender ile payload gender çelişirse profil üretmez. OMR'de unresolved item varsa kayıt profili sessizce üretmez.
- Scoring engine `2.0.0` ve norm etiketi `CaseMeta` içine yazılır. Kaynak kesinliği `src/components/SourcesPage.tsx` ve `docs/kaynak-denetimi.md` ile dürüstçe sınıflandırılır; doğrulanamayan yerel rehber künyelenmiş bilimsel kaynak gibi sunulmaz.

### Ekran raporu ve yazdırma

`RecordDetailPage` sonuçları sekmeli progressive-disclosure düzeninde gösterir: Genel Bakış, Geçerlik, Klinik Ölçekler, Kod, Türetilmiş, Desenler/Sözlük, Kritik ve Soru Yanıtları. Ekran yazdırılmaz. `MMPIPrintReport` yalnızca kayıt özeti, profil/tablolar, validity, derived/critical bulgular ve varsa uzman notunu profesyonel print-only DOM'a koyar; `window.print()` bu raporu `@media print` ile yazdırır. `document.title`, `MMPI_Klinik_Raporu_<Danisan>_<gg-AA-yyyy>` dosya adı önerisine ayarlanır.

Rapor ve ekrandaki kaynak tabanlı “olası tanı”/izlenim ifadeleri tanı değildir; footer, FAQ, kullanım koşulları ve uzman notu yardım metni klinik kararı uzmana bırakır. Uzman notu `maxLength=4000` ve DB check ile korunur; not rapora aktarılır.

Form PDF yazdırma ile klinik rapor yazdırma ayrıdır: FormKit'in **Yazdır/İndir/Yeni sekmede aç** eylemleri doğrulanmış optik form PDF'sini kullanır; klinik rapor düğmesi tarayıcının print pipeline'ını kullanır.

---

## 7. UI, responsive ve accessibility

- Stil katmanları ekran token'ları (`screen.css`), tema (`theme.css`), site chrome (`site.css`), workspace/results (`workspace.css`), scanner (`scanner.css`, `scanner-enhancements.css`), form (`form.css`) ve print (`print.css`) olarak ayrıdır. `theme.css` yalnız screen media içinde olduğu için A4 form/PDF print geometrisini etkilemez.
- DM Sans gövde, Newsreader başlık font stack'i remote font yüklemeden kullanılır. Standalone CSP `font-src 'none'` olduğu için fallback font normaldir.
- Workspace header, scanner source tablist, status/alert, confirm dialogs, form labels, image alt text, results disclosure ve focus-visible stilleri mevcuttur. Ana workspace, Admin ve scanner source tab listelerinde `role=tab`, `aria-selected`, `aria-controls` ve Home/End/Arrow klavye dolaşımı uygulanmıştır. Gerçek browser/AT davranışı bu auditte **DOĞRULANMADI**.
- Responsive kırılımlar `screen.css`/`theme.css`/`workspace.css`/`scanner*.css` içinde 900, 800, 760, 720 ve 560 px civarındadır; scanner grid ve sonuç tabloları mobilde taşma/stack düzenlerine iner.
- `ManualCornerEditor` pointer/touch yanında dört köşe handle'ı focusable `role=button` olarak sunar; ok tuşlarıyla küçük/büyük (Shift) adımlı taşıma ve Türkçe aria label'ları vardır. Gerçek ekran okuyucu ve browser keyboard testi **DOĞRULANMADI**.
- Reduced-motion, mobil browser, iOS camera izinleri, gerçek Safari/Firefox/Chrome PDF viewer ve ekran okuyucu kombinasyonları **DOĞRULANMADI**. Bu, automated test PASS'i değildir; release öncesi cihaz matrisi gerekir.

---

## 8. Güvenlik, gizlilik ve bağımlılıklar

### 8.1 Frontend güvenliği

- İlk statik taramada `src` içinde `dangerouslySetInnerHTML`, `eval`, service-role frontend referansı veya debug `console.log` bulunmadı. React text rendering escape edilir.
- Upload görüntüleri/PDF sunucuya gönderilmez; blob URL'ler revoke edilir. SVG MIME'ı magic-byte imzası olmadığı için kabul edilmez.
- Standalone build `scripts/build.mjs` yalnız `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini üretime alır; inline script SHA-256 CSP ile pinlenir, default-deny `connect-src` yapılandırılan Supabase origin'iyle sınırlanır, dış font/script yoktur.
- PDF worker CDN'e gitmez; worker patch sürümü `pdfjs-dist 6.3.289` ile pinlidir.
- Draft localStorage'dadır ve aynı origin'deki browser JavaScript erişim modeline tabidir; ortak cihazda taslak bırakılmamalıdır. Taslakta görüntü byte'ı tutulmaz, ancak danışan ve cevap verisi tutulur.
- Supabase anon/publishable key gizli kabul edilmez; gerçek güvenlik Auth/RLS/Edge Function'dadır. Service-role secret yalnız server-side Function'da olmalıdır.

### 8.2 Backend ve operasyon güvenliği

- RLS canlı PostgREST davranışı, migration uygulanma durumu ve Edge Function CORS/Auth **DOĞRULANMADI**; yalnız SQL/TypeScript statik incelemesi yapıldı.
- Supabase production origin'i `ALLOWED_ORIGINS` içine eklenmeden Admin kullanıcı işlemleri çalışmamalıdır. Preview origin'i de geçici test için ayrıca izin ister.
- `npm ci` lockfile'a bağlıdır; package sürümleri `package.json`/`package-lock.json` ile sabittir. Runtime dependency'ler React, Supabase, jsQR, qrcode, pdfjs-dist ve noble hashes; build/test dev dependency'leri Vite, TypeScript, tsx, esbuild, canvas/types paketleridir.
- Lint veya browser E2E script'i yoktur. SAST/DAST, npm audit ve gerçek secret scanning bu auditin otomatik CI contract'ında değildir; her release'te ayrıca çalıştırılmalıdır.

### 8.3 KVKK veri akışı özeti

| Veri | Nerede | Süre/temizleme |
| --- | --- | --- |
| Auth session | `sessionStorage` | Sekme kapanışı veya kullanıcı logout/temizleme |
| Taslak/outbox | kullanıcı anahtarlı `localStorage` | Taslak 30 gün TTL; “Yeni işlem”/tarayıcı temizliği |
| Raw camera/PDF pixels | client memory/blob/canvas | Akış, page removal/reset/unmount; server'a gönderilmez |
| Onaylı intake/raw/OMR payload | Supabase `mmpi_records` | Kurumun retention/silme politikasına bağlı; delete kalıcıdır |
| Action metadata | Supabase `audit_logs` | DB retention politikasına bağlı; yalnız Admin select |

Bu teknik davranış KVKK hukuki danışmanlığı değildir. Barındırma bölgesi, veri işleme hukuki sebebi, saklama/imha süresi ve danışan aydınlatması kurum/uzman tarafından belirlenmelidir.

---

## 9. Test ve doğrulama sözleşmesi

### 9.1 Otomatik komutlar

| Komut | Kapsam | Bu audit snapshot'ı |
| --- | --- | --- |
| `npm ci` | lockfile ile temiz bağımlılık kurulumu | **DOĞRULANDI** — 74 paket, 0 vulnerability |
| `npm run typecheck` | `tsc --noEmit`, strict/noUnused | **DOĞRULANDI** |
| `npm test` | `tsx --test tests/*.test.ts`; OMR/scanner, draft, result safety, PDF, build, print ve router | **239/239 DOĞRULANDI** |
| `npm run verify:pdf` | hazır/üretilmiş form PDF byte/geometri/QR doğrulaması | **DOĞRULANDI** — 4 A4, 566 madde, 1.132 bubble |
| `npm run build` | typecheck + standalone `dist/index.html`, `dist/_redirects`, tracked `optik-form.html` üretimi | **DOĞRULANDI** |
| `git diff --check` | whitespace/diff hygiene | **DOĞRULANDI** |
| `npm audit --audit-level=high` | advisory scan | **DOĞRULANDI** — 0 vulnerability |

### 9.2 Test kategorileri

- Form layout: 4 A4 sayfa, item ranges, header/QR/registration mark containment, HTML/PDF eşleşmesi.
- Identity/QR: fingerprint, batch/page/total parse, foreign/missing/duplicate page protections.
- Geometry/OMR: homography/similarity, orientation 90/180/270, 17°/projective distortion, page isolation, alignment, bubble rings, peripheral isolation, blur/shadow/low-light, multiple/ambiguous/blank/reliable statuses.
- Scanner: magic-byte file gate, dimensions/bytes, PDF worker allowlist/buffer/timeouts, camera advisor, enhancement, comparison, manual warp.
- Lifecycle: user-key draft isolation, TTL/corrupt JSON, no image persistence, outbox shape/size/attempts, exact local date, landing/resume decisions at code level.
- Result boundary: unresolved OMR remains pending, measured blank is distinct, manual review/history/undo and record gate do not grant unearned clinical transfer.
- Scoring/report: Turkish norms/K correction/validity/config/derived/critical/source labels, report rendering, print path separation.
- Standalone build: no source imports, one inline script, CSP hash, embedded PDF bytes and footer/print separation.

### 9.3 Manuel veya canlı doğrulama gerektirenler

Aşağıdakiler otomatik testler sayesinde PASS sayılamaz ve bu ortamda **DOĞRULANMADI**:

- gerçek Supabase project üzerinde migration `db push`, login/logout/expired session;
- iki farklı kullanıcıyla cross-user RLS/IDOR, Admin/psychologist note/delete, audit log ve Edge Function rollback;
- gerçek iOS/Android kamera, HTTPS permission, Safari/Firefox/Chrome PDF viewer, gerçek yazıcı/kâğıt/kalem/fotokopi;
- gerçek fotoğraf kalibrasyonu ve klinik kabul doğruluğu;
- responsive cihaz matrisi, keyboard-only manual corners, ekran okuyucu ve reduced-motion;
- production hosting SPA fallback, CSP header/proxy, `ALLOWED_ORIGINS`, Supabase region/backup/retention.

CI (`.github/workflows/ci.yml`) `npm ci`, typecheck, test, PDF verify, build ve tracked `optik-form.html` diff kontrolü yapar. Lint/E2E/manual Supabase step'i yoktur.

---

## 10. Deployment runbook

### Frontend

1. Node.js **22+** kullanın.
2. `npm ci`.
3. `.env` içine yalnız frontend-safe değerleri koyun:
   ```sh
   VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=PUBLIC_ANON_OR_PUBLISHABLE_KEY
   ```
4. `npm run build` çalıştırın.
5. `dist/index.html` + `dist/_redirects` ve statik asset çıktısını SPA fallback destekleyen hosting'e yayınlayın. `optik-form.html` tracked/self-contained teslimattır; onu tek başına farklı bir path altında yayınlıyorsanız `/islem` gibi direct URL'ler için host rewrite kuralını ayrıca sağlayın.
6. Yayın origin'ini Supabase Edge Function `ALLOWED_ORIGINS` içine ekleyin. Kamera için HTTPS sağlayın.

Build çıktıları:

- `dist/index.html`: inline React/CSS/pdf worker ve build-time env ile standalone HTML;
- `dist/_redirects`: Cloudflare Pages fallback;
- `optik-form.html`: aynı self-contained HTML'nin tracked kopyası.

### Supabase

1. `supabase link --project-ref PROJECT_REF`.
2. `supabase db push`; beş migration'ın sırasıyla uygulandığını doğrulayın.
3. Dashboard'da public email signup'ı kapatın.
4. İlk Auth user'ı Dashboard'dan oluşturup SQL ile bir kez `ADMIN` yapın.
5. `supabase functions deploy admin-users`.
6. `supabase secrets set ALLOWED_ORIGINS=https://app.example` (birden çok origin virgülle ayrılır). Service-role secret Supabase tarafından yönetilir; `.env`/frontend'e kopyalanmaz.
7. Gerçek project'te RLS, Edge Function, trigger ve delete cascade testlerini iki rol ile uygulayın; sonuçları ayrı operasyon kaydına yazın.

---

## 11. Bilinen sınırlamalar ve üretim riskleri

1. Form geometrisi ve `D/Y` düzeni `unverified-template` varsayımıdır; yetkili lisans/form materyaliyle eşdeğerlik kanıtı yoktur.
2. OMR eşikleri sentetik raster ve depo PDF'sinin raster pipeline'ı ile testlidir; gerçek telefon, kalem, kağıt, fotokopi ve yazıcı dağılımı için doğruluk yüzdesi iddia edilmez.
3. `confidence` probability değildir; insan review kapısı zorunludur.
4. Klinik skor/yorum kaynaklarının bir kısmı kaynakça statüsü C/D/E ile işaretlidir; uygulama klinik tanı veya otomatik tedavi kararı üretmez.
5. Sunucuda T score/profile saklanmaz; raw payload ve metadata saklanır, profil kayıt açılırken cihazda yeniden üretilir. Scoring engine/norm değişimi legacy görünümü etkileyebilir; `scoringVersion` bu izi sağlar.
6. Ayrı patient/entity tablosu yoktur; her assessment `mmpi_records` satırıdır. Patient-level grouping yoktur.
7. Delete kalıcıdır; soft delete yoktur. FK cascade ile Auth user deletion ilişkili profile/records'ı kaldırabilir; kurum retention politikasını buna göre kurmalıdır.
8. Taslak localStorage ortak bilgisayarda kalabilir; browser/origin güvenliği dışında şifreli kasa değildir.
9. OMR CPU hattı ana thread'de çalışır. `analyzePage` Promise API ile worker'a taşınabilir ama uygulama kendisi Web Worker kullanmaz; büyük görüntüler mobilde yavaşlayabilir.
10. Form print ve clinical report print iki farklı akıştır; browser print dialog, PDF viewer ve gerçek yazıcı davranışı manuel kabul testidir.

---

## 12. Üretim checklist'i

Bu liste “PASS” yerine gerçek kanıt gerektirir:

### Kod ve artifact

- [x] `npm run typecheck`.
- [x] `npm test` 239/239.
- [x] `npm ci` ile lockfile kurulumu: 74 paket, 0 vulnerability.
- [x] `npm run verify:pdf`: 4 A4, 566 madde ve 1.132 bubble doğrulandı.
- [x] `npm run build`: `dist/index.html`, `dist/_redirects` ve `optik-form.html` üretildi; standalone build testleri başarılı.
- [x] `git diff --check`.
- [x] `npm audit --audit-level=high`: 0 vulnerability.
- [x] `SYSTEM.md` rota/auth/RLS/scanner/OMR/PDF/help/privacy/limitations sözleşmesini içeriyor.
- [x] Belirsiz generated-looking scanner evidence dosyaları silinmedi; yalnız doğrulanmış stale açıklamalar düzeltildi.

### Backend/hosting

- [ ] `supabase db push` canlı project'te beş migration ile tamamlandı.
- [ ] İki rol ile canlı RLS/IDOR/note/delete/audit testleri.
- [ ] Edge Function deploy, secret ve exact `ALLOWED_ORIGINS`.
- [ ] Public signup kapalı, ilk Admin bootstrap tamam.
- [ ] SPA fallback, HTTPS, CSP/proxy ve backup/retention politikası.

### İnsan kabulü

- [ ] Gerçek yazıcıda A4 %100 baskı, 4 sayfa batch, QR/mark ölçümü.
- [ ] Gerçek iOS/Android kamera, izin, ışık/blur, manual fallback.
- [ ] Screen reader, keyboard-only, mobile/responsive ve reduced-motion.
- [ ] Klinik uzman tarafından yorum/rapor/safety wording ve lisanslı materyal kabulü.

Checklist'teki `[ ]` maddeler, yerel testlerin başarısız olduğu anlamına gelmez; bu ortamda gerekli canlı/manuel kanıtın bulunmadığını gösterir.

---

## 13. Cleanup ve belirsiz dosya kararları

Bu turda güvenli silme kapsamı özellikle dar tutuldu:

- `src/components/FormPage.tsx`, test/rendering twin olarak `formIdentity.test.ts` ve `printLayout.test.ts` tarafından kullanıldığı için silinmedi.
- `FormKit`, `FormPage`, standalone `optik-form.html` ve embedded verified PDF birbirinin kanıtlanmamış duplicate'i sayılmadı; canlı/runtime, geometri testi ve offline teslimat rolleri farklıdır.
- `scripts/validation/out/*.png`, scanner raporlarının gerçek görsel kanıtı olarak tracked'dir; generated göründükleri için silinmedi.
- Supabase migrationları, fixtures, configs, source maps veya dynamic asset'ler “import grep” ile dead kabul edilmedi.
- Unused/dead/debug taramasında silme için kesin kanıt bulunmayan hiçbir source, migration, fixture, config veya evidence dosyası kaldırılmadı.
- Bunun yerine doğrulanmış stale route/çıktı açıklamaları README, FAQ, KVKK, route comments ve tarihsel rapor başlıklarında düzeltildi; tarihsel raporların geçmiş test sayıları ve branch bağlamı sessizce değiştirilmedi.

## 14. Final audit evidence log

Bu bölüm, çalışma tamamlanırken komutların gerçek çıktılarıyla güncellenecek. Komut çalıştırılmadan PASS yazılmaz.

- Branch/HEAD: `arena/01a0beda-repo123` / `22ed943` (audit commit; başlangıç snapshot'ı `32c7acb`).
- PR: `#35`, target `main`, state başlangıçta OPEN; final merge sonucu ayrıca doğrulanmadan “merged” denmez.
- Local: `npm run typecheck` başarılı.
- Local: `npm test` **239/239** başarılı.
- Local: `npm run verify:pdf`: **DOĞRULANDI** — 4 A4 sayfa, 566 madde, 1.132 bubble; ortak set kodu `1F49F315B2636DCB4C18C2E4`.
- Local: `npm run build`: **DOĞRULANDI** — `dist/index.html`, `dist/_redirects`, `optik-form.html`; standalone build/PDF/footer/CSP testleri suite içinde başarılı.
- Local: `git diff --check`: **DOĞRULANDI**.
- Local: `npm audit --audit-level=high`: **DOĞRULANDI** — 0 vulnerability.
- Local Vite HTTP smoke: **DOĞRULANDI** — `/`, `/islem`, `/form`, `/kayitlar`, `/yonetim`, `/sss`, `/gizlilik`, `/kullanim`, `/kaynaklar`, `/onizleme` ve bilinmeyen path'ler HTTP 200; `dist/_redirects` mevcut.
- Live Supabase/RLS/Edge: **NOT VERIFIED**.
- Real camera/paper/AT/hosting: **NOT VERIFIED**.
