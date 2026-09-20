# Supabase kurulumu

Bu klasör, uygulamanın şemasını, RLS politikalarını ve Admin'in psikolog hesabı
oluşturmak için kullandığı Edge Function'ı içerir.

## 1. Proje değişkenleri

Kök dizinde `.env` oluşturun:

```sh
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Frontend'e yalnızca publishable/anon anahtar konur. `service_role` anahtarı
frontend'e, `.env` içine `VITE_` önekiyle veya Git'e kesinlikle konmaz.

## 2. Şema ve RLS

Supabase CLI ile proje ref'ini `supabase/config.toml` içine yazıp tüm migration'ları canlı veritabanına uygulayın:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push          # 6 migration'ın tamamı
npm run diagnose:supabase # canlı projeyi doğrula (bkz. TROUBLESHOOTING.md)
```

Özellikle `20260920000000_record_actions.sql`, not kaydı ve silme akışındaki
RLS/şema uyumunu düzeltir; bu migration uygulanmadan uygulama kodu tek başına
canlı Supabase yetkilerini değiştiremez. `20260920120000_repair_record_actions_and_audit.sql`
onarım migration'ıdır: eksik `expert_notes` kolonunu, RLS/grant sözleşmesini ve
`audit_logs.actor NOT NULL` hatasını tek seferde kapatır (idempotent'tır, sağlıklı
kurulumda hiçbir şeyi değiştirmez).

Migration uygulanmadığında görülen belirtiler ve çözüm sırası `TROUBLESHOOTING.md`
içinde; `npm run diagnose:supabase` hangi maddenin eksik olduğunu canlı projeden okuyup
söyler (`--allow-destructive` ile uçtan uca silme akışını da test eder).

Migration'lar şunları oluşturur:

- `profiles`: Auth kullanıcı profili, `ADMIN` / `PSYCHOLOG` rolü ve aktiflik.
- `mmpi_records`: danışan alanları, ham OMR JSON'u, oluşturan psikolog ve idempotency anahtarı.
- `mmpi_records.expert_notes` + `notes_updated_at`: kayıt sonrası uzman değerlendirme
  notu (en fazla 4000 karakter; rapora aktarılır; Admin tüm görünür kayıtlara,
  aktif psikolog kendi kaydına yazabilir).
- `audit_logs`: sunucu taraflı denetim izi — `mmpi_records` üzerindeki her
  insert/update/delete, security-definer trigger ile (aktör, aktör tipi, eylem, hedef,
  zaman) olarak yazılır; istemciden yazılamaz/silinemez, yalnızca Admin okuyabilir.
  `actor` **nullable**'dır: Auth üzerinden gelen CASCADE silmede JWT olmadığı için
  `auth.uid()` NULL döner ve satır `actor_kind = 'service'` ile yazılır. Trigger ayrıca
  hataya dayanıklıdır — denetim izi yazılamazsa klinik işlem geri alınmaz, yalnızca
  `warning` loglanır.
- Auth kullanıcı trigger'ı.
- Psikoloğun yalnızca kendi kayıtlarını, Admin'in tüm kayıtları görebildiği RLS.
- Aktif olmayan kullanıcının kayıt okuyup yazmasını engelleyen RLS fonksiyonları.
- Yaş, tarih, ham veri yükü boyutu ve kayıt değişmezliği için veritabanı tarafı korumalar; yalnızca aktif psikolog kayıt yazabilir, profil UPDATE/DELETE işlemleri yalnızca Edge Function üzerinden yapılır.

Supabase Dashboard → Authentication → Providers → Email bölümünde **Allow new
users / Enable email signup** seçeneğini kapatın. `config.toml` yerel CLI
konfigürasyonunu da aynı şekilde ayarlar; uzak projeye dashboard ayarı olarak
kontrol edilmelidir.

## 3. İlk Admin

Public signup kapalıyken ilk Admin'i Supabase Dashboard → Authentication → Users
→ Add user ile oluşturun. Migration trigger'ı hesabı önce en düşük yetki olan
`PSYCHOLOG` olarak profile ekler. SQL Editor'da yalnızca bir kez:

```sql
update public.profiles
set role = 'ADMIN', active = true
where email = 'ilk-admin@example.com';
```

Bu işlemden sonra psikolog hesapları yalnızca uygulamanın Admin panelinden
oluşturulabilir.

## 4. Edge Function

Function, service role anahtarını yalnızca Supabase sunucusunda kullanır:

```sh
supabase functions deploy admin-users
supabase secrets set ALLOWED_ORIGINS=https://your-app.example.com
supabase secrets list   # ALLOWED_ORIGINS görünüyor mu?
```

`ALLOWED_ORIGINS` boşsa fonksiyon üretimde hiçbir origin'i kabul etmez ve Admin
panelindeki hesap işlemleri "Kullanıcı hesabı silinemedi. Edge Function bağlantısını
kontrol edin." hatasıyla düşer (tarayıcı konsolunda CORS/403).

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ve `SUPABASE_ANON_KEY` Supabase
Edge Functions ortamında otomatik bulunur. Production'da `ALLOWED_ORIGINS` boş
bırakılmamalı; birden fazla origin virgülle ayrılarak yazılmalıdır. Boş allowlist
yalnızca `http://localhost` ve `http://127.0.0.1` geliştirme origin'lerine izin
verir. Arena preview origin'i de açıkça eklenmelidir. Hesap silme işlemi Auth
kullanıcısını siler; `profiles` ve `mmpi_records` üzerindeki `on delete cascade`
ilişkileri ilişkili uygulama verisini birlikte kaldırır.

Function, çağıranın access token'ını doğrular; aktif Admin değilse psikolog
oluşturma veya aktiflik değiştirme isteğini reddeder. Password Auth kullanıcısı
Supabase Auth'ta oluşturulur; uygulamanın tablolarına parola yazılmaz.
