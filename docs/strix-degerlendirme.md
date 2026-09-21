# Strix Değerlendirmesi — bu depoya uygunluk raporu

**Tarih:** 21 Eylül 2026 · **İncelenen proje:** [usestrix/strix](https://github.com/usestrix/strix)
**Soru:** "Güvenlik açıklarını bulan bir araç; bize uygun mu?"

## Özet karar

**Uygun — ancak bu projenin *birincil* güvenlik güvencesi olarak değil, periyodik derin tarama
katmanı olarak.** Araca karşı bu depoda opsiyonel (elle tetiklenen) bir CI iş akışı eklendi:
[`.github/workflows/strix-scan.yml`](../.github/workflows/strix-scan.yml). Depoya `STRIX_LLM` ve
`LLM_API_KEY` secret'ları girilip iş akışı elle çalıştırıldığında Strix, depoyu ve derlenen tek
dosyalık çıktıyı tarayıp raporu CI artifact olarak bırakır. Secret'lar girilmemişse iş akışı
 **hatasız atlanır** — normal CI akışı (typecheck + 252 test + PDF doğrulama + build + bayt
özdeşlik kontrolü) hiçbir şekilde etkilenmez.

## Strix nedir?

- Açık kaynaklı, **ajantik sızma testi (pentest) aracı**: Apache-2.0 lisansı, Python, 60 bin+
  yıldız, Eylül 2026 itibarıyla aktif bakımda (son sürüm `1.6.2`, PyPI: `strix-agent`).
- Statik tarayıcıların aksine, Docker sandbox'ında çalışan **AI ajanları** hedefi dinamik
  inceler: keşif → istismar denemesi → kanıtlanmış bulgu (PoC) → düzeltme önerisi çıkarır.
- Çalıştırma biçimleri: yerel CLI (Docker + kendi LLM anahtarın), Strix Cloud veya kurumsal
  kurulum. `strix -n -t <hedef> --scan-mode quick|standard|deep` başsız (CI uyumlu) moddur;
  bulgu varsa çıkış kodu 2'dir.

## Gereksinimler ve bu sandbox'ta neden koşulamadı?

| Gereksinim | Bu oturumun ortamı |
| --- | --- |
| Docker (Strix sandbox imajı) | **Yok** — sandbox'ta Docker daemon bulunmuyor |
| LLM API anahtarı (`LLM_API_KEY`) | **Yok** — kullanıcı anahtarını girmemiş olması gerekir (ve girmemeli: anahtarlar sohbete yazılmaz) |
| Hedef (kaynak klasörü / canlı URL) | Depo mevcut; canlı tarama için staging üretim |

Bu yüzden Strix **canlı taraması yerine** bu depoda kapsamlı **manuel güvenlik denetimi**
yapıldı (aşağıda) ve Strix, GitHub Actions'ta (ubuntu runner'ında Docker vardır) elle
tetiklenecek şekilde hazırlandı.

## Bu projeye uygunluk analizi

### Nerede iyi oturur

1. **Kaynak + çıktı taraması.** Uygulama tek dosyalık self-contained HTML olarak derlenip
   Cloudflare Workers'a yayınlanır. Strix, `src/` ve `dist/index.html` (gerçekten yayınlanan
   artefakt) üzerinden istemci tarafı saldırı yüzeyini tarayabilir.
2. **Supabase Edge Function'ları.** `admin-users` ve `ai-interpretation` HTTP servisleri;
   Strix'in auth/IDOR/CORS/girdi doğrulama testleri için anlamlı hedefler. Canlı test
   **production'a değil**, `supabase start` ile kalkan lokal stack'e veya staging project'e
   yapılmalıdır.
3. **CI döngüsü.** `quick` mod PR başına dakikalar sürer; bulgu olduğunda çıkış kodu 2 ile işi
   kırdığı için "yeni değişiklik açık getirdi mi?" sorusuna otomatik yanıt verir.

### Nerede dikkatli olunmalı

