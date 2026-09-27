/**
 * 06 — IDOR kanonik matrisi (rapor §8, §42 kanıt biçimi).
 *
 * RLS bölümünde koşucu üzerinden geçen senaryolara ek olarak, burada kanıt
 * tablosunun gerektirdiği kanonik sekiz satır doğrudan REST ile doğrulanır.
 * Hedefler yalnızca MMPI_PROD_VALIDATION etiketli fixture kimlikleridir;
 * gerçek üretim verisine çapraz erişim ASLA denenmez.
 */
import { Collector, SEVERITY } from './lib/output.mjs';
import { rest, isDeniedShape, describeResult } from './lib/supabase.mjs';
import { ensureSessions } from './lib/fixtures.mjs';
import { writesAllowed } from './lib/env.mjs';

function entry(out, { check, expected, result, severity = SEVERITY.CRITICAL, action = null }) {
  const expectedText = expected;
  const actualText = describeResult(result);
  if (result.status == null) return out.blocked(check, `bağlantı yok (${result.error})`, { expected: expectedText, severity });
  const ok = expected === 'ALLOW' ? (result.status === 200 && (result.rows === null || result.rows >= 1)) : isDeniedShape(result);
  if (ok) return out.pass(check, expectedText, actualText, { severity });
  return out.fail(check, expectedText, actualText, { severity, action: action ?? 'RLS policy drift veya grant sorunu — derhal inceleyin (bu bir üretim hatası bulgusudur, koddan önce raporlanır).' });
}

