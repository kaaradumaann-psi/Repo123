# MMPI-566 Optik Cevap Formu ve OMR Okuyucu

A4 optik cevap formu (566 madde), tarayıcıda çalışan optik okuma (OMR) hattı,
kamera/dosya yükleme, sonuç inceleme ekranları, Supabase Auth/RLS tabanlı
kullanıcı akışı ve **hazır yazdırılabilir PDF**. React 19 + TypeScript + Vite.
OMR hesaplaması kullanıcının cihazında yapılır; kimlik ve kayıt yetkisi Supabase
backend'inde doğrulanır.

Güncel mimari, veri güvenliği, yaşam döngüsü ve üretim doğrulama sözleşmesi için
[`SYSTEM.md`](SYSTEM.md) dosyasına bakın.

## Hızlı başlangıç

Node.js 22 veya üzeri gerekir.

```sh
npm ci
cp .env.example .env   # Supabase URL ve publishable/anon anahtarını doldurun
npm run dev             # geliştirme sunucusu -> http://localhost:5173
```

Supabase migration ve Edge Function kurulumu için [`supabase/README.md`](supabase/README.md)
izlenmelidir.

Uygulama hash router değil, History API tabanlı pathname yönlendirmesi kullanır: `/`, `/islem`,
`/form`, `/kayitlar`, `/yonetim`, `/sss`, `/gizlilik`, `/kullanim`, `/kaynaklar` ve
`/onizleme`. `/kayitlar/<uuid>` kayıt ayrıntısıdır. Production barındırmada SPA fallback
gerekir: Cloudflare Workers'ta `wrangler.jsonc` içindeki
`assets.not_found_handling` bunu sağlar; Cloudflare Pages / Netlify için
`PAGES_REDIRECTS=1 npm run build` ayrıca `dist/_redirects` dosyasını üretir.

Uygulamada public kayıt ekranı yoktur. İlk Admin, Supabase
Dashboard/SQL ile bir kez oluşturulur; sonraki Psikolog hesaplarını yalnızca
aktif Admin paneli oluşturabilir. Oturum açıldıktan sonra üç çalışma alanı
olabilir: **Optik form**, **Tara ve gözden geçir**, Psikolog için Supabase'den
kendi **Kayıtlarım** listesi ve yalnızca Admin için **Admin paneli**.

