# MMPI-1 PRODUCTION VALIDATION — RUNBOOK

**Bu belge, teknik derinliği olmayan bir kullanıcının kendi Windows bilgisayarında gerçek production doğrulamasını adım adım çalıştırabilmesi için yazılmıştır.**

- Araç: `npm run validate:production`
- Amaç: sistemin gerçekten güvenli ve production'a hazır olup olmadığını **kanıtla** görmek
- Altın kural: `BLOCKED` = kanıt eksikliği (başarısızlık değil). `PASS` yalnızca gerçek kanıtla verilir. **OMR bu aracın kapsamı dışındadır** — fiziksel testi siz ayrıca yapacaksınız.

---

## Prerequisites (Ön koşullar)

1. **Windows 10/11 (64-bit)** ve yönetici olmayan normal kullanıcı hesabı yeterlidir.
2. **Node.js 22 veya üzeri.** Kontrol etmek için PowerShell'de:
   ```powershell
   node --version
   ```
   `v22.x.x` veya üzeri görmelisiniz. Yoksa: https://nodejs.org adresinden LTS sürümünü kurun (kurulumda "Add to PATH" seçili kalsın).
3. **Git** (repoyu indirdiyseniz muhtemelen var).
4. İnternet bağlantısı (production domain ve Supabase'e erişim).
5. Aşağıdaki hesap bilgileri (kendi Supabase projenizden):
   - Proje URL'si ve **anon/publishable** anahtar (Supabase Dashboard → Project Settings → API)
   - (İsteğe bağlı, derin şema doğrulaması için) **service_role** anahtarı — *gizli tutun*

## Windows setup (Kurulum — bir kez)

PowerShell'i açın (Başlat → "PowerShell" yazın → Enter) ve sırayla:

```powershell
# 1) Repoya gidin (kendi yolunuzu yazın)
cd C:\Users\<KullaniciAdiniz>\Repo123

# 2) Bağımlılıkları kurun
npm install

# 3) (Browser E2E için — sonra da yapılabilir)
npm i -D playwright
npx playwright install chromium firefox webkit
```

> `npx playwright install` tarayıcı kopyalarını indirir (birkaç yüz MB). İstemezseniz bu adımı atlayabilirsiniz; o zaman `Browser E2E` bölümü `BLOCKED` kalır (bu bir hata değildir, sadece o kapı doğrulanmamış olur).

## Environment variables (Ortam değişkenleri)

Değerleri iki yoldan birini seçerek verin:

### Yol 1 (ÖNERİLEN): `.env.local` dosyası

Repo klasöründe `.env.production-validation.local` adında bir dosya oluşturun (Not Defteri ile oluşturup kaydederken "Tüm dosyalar" türünü seçin). Bu dosya **Git'e asla girmez**.

```ini
SUPABASE_URL=https://<sizin-proje-refiniz>.supabase.co
SUPABASE_ANON_KEY=<sizin anon/publishable anahtarınız>
PRODUCTION_URL=https://mmpi.halilkaraduman.com.tr

TEST_USER_A_EMAIL=<disposable psikolog A e-postası>
TEST_USER_A_PASSWORD=<disposable psikolog A şifresi>
TEST_USER_B_EMAIL=<disposable psikolog B e-postası>
TEST_USER_B_PASSWORD=<disposable psikolog B şifresi>
TEST_ADMIN_EMAIL=<disposable admin e-postası>
TEST_ADMIN_PASSWORD=<disposable admin şifresi>
TEST_INACTIVE_EMAIL=<disposable pasif hesap e-postası>
TEST_INACTIVE_PASSWORD=<disposable pasif hesap şifresi>

SUPABASE_SERVICE_ROLE_KEY=<sizin service_role anahtarınız>
VALIDATION_RECORD_ID=<User A'ya ait validation kaydının UUID'si>

LIVE_MATRIX_ALLOW_WRITES=YES
PRODUCTION_VALIDATION_CONFIRM=YES
```

> **Değerleri UYDURMAYIN.** Kendi projenizin değerlerini kullanın. `SUPABASE_SERVICE_ROLE_KEY` opsiyoneldir; vermezseniz derin şema bölümü `BLOCKED` kalır (runbook "Supabase setup" bölümünde elle doğrulama yolu vardır).

### Yol 2: PowerShell oturum değişkenleri

Her yeni PowerShell penceresinde tekrar tanımlamanız gerekir:

```powershell
$env:SUPABASE_URL="https://<proje-ref>.supabase.co"
$env:SUPABASE_ANON_KEY="<anon anahtar>"
$env:PRODUCTION_URL="https://mmpi.halilkaraduman.com.tr"
$env:TEST_USER_A_EMAIL="..."
$env:TEST_USER_A_PASSWORD="..."
$env:TEST_USER_B_EMAIL="..."
$env:TEST_USER_B_PASSWORD="..."
$env:TEST_ADMIN_EMAIL="..."
$env:TEST_ADMIN_PASSWORD="..."
$env:TEST_INACTIVE_EMAIL="..."
$env:TEST_INACTIVE_PASSWORD="..."
$env:SUPABASE_SERVICE_ROLE_KEY="..."
$env:LIVE_MATRIX_ALLOW_WRITES="YES"
$env:PRODUCTION_VALIDATION_CONFIRM="YES"
```

> Bu değerler terminale asla yansıtılmaz (toolkit yalnızca `configured`/`missing` yazar).

## Supabase setup (Supabase hazırlığı)

1. **Migration'ların uygulandığından emin olun.** Bu araç migration **çalıştırmaz** (kural §28). Şüpheniz varsa Supabase SQL Editor'da `supabase/migrations/` altındaki dosyaları tarih sırasıyla uygulayıp uygulamadığınızı kontrol edin; ya da Supabase CLI kuruluysa:
   ```powershell
   npx supabase login
   npx supabase link --project-ref <proje-ref>
   npx supabase migration list
   ```
   Araç, service key verdiyseniz geçmişi otomatik karşılaştırır; vermediyseniz `Remote migrations` bölümü `BLOCKED` olur.
2. **Public signup kapalı olmalı:** Dashboard → Authentication → Sign In / Up → "Allow new users" → **kapalı** (bu, repo politikasıdır; araç canlı ölçer).
3. **Edge Functions dağıtılmış olmalı:** `admin-users` ve `ai-interpretation` (Dashboard → Edge Functions). Dağıtmak için (CLI varsa):
   ```powershell
   npx supabase functions deploy admin-users
   npx supabase functions deploy ai-interpretation
   ```
4. **ALLOWED_ORIGINS sırrı:** Dashboard → Edge Functions → Secrets: `ALLOWED_ORIGINS=https://mmpi.halilkaraduman.com.tr`
5. **AI sırları (yalnızca AI yorumu kullanıyorsanız):** `AI_API_KEY`, `AI_MODEL` — bunlar **sunucuda** kalır; frontend'e ASLA konmaz.

### Derin şema doğrulamasını elle yapmak isterseniz (service key vermeden)

Dashboard → SQL Editor'da çalıştırın ve çıktıyı saklayın:

```sql
select c.relname as tablo, c.relrowsecurity as rls_aktif
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by c.relname;

select version from supabase_migrations.schema_migrations order by version;
```

Beklenen: 7 tablonun tamamında `rls_aktif = true`; 6 migration satırı (20260915…–20260923…).

## Disposable test users (Tek kullanımlık test hesapları)

**Gerçek danışan/kullanıcı verisi kullanılmaz.** Dört ayrı e-posta adresi gerekir (Gmail kullanıyorsanız `adres+testa@gmail.com` biçimi çoğu durumda çalışır):

1. Dashboard → Authentication → Users → **Add user** ile üç hesap açın:
   - `…+pv-a@…` (User A), `…+pv-b@…` (User B) → normal psikolog olacaklar
   - `…+pv-admin@…` (Admin olacak)
2. Admin hesabını yetkilendirin (SQL Editor, tek sefer):
   ```sql
   update public.profiles set role='ADMIN', active=true
   where email = '<admin-test-epostasi>';
   ```
3. Pasif hesabı oluşturun ve pasifleştirin: ya uygulamadan Admin paneliyle `…+pv-inactive@…` hesabını **set_active: false** yapın, ya da SQL:
   ```sql
   update public.profiles set active=false
   where email = '<inactive-test-epostasi>';
   ```
4. Bu dört e-posta/şifre çiftini `.env.production-validation.local` içine yazın.

> Toolkit üretilen tüm veriyi `MMPI_PROD_VALIDATION` / `mmpi-prod-validation-` etiketiyle işaretler ve koşu sonunda kendi ürettiği fixture'ları siler. Gerçek verilerinize **asla** yazmaz/silmez.

## Browser setup (Tarayıcı kurulumu)

Browser E2E kapısını açmak için (zorunlu değildir):

```powershell
cd C:\Users\<KullaniciAdiniz>\Repo123
npm i -D playwright
npx playwright install chromium firefox webkit
```

Kimlikler yalnızca `.env.production-validation.local` / ortam değişkenlerinden okunur; koda **hiçbir zaman** e-posta/şifre yazmayın (kural §38).

Derin akış (kayıt → rapor → PDF) için ek adım: User A ile uygulamaya girip `MMPI_PROD_VALIDATION` adında sahte bir kayıt açın, kaydın UUID'sini (tarayıcı adres çubuğundaki `/kayitlar/<uuid>` kısmı) `VALIDATION_RECORD_ID` olarak yazın. Bu yoksa derin akış `SKIPPED` kalır; giriş/koruma akışları yine doğrulanır.

## Running validation (Çalıştırma)

```powershell
cd C:\Users\<KullaniciAdiniz>\Repo123
npm run validate:production
```

İlk koşu test paketini de içerir (~3-5 dakika). Hızlı tekrarlar için:

```powershell
$env:PRODUCTION_VALIDATION_SKIP_TESTS="YES"
npm run validate:production
$env:PRODUCTION_VALIDATION_SKIP_TESTS=$null
```

Belirli bölümleri tek başına:

```powershell
npx node scripts/production-validation/run-all.mjs --only tls,headers,secrets
npx node scripts/production-validation/run-all.mjs --only rls,idor,deletion,edge
```

## Live RLS validation (Canlı RLS — ne olur?)

Araç, mevcut `scripts/run-live-security-matrix.mjs` koşucusunu **yeniden kullanır**: dört rolle (anonim, A, B, admin, inactive) gerçek REST çağrıları yapar; A↔B çapraz erişim denemelerinde **0 satır** bekler (HTTP 200 + boş liste de reddir — tuzağa düşmeyin). Yanıt kayıtları saklanmaz, yalnızca durum/satır sayısı.

- `LIVE_MATRIX_ALLOW_WRITES` kapalıysa: yazma senaryoları atlanır (SKIPPED), salt-okunur kanıtlar koşulur; fixture'lar önceden üretildiyse yeniden keşfedilir.
- `LIVE_MATRIX_ALLOW_WRITES=YES` iken: etiketli sahte kayıt/rapor/şablon/ayar üretilir; UPDATE/DELETE IDOR denemeleri + üretim bütünlüğü kanıtlanır; koşu sonunda temizlenir.

## Deletion validation (Silme doğrulaması)

İki kilit **birden** açıkken çalışır: `LIVE_MATRIX_ALLOW_WRITES=YES` ve `PRODUCTION_VALIDATION_CONFIRM=YES`.

Akış: admin-users Edge Function'ı ile **`mmpi-prod-validation-` önekli tek kullanımlık psikolog üretilir** → fixture zinciri açılır → aynı function ile silinir → profile/record/report/version/settings/template cascade'inin **0 satır** kaldığı admin gözüyle doğrulanır → eski JWT'nin öldüğü ve tekrar giriş yapılamadığı kanıtlanır. **Gerçek kullanıcıya asla dokunulmaz.**

## Production HTTP validation

Araç canlı domaine gerçek istekler atar: `GET /`, HTTP→HTTPS davranışı, SPA fallback (`/kayitlar`), asset yüklenmesi, TLS sertifikası (geçerlilik/protokol), canlı güvenlik başlıkları (HSTS/nosniff/CSP/Referrer/Permissions/frame-ancestors), CORS preflight ayrımı (production origin / yabancı origin / null origin) ve deployed bundle üzerinde secret+localhost taraması.

## Browser E2E

Üç motor (Chromium/Firefox/WebKit) üzerinde: açılış, kimliksiz → login ekranı, korumalı rotanın kapanması, yanlış parola → fail-closed hata (ham backend/secret sızmaz), giriş → panel → kayıtlar → (varsa) kayıt → rapor → **PDF üretimi** (Chromium'da otomatik A4; çıktı `artifacts/production-validation/e2e-print-chromium.pdf`), çıkış → korumanın geri gelmesi.

## Reading results (Sonuçları okuma)

- **Terminal**: her bölümün altında `PASS/FAIL/BLOCKED/…` satırları, en sonda `FINAL STATUS`.
- **Dosyalar** (Git'e girmez): `artifacts/production-validation/latest.json` (makine okunur kanıt) ve `latest.md` (masaüstünde açabileceğiniz rapor).
- Final durumları: `READY` (tüm kritik kapılar PASS), `CONDITIONAL` (kritik olmayan açık alanlar), `BLOCKED` (kritik FAIL veya doğrulanamayan kritik alan var). OMR satırı her zaman `EXTERNAL` kalır.

## Cleaning test fixtures (Temizlik)

- Koşu sonunda araç **kendi ürettiklerini** otomatik siler (etiket: `MMPI_PROD_VALIDATION` / `mmpi-prod-validation-`).
- Elle temizlik gerekirse (ör. yarım kalan koşu): Dashboard → Table Editor'da `client_first_name = MMPI_PROD_VALIDATION` satırlarını silin; Authentication → Users'ta `mmpi-prod-validation-…@validation.invalid` hesabını silin. Test hesaplarını (A/B/Admin/Inactive) dilerseniz tutabilirsiniz; production görünürlüğü kendi hesaplarıyla sınırlıdır.

## Security warnings (Güvenlik uyarıları)

- `SUPABASE_SERVICE_ROLE_KEY` **gizlidir**. `.env.production-validation.local` Git'e girmez (teknoloji olarak engellidir); yine de bu dosyayı kimseyle paylaşmayın.
- Araç çıktı token/parola/secret içermez; ama terminal geçmişinize şifre yazmayın.
- Signup probu (`LIVE_MATRIX_ALLOW_WRITES=YES` iken) tek bir etiketli sahte hesap **denemesi** yapar; signup kapalıysa hiçbir şey oluşmaz. Açıksa araç `FAIL` verir ve Dashboard'dan kapatmanızı söyler.
- Araç production'da migration çalıştırmaz, veri dışa aktarmaz, kayıt içeriğini saklamaz.
- Bulduğunuz `FAIL`'leri **önce raporlayın**: ID / Severity / Area / Expected / Actual / Evidence / Recommended Action formatı `PHASE_C_PRODUCTION_VALIDATION_REPORT.md` ile aynıdır.

## Troubleshooting (Sorun giderme)

| Belirti | Nedeni | Çözüm |
|---|---|---|
| `SUPABASE_URL = missing` | Değişken tanımsız | `.env.production-validation.local` oluşturun veya `$env:` ile tanımlayın (yukarıdaki örnekler). |
| `Authentication API BLOCKED/erişilemiyor` | Yanlış URL, proje pause, ağ | Dashboard'da proje açık mı? URL `https://<ref>.supabase.co` biçiminde mi? |
| Edge endpoint `404` | Function dağıtılmamış | `npx supabase functions deploy admin-users` ve `ai-interpretation`. |
| Edge `403 Origin not allowed` (kendi domaininiz) | ALLOWED_ORIGINS eksik | Edge secret: `ALLOWED_ORIGINS=https://mmpi.halilkaraduman.com.tr`. |
| Fixture `oluşturulamadı` | INSERT policy/migration uyumsuz | Migration'ların tamamı uygulanmış mı? (`Remote migrations` bölümüne bakın.) |
| Playwright `BLOCKED` | Paket/browser yok | `npm i -D playwright` + `npx playwright install chromium firefox webkit`. |
| `Cannot find module` | `npm install` atlanmış | Repo kökünde `npm install` çalıştırın. |
| Test aşaması çok uzun | Normal (≈3 dk) | `$env:PRODUCTION_VALIDATION_SKIP_TESTS="YES"` ile atlayın (scoring kapısı atlanır — bunu bilerek yapın). |
| `npm audit` BLOCKED | Registry erişimi yok | Çevrimdışıysanız beklenen; internetle tekrarlayın. |
| `Remote migrations` derin katman BLOCKED | Service key yok / SQL endpoint kapalı | Service key verin veya bu belgedeki SQL'leri SQL Editor'da çalıştırın. |
| TLS BLOCKED (kendi PC'nizde) | Domain down / ağ | Tarayıcıdan site açılıyor mu? Açılıyorsa tekrar deneyin; açılmıyorsa hosting sorunudur (bu zaten kritik bulgudur). |