1. **Asla production'a yöneltmeyin.** Uygulama hasta verisi (KVKK kapsamında özel nitelikli
   kişisel veri) işler. Ajantik pentest aracı istismar denemeleri üretir; yalnızca sahibi
   olduğunuz staging/lokal ortama yöneltin. İş akışı bu yüzden varsayılan olarak **yalnızca
   kaynak/derleme çıktısı** tarar, canlı URL'ye istek açmaz.
2. **Maliyet ve gürültü.** Taramalar LLM token'ı harcar; her PR'da otomatik koşması yerine
   elle tetikleme seçildi. Bulgu eşikleri aracın olduğundan emin olamayacağı mimari kararları
   (ör. sessionStorage'da oturum — [SYSTEM.md](../SYSTEM.md)'de belgelenmiş bilinçli tercih)
   bulgu olarak raporlayabilir; değerlendirme insanda kalır.
3. **Kapsam sınırı.** Strix dinamik test eder; deterministik puanlama doğruluğunu (T skorları,
   norm tabloları) test edemez — o güvence [tests/](../tests) paketindedir.

## Bu depo için yapılan manuel güvenlik denetimi (bu oturum)

Strix koşulamadığı için eşdeğer kapsamda kod düzeyinde denetim yapıldı; sonuçlar:

| Alan | Bulgular |
| --- | --- |
| Bağımlılıklar | `npm audit`: **0 bilinen açık**; lockfile pinned; postinstall kancası yok |
| XSS | `dangerouslySetInnerHTML`/`innerHTML`/`eval` kullanımı yok; AI yorumu React text node olarak basılıyor; build çıktısı SHA-256 hash-pinned CSP taşıyor (`default-src 'none'`) |
| Kimlik/oturum | Supabase Auth PKCE; public signup kapalı (`config.toml`); oturum `sessionStorage`'da (bilinçli, belgelenmiş karar); parola uygulama tablolarına yazılmıyor |
| RLS / DB | İki tabloda RLS açık; klinik alanlar tetikleyiciyle immutable; `created_by` her zaman `auth.uid()`'den; anon role tüm erişim revoked; SECURITY DEFINER fonksiyonlarda sabit `search_path` |
| Edge Functions | CORS origin allowlist; Bearer JWT + rol + aktiflik yeniden doğrulaması; IDOR koruması (kayıt modunda sahiplik kontrolü); gövde boyut limiti; LLM'e giden özet sunucuda sayısal olarak yeniden doğrulanır (prompt injection yüzeyi yok); AI anahtarı istemciye dönmez |
| Sır/sağlamlık | Depoda sır yok (`.env` ignore'da); tek dosya build tamamen çevrimdışı; PDF worker allowlist+timeout'lu |
| **Bulunan eksik (düzeltildi)** | HTTP yanıt başlıkları yoktu: meta CSP `frame-ancestors`'ı uygulamaz; nosniff/referrer/permissions/HSTS başlıkları hiçbir yerde ayarlı değildi. `scripts/build.mjs` artık `dist/_headers` üretiyor (Workers/Pages/Netlify yerel destekler) ve testi eklendi. |

## Eklenen entegrasyon nasıl kullanılır?

1. GitHub → Settings → Secrets and variables → Actions:
   - `STRIX_LLM` — model adı, ör. `openai/gpt-5` veya `openrouter/z-ai/glm-5.3`
   - `LLM_API_KEY` — ilgili sağlayıcının API anahtarı
2. Actions → **Strix Security Scan (manual)** → Run workflow.
3. Tarama sonı `strix_runs/` altında artifact olarak inilir; bulgu varsa iş **fail** olur
   (bilinçli davranış: bulgu görmeden geçme). Rapor `strix_runs/*/report.md` içindedir.

Canlı uç nokta taramak isterseniz (önerilmez/production'a değil): lokalde `supabase start` +
`supabase functions serve` ile kalkan stack'e, ya da kopya staging project'e `--target` vererek
ayrı bir adım ekleyin.

## Kaynaklar

- Depo: <https://github.com/usestrix/strix> · Dokümantasyon: <https://docs.strix.ai>
- Resmî GitHub Actions entegrasyonu: <https://docs.strix.ai/integrations/github-actions>
- PyPI: <https://pypi.org/project/strix-agent/> (Apache-2.0)
