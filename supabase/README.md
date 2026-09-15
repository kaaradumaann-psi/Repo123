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

Supabase CLI ile proje ref'ini `supabase/config.toml` içine yazıp:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Migration şunları oluşturur:

- `profiles`: Auth kullanıcı profili, `ADMIN` / `PSYCHOLOG` rolü ve aktiflik.
- `mmpi_records`: danışan alanları, ham OMR JSON'u, oluşturan psikolog ve idempotency anahtarı.
- Auth kullanıcı trigger'ı.
- Psikoloğun yalnızca kendi kayıtlarını, Admin'in tüm kayıtları görebildiği RLS.
- Aktif olmayan kullanıcının kayıt okuyup yazmasını engelleyen RLS fonksiyonları.

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
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ve `SUPABASE_ANON_KEY` Supabase
Edge Functions ortamında otomatik bulunur. Preview kullanırken `ALLOWED_ORIGINS`
değerine preview origin'ini de ekleyin veya geliştirmede boş bırakın.

Function, çağıranın access token'ını doğrular; aktif Admin değilse psikolog
oluşturma veya aktiflik değiştirme isteğini reddeder. Password Auth kullanıcısı
Supabase Auth'ta oluşturulur; uygulamanın tablolarına parola yazılmaz.
