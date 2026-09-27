# MMPI-1 Production Validation Toolkit (Phase C)

**Tek giriş:** `npm run validate:production`

Bu araç mevcut MMPI-1 (566-item) sistemini DEĞİŞTİRMEZ. Görevi, kendi bilgisayarınızdan **gerçek Supabase + gerçek production domainine** karşı kanıta-dayalı doğrulama koşmaktır: Supabase bağlantısı, uzak schema drift, canlı RLS, IDOR, auth, deletion/cascade, rapor/şablon/ayar sahipliği, audit erişimi, Edge Functions, AI endpoint güvenliği, CORS, security headers, TLS, production config, secret sızıntısı ve browser E2E. **OMM/fiziksel kâğıt testi bu fazın dışındadır** (`EXTERNAL — kullanıcı ayrı doğrular`).

Adım adım kılavuz: `../../docs/PRODUCTION_VALIDATION_RUNBOOK.md`.

## Durumlar

| Status | Anlam |
|---|---|
| `PASS` | Kanıtlanmış gerçek davranış (live kanıt; repo kanıtı `[REPOSITORY]` etiketlidir) |
| `FAIL` | Beklenen ≠ gözlenen (security finding olarak raporlanır) |
| `BLOCKED` | Erişim/kimlik eksik — doğrulanamadı. **Başarısızlık değil, kanıt eksikliği.** |
| `SKIPPED` | Bilinçli kilit (yazma/yıkıcı koruma) açık değil |
| `CONDITIONAL` | Doğrulandı ama koşula bağlı (ör. instance-local rate limit) |
| `NOT_APPLICABLE` | Bu mimaride anlamlı değil |

**Sahte PASS yoktur.** Mock/local sonucu asla live PASS yazılmaz. Secret değerleri hiçbir çıktıya yazılmaz.

## Gerekli ortam değişkenleri

```powershell
$env:SUPABASE_URL="https://<proje-ref>.supabase.co"        # zorunlu
$env:SUPABASE_ANON_KEY="<anon/publishable key>"            # zorunlu
$env:PRODUCTION_URL="https://mmpi.halilkaraduman.com.tr"   # zorunlu
```

Rol kimlikleri (canlı RLS/IDOR/auth/deletion için — disposable test hesapları):

```
TEST_USER_A_EMAIL / TEST_USER_A_PASSWORD     → aktif psikolog A
TEST_USER_B_EMAIL / TEST_USER_B_PASSWORD     → aktif psikolog B
TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD       → admin
TEST_INACTIVE_EMAIL / TEST_INACTIVE_PASSWORD → pasif hesap
SUPABASE_SERVICE_ROLE_KEY                    → (opsiyonel) derin şema kataloğu
VALIDATION_RECORD_ID                         → (opsiyonel) E2E derin akış + PDF
```

Kilitler:

```
LIVE_MATRIX_ALLOW_WRITES=YES        → fixture üretimi + yazma senaryoları
PRODUCTION_VALIDATION_CONFIRM=YES   → kullanıcı silme cascade akışı (destrüktif)
```

Değerleri `.env.production-validation.local` veya `.env.local` dosyasına da koyabilirsiniz (Git izlemez; shell değişkenleri ezilmez).

## Modüller

| Dosya | Bölüm | Not |
|---|---|---|
| `check-regression.mjs` | Repository regression | `npm test`/typecheck/audit/PDF — scoring freeze kanıtı |
| `check-environment.mjs` | Environment | Değer yazılmaz; eksik → BLOCKED |
| `check-supabase.mjs` | Supabase | HTTPS, Auth API, REST API, Edge uçları |
| `check-migrations.mjs` | Remote migrations | OpenAPI tablo/kolon + service-key ile salt-okunur derin katalog (RLS/policy/trigger/grant/FK/migration listesi). **DDL/migration ÇALIŞTIRMAZ.** |
| `check-auth.mjs` | Authentication | `/auth/v1/settings` canlı config, rol oturumları, signup probu |
| `check-rls.mjs` | RLS (live) | Mevcut `../run-live-security-matrix.mjs` koşucusunu REUSE eder (REUSE; ikinci sistem yok) |
| `check-idor.mjs` | IDOR | Kanonik §8 matrisi + bütünlük kanıtı |
| `check-deletion.mjs` | Deletion | Disposable kullanıcıyla tam cascade (çift kilitli) |
| `check-reports.mjs` | Reports | Adapter izolasyonu (repo) + sahiplik/snapshot (live) |
| `check-edge-functions.mjs` | Edge Functions | admin-users + ai-interpretation güvenlik matrisi, AI ham-cevap reddi, rate limit sınıflandırması, CORS uçları |
| `check-production-config.mjs` | Production HTTP + Configuration | Canlı HTTP/SPA/asset + `../verify-production-config.mjs` REUSE + deployed bundle taraması |
| `check-security-headers.mjs` | Security Headers | HSTS/CSP/XFO/Referrer/Permissions canlı ölçümü |
| `check-tls.mjs` | TLS | Sertifika zinciri/geçerlilik/protokol (node:tls) |
| `check-browser-e2e.mjs` | Browser E2E | Playwright varsa Chromium/Firefox/WebKit; yoksa BLOCKED + kurulum komutu |
| `check-secrets.mjs` | Secrets | Depo + dist + deployed bundle; false-positive kontrollü |

## Çıktılar

- Terminal: insan okunur renkli özet + blokaj listesi.
- `artifacts/production-validation/latest.json` — makine okunur kanıt (şema §32).
- `artifacts/production-validation/latest.md` — rapor.
- Bu dizin `.gitignore` altındadır; token/parola/secret/danışan verisi **asla** içermez (yalnızca HTTP durumu, satır sayısı, boolean kanıtlar).

## Çıkış kodları

| Kod | Final |
|---|---|
| 0 | `READY` |
| 3 | `CONDITIONAL` |
| 1 | `BLOCKED` |

## Seçici koşu

```bash
node scripts/production-validation/run-all.mjs --only tls,secrets,headers
```

## Güvenlik sözleşmesi

- Production'da migration/DDL **çalıştırılmaz** (`supabase db push` yok).
- Gerçek kullanıcı/danışan verisi hedeflenmez; yalnızca `MMPI_PROD_VALIDATION` / `mmpi-prod-validation-` etiketli disposable fixture'lar.
- Yıkıcı kullanıcı silme yalnızca bu çalıştırmada üretilen disposable hesaba yapılır.
- İstek gövdeleri saklanmaz; yanıtların yalnızca satır sayısı/durumu tutulur.
- Scoring dosyalarına dokunulmaz; bu faz scoring değişikliği yapmaz.