Tarama oturumunda dört sayfa kabul edildiğinde Psikolog için danışan bilgi formu
(ad, soyad, cinsiyet, yaş, meslek, eğitim, uygulanma tarihi, istekte bulunan)
açılır. Kaydetme, mevcut `ItemReadResult` OMR maddelerini dönüştürmeden ham cevap
sayfalarını ve psikolog kimliğini Supabase'e yazar. MMPI profili (T skorları,
profil grafiği, geçerlik ve kod analizi) sunucuda değil, kullanıcının cihazında
hesaplanır: İşlem adımında anlık olarak ve kayıtta **“Testi İncele”** ile açılan
tam sayfada (kayıttaki hızlı giriş / OMR / ham puan verisinden yeniden üretilir).
Kayıt sayfası psikolog çalışma alanı olarak sekmeli bir bilgi mimarisi kullanır
(Profil özeti → Genel Bakış / Geçerlik / Klinik Ölçekler / Kod / Türetilmiş /
Desenler / Kritik / Soru Yanıtları); ayrıntılar yalnızca istendiğinde açılır.
**Yazdır / PDF** düğmesi uygulama arayüzünü değil, yalnızca gerekli MMPI
verisini taşıyan profesyonel klinik raporu basar (`src/components/results/MMPIPrintReport.tsx`);
tarayıcının PDF dosya adı önerisi `MMPI_Klinik_Raporu_<Danisan>_<gg-AA-yyyy>`
biçiminde test tarihinden üretilir. Uygulamada kullanılan bilimsel/teknik
kaynaklar tek bir **Kaynaklar / Kaynakça** sayfasında (`/kaynaklar`, alt
bilgiden açılır; sabit içindekiler şeridi ve numaralı bölümlerle) künye +
uygulamadaki karşılıklarıyla listelenir; raporlara yalnızca kısa yöntem notu
taşınır. Sitenin tam alt bilgisi (marka + slogan, **Yeni Veri Girişi**, **SSS**,
**Gizlilik & KVKK Politikası**, **Kullanım Koşulları**, **Kaynakça**, iletişim
ve telif/kredi şeridi) her ekranda — çalışma alanı, giriş/kurulum, bilgi
sayfaları — aynı düzenle görünür; SSS (`/sss`), Gizlilik & KVKK (`/gizlilik`)
ve Kullanım Koşulları (`/kullanim`) sayfaları oturum açmadan da okunabilir
(kabuk: `InfoPageShell`, içerik: `FaqPage`, `PrivacyPolicyPage`, `TermsPage`,
ortak politika düzeni: `PolicyDoc`, stiller: `src/styles/site.css`).
Supabase yapılandırılmadan önce sonuç
ekranlarının tamamı `/onizleme` rotasındaki örnek veriyle incelenebilir (bu
rota yalnızca yapılandırılmamış kurulumda açılır; veriler gerçek kayda ait
değildir).
T skorlarının hesabı Savaşır (1981) Türk normlarına ve klasik K düzeltme
standart ekleme tablosuna dayanır; **yorum katmanı** klinik MMPI yorumlama
kaynağına birebir dayanır: geçerlik analizleri (?) “Hiç Bir Şey Diyemem”, L, F, K
ham puan tabloları ve L/F/K T puanı aralıklarıyla, klinik ölçek yorumları ölçeğe
özgü T puanı bantlarıyla (Mf erkek/kadın ayrı), tek ölçek yükselmeleri ve iki
noktalı kod analizleri kaynaktaki metin ve olası tanılarla üretilir. F-K
endeksinde kaynak sınırı 16’dır; boş madde ≥ 31 veya F ham ≥ 23 ise profil
geçersiz sayılır (`src/scoring/mmpiSource.ts`, `src/scoring/mmpiSourceCodes.ts`).

Cevap dizisi olan kayıtlarda **madde düzeyi analiz katmanı** da hesaplanır
(`src/scoring/mmpiConsistency.ts`, `mmpiValidityConfigs.ts`, `mmpiDerived.ts`,
`mmpiCritical.ts`): TR (tekrarlanmış maddeler) endeksi ve Dikkatsizlik endeksi
ile tutarlılık değerlendirmesi, 15 geçerlik profili konfigürasyonu (V Şekli,
Tersine V, tümüne yanlış vb.), Goldberg / Taulbee / Peterson ayırma endeksleri,
11 kişilik bozukluğu ölçeği (PDI-IV), alkol/madde kullanım ölçekleri (MacAndrew,
MAC-R, AAS), 13 Wiggins içerik ölçeği ve özel ölçekler (Barron Ego Gücü, Welsh
A/R, Aşikâr Anksiyete, Prejudice, Hostility), 38 kritik patolojik madde
taraması (intihar, zarar verme, alkol/madde, ajitasyon, paranoya) ve 16 otomatik
klinik izlenim. Ham puan girişlerinde bu katman yerine kaynak tablo bandı
gösterilir.

Kimlik oturumu Supabase Auth tarafından yönetilir ve bu frontend'de
`persistSession: true` ile **`sessionStorage`**'da tutulur: aynı sekmede F5
oturumu korur, sekme kapanınca düşer. (İşlem taslağı ayrı bir yerel depodur;
veri sorumluluğu için bkz. Kapsam ve sınırlamalar.) Rol ve kayıt
erişimi hâlâ RLS + `profiles.active` ile doğrulanır. Parolalar uygulama
tablolarına yazılmaz. Admin hesap oluşturma/aktiflik değişikliği doğrulanmış
Edge Function üzerinden yapılır.
Form sayfasında **Yazdır**, **İndir** ve **Yeni sekmede aç** eylemleri vardır; üçü de doğrulanmış 4
sayfalık A4 PDF'yi kullanır (HTML `window.print()` değil). Hepsi
`MMPI-566-optik-cevap-formu.pdf` baytlarını kullanır; bu dosya hem dosyadan geri
okunup geometrisi doğrulanan (`tests/pdfForm.test.ts`) hem de rasterleştirilip
gerçek okuma hattından geçirilen (`tests/pdfScanPipeline.test.ts`) dosyadır.

