# Sorun giderme: "400", "Kayıt bulunamadı…", "Kullanıcı hesabı silinemedi"

Bu dosya, Admin **ve** Psikolog hesaplarının aynı anda "hiçbir şey yapamadığı" durumda
görülen hata kümesinin kök nedenini ve kesin çözüm sırasını anlatır.

Ekranda/konsolda görülenler:

```text
Kullanıcı hesabı silinemedi. Edge Function bağlantısını kontrol edin.
Kayıt bulunamadı veya bu kayıt üzerinde silme yetkiniz bulunmuyor.
Kayıt işlemleri için veritabanı güncellemesi gerekiyor; yöneticiniz supabase db push çalıştırmalı.
Failed to load resource: the server responded with a status of 400 ()
https://<proje>.supabase.co/rest/v1/mmpi_records?id=eq.<uuid>:1 Failed to load resource: 400
```

## Tek cümlelik teşhis

**Kod değil, canlı Supabase projesinin yapılandırması eksik.** Üç ayrı katman aynı anda
kırık ve üçü de yalnızca yöneticinin çalıştıracağı komutlarla düzelir:

| # | Katman | Belirti | Neden |
| - | --- | --- | --- |
| 1 | Veritabanı şeması | `rest/v1/mmpi_records?id=eq...` → **400**, ekranda "supabase db push çalıştırmalı" | `mmpi_records.expert_notes` / `notes_updated_at` kolonları canlıda yok → PostgREST `42703 undefined_column` → HTTP 400. Kayıt detayı ve uzman notu bu yüzden Admin'de de Psikolog'da da patlar. |
| 2 | RLS / grant | "Kayıt bulunamadı veya bu kayıt üzerinde silme yetkiniz bulunmuyor" (sunucu hatası **yok**, 0 satır) | `20260920000000_record_actions.sql` uygulanmamışsa Admin için UPDATE/DELETE politikası yok; RLS yetkisiz isteği hata vermeden **0 satır** olarak filtreler. |
| 3 | Edge Function | "Kullanıcı hesabı silinemedi. Edge Function bağlantısını kontrol edin." | `ALLOWED_ORIGINS` secret'ı boş → fonksiyon yalnızca `http://localhost`'a izin verir → yayın origin'i **403 Origin not allowed** ile reddedilir, tarayıcı isteği keser. |
| 3b | Edge Function + şema | Silme 403 düzeltilse bile yine "silinemedi" | `audit_logs.actor uuid NOT NULL`: Auth kullanıcısı silinirken `mmpi_records` ON DELETE CASCADE ile silinir, AFTER DELETE trigger'ı service-role bağlamında `auth.uid() = NULL` ile audit'e yazmaya çalışır → NOT NULL ihlali tüm silmeyi geri alır. |

Not: Admin panelindeki psikolog listesi çalışmaya devam eder, çünkü `profiles` tablosu ilk
migration'dan beri mevcut. Bu yüzden "yarısı çalışıyor, yarısı çalışmıyor" hissi oluşur.

## Çözüm: sırayla çalıştırın

