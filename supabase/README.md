# Supabase kurulumu

Bu klasör, uygulamanın şemasını, RLS politikalarını ve Admin'in psikolog hesabı
oluşturmak için kullandığı Edge Function'ları içerir:

- `admin-users` — Admin'in psikolog hesabı oluşturması ve aktiflik yönetimi.
- `ai-interpretation` — MMPI sonuçlarının yapay zekâ destekli yorumu (karar desteği).

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
supabase db push
```

Uygulamadan sonra canlı projeyi bağımlılıksız teşhis betiğiyle doğrulayın
(migration geçmişi, kolon/politika/grant/trigger, `audit_logs` sözleşmesi ve iki
Edge Function'ın CORS davranışı):

```sh
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
SUPABASE_SERVICE_KEY=<service_role> \
SITE_ORIGIN=https://your-app.example.com \
npm run diagnose:supabase
```

Belirti → kök neden → komut eşlemesi için [`../TROUBLESHOOTING.md`](../TROUBLESHOOTING.md).

Özellikle `20260920000000_record_actions.sql`, not kaydı ve silme akışındaki
RLS/şema uyumunu düzeltir; bu migration uygulanmadan uygulama kodu tek başına
canlı Supabase yetkilerini değiştiremez.

Migration'lar şunları oluşturur:

- `profiles`: Auth kullanıcı profili, `ADMIN` / `PSYCHOLOG` rolü ve aktiflik.
- `mmpi_records`: danışan alanları, ham OMR JSON'u, oluşturan psikolog ve idempotency anahtarı.
- `mmpi_records.expert_notes` + `notes_updated_at`: kayıt sonrası uzman değerlendirme
  notu (en fazla 4000 karakter; rapora aktarılır; Admin tüm görünür kayıtlara,
  aktif psikolog kendi kaydına yazabilir).
- `audit_logs`: sunucu taraflı denetim izi — `mmpi_records` üzerindeki her
  insert/update/delete, security-definer trigger ile (aktör, eylem, hedef, zaman)
  olarak yazılır; istemciden yazılamaz/silinemez, yalnızca Admin okuyabilir.
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
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ve `SUPABASE_ANON_KEY` Supabase
Edge Functions ortamında otomatik bulunur. Production'da `ALLOWED_ORIGINS` boş
bırakılmamalı; birden fazla origin virgülle ayrılarak yazılmalıdır. Boş allowlist
yalnızca `http://localhost` ve `http://127.0.0.1` geliştirme origin'lerine izin
verir. Arena preview origin'i de açıkça eklenmelidir. Hesap silme işlemi Auth
kullanıcısını siler; `profiles` ve `mmpi_records` üzerindeki `on delete cascade`
ilişkileri ilişkili uygulama verisini birlikte kaldırır.

`admin-users` ayrıca veritabanı kaynaklı hataları (denetim izi/kısıt/RLS) **500 +
`supabase db push`** mesajıyla, Auth/istemci kaynaklıları **400** ile ayırır; böylece
arayüz "şema eksik" ile "geçersiz istek" durumunu karıştırmaz. Password Auth kullanıcısı
Supabase Auth'ta oluşturulur; uygulamanın tablolarına parola yazılmaz.

## 5. AI karar desteği (ai-interpretation)

Sonuç ekranlarındaki "Yapay Zekâ Yorumu" bölümü, OpenAI uyumlu bir LLM uç
noktasına istek atar. Anahtar **yalnız Edge Function çalışma zamanında**
yaşar; frontend'e, `.env`'e veya Git'e asla yazılmaz:

```sh
supabase functions deploy ai-interpretation
supabase secrets set AI_API_KEY=sk-... AI_MODEL=gpt-4o-mini \
  ALLOWED_ORIGINS=https://your-app.example.com
```

- `AI_API_BASE` (opsiyonel, varsayılan `https://api.openai.com/v1`) — herhangi
  bir OpenAI uyumlu `/chat/completions` uç noktası.
- `AI_API_KEY` tanımlı değilken fonksiyon 503 döner; arayüz "henüz
  yapılandırılmamış" gösterir ve AI bölümü sessizce kapanır.
- İstemci yalnız **sayısal profil özetini** gönderir (ham metin/prompt yok);
  fonksiyon bu özetin her alanını bağımsız doğrular. `mode=record` ise kayıt,
  service role ile okunur ve çağrının o kayda RLS ile erişme hakkı taşıdığı
  (sahip veya Admin) doğrulanmadan yorum üretilmez (IDOR koruması).
- `ALLOWED_ORIGINS` `admin-users` ile **aynı değeri** taşır; boş bırakılırsa
  yalnız localhost dev origin'leri izinli olur.