export async function run(ctx) {
  const out = new Collector('IDOR');
  if (!ctx.supabase) {
    out.blocked('IDOR matrisi', 'SUPABASE_URL / SUPABASE_ANON_KEY tanımsız', { severity: SEVERITY.CRITICAL });
    return out;
  }
  const sessions = await ensureSessions(ctx);
  const A = sessions.userA; const B = sessions.userB;
  if (!A?.ok || !B?.ok) {
    out.blocked('IDOR matrisi', 'User A + User B oturumları zorunlu', { severity: SEVERITY.CRITICAL, action: 'Runbook: Disposable test users.' });
    return out;
  }
  const fxA = ctx.fixtures?.userA; const fxB = ctx.fixtures?.userB;
  if (!fxA?.recordId || !fxB?.recordId) {
    out.blocked('IDOR matrisi', 'her iki kullanıcı için etiketli kayıt fixture’ı gerekli', {
      severity: SEVERITY.CRITICAL,
      action: 'LIVE_MATRIX_ALLOW_WRITES=YES ile çalıştırın (yalnızca MMPI_PROD_VALIDATION etiketli sahte veri üretilir).',
    });
    return out;
  }

  // Kanonik sekiz satır (rapor §8).
  entry(out, { check: 'User A → own record', expected: 'ALLOW', result: await rest(ctx.supabase, `/rest/v1/mmpi_records?id=eq.${fxA.recordId}&select=id`, { token: A.token }) });
  entry(out, { check: 'User A → User B record', expected: 'DENY', result: await rest(ctx.supabase, `/rest/v1/mmpi_records?id=eq.${fxB.recordId}&select=id`, { token: A.token }) });
  entry(out, { check: 'User B → User A record', expected: 'DENY', result: await rest(ctx.supabase, `/rest/v1/mmpi_records?id=eq.${fxA.recordId}&select=id`, { token: B.token }) });

  if (fxA.reportId && fxB.reportId) {
    entry(out, { check: 'User A → own report', expected: 'ALLOW', result: await rest(ctx.supabase, `/rest/v1/mmpi_reports?id=eq.${fxA.reportId}&select=id`, { token: A.token }) });
    entry(out, { check: 'User A → User B report', expected: 'DENY', result: await rest(ctx.supabase, `/rest/v1/mmpi_reports?id=eq.${fxB.reportId}&select=id`, { token: A.token }) });
  } else {
    out.blocked('User A/B ↔ report satırları', 'rapor fixture’ı eksik', { severity: SEVERITY.CRITICAL });
  }
  if (fxB.versionId) {
    entry(out, { check: 'User A → User B version', expected: 'DENY', result: await rest(ctx.supabase, `/rest/v1/mmpi_report_versions?id=eq.${fxB.versionId}&select=id`, { token: A.token }) });
  } else {
    out.blocked('User A → User B version', 'User B sürüm fixture’ı eksik', { severity: SEVERITY.HIGH });
  }
  if (B.userId) {
    entry(out, { check: 'User A → User B settings', expected: 'DENY', result: await rest(ctx.supabase, `/rest/v1/psychologist_report_settings?created_by=eq.${B.userId}&select=created_by`, { token: A.token }) });
  }
  entry(out, { check: 'User A → User B audit', expected: 'DENY', result: await rest(ctx.supabase, `/rest/v1/audit_logs?actor=eq.${B.userId}&select=id&limit=1`, { token: A.token }) });

  // Yazma IDOR’ları (yalnızca etiketli fixture hedefi ve yazma kilidi açıkken).
  if (writesAllowed()) {
    const patch = await rest(ctx.supabase, `/rest/v1/mmpi_records?id=eq.${fxB.recordId}`, {
      token: A.token, method: 'PATCH', body: { expert_notes: 'production-validation-forbidden' }, prefer: 'return=representation',
    });
    if (patch.status == null) out.blocked('User A → User B record UPDATE', `bağlantı (${patch.error})`, { severity: SEVERITY.CRITICAL });
    else if (isDeniedShape(patch)) out.pass('User A → User B record UPDATE', 'DENY (0 satır etkilenir)', describeResult(patch), { severity: SEVERITY.CRITICAL });
    else out.fail('User A → User B record UPDATE', 'DENY (0 satır etkilenir)', describeResult(patch), { severity: SEVERITY.CRITICAL });

    const del = await rest(ctx.supabase, `/rest/v1/mmpi_records?id=eq.${fxB.recordId}`, { token: A.token, method: 'DELETE', prefer: 'return=representation' });
    if (del.status == null) out.blocked('User A → User B record DELETE', `bağlantı (${del.error})`, { severity: SEVERITY.CRITICAL });
    else if (isDeniedShape(del)) out.pass('User A → User B record DELETE', 'DENY (0 satır etkilenir)', describeResult(del), { severity: SEVERITY.CRITICAL });
    else out.fail('User A → User B record DELETE', 'DENY (0 satır etkilenir)', describeResult(del), { severity: SEVERITY.CRITICAL });

    // Bütünlük kanıtı: denemelerden sonra User B fixture’ı hâlâ yerinde olmalı.
    const intact = await rest(ctx.supabase, `/rest/v1/mmpi_records?id=eq.${fxB.recordId}&select=id`, { token: B.token });
    if (intact.status === 200 && intact.rows === 1) out.pass('IDOR sonrası User B fixture bütünlüğü', 'kayıt değişmedi/ silinmedi', describeResult(intact), { severity: SEVERITY.CRITICAL });
    else if (intact.status == null) out.blocked('IDOR sonrası User B fixture bütünlüğü', `bağlantı (${intact.error})`, { severity: SEVERITY.CRITICAL });
    else out.fail('IDOR sonrası User B fixture bütünlüğü', 'kayıt değişmedi/silinmedi', describeResult(intact), { severity: SEVERITY.CRITICAL, action: 'UPDATE/DELETE IDOR gerçekleşmiş olabilir — KRİTİK bulgu, RLS kırılmış.' });
  } else {
    out.skipped('UPDATE/DELETE IDOR denemeleri + bütünlük kanıtı', 'LIVE_MATRIX_ALLOW_WRITES=YES gerekir', { severity: SEVERITY.CRITICAL, expected: '0 satır etkilenir' });
  }

  // Admin erişim modeli (belgelenen politika: admin okuyabilir, audit okuyabilir).
  const admin = sessions.admin;
  if (admin?.ok) {
    entry(out, { check: 'Admin → User A record (belgelenen model)', expected: 'ALLOW', result: await rest(ctx.supabase, `/rest/v1/mmpi_records?id=eq.${fxA.recordId}&select=id`, { token: admin.token }) });
    entry(out, { check: 'Admin → User A profile (belgelenen model)', expected: 'ALLOW', result: await rest(ctx.supabase, `/rest/v1/profiles?id=eq.${A.userId}&select=id`, { token: admin.token }) });
    const audit = await rest(ctx.supabase, '/rest/v1/audit_logs?select=id&limit=1', { token: admin.token });
    if (audit.status === 200) out.pass('Admin → audit_logs (belgelenen model)', 'ALLOW', describeResult(audit), { severity: SEVERITY.CRITICAL });
    else if (audit.status == null) out.blocked('Admin → audit_logs', `bağlantı (${audit.error})`, { severity: SEVERITY.CRITICAL });
    else out.fail('Admin → audit_logs (belgelenen model)', 'ALLOW', describeResult(audit), { severity: SEVERITY.CRITICAL });
    out.notApplicable('Admin → destrüktif DELETE', 'bilinçli olarak denenmez (yalnızca disposable fixture üzerinde zararsız sondalar)'); 
  } else {
    out.blocked('Admin erişim modeli', 'TEST_ADMIN_* oturumu yok', { severity: SEVERITY.CRITICAL });
  }

  return out;
}
