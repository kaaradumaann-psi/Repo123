# PHASE C — MMPI-1 PRODUCTION VALIDATION RAPORU

**Tarih:** 27 Eylül 2026
**Branch:** `arena/01a0e2c1-repo123`
**Taban commit:** `8f54ec3` (Phase B kapanışı)
**Araç:** `scripts/production-validation/` — tek giriş `npm run validate:production`
**Kural:** Sahte PASS yok. Kanıtlanamayan alan `BLOCKED`. OMR `EXTERNAL`.

---

## 1. Executive Summary

Bu fazda **ürün/scoring/veritabanı kodu değiştirilmedi**; yalnızca kullanıcının kendi Windows bilgisayarında **gerçek Supabase + gerçek production domainine** karşı koşabileceği kanıt odaklı bir validation toolkit üretildi.

- Araç, Phase B'de `SEC-LIVE-001` ve `CFG-PROD-001` için istenen canlı kanıtların **tamamını tek komutta** üretecek altyapıyı kurar: canlı RLS/IDOR matrisi (mevcut koşucu REUSE), remote schema drift (OpenAPI + salt-okunur derin katalog), auth config, deletion cascade, Edge/AI güvenlik matrisi, CORS, security headers, TLS, production HTTP/config, secret taraması, browser E2E (Chromium/Firefox/WebKit) ve release-gate hesaplayıcı.
- Bu ortamda (geliştirme sandbox'ı) canlı production erişimi/kimlikleri **yoktur**; bu yüzden buradaki canlı sonuçlar bilinçli olarak `BLOCKED` raporlanmıştır — kural §0.3 gereği mock/local sonuç hiçbir zaman live PASS olarak yazılmamıştır.
- Toolkit mekanik olarak **uçtan uca doğrulanmıştır**: bağımsız bir HTTPS mock Supabase/GoTrue/Edge simülasyonuna karşı `181 PASS / 0 FAIL` (bu yalnızca araç QA'sıdır ve production kanıtı DEĞİLDİR; mock çıktısı depoya girmez).
- **Release gate (bu ortamdan): `BLOCKED`** — canlı kapılar kullanıcı makinesinde runbook ile koşulmalıdır.

## 2. Environment

| Kontrol | Durum | Kanıt |
|---|---|---|
| Node.js ≥ 22 | PASS (22.22.3) | `node --version` |
| Tek komut, Windows uyumlu | PASS | Tüm modüller saf Node ESM; bash bağımlılığı yok; spawn hedefleri `process.execPath` |
| Gerekli değişkenlerin varlık kontrolü | BLOCKED (sandbox) | `SUPABASE_URL/ANON_KEY/PRODUCTION_URL` yok → değerler asla yazılmaz, yalnızca `configured/missing` |
| `.env.production-validation.local` / `.env.local` okuyucu | PASS | Git dışı; kabuk değişkenlerini ezmez |

## 3. Supabase

Kontroller: HTTPS REST kökü (`/rest/v1/` OpenAPI), Auth health, negatif kimlik reddi, her iki Edge uç noktasının canlılığı (kimliksiz → 401/403 beklenir; 404 = dağıtım yok FAIL).

- Sandbox: **BLOCKED** (kimlik yok).
- Mekanik QA (mock): tüm bağlantı sinyalleri doğru ayrıştırılıyor — kanıt: mock koşusu 181 PASS.

## 4. Remote Schema (migration drift)

İki katman:

1. **OpenAPI (anon key):** 7 tablo + tüm kolonların uzak PostgREST şema önbelleğinde varlığı (repo migration parser'ı ile karşılaştırılır). Sandbox: BLOCKED. Mock QA: 7/7 tablo, tüm kolonlar PASS.
2. **Derin katalog (service key, TEK salt-okunur SELECT `/pg/query`):** RLS bayrakları, policy seti (isim/tablo/komut), trigger'lar (`public` + `auth.users`), helper function'lar, FK/index/extension envanteri, grant yüzeyi (`anon = 0` zorunlu), `supabase_migrations.schema_migrations` geçmişi.
   - **Hiçbir DDL/sync/push yürütülmez** (kural §28); endpoint kapalıysa BLOCKED + runbook'ta elle SQL alternatifi.
   - Mock QA: 17/17 policy, 9/9 trigger, 10/10 function, 6/6 migration version, anon grant 0 PASS.

## 5. Auth

- `/auth/v1/settings` üzerinden **canlı** `disable_signup` (beklenen: kapalı — `config.toml` politikası), `mailer_autoconfirm`, harici provider envanteri.
- Rol oturumları: A/B/Admin/Inactive password grant.
- Signup probu (yalnızca yazma kilidi açıkken; etiketli sahte adres): signup kapalıysa HTTP 4xx beklenir; açıksa **FAIL** ve silme talimatı.
- Redirect URL / Site URL / SMTP / session: Supabase Management API kapsam dışı → **BLOCKED (tahmin yok)** + runbook checklist.

## 6. RLS

- **REUSE:** `scripts/run-live-security-matrix.mjs` child-process olarak koşar; spec bu fazda otomatik üretilir (token'lar yalnızca child ENV'de; asla diske yazılmaz).
- Roller: anonymous, userA, userB, admin, inactive; kaynaklar: profiles, mmpi_records, mmpi_reports, mmpi_report_versions, mmpi_report_templates, psychologist_report_settings, audit_logs; CRUD + IDOR satırları.
- RLS filtreli reddin doğru ölçüsü: **HTTP 200 + 0 satır** (HTTP 200 ≠ başarı tuzağı; Phase B ile aynı sözleşme).
- Sandbox: BLOCKED. Mock QA: 32 senaryodan 31'i ilk koşuda PASS; 1 beklenti hatası araçta düzeltildi (`inactive-report-select` → 200 + 0 satır) ve final mock koşusu 32/32 PASS.

## 7. IDOR

Kanonik matris (rapor §8) doğrudan REST ile, `EXPECTED/ACTUAL/STATUS` biçiminde:

| Senaryo | Beklenen | Mock QA ölçümü |
|---|---|---|
| User A → own record | ALLOW | HTTP 200 · 1 satır PASS |
| User A → User B record | DENY | HTTP 200 · 0 satır PASS |
| User B → User A record | DENY | HTTP 200 · 0 satır PASS |
| User A → own report | ALLOW | HTTP 200 · 1 satır PASS |
| User A → User B report | DENY | HTTP 200 · 0 satır PASS |
| User A → User B version | DENY | HTTP 200 · 0 satır PASS |
| User A → User B settings | DENY | HTTP 200 · 0 satır PASS |
| User A → User B audit | DENY | HTTP 200 · 0 satır PASS |
| User A → User B UPDATE/DELETE | DENY (0 satır) | PASS + sonrasında B fixture bütünlüğü PASS |
| Admin modeli (record/profile/audit) | ALLOW | HTTPS 200 PASS |

Hedefler yalnızca `MMPI_PROD_VALIDATION` etiketli fixture'dır; gerçek veriye çapraz erişim denenmez.

## 8. Admin

- `admin-users`: kimliksiz/geçersiz → 401; psychologist → 403; inactive → 401/403; admin + bilinmeyen action/bozuk JSON/geçersiz create yükü → 400 (input validation).
- Admin'in RLS görünürlük modeli (tüm kayıtlar+audit okuyabilir) IDOR bölümünde doğrulanır.
- Admin create/delete ALLOW kanıtı, **Deletion bölümüyle çapraz** doğrulanır (gerçek Edge yolu).

## 9. Inactive

- Auth düzeyinde oturum verilmiyorsa (ban) → bu fail-closed davranışı PASS sayılır ve REST matrisi atlanır.
- Oturum açılabiliyorsa: kayıtlar/raporlar/templates/audit/AI Edge → DENY (401/403 veya 200 + 0 satır).

## 10. Edge Functions

Yukarıdaki admin-users/ai-interpretation güvenlik matrisi + canlı dağıtım sinyali (kimliksiz 401/403, 404 → FAIL). CORS preflight/production-origin ayrımı bu bölüm altında `CORS` alanına da düşer.

## 11. AI Security

- Kimlik/rol/aktif profil/ownership zinciri canlı isteklerle; record modunda çapraz kullanıcı `recordId` → 403.
- Girdi doğrulaması: bozuk JSON, bilinmeyen mode, UUID dışı recordId, NaN-string, bilinmeyen ölçek, >64 KiB gövde → 400/413.
- **566 ham cevap** request body'sine eklenirse schema reddi beklenir (AI scoring yapmaz sözleşmesi). Mock QA: PASS.
- Rate limit: gözlenirse kanıt; gözlenemezse `CONDITIONAL`; **DISTRIBUTED_RATE_LIMITER = NOT_VERIFIED** sabit olarak raporlanır (Phase B sınırlaması — in-instance sayaç, cold-start'ta sıfırlanır).
- Provider key'in frontend'de olmadığı: repo + deployed bundle taraması (Secrets bölümü).

## 12. Secret Scan

- Kapsam: `src/`, `supabase/functions/`, `scripts/`, `docs/`, `dist/` (varsa) + **canlı** production HTML/asset.
- False-positive kontrolleri: anon/publishable Supabase anahtarı (JWT payload `role:'anon'` decode edilerek), `sb_publishable_*`, placeholder'lar, regex tanım satırları, CSS `sk-*` sınıfları, `.env.example` yorum metni (case-sensitive değişken tanımı ayrımı).
- Bu ortamdaki ölçüm: **0 secret / 0 belirsiz** (262 dosya). Değerler asla rapora yazılmaz.

## 13. CORS

- Edge: production origin preflight → `ACAO = origin` beklenir; yabancı origin → ACAO yok veya origin yansıtılmaz; POST yabancı origin → 403 (fail-closed). Wildcard `*` → CONDITIONAL (token-tabanlı API notuyla).
- Frontend (statik HTML): wildcard + credentials kombinasyonu FAIL; statik public HTML'de `ACAO:*` tek başına fail-değil (false-positive kontrolü, §43).

## 14. CSP

Canlı yanıttan ölçüm: mevcut mu, `frame-ancestors`, `script-src` içinde `unsafe-eval`/`unsafe-inline`, `connect-src` wildcard/https ayrımı. `<meta>` CSP fallback'i `CONDITIONAL` olarak işaretlenir.

## 15. Security Headers

HSTS (uzun max-age), `X-Content-Type-Options: nosniff`, CSP, `Referrer-Policy`, `Permissions-Policy`, clickjacking (XFO veya frame-ancestors). Repo `dist/_headers` kanıtı mevcut `verify-production-config.mjs` REUSE ile Configuration altında ayrıca tutulur.

## 16. TLS

`node:tls` ile: zincir doğrulaması, geçerlilik penceresi (>7 gün), protokol (≥ TLS1.2), issuer/subject, her iki host (production + Supabase). Self-signed/hostname uyumsuzluğu FAIL; erişilememe BLOCKED.

## 17. Production Config

- **REUSE:** `npm run verify:production-config` (repo artefakt kontrolleri) child-process; satırları kanıt tablosuna taşınır. Bu ortamda 12/12 PASS (`dist/` mevcut).
- Canlı: bundle → doğru Supabase host referansı, localhost/127.0.0.1/dev referansı yok, test/debug kalıntısı yok; anon key varlığı **bilinçli olarak FAIL sayılmaz** (public tasarım).

## 18. Browser E2E

- Playwright yoksa: **BLOCKED + kurulum komutu** (bu faz dependency eklemez).
- Varsa: Chromium/Firefox/WebKit üzerinde açılış → kimliksiz login ekranı → korumalı rota kapanır → yanlış parola fail-closed UI → giriş → panel → kayıtlar → `VALIDATION_RECORD_ID` varsa kayıt → rapor → **PDF (Chromium A4; sha256 + sayfa sayısı)** → logout → korumanın geri gelmesi. Kimlikler yalnızca env/.env.local'den okunur, hiçbir çıktıya yazılmaz.

## 19. Reports

- `[REPOSITORY]` reportDataAdapter **skorlama yürütmez** (yalnızca görüntüleme yardımcıları + type import; yürütme importu/çağrısı yok) + `tests/reports.test.ts` + `tests/reportDatabase.test.ts` alt kümesi: **25 pass / 0 fail** (bu ortamdan kanıt).
- `[LIVE]` sahiplik matrisi + sistem şablonu görünürlüğü + snapshot yapı bütünlüğü (`source_data_version`, `version_number`, `revision`, `status` alan mevcudiyeti; değerler saklanmaz).

## 20. PDF

- `[REPOSITORY]` `npm run verify:pdf` (form PDF geometrisi): PASS (bu ortamdan).
- `[LIVE/BROWSER]` rapor sayfası yazdırma akışından A4 PDF üretimi (Chromium): bayt boyutu + sayfa sayısı + sha256. `VALIDATION_RECORD_ID` yoksa SKIPPED. Firefox/WebKit'te `page.pdf()` yok → manual matris NOT_APPLICABLE (kullanıcı yazdırma kontrolü yapar).
- Fiziksel baskı ölçümü bu fazda yapılmaz.

## 21. Deletion

Çift kilit: `LIVE_MATRIX_ALLOW_WRITES=YES` **ve** `PRODUCTION_VALIDATION_CONFIRM=YES`. Akış: admin-users create → disposable oturum → fixture zinciri → admin-users delete → profile/record/report/version/settings/template cascade **0 satır** → eski JWT ölü (401/403/0 satır) → tekrar giriş reddi → audit izi gözlemi (auth-cascade yolunda trigger uyarısı yazmayabilir → `CONDITIONAL` tasarım notu; bu fazda değişiklik yapılmaz). **Gerçek kullanıcı asla hedeflenmez** (e-posta önek kilidi + bu çalıştırmada üretilmiş kimlik şartı).

## 22. OMR External Status

**OMR VALIDATION: EXTERNAL / USER-VALIDATED SEPARATELY.** Bu araç OMR doğruluğu hakkında karar vermez; `mmpiScoring`/OMR kaynak dosyalarına dokunulmamıştır. Sentetik/mevcut testler yalnızca regresyon kapısında `npm test` içinde koşar. Fiziksel kamera/kâğıt doğrulaması kullanıcı tarafından ayrıca yapılacaktır; final release gate OMR'dan bağımsız hesaplanır (kural §34-35).

## 23. Findings

Biçim: `ID · Severity · Area · Expected · Actual · Evidence · Status · Recommended Action`.

| ID | Severity | Area | Expected | Actual | Evidence | Status | Recommended Action |
|---|---|---|---|---|---|---|---|
| PVC-001 | HIGH | Live RLS/IDOR/Auth | Kullanıcı makinesinde canlı PASS | Bu ortamda kimlik/erişim yok | Sandbox koşusu 24 BLOCKED listesi | BLOCKED | Runbook §Environment variables + §Disposable test users → Windows'ta koşun |
| PVC-002 | HIGH | Remote schema | Derin katalog PASS | `SUPABASE_SERVICE_ROLE_KEY` yok (bu ortamda) | Migrations modülü | BLOCKED | Service key verin veya runbook SQL'leri |
| PVC-003 | HIGH | Browser E2E | 3 motorda akış PASS | Playwright bu ortamda yok | check-browser-e2e | BLOCKED | `npm i -D playwright && npx playwright install chromium firefox webkit` |
| PVC-004 | MEDIUM | Rate limit | Distributed limiter | In-instance sayaç (Phase B belgeli) | Edge modülü | CONDITIONAL | DESIGN NOT VERIFIED; dağıtık limiter ayrı karar |
| PVC-005 | MEDIUM | Auth config | Redirect/Site URL/SMTP canlı doğrulama | Management API kapsam dışı | Auth modülü | BLOCKED | Runbook checklist ile Dashboard doğrulaması |
| PVC-006 | LOW | Audit (auth-cascade) | record_delete izi | Trigger uyarısı yazmayabilir (tasarım notu) | Deletion modülü | UNVERIFIED→gözlem | Kullanıcı makinesindeki koşuda gözlenir; değişiklik bu fazda yapılmaz |
| PVC-007 | INFO | OMR | EXTERNAL | EXTERNAL | §0.2 | EXTERNAL | Kullanıcı fiziksel testi ayrı yapar |

## 24. Evidence

- **Bu ortamdaki tam kanıt paketi:** `artifacts/production-validation/latest.json` + `latest.md` (bu dosyalar Git'e girmez; koşu anında üretilir). Özet: `PASS 24 · FAIL 0 · BLOCKED 24 · N/A 8 · EXTERNAL 1` — `FINAL STATUS: BLOCKED`.
- Regresyon kanıtı (aynı koşudan): **npm test 732/732 PASS**; `npm run typecheck` PASS; `npm audit` 0 açık; `npm run verify:pdf` PASS.
- Mekanik QA (mock Supabase/GoTrue/Edge, /tmp'de — depo dışı): **181 PASS / 0 FAIL**; bu kanıt yalnızca araç beklentilerinin doğruluğunu gösterir ve production PASS SAYILMAZ.
- Kullanıcı makinesindeki koşunun kanıt formatı: her satır `check · expected · actual · status · timestamp · endpoint/resource`; token/parola/secret/kişisel veri içermez.

## 25. Remaining Blockers (kullanıcı tarafında kapatılacaklar)

1. `.env.production-validation.local` (veya `$env:` değişkenleri) ile gerçek değerleri verin → Environment/Supabase/Auth blokajları açılır.
2. Dört disposable test hesabı oluşturun (runbook) → RLS/IDOR canlı PASS üretilebilir.
3. Service role key verin → derin schema drift kapanır.
4. Playwright kurun → Browser E2E kapanır (Chromium/Firefox/WebKit + PDF kanıtı).
5. `LIVE_MATRIX_ALLOW_WRITES=YES` ve gerektiğinde `PRODUCTION_VALIDATION_CONFIRM=YES` → yazma/silme kapıları.
6. Dashboard auth checklist (redirect/site URL/session) → PVC-005.

## 26. Final Release Gate (bu ortamdan hesaplanan)

```
READY koşulları (kural §34):
  scoring regression PASS      → PASS  (732/732 + typecheck + audit + pdf)
  live RLS PASS                → BLOCKED (kullanıcı makinesi bekleniyor)
  IDOR PASS                    → BLOCKED
  Auth PASS                    → BLOCKED
  deletion PASS                → BLOCKED
  production HTTPS/TLS PASS    → BLOCKED
  security headers PASS        → BLOCKED (canlı; repo _headers PASS)
  production configuration     → BLOCKED (canlı; repo 12/12 PASS)
  browser E2E PASS             → BLOCKED
  edge/AI security PASS        → BLOCKED
  report/PDF PASS              → repo PASS / canlı BLOCKED
  no critical secret leakage   → PASS (repo taraması 0 bulgu)
```

# FINAL STATUS (bu ortamdan): **BLOCKED**

Beklenen ve doğru durum: canlı kanıtlar ancak kullanıcının gerçek PC + gerçek Supabase + gerçek domaininde üretilebilir. **OMR: EXTERNAL / USER-VALIDATED SEPARATELY.** Kullanıcı koşusunda yeni FINAL STATUS, `artifacts/production-validation/latest.json` içinde aynı algoritmayla yeniden hesaplanır ve bu rapor güncellenebilir.