### Kendi sitenize koymak

```sh
npm run build
```

İki HTML çıktısı üretir (SPA fallback'i barındırmaya göre ayrıca üretilir):

| Çıktı | Ne işe yarar |
| --- | --- |
| `dist/index.html` | React, CSS ve pdf.js worker'ı gömülü statik çıktı. Supabase URL/anon anahtarı build sırasında `.env`'den alınır. |
| `optik-form.html` | Aynı self-contained HTML'nin depo kökündeki kopyası. OMR/form önizlemesi çevrimdışı çalışabilir; giriş ve kayıt için Supabase erişimi gerekir. |
| `dist/_redirects` | Yalnızca `PAGES_REDIRECTS=1 npm run build` ile üretilir; Cloudflare Pages / Netlify SPA fallback kuralıdır (`/*  /index.html  200`). Workers bu catch-all kuralı reddettiği için (code 100324) varsayılan derlemede yazılmaz; SPA davranışını `wrangler.jsonc` içindeki `assets.not_found_handling` sağlar. |
| `dist/_headers` | Her derlemede üretilir; tüm rotalara HTTP güvenlik başlıkları ekler (HSTS, `X-Content-Type-Options`, `X-Frame-Options` + `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP). Workers statik varlıkları, Pages ve Netlify bu dosyayı yerel olarak destekler; dosyanın kendisi servis edilmez. |

#### Cloudflare Workers'a yayınlama

Depodaki `wrangler.jsonc`, `dist/` klasörünü statik varlık olarak yayınlar
(sunucu tarafı Worker kodu yoktur; Supabase ayrı çalışır):

```sh
npm ci
npm run build          # dist/index.html
npm run deploy         # = npm run build && npx wrangler deploy
```

`wrangler.jsonc` olmadan `wrangler deploy`, Vite projesini otomatik
yapılandırmaya çalışır (`@cloudflare/vite-plugin` kurup `vite.config.ts`'i
yeniden yazar) ve bu depo Vite ile derlenmediği için
`Cannot modify Vite config: could not find a valid plugins array` hatasıyla
durur. Yapılandırma dosyası bu adımı tamamen atlatır, bu yüzden dosya depoda
tutulur ve silinmemelidir. Aynı nedenle `vite.config.ts` içine boş bir
`plugins` dizisi eklemek de yanlış çözümdür: o durumda wrangler kurulumu
tamamlar ve deploy edilen çıktı bu deponun tek dosya derlemesinden değil, Vite
derlemesinden gelir.

##### `Invalid _redirects configuration` (code 100324)

SPA fallback iki barındırmada iki farklı yolla sağlanır ve **ikisi aynı anda
kullanılamaz**:

- **Workers:** `assets.not_found_handling: "single-page-application"` —
  eşleşmeyen pathname'lerde `index.html` döner.
- **Pages / Netlify:** `_redirects` içindeki `/*  /index.html  200` kuralı.

`dist/_redirects` dosyası Workers yayınında bulunursa wrangler onu ayrıca
yükleyip API'ye doğrulatır ve deploy şu hatayla durur:

```
Invalid _redirects configuration:
Line 1: Infinite loop detected in this rule. [code: 100324]
```

Kural `/index.html` isteğini yeniden kendine yönlendirdiği için Workers bunu
sonsuz döngü sayar. Worker'a yayınlıyorsanız `dist/` içinde `_redirects`
**olmamalıdır**; bu yüzden derleme o dosyayı ne yazar ne de eski kopyasını
bırakır. Pages/Netlify'a yayınlıyorsanız `PAGES_REDIRECTS=1 npm run build`
kullanın (bu değişkeni Cloudflare build değişkenlerine eklemeyin, aksi halde
Workers yayını yine 100324 ile durur).

##### Yapılandırmanın production ile aynı olması

`wrangler.jsonc` içindeki `routes` (custom domain
`mmpi.halilkaraduman.com.tr`), `workers_dev: false` ve `preview_urls: false`
paneldeki mevcut durumu yansıtır. Bunlar yazılmazsa `wrangler deploy` uzak
yapılandırmayı yerel dosyayla ezer: workers.dev adresi açılır ve custom domain
düşer. Farklı bir hesaba/zone'a yayınlıyorsanız `routes` bloğunu kendi alan
adınızla güncelleyin ya da silin.

Cloudflare panelinde (Workers & Pages → proje → Settings → Build) beklenen
ayarlar:

| Ayar | Değer |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (production derlemesi bu değerleri gömer) |

Build değişkenleri build ortamına ulaşmazsa derleme, çevrimdışı bir sürüm
üretir ve günlüğe hangi değerin eksik olduğunu yazar
(`UYARI: Supabase yapılandırması eksik — VITE_SUPABASE_URL: var, …`). Bu uyarı
varsa site açılır ama giriş/kayıt çalışmaz ve CSP'de `connect-src` bulunmaz;
değerleri panelin **Builds → Variables and secrets** bölümüne ekleyin (runtime
secrets build zamanında görünmez).

`wrangler.jsonc` içindeki `name`, paneldeki Worker (proje) adıyla aynı
tutulmalıdır. Workers Builds, bağlı Worker'ın adını
`WRANGLER_CI_OVERRIDE_NAME` ile geçersiz kılar; yine de yerel `npm run deploy`
çağrıları doğru Worker'a gitmesi için proje adınız farklıysa (ör. `mmpi-566`)
`wrangler.jsonc` içindeki `name` alanını paneldeki adla aynı yapın.

Cloudflare **Pages** kullanacaksanız `PAGES_REDIRECTS=1 npm run build` ile
derleyin ve deploy komutunu
`npx wrangler pages deploy dist --project-name=<pages-projesi>` yapın.

`wrangler.jsonc` ekleyemediğiniz bir durumda Deploy command'ı
`npx wrangler deploy --assets=./dist` yapmak da çalışır (yerelde `--dry-run`
ile doğrulandı); ancak bu durumda SPA fallback ayarı uygulanmaz ve derin
linkler (`/form`, `/kayitlar/...`) 404 döner. Kalıcı çözüm, yapılandırma
dosyasının depoda kalmasıdır.

Statik frontend barındırmada çalışır (Netlify, Vercel, nginx, S3); Supabase
backend ayrıca çalışır. Kamera için **HTTPS zorunludur** (`getUserMedia` güvenli
bağlam ister); yerel geliştirmede `localhost` ve `127.0.0.1` güvenli bağlam istisnasıdır. Build, inline betiğin SHA-256
hash'ine bağlı CSP'yi korur; Supabase çağrıları için yayınlanan origin'in
Edge Function `ALLOWED_ORIGINS` ayarına eklenmesi gerekir.

## Yazdırılabilir optik form

Hazır dosya depoda: **`MMPI-566-optik-cevap-formu.pdf`** — 4 sayfa, A4 dikey,
242 KB, 1.132 boş D/Y dairesi.

Yeniden üretmek ve doğrulamak:

```sh
npm run pdf           # MMPI-566-optik-cevap-formu.pdf üretir
npm run verify:pdf    # üretilen dosyayı bağımsız olarak doğrular
```

PDF, tarayıcının CSS yazıcısından **bağımsız** bir üreticidir
(`src/print/`), ama koordinatları aynı `FormDefinition`'dan okur. Yani basılı
daire merkezleri ile okuyucunun beklediği koordinatlar aynı kaynaktan gelir.

Yazdırma ayarları: **A4 · Dikey · %100 (Gerçek boyut) · Kenar boşluğu yok ·
Üst/alt bilgi kapalı · Tek yüz · Siyah-beyaz.** “Sayfaya sığdır” seçeneğini
açmayın. İlk baskıda köşe karelerini kumpasla 5 mm olarak ölçün.

## Arayüz tasarım dili

Ekran arayüzü, yazarın kendi sitesi **www.halilkaraduman.com.tr** ile aynı görsel
dili kullanır: kâğıt beyazı yüzeyler, mürekkep siyahı metin, kıl payı (1 px)
çerçeveler, tek bir mavi vurgu ve ağırlıksız serif başlıklar.

| Katman | Dosya | İşi |
| --- | --- | --- |
| Token'lar | `src/styles/screen.css` → `:root` | Sitenin paleti, yazı tipi yığınları, yarıçaplar ve gölgeler. `--slate-*` / `--primary-*` adları bileşenlerin zaten kullandığı adlara eşlenir. |
| Tasarım katmanı | `src/styles/theme.css` | Token'ları bileşenlere uygular. `main.tsx`'te **en son** içe aktarılır; böylece diğer üç stil dosyasının kurallarını davranışına dokunmadan inceltir. Tamamı `@media screen` içindedir: yazdırılabilir A4 sayfası bu dosyadan tek bir bildirim almaz. |

Site 780 px'lik tek bir editoryal sayfa olduğu için birebir düzen değil, **dil**
taşınmıştır: aynı token'lar, aynı tipografi hiyerarşisi, aynı yüzey anlayışı;
tablolar, formlar ve çalışma alanları bunun üzerine kuruludur.

- **Birincil eylem** mürekkep siyahı hap düğmedir; **vurgu mavisi** yalnızca
  durum, bağlantı ve odak halkası için kullanılır.
- Gövde yazı tipi **DM Sans**, başlıklar **Newsreader** (300). İkisi de yayın
  bütününde uzaktan yüklenmez; kurulu değilse sistem karşılıkları kullanılır ve
  çevrimdışı derleme (`font-src 'none'`) bozulmaz.
- Yazdırılabilir form geometrisi (`form.css`, `print.css`) bu katmandan etkilenmez.

## Nasıl kontrol edersiniz

```sh
npm run typecheck   # tsc --noEmit
npm test            # tüm test dosyaları
npm run build       # tip kontrolü + tek dosya çıktı
npm run pdf         # optik formu üret
npm run verify:pdf  # üretilen PDF'i doğrula
```

Canlı kurulumun (Supabase şeması, RLS, grant'lar, trigger'lar ve iki Edge
Function'ın CORS'u) doğrulaması için bağımlılıksız teşhis betiği:

```sh
SUPABASE_URL=https://<proje-ref>.supabase.co \
SUPABASE_SERVICE_KEY=<service_role> \
SITE_ORIGIN=https://uygulama-adresiniz \
npm run diagnose:supabase          # --allow-destructive ile uçtan uca yazma/silme testi
```

Üretimde görülen `400` / “Kayıt bulunamadı…” / “Kullanıcı hesabı silinemedi”
belirtilerinin kök nedenleri ve çözüm sırası [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
içindedir.

`npm test` şunları çalıştırır: form geometrisi, kimlik alanlarının yalnızca
1. sayfada olması, homografi/benzerlik matematiği, sentetik görüntüler üzerinde
OMR (boş, güçlü, silik, silinmiş, çoklu, çelişen iz, eksik köşe karesi, kesik
sayfa, düşük ışık, gölge, bulanıklık, 90/180/270° ve 17° dönüş, projektif
çarpıklık), güvenlik red yolları, sonuç doğrulama/elle inceleme, **üretilen
PDF'in dosyadan geri okunup tanımla karşılaştırılması**, **depodaki PDF'in
rasterleştirilip gerçek OMR hattından geçirilmesi** (4 sayfa kabul, 566 madde
boş okunuyor, sayfalar tek tek kabul ediliyor), **pdf.js worker sertleştirmesinin
pin'lenmiş sürümde başvurduğu sembollerin varlığı** ve **tek dosya derlemenin
CSP hash doğrulaması**, **kayıt/Edge Function hata çevirisinin** (PostgREST kodları
`42703/PGRST204`, `42P01/PGRST205`, `42501`, `23502`, `P0001`, `PGRST116`,
`PGRST301/302` ve HTTP 401/403/404/413/429/500 için eyleme dönüştürülebilir mesaj;
satır içeriği taşıyan `details` alanının loglanmadığının kanıtı), iki Edge Function'ın
**kaynak sözleşmesinin** (esbuild ile sözdizimi, en dışta `try/catch`, ham hata
mesajının istemciye dönmemesi, CORS/rol kapılarının korunması) ve **teşhis betiği
sözleşmesinin** (beklenen migration listesi, salt-okunur varsayılan). Supabase Auth
ve kayıt çağrıları doğal olarak backend'e HTTPS bağlantısı gerektirir.
Toplam **285 test** 18 dosyada koşar.

Ayrıca GitHub Actions CI (`.github/workflows/ci.yml`) her push/PR'da tip kontrolü,
testler, PDF doğrulaması ve derlemeyi çalıştırır; commit'li `optik-form.html`'in
derleme çıktısından sapmasını reddeder.

## Kapsam ve sınırlamalar

Bunlar tasarım kararları değil, **doğrulanmamış varsayımlardır**.

- Bu bir **yerleşim şablonudur** (`source: 'unverified-template'`). Yetkili MMPI
  formunun birebir kopyası değildir; lisanslı madde düzeniyle eşdeğerliği
  doğrulanmamıştır.
- 1–566 madde **numaraları** ve boş D/Y daireleri vardır. Madde metni, cevap
  anahtarı veya klinik içerik yoktur ve uydurulmamıştır.
- `D = Doğru / Y = Yanlış` iki seçenekli düzen bir varsayımdır; yetkili
  materyalle doğrulanmalıdır.
- OMR eşikleri yalnızca **sentetik raster örneklerle** sınanmıştır. Gerçek
  kamera, fotokopi, kalem veya baskı üzerinde kalibre edilmemiştir; bu yüzden
  doğruluk yüzdesi iddia edilmez. `confidence` sezgisel bir işaret gücüdür,
  olasılık değildir.
- Klinik puanlama ve raporlama ekranı vardır; sonuç API'si yoktur. Kayıt akışı Supabase
  `mmpi_records` tablosuna ham/quick/OMR cevaplarını ve danışan metadata'sını
  yazar; `summarizeResults()` her zaman `clinicalTransferAllowed: false` döndürür.
  T skoru / profil grafiği hesabı tamamen istemcide yapılır (`src/scoring/`) ve
  sunucuya klinik sonuç özeti yazılmaz.
- Yalnızca `reliable` maddeler algoritma cevabı sayılır; `single` ve `ambiguous`
  her zaman insan incelemesi ister.
- Formda kişisel veri saklanmaz. Form kimliği, katılımcı kodu ve tarih yalnızca
  basılı kağıda el yazısıyla girilir ve **yalnızca 1. sayfada** bulunur.
- İşlem taslağı (danışan bilgileri, cevaplar, taranmış sayfa verisi — görüntü
  hariç) F5, tarayıcı çökmesi ve internet kesintisinde kaybolmasın diye
  tarayıcının `localStorage` alanına kullanıcıya özel anahtarla yazılır, 30 gün
  sonra atılır ve “Yeni işlem” ile silinir. Ortak kullanılan bir bilgisayarda bu
  taslak cihazda kalır; kayıt yalnızca kaydedildiğinde sunucuya gider.
- Kaydetme başarısız olursa işlem, aynı idempotency anahtarıyla yerel kuyruğa
  (outbox) alınır ve bağlantı gelince otomatik tekrarlanır; çift kayıt oluşmaz.
- Telif riski taşıyan tarama/paket dosyaları depoda izlenmez; yerel arşivde
  tutulur (`yerel-kaynaklar/`, `.gitignore`).

## Sabit form geometrisi

| Özellik | Değer |
| --- | --- |
| Şablon kimliği / sürüm | `MMPI566-DY-3C48-V2` / `2.0.0` |
| Yerleşim özeti (SHA-256) | `1F49F315B2636DCB4C18C2E48242AA09B560B8737F81E2E502DFA9109016E280` |
| Kağıt | A4, 210 × 297 mm, dikey |
| Sayfa sayısı / aralıklar | 4 · 1–144, 145–288, 289–432, 433–566 |
| Düzen | 3 sütun × 48 satır; son sütunda 38 madde |
| İşaretleme dairesi | 3,5 mm dış çap, 0,3 mm içe doğru siyah sınır |
| Satır aralığı | Merkezden merkeze 4,25 mm |
| D/Y yatay merkezleri | Sütun içinde 27 mm ve 43 mm (16 mm arayla) |
| Cevap ızgarası | x = 20 mm, y = 60 mm; başlık 7 mm |
| Sütun genişliği / aralığı | 51,333… mm / 8 mm |
| Köşe işaretleri | 5 × 5 mm; sol üst köşeleri (10,10), (195,10), (195,282), (10,282) mm |
| Sayfa QR alanı | x = 164, y = 18, 26 × 26 mm — her sayfada, cevap alanlarından ayrı |
| Normalize görüntü | 8 px/mm → 1680 × 2376 piksel |
| Toplam işaretleme alanı | 1.132 (566 madde × 2 seçenek) |

Sayfalar sütun boyunca yukarıdan aşağı, sonra soldan sağa numaralandırılır. Son
sayfadaki kullanılmayan satırlarda daire veya numara üretilmez.

### Sayfa kimliği

Her sayfanın QR metni: `M566:sürüm:yerleşim özeti:baskı seti:sayfa:toplam`.
Aynı oturumda yazdırılan dört sayfa aynı baskı seti kimliğini taşır; eksik,
yinelenen veya başka bir sete ait sayfa reddedilir. Depodaki hazır PDF sabit bir
şablon seti kimliği kullanır (`npm run pdf <dosya> <24 haneli set kimliği>` ile
değiştirilebilir); uygulamanın FormKit akışı bu doğrulanmış sabit set kodunu kullanır; yeni danışan için **Yeni Set / Sıfırla** akışı kullanılır.

## Mimari

| Yol | Görev |
| --- | --- |
| `src/omr/omrTypes.ts` | Ortak veri modeli: `FormDefinition`, `PageDefinition`, `ItemDefinition`, `ResponseArea`, `AlignmentMark`. Koordinatlar kağıdın sol üstünden **milimetre**. |
| `src/omr/formDefinition.ts` | Şablon sabitleri, sayfa/madde üretimi, SHA-256 yerleşim özeti, `getBubbleGeometry()`. |
| `src/form/layout.ts` | Bileşenlerin kullandığı tek içe aktarma yüzeyi. |
| `src/form/pageIdentity.ts` | Baskı seti kimliği, QR metni kodlama/çözümleme, QR modül geometrisi. |
| `src/omr/qrDecoder.ts` | jsQR ile çok ölçekli / invert sayfa kimliği okuma (≤4 MP). |
| `src/omr/pageIsolation.ts` | Masa fotoğrafında kağıdı kırpma; tam kenarlı PDF'de no-op. |
| `src/omr/perspectiveCorrection.ts` | `fitHomography`, `fitSimilarity`, `mapPoint`, `inspectPageGeometry`, `warpPerspective`. |
| `src/omr/alignmentDetector.ts` | Köşe karelerini bağlı bileşen analiziyle bulma; çoklu eşik, karelik 0.84. |
| `src/omr/imageQuality.ts` | Üç kademeli kalite: ideal / inceleme / okunamaz. |
| `src/omr/markDetector.ts` | Bubble geometri maskeli merkez/peripheral/zemin örneklemesi, komşu bubble izolasyonu ve debug ölçümleriyle madde durumu; `reliable` yalnız `quality.ok`. |
| `src/omr/analyzePage.ts` | Saf dizilerle çalışan sayfa hattı; fatal kalitede cevap üretmez. |
| `src/results/*` | Sonuç tipleri, OMR sınırını güvenilmez sayan doğrulama, özetleme. |
| `src/scoring/*` | MMPI puanlama anahtarları, Türk normları, K düzeltmesi ve klinik yorum kaynağına birebir dayanan geçerlik/klinik/kod yorum katmanı; madde düzeyi analiz (TR/Dikkatsizlik endeksleri, konfigürasyonlar, türetilmiş ölçekler, kritik maddeler). |
| `src/auth/*` | Supabase Auth istemcisi, profil/rol doğrulaması ve Admin Edge Function çağrıları. |
| `src/workspace/*` | İşlem taslağı (localStorage, 30 gün TTL) ve çevrimdışı kayıt kuyruğu; `ItemAnswer` modeli. |
| `src/preview/*` | `/onizleme` tasarım önizlemesi için deterministik demo profilleri (gerçek kayıt yazmaz). |
| `src/records/*` | Ham OMR maddelerini bozmadan Supabase kayıt payload'ı ve idempotent gönderim. |
| `supabase/*` | Migration, ilişkiler, RLS politikaları, Auth trigger'ı ve Admin Edge Function. |
| `src/scanner/*` | Görüntü/PDF girişi, boyut sınırları, sayfa sırası, elle inceleme kayıtları. |
| `src/print/*` | PDF yazıcısı, TrueType gömme ve form sayfası çizimi (tarayıcı gerektirmez). |
| `src/components/*` | Form sayfaları, önizleme, kamera, tarama alanı, sonuç incelemesi. |
| `scripts/build.mjs` | Tek dosya production derlemesi (`optik-form.html` / `dist/index.html`). |
| `wrangler.jsonc` | Cloudflare Workers statik varlık yayını: `dist/` + SPA fallback. Wrangler'ın Vite otomatik yapılandırmasına girmesini engeller. |
| `scripts/generate-pdf.ts`, `printFonts.ts`, `verify-pdf.ts` | Yazdırılabilir form PDF üretimi ve bağımsız doğrulama. |
| `scripts/diagnose-supabase.mjs` | Canlı Supabase teşhisi (`npm run diagnose:supabase`): migration geçmişi, şema, RLS politikaları, grant'lar, trigger'lar, `audit_logs` sözleşmesi, `admin-users` + `ai-interpretation` CORS'u; yazma/silme testi yalnız `--allow-destructive` ile. Harici bağımlılık yok. |
| `TROUBLESHOOTING.md` | Canlı ortam hata kümesinin (400 / silme yetkisi / hesap silme) kök neden tablosu, `supabase db push` + `functions deploy` + `secrets set` çözüm sırası ve hata kodu → neden eşlemesi. |
| `docs/kaynak-denetimi.md` | Puanlama/yorum bileşenlerinin kaynak denetimi: künye–bileşen eşleştirme tabloları ve doğrulanamayan kesimlerin dürüstlük kaydı. |

Form tanımı, görsel tasarım ve PDF üreticisi aynı `FormDefinition` örneğini
paylaşır; koordinat kaynağı tektir.

## Doğrulama

Özet: tip kontrolü temiz, sentetik + PDF testleri geçiyor,
derleme çalışıyor, üretilen PDF dosyadan geri okunup doğrulanıyor ve aynı PDF
rasterleştirilip gerçek okuma hattından geçiriliyor. Gerçek kağıt, gerçek
kamera ve lisanslı form düzeni bu ortamda doğrulanmadı.
