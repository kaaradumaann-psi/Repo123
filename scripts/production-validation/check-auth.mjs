/**
 * 04 — Authentication / Authorization yapılandırması (rapor §5, §9, §17).
 *
 *  - /auth/v1/settings üzerinden CANLI auth config kanıtı (disable_signup vb.).
 *  - Rol bazlı gerçek oturum açma (A/B/Admin/Inactive).
 *  - Public signup probu (yalnızca yazma kilidi açıkken; etiketli sahte adres).
 *  - Uzaktan gözlenemeyenler (redirect URL/SMTP/session) tahmin edilmez → BLOCKED/UNVERIFIED.
 */
import { Collector, SEVERITY } from './lib/output.mjs';
import { randomBytes } from 'node:crypto';
import { authSettings, signupProbe, rest, isDeniedShape, describeResult } from './lib/supabase.mjs';
import { envValue, writesAllowed } from './lib/env.mjs';
import { ensureSessions, ROLE_LABELS } from './lib/fixtures.mjs';

const EXPECT_SIGNUP = (envValue('PROD_VALIDATION_EXPECT_SIGNUP') || 'disabled').toLowerCase();

export async function run(ctx) {
  const out = new Collector('Authentication');
  if (!ctx.supabase) {
    out.blocked('Authentication doğrulaması', 'SUPABASE_URL / SUPABASE_ANON_KEY tanımsız', { severity: SEVERITY.CRITICAL });
    return out;
  }

  // Canlı auth settings (GoTrue public config).
  const settings = await authSettings(ctx.supabase);
  if (!settings.ok) {
    out.blocked('Auth settings (canlı)', `erişilemiyor (${settings.error})`, { expected: '/auth/v1/settings', severity: SEVERITY.HIGH });
  } else if (settings.status !== 200 || !settings.json || typeof settings.json !== 'object') {
    out.blocked('Auth settings (canlı)', `okunamadı (HTTP ${settings.status})`, { expected: 'HTTP 200 JSON', severity: SEVERITY.HIGH, action: 'GoTrue sürümü settings ucu sunmuyor olabilir; Dashboard’dan elle doğrulayın (runbook).' });
  } else {
    const s = settings.json;
    if (typeof s.disable_signup === 'boolean') {
      if (EXPECT_SIGNUP === 'disabled') {
        if (s.disable_signup === true) out.pass('Public signup kapalı (canlı)', 'disable_signup = true', 'disable_signup = true', { severity: SEVERITY.CRITICAL });
        else out.fail('Public signup kapalı (canlı)', 'disable_signup = true', 'disable_signup = false — config.toml politikasıyla ÇELİŞİYOR', { severity: SEVERITY.CRITICAL, action: 'Dashboard → Authentication → Sign In / Up → Allow new users KAPALI olmalı.' });
      } else {
        out.conditional('Public signup durumu (canlı)', `PROD_VALIDATION_EXPECT_SIGNUP=${EXPECT_SIGNUP}`, `disable_signup = ${s.disable_signup}`, { severity: SEVERITY.MEDIUM });
      }
    } else {
      out.blocked('Public signup bayrağı', 'settings.disable_signup alanı', 'alan yok', { severity: SEVERITY.HIGH });
    }
    if (typeof s.mailer_autoconfirm === 'boolean') {
      out.pass('Email confirmation durumu (canlı)', 'canlı değer okunur', `mailer_autoconfirm = ${s.mailer_autoconfirm}`, { severity: SEVERITY.INFO });
    }
    const external = s.external && typeof s.external === 'object' ? Object.entries(s.external).filter(([, v]) => v === true).map(([k]) => k) : [];
    out.notApplicable('Harici OAuth sağlayıcıları (canlı)', external.length ? external.join(', ') : 'yok/kapalı');
  }

  // Rol bazlı gerçek oturumlar.
  const sessions = await ensureSessions(ctx);
  const roleSeverity = { userA: SEVERITY.CRITICAL, userB: SEVERITY.CRITICAL, admin: SEVERITY.CRITICAL, inactive: SEVERITY.HIGH };
  for (const role of Object.keys(sessions)) {
    const session = sessions[role];
    const label = ROLE_LABELS[role];
    if (session.missingEnv) {
      out.blocked(`${label} oturumu`, `${role === 'admin' ? 'TEST_ADMIN' : role === 'inactive' ? 'TEST_INACTIVE' : `TEST_USER_${role === 'userA' ? 'A' : 'B'}`}_* tanımsız`, { expected: 'email+password configured', severity: roleSeverity[role], action: 'Runbook: Disposable test users.' });
    } else if (session.blocked) {
      out.blocked(`${label} oturumu`, 'SUPABASE_URL/ANON_KEY eksik', { severity: roleSeverity[role] });
    } else if (session.ok) {
      out.pass(`${label} oturumu`, 'password grant ile token', `HTTP 200 · user id alınabildi: ${session.userId ? 'evet' : 'hayır'}`, { severity: roleSeverity[role] });
    } else if (role === 'inactive' && (session.status === 400 || session.authBanned)) {
      // Inactive kullanıcının auth düzeyinde reddedilmesi fail-closed davranıştır (ban).
      out.pass(`${label} oturumu`, 'inactive hesap için oturum RED veya profilsiz deneme', `HTTP ${session.status ?? '?'} — auth düzeyinde kapalı (fail-closed)`, { severity: roleSeverity[role] });
    } else {
      out.fail(`${label} oturumu`, 'password grant ile token', `HTTP ${session.status ?? session.error ?? '?'} · kod=${session.errorCode ?? 'yok'}`, { severity: roleSeverity[role], action: 'Test hesabı Dashboard’da var mı? Şifre doğru mu? Hesap doğrulanmış mı?' });
    }
  }

  // Inactive kullanıcı REST denemesi (oturum alınabildiyse kaynaklar kapalı olmalı).
  const inactive = sessions.inactive;
  if (inactive?.ok && inactive.token) {
    for (const [table, label] of [['mmpi_records', 'kayıtlar'], ['mmpi_reports', 'raporlar'], ['audit_logs', 'audit']]) {
      const probe = await rest(ctx.supabase, `/rest/v1/${table}?select=id&limit=1`, { token: inactive.token });
      if (isDeniedShape(probe)) out.pass(`Inactive → ${label}`, 'DENY (401/403 veya 0 satır)', describeResult(probe), { resource: table, severity: SEVERITY.HIGH });
      else if (probe.status == null) out.blocked(`Inactive → ${label}`, `bağlantı (${probe.error})`, { severity: SEVERITY.HIGH });
      else out.fail(`Inactive → ${label}`, 'DENY (401/403 veya 0 satır)', describeResult(probe), { resource: table, severity: SEVERITY.HIGH, action: 'is_active_user()/RLS zincirini inceleyin.' });
    }
  }

  // Public signup probu — yazma kilidi olmadan asla.
  if (EXPECT_SIGNUP === 'disabled') {
    if (!writesAllowed()) {
      out.skipped('Public signup probu (etiketli sahte hesap)', 'LIVE_MATRIX_ALLOW_WRITES=YES gerekir', { severity: SEVERITY.HIGH, expected: 'signup HTTP 4xx' });
    } else {
      const email = `mmpi-prod-validation-signup-probe-${randomBytes(4).toString('hex')}@validation.invalid`;
      const probe = await signupProbe(ctx.supabase, email, `Pv!${randomBytes(18).toString('hex')}`);
      if (!probe.ok) out.blocked('Public signup probu', `erişilemiyor (${probe.error})`, { expected: 'HTTP 4xx', severity: SEVERITY.HIGH });
      else if (probe.status >= 400) out.pass('Public signup probu', 'signup RED (4xx)', `HTTP ${probe.status} · kod=${probe.code ?? 'yok'}`, { severity: SEVERITY.HIGH });
      else {
        out.fail('Public signup probu', 'signup RED (4xx)', `HTTP ${probe.status} — HESAP OLUŞTU`, { severity: SEVERITY.CRITICAL, action: 'Public signup açık! Dashboard’dan kapatın; oluşan validation probe kullanıcısını Authentication → Users listesinden silin (etiket: mmpi-prod-validation-signup-probe).' });
      }
    }
  }

  // Uzaktan gözlenemeyen auth yüzeyi — tahmin edilmez.
  out.blocked('Redirect URL / Site URL / SMTP / session politikaları (canlı)', 'Supabase Management API bu toolkit kapsamında değil', {
    expected: 'dashboard ile tutarlı config', severity: SEVERITY.HIGH,
    action: 'Runbook "Auth configuration checklist": Dashboard değerlerini checklist ile karşılaştırın; tahmin yapılmaz.',
  });

  return out;
}
