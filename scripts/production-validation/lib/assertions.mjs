/**
 * Doğrulama yardımcıları: beklenen/gerçekleşen ifadelerini tek biçimde üretir.
 */
import { isDeniedShape, describeResult } from './supabase.mjs';

/** expectedStatus: 200 | [401,403] | {allowRows:n} | 'deny' */
export function matchesExpectation(result, expected) {
  if (!result || result.status == null) return false;
  if (expected === 'deny') return isDeniedShape(result);
  if (Array.isArray(expected)) return expected.includes(result.status);
  if (typeof expected === 'number') return expected === result.status;
  if (expected && typeof expected === 'object') {
    if (expected.status !== undefined) {
      const statusOk = Array.isArray(expected.status) ? expected.status.includes(result.status) : expected.status === result.status;
      if (!statusOk) return false;
    }
    if (expected.rows !== undefined && result.rows !== expected.rows) return false;
    return true;
  }
  return false;
}

export function expectationText(expected) {
  if (expected === 'deny') return 'DENY (401/403 veya 200 + 0 satır)';
  if (Array.isArray(expected)) return `HTTP ${expected.join('/')}`;
  if (typeof expected === 'number') return `HTTP ${expected}`;
  if (expected && typeof expected === 'object') {
    const bits = [];
    if (expected.status !== undefined) bits.push(`HTTP ${Array.isArray(expected.status) ? expected.status.join('/') : expected.status}`);
    if (expected.rows !== undefined) bits.push(`${expected.rows} satır`);
    return bits.join(' + ');
  }
  return String(expected);
}

/**
 * Collector üzerinden EXPECTED / ACTUAL / STATUS üçlüsüyle kanıt kaydı üretir.
 */
export function evidenceEntry(collector, { check, expected, result, resource, endpoint, severity = 'critical', action = null, statusOverride = null }) {
  const expectedText = expectationText(expected);
  const actualText = describeResult(result);
  if (!result || result.status == null) {
    return collector.blocked(check, `bağlantı yok (${result?.error ?? 'bilinmiyor'})`, { expected: expectedText, resource, endpoint, severity, action });
  }
  const ok = statusOverride ? statusOverride(result) : matchesExpectation(result, expected);
  if (ok) return collector.pass(check, expectedText, actualText, { resource, endpoint, severity });
  return collector.fail(check, expectedText, actualText, { resource, endpoint, severity, action });
}
