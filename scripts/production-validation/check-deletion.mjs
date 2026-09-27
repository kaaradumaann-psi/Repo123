/**
 * 07 — Kullanıcı silme / cascade doğrulaması (rapor §18, §29).
 *
 * YALNIZCA bu çalıştırma sırasında admin-users Edge Function'ı ile üretilen,
 * `mmpi-prod-validation-` önekli DISPOSABLE psikolog hesabı silinir.
 * Gerçek kullanıcı asla hedeflenmez (e-posta öneki + kullanıcı kimliği bu
 * çalıştırmada üretilmiş olmalı). İki kilit birden gerekir:
 * LIVE_MATRIX_ALLOW_WRITES=YES ve PRODUCTION_VALIDATION_CONFIRM=YES.
 */
import { randomBytes } from 'node:crypto';
import { Collector, SEVERITY } from './lib/output.mjs';
import { rest, signIn, describeResult } from './lib/supabase.mjs';
import { edgeFunction } from './lib/supabase.mjs';
import { destructiveConfirmed, writesAllowed } from './lib/env.mjs';
import { ensureSessions, createUserFixtures, DISPOSABLE_EMAIL_PREFIX } from './lib/fixtures.mjs';

export async function run(ctx) {
  const out = new Collector('Deletion / cascade');

  if (!ctx.supabase) {
    out.blocked('Deletion doğrulaması', 'SUPABASE_URL / SUPABASE_ANON_KEY tanımsız', { severity: SEVERITY.CRITICAL });
    return out;
  }
  if (!writesAllowed()) {
    out.skipped('Deletion / cascade akışı', 'LIVE_MATRIX_ALLOW_WRITES=YES gerekir', { severity: SEVERITY.HIGH, expected: 'disposable kullanıcı ile tam cascade kanıtı' });
    return out;
  }
  if (!destructiveConfirmed()) {
    out.skipped('Deletion / cascade akışı', 'PRODUCTION_VALIDATION_CONFIRM=YES gerekir (destrüktif akış kilidi)', { severity: SEVERITY.HIGH, expected: 'disposable kullanıcı ile tam cascade kanıtı', action: 'Runbook "Deletion validation" bölümündeki güvenlik notlarını okuyup iki kilidi birden açın.' });
    return out;
  }

  const sessions = await ensureSessions(ctx);
  const admin = sessions.admin;
  if (!admin?.ok) {
    out.blocked('Deletion / cascade akışı', 'TEST_ADMIN_* oturumu zorunlu', { severity: SEVERITY.HIGH, action: 'Admin disposable fixture kullanıcısını yalnızca admin-users Edge Function’ı silebilir.' });
    return out;
  }

  // 1) Disposable psikolog üret (gerçek Edge yolu — aynı zamanda admin-users create doğrulaması).
  const email = `${DISPOSABLE_EMAIL_PREFIX}delete-${Date.now()}-${randomBytes(3).toString('hex')}@validation.invalid`;
  const password = `Pv!${randomBytes(21).toString('hex')}`;
  const create = await edgeFunction(ctx.supabase, 'admin-users', {
    token: admin.token,
    body: { action: 'create', firstName: 'MMPI_PROD_VALIDATION', lastName: `Delete ${randomBytes(3).toString('hex')}`, email, password },
  });
  const createdId = create.ok && create.json && typeof create.json.user?.id === 'string' ? create.json.user.id
    : (create.ok && typeof create.json?.id === 'string' ? create.json.id : null);
  if (!create.ok) {
    out.blocked('Disposable kullanıcı üretimi (admin-users create)', `bağlantı (${create.error})`, { severity: SEVERITY.HIGH });
    return out;
  }
  if (!createdId) {
    out.fail('Disposable kullanıcı üretimi (admin-users create)', 'HTTP 200 + user id', `HTTP ${create.status}`, { severity: SEVERITY.HIGH, action: 'admin-users create akışını inceleyin (Edge Functions bölümü ile çapraz).', endpoint: '/functions/v1/admin-users' });
    return out;
  }
  if (!email.startsWith(DISPOSABLE_EMAIL_PREFIX)) {
    out.fail('Güvenlik kilidi', 'disposable e-posta öneki', 'beklenmeyen adres — silme YAPILMAZ', { severity: SEVERITY.CRITICAL });
    return out;
  }
  out.pass('Disposable kullanıcı üretimi (admin-users create)', 'HTTP 200 + user id', `HTTP ${create.status} · id alındı`, { endpoint: '/functions/v1/admin-users', severity: SEVERITY.HIGH });

  let deleted = false;
  try {
    // 2) Disposable kullanıcı ile oturum + fixture zinciri.
    const login = await signIn(ctx.supabase, email, password);
    if (!login.ok || !login.token) {
      out.fail('Disposable kullanıcı oturumu', 'password grant ile token', `HTTP ${login.status ?? login.error}`, { severity: SEVERITY.HIGH, action: 'Yeni hesap mail-confirm bekliyor olabilir; admin-users create email_confirm=true üretmelidir.' });
      return out;
    }
    out.pass('Disposable kullanıcı oturumu', 'password grant ile token', 'HTTP 200', { severity: SEVERITY.HIGH });

    ctx.sessions.disposable = { ok: true, token: login.token, userId: login.userId ?? createdId };
    const fixtures = await createUserFixtures(ctx, 'disposable');
    if (!fixtures.ok) {
      out.blocked('Disposable fixture zinciri', fixtures.reason ?? 'oluşturulamadı', { severity: SEVERITY.HIGH });
    } else {
      out.pass('Disposable fixture zinciri', 'kayıt+rapor+şablon+ayar', `${['recordId', 'reportId', 'templateId'].filter((k) => fixtures[k]).length}/3 + settings=${fixtures.settingsWritten ? 'evet' : 'hayır'}`, { severity: SEVERITY.HIGH });
    }

    // 3) Silme — admin-users delete.
    const deletion = await edgeFunction(ctx.supabase, 'admin-users', {
      token: admin.token,
      body: { action: 'delete', userId: createdId },
    });
    if (!deletion.ok) {
      out.blocked('admin-users delete (disposable hedef)', `bağlantı (${deletion.error})`, { severity: SEVERITY.HIGH });
      return out;
    }
    if (deletion.status === 200) {
      deleted = true;
      out.pass('admin-users delete (disposable hedef)', 'HTTP 200', `HTTP ${deletion.status}`, { endpoint: '/functions/v1/admin-users', severity: SEVERITY.HIGH });
    } else {
      out.fail('admin-users delete (disposable hedef)', 'HTTP 200', `HTTP ${deletion.status}`, { endpoint: '/functions/v1/admin-users', severity: SEVERITY.HIGH, action: 'delete akışını ve Edge loglarını inceleyin.' });
      return out;
    }

    // 4) Cascade kanıtları (admin gözüyle, satır SAYISI ile).
    const checks = [
      ['profiles', `/rest/v1/profiles?id=eq.${createdId}&select=id`, 'profil silindi (auth cascade)'],
      ['mmpi_records', `/rest/v1/mmpi_records?created_by=eq.${createdId}&select=id`, 'kayıtlar cascade'],
      ['mmpi_reports', `/rest/v1/mmpi_reports?created_by=eq.${createdId}&select=id`, 'raporlar cascade'],
      ['psychologist_report_settings', `/rest/v1/psychologist_report_settings?created_by=eq.${createdId}&select=created_by`, 'ayarlar cascade'],
      ['mmpi_report_templates', `/rest/v1/mmpi_report_templates?created_by=eq.${createdId}&select=id`, 'kullanıcı şablonları cascade'],
    ];
    for (const [, path, label] of checks) {
      const probe = await rest(ctx.supabase, path, { token: admin.token });
      if (probe.status == null) out.blocked(`Cascade: ${label}`, `bağlantı (${probe.error})`, { severity: SEVERITY.HIGH });
      else if (probe.status === 200 && probe.rows === 0) out.pass(`Cascade: ${label}`, '0 satır kaldı', describeResult(probe), { severity: SEVERITY.HIGH });
      else out.fail(`Cascade: ${label}`, '0 satır kaldı', describeResult(probe), { severity: SEVERITY.HIGH, action: 'on delete cascade zinciri drift etmiş olabilir — remote FK tanımlarını doğrulayın.' });
    }

    // Rapor sürümleri: fixture raporu varsa, sürümler 0 kalmalı.
    if (fixtures.reportId) {
      const versions = await rest(ctx.supabase, `/rest/v1/mmpi_report_versions?report_id=eq.${fixtures.reportId}&select=id`, { token: admin.token });
      if (versions.status == null) out.blocked('Cascade: rapor sürümleri', `bağlantı (${versions.error})`, { severity: SEVERITY.HIGH });
      else if (versions.status === 200 && versions.rows === 0) out.pass('Cascade: rapor sürümleri', '0 satır kaldı', describeResult(versions), { severity: SEVERITY.HIGH });
      else out.fail('Cascade: rapor sürümleri', '0 satır kaldı', describeResult(versions), { severity: SEVERITY.HIGH });
    }

    // 5) Eski token artık işe yaramamalı (auth + RLS seviyesi fail-closed).
    const stale = await rest(ctx.supabase, '/rest/v1/mmpi_records?select=id&limit=1', { token: login.token });
    if (stale.status == null) out.blocked('Silinen kullanıcının eski JWT’si', `bağlantı (${stale.error})`, { severity: SEVERITY.HIGH });
    else if (stale.status === 401 || stale.status === 403 || (stale.status === 200 && stale.rows === 0)) {
      out.pass('Silinen kullanıcının eski JWT’si', 'kaynak kapalı (401/403 veya 0 satır)', describeResult(stale), { severity: SEVERITY.HIGH });
    } else out.fail('Silinen kullanıcının eski JWT’si', 'kaynak kapalı', describeResult(stale), { severity: SEVERITY.CRITICAL });

    const relogin = await signIn(ctx.supabase, email, password);
    if (!relogin.ok) out.blocked('Silinen kullanıcıyla tekrar oturum', `bağlantı (${relogin.error})`, { severity: SEVERITY.HIGH });
    else if (relogin.token) out.fail('Silinen kullanıcıyla tekrar oturum', 'token VERİLMEMELİ', 'token verildi — Auth silinmemiş', { severity: SEVERITY.CRITICAL });
    else out.pass('Silinen kullanıcıyla tekrar oturum', 'token verilmez (4xx)', `HTTP ${relogin.status ?? '?'}`, { severity: SEVERITY.HIGH });

    // 6) Audit davranışı (tasarım sözleşmesi gözlemi).
    if (fixtures.recordId) {
      const audit = await rest(ctx.supabase, `/rest/v1/audit_logs?target_id=eq.${fixtures.recordId}&select=id`, { token: admin.token });
      if (audit.status == null) out.blocked('Audit: silme izi', `bağlantı (${audit.error})`, { severity: SEVERITY.MEDIUM });
      else if (audit.status === 200 && audit.rows >= 1) out.pass('Audit: kullanıcı silme cascade izi', 'record_delete izi mevcut', `${audit.rows} satır`, { resource: 'audit_logs', severity: SEVERITY.MEDIUM });
      else out.conditional('Audit: kullanıcı silme cascade izi', 'record_delete izi mevcut (tasarım varsayımı)', `${describeResult(audit)} — auth-cascade yolunda audit trigger uyarısı yazmıyor olabilir`, { resource: 'audit_logs', severity: SEVERITY.LOW, action: 'Tasarım kararı: auth-cascade silmelerde audit izi isteniyorsa ayrı migration gerekir; bu fazda değiştirilmez.' });
    }
  } finally {
    // Bu çalıştırmanın disposable kullanıcısının fixture temizliği artık anlamsız
    // (cascade kapsıyor); temizleme kuyruğundan çıkar.
    if (deleted && Array.isArray(ctx.cleanup)) ctx.cleanup = [];
  }

  return out;
}