Yönetici makinesinde, [Supabase CLI](https://supabase.com/docs/guides/cli) kurulu ve
`supabase login` yapılmış olmalı. Proje ref'i Dashboard → Project Settings → API'de yazar.

```sh
# 0) config.toml'daki project_id'yi gerçek ref ile değiştirin (bir kez)
#    supabase/config.toml → project_id = "lgtahyruhyfozhueawft"

# 1) Şema + RLS + onarım migration'ı (6 dosya)
supabase link --project-ref <PROJE_REF>
supabase db push

# 2) Edge Function'ı güncel kodla yeniden yayınla
supabase functions deploy admin-users

# 3) Uygulamanın yayın adresini allowlist'e ekle (birden çok adres virgülle)
supabase secrets set ALLOWED_ORIGINS=https://UYGULAMA-ADRESINIZ,http://localhost:5173

# 4) Uygulamayı yeniden yayınla (bu onarımla hata mesajları da netleşti)
npm run build      # optik-form.html + dist/ çıktısını hosting'e yükleyin
```

`supabase secrets list` çıktısında `ALLOWED_ORIGINS` görünmeli. Değer **tam origin**
olmalıdır: şema + host + (varsa) port, sonda `/` yok. `ALLOWED_ORIGINS` boş bırakılırsa
fonksiyon üretimde hiçbir siteye izin vermez.

## Otomatik teşhis

Komutları çalıştırmadan önce (ya da sonra doğrulamak için) betiği kullanın. Harici
bağımlılığı yoktur; şemayı, migration geçmişini, RLS politikalarını, grant'ları,
trigger'ları, `audit_logs.actor` durumunu ve Edge Function CORS davranışını canlı projeden
okuyup hangi maddenin eksik olduğunu tek tek söyler:

```sh
SUPABASE_URL=https://<PROJE_REF>.supabase.co \
SUPABASE_SERVICE_KEY=<service_role veya sb_secret_...> \
SITE_ORIGIN=https://UYGULAMA-ADRESINIZ \
npm run diagnose:supabase -- --allow-destructive
```

* `SUPABASE_SERVICE_KEY` olmadan yalnızca şema ve CORS kontrolü yapılır.
* `--allow-destructive` geçici bir **diagnostik** kullanıcısı ve kaydı oluşturur; uçtan uca
  `INSERT → uzman notu → DELETE → Auth CASCADE silme` akışını gerçek hata kodlarıyla test
  eder ve sonunda hepsini siler. Gerçek danışan verisine dokunmaz.
* Betik `diag_report()` adında geçici bir teşhis fonksiyonu kurar (yalnızca katalog okur).
  İsterseniz sonrasında `drop function public.diag_report();` diyebilirsiniz.
* Çıkış kodu: sorun varsa `1`. CI'a bağlamak isterseniz `--allow-destructive` olmadan
  çalıştırın (yazma testi yapmaz).

Ek olarak `ADMIN_JWT=<admin access_token>` verirseniz Edge Function'ın Admin doğrulaması da
test edilir (token'ı tarayıcıda sessionStorage'daki oturumdan alabilirsiniz; paylaşmayın,
komutu kendi makinenizde çalıştırın).

## Hata kodu → neden tablosu

Uygulama artık ham PostgREST hatasını konsola yazıyor (`[supabase] kayıt işlemi hatası …`).
Konsoldaki `code` değerine bakın:

| code | Anlamı | Çözüm |
| --- | --- | --- |
| `42703` / `PGRST204` | Kolon yok (`expert_notes`) | `supabase db push` |
| `42P01` / `PGRST205` | Tablo yok | `supabase db push` |
| `42501` | Grant/RLS yetkisi yok | `supabase db push` (onarım migration'ı grant'ları yeniden verir) |
| `23502` | NOT NULL ihlali → `audit_logs.actor` | `supabase db push` (20260920120000) |
| `P0001` | Trigger `raise exception` (mesaj ekranda gösterilir) | Mesajı okuyun: tarih/veri yükü/değişmezlik kuralı |
| `PGRST301` | JWT süresi dolmuş | Çıkış yapıp yeniden giriş yapın |
| `23514` | CHECK ihlali (yaş, not uzunluğu, veri yükü) | Girilen veriyi düzeltin |
| CORS / `Failed to fetch` | `ALLOWED_ORIGINS` eksik | `supabase secrets set ALLOWED_ORIGINS=...` |

## İlk Admin hesabı

Public signup kapalı olduğu için ilk Admin elle kurulur:

1. Dashboard → Authentication → Users → **Add user** (e-posta + parola, "Auto Confirm" işaretli).
2. `on_auth_user_created` trigger'ı profili en düşük yetkiyle (`PSYCHOLOG`) oluşturur.
3. Dashboard → SQL Editor'da **bir kez**:
   ```sql
   update public.profiles
   set role = 'ADMIN', active = true
   where email = 'ilk-admin@example.com';
   ```
4. Admin ile giriş yapın; psikolog hesapları artık Admin panelinden oluşturulur.

Bu adım atlandıysa Edge Function her isteği `403 Admin role required` ile reddeder ve
paneldeki **tüm** hesap işlemleri (oluştur / pasifleştir / sil) çalışmaz.

## Bunlar da kontrol edildi mi?

* Dashboard → Authentication → Providers → Email → **Allow new users to sign up: KAPALI**.
* `supabase functions deploy` sonrası Dashboard → Edge Functions → `admin-users`
  "Updated" zamanı güncel mi? (eski sürüm `ALLOWED_ORIGINS` normalizasyonunu içermeyebilir)
* Uygulama, `.env` içindeki `VITE_SUPABASE_URL` ile **aynı** projeye mi bakıyor? İki farklı
  proje ref'i karıştırıldığında "tablo yok / 400" belirtileri birebir aynı görünür.
* Yayınlanan dosya güncel mi? `npm run build` sonrası `optik-form.html` / `dist` yüklenmediyse
  tarayıcı eski kodu çalıştırmaya devam eder (hard refresh + service worker temizliği).
* Silme 0 satır döndüyse: kayıt zaten silinmiş olabilir; listeyi yenileyip tekrar deneyin.

## Neden "Edge Function bağlantısını kontrol edin" yazıyordu?

Eski istemci kodu Edge Function hatalarının tamamını tek cümleye indirgiyordu; 403 (origin),
401 (oturum), 404 (hedef yok) ve 500 (veritabanı) aynı mesajı üretiyordu. Artık
`src/auth/adminApi.ts` içindeki `explainEdgeFunctionError()` gerçek HTTP durumunu ve
fonksiyonun döndürdüğü gövdeyi ayırt edip hangi komutun gerektiğini söylüyor
(ör. `ALLOWED_ORIGINS` eksikse doğrudan `supabase secrets set ...` öneriyor).
