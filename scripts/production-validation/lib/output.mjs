/**
 * Sonuç kayıt düzeni (evidence registry) ve çıktı katmanı.
 *
 * Her kontrol şu alanları taşır: id, area, check, expected, actual, status,
 * severity, endpoint, resource, timestamp. Token, parola, secret veya kişisel
 * veri İÇERMEZ — bu katman yazmadan önce alanları doğrular ve uzun değerleri
 * kırpar.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const STATUS = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  BLOCKED: 'BLOCKED',
  SKIPPED: 'SKIPPED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  CONDITIONAL: 'CONDITIONAL',
  EXTERNAL: 'EXTERNAL',
});

export const SEVERITY = Object.freeze({
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
});

const STATUSES = new Set(Object.values(STATUS));
const SEVERITIES = new Set(Object.values(SEVERITY));

const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, text) => (COLOR ? `${code}${text}[0m` : text);
const STATUS_PAINT = {
  PASS: (t) => paint('[32m', t),
  FAIL: (t) => paint('[31m', t),
  BLOCKED: (t) => paint('[33m', t),
  SKIPPED: (t) => paint('[90m', t),
  NOT_APPLICABLE: (t) => paint('[90m', t),
  CONDITIONAL: (t) => paint('[36m', t),
  EXTERNAL: (t) => paint('[35m', t),
};

// Yalnızca GERÇEK secret-biçimli içerik redakte edilir; "secret" kelimesini
// içeren sıradan açıklamalar (ör. "0 secret bulundu") elenmez.
const SECRETISH = /(bearer\s+[A-Za-z0-9._-]{16,}|access_token|refresh_token|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9]{8,}|sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|apikey["']?\s*[:=]\s*["'][A-Za-z0-9._-]{16,})/i;

function sanitizeValue(value, max = 240) {
  if (value === undefined || value === null) return null;
  let text = typeof value === 'string' ? value : JSON.stringify(value);
  if (SECRETISH.test(text)) {
    // Güvenli tarafta kal: bu alan secret-biçimli içerik taşıyorsa saklama.
    return '[redacted]';
  }
  if (text.length > max) text = `${text.slice(0, max)}…`;
  return text;
}

let sequence = 0;

export class Collector {
  constructor(area) {
    this.area = area;
    this.entries = [];
  }

  /**
   * @param {object} e
   * @param {string} e.check      Kontrol adı (insan okunur).
   * @param {*} e.expected        Beklenen davranış (kısa).
   * @param {*} e.actual          Gözlenen davranış (kısa; body/token ASLA).
   * @param {string} e.status     STATUS değerlerinden biri.
   * @param {string} [e.severity]
   * @param {string} [e.endpoint]
   * @param {string} [e.resource]
   * @param {string} [e.action]   Önerilen aksiyon / BLOCKED gerekçesi çözümü.
   */
  add(e) {
    if (!e || typeof e.check !== 'string' || e.check.trim() === '') throw new Error('check alanı zorunludur');
    if (!STATUSES.has(e.status)) throw new Error(`Geçersiz status: ${e.status}`);
    const severity = e.severity && SEVERITIES.has(e.severity) ? e.severity : SEVERITY.MEDIUM;
    const entry = {
      id: e.id || `PV-${String(++sequence).padStart(3, '0')}`,
      area: this.area,
      check: e.check.trim(),
      expected: sanitizeValue(e.expected) ?? '',
      actual: sanitizeValue(e.actual) ?? '',
      status: e.status,
      severity,
      endpoint: sanitizeValue(e.endpoint, 180),
      resource: sanitizeValue(e.resource, 120),
      action: sanitizeValue(e.action, 300),
      timestamp: e.timestamp || new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  pass(check, expected, actual, extra = {}) { return this.add({ check, expected, actual, status: STATUS.PASS, ...extra }); }
  fail(check, expected, actual, extra = {}) { return this.add({ check, expected, actual, status: STATUS.FAIL, ...extra }); }
  blocked(check, reason, extra = {}) { return this.add({ check, expected: extra.expected ?? 'live erişim', actual: reason, status: STATUS.BLOCKED, ...extra }); }
  skipped(check, reason, extra = {}) { return this.add({ check, expected: extra.expected ?? '', actual: reason, status: STATUS.SKIPPED, ...extra }); }
  conditional(check, expected, actual, extra = {}) { return this.add({ check, expected, actual, status: STATUS.CONDITIONAL, ...extra }); }
  notApplicable(check, reason, extra = {}) { return this.add({ check, expected: extra.expected ?? '', actual: reason, status: STATUS.NOT_APPLICABLE, ...extra }); }
}

export function printArea(area, entries) {
  if (!entries.length) return;
  console.log('');
  console.log(paint('[1m', `── ${area} ${'─'.repeat(Math.max(4, 58 - area.length))}`));
  for (const e of entries) {
    const tag = STATUS_PAINT[e.status] ? STATUS_PAINT[e.status](e.status.padEnd(14)) : e.status.padEnd(14);
    const detail = e.actual && e.actual !== e.expected ? ` — ${e.actual}` : '';
    console.log(`${tag} ${e.check}${detail}`);
    if (e.action && (e.status === STATUS.FAIL || e.status === STATUS.BLOCKED)) {
      console.log(`${' '.repeat(14)} ↳ ${e.action}`);
    }
  }
}

export function summarize(areas) {
  const summary = { pass: 0, fail: 0, blocked: 0, conditional: 0, skipped: 0, notApplicable: 0, external: 0, total: 0 };
  for (const { entries } of areas) {
    for (const e of entries) {
      summary.total += 1;
      if (e.status === STATUS.PASS) summary.pass += 1;
      else if (e.status === STATUS.FAIL) summary.fail += 1;
      else if (e.status === STATUS.BLOCKED) summary.blocked += 1;
      else if (e.status === STATUS.CONDITIONAL) summary.conditional += 1;
      else if (e.status === STATUS.SKIPPED) summary.skipped += 1;
      else if (e.status === STATUS.EXTERNAL) summary.external += 1;
      else summary.notApplicable += 1;
    }
  }
  return summary;
}

/**
 * Final release gate (rapor §34):
 *  READY        — kritik kapıların tamamı PASS ve hiç kritik/high FAIL yok.
 *  CONDITIONAL  — kritik olmayan çözülmemiş alanlar var.
 *  BLOCKED      — kritik/high FAIL veya kritik/high BLOCKED var (kanıt eksikliği
 *                 başarısızlık değildir; yine de release yoktur).
 * SKIPPED/NOT_APPLICABLE/EXTERNAL gate'i etkilemez.
 */
export function computeFinalStatus(allEntries) {
  const relevant = allEntries.filter((e) => e.status !== STATUS.SKIPPED && e.status !== STATUS.NOT_APPLICABLE && e.status !== STATUS.EXTERNAL);
  const hardFail = relevant.filter((e) => e.status === STATUS.FAIL && (e.severity === SEVERITY.CRITICAL || e.severity === SEVERITY.HIGH));
  const critBlocked = relevant.filter((e) => e.status === STATUS.BLOCKED && (e.severity === SEVERITY.CRITICAL || e.severity === SEVERITY.HIGH));
  if (hardFail.length > 0) return { final: 'BLOCKED', reason: `${hardFail.length} kritik/high başarısızlık`, hardFail, critBlocked };
  if (critBlocked.length > 0) return { final: 'BLOCKED', reason: `${critBlocked.length} kritik/high doğrulanamayan alan`, hardFail, critBlocked };
  const soft = relevant.filter((e) => e.status === STATUS.FAIL || e.status === STATUS.BLOCKED || e.status === STATUS.CONDITIONAL);
  if (soft.length > 0) return { final: 'CONDITIONAL', reason: `${soft.length} kritik olmayan çözülmemiş alan`, hardFail, critBlocked };
  return { final: 'READY', reason: 'tüm kritik kapılar PASS', hardFail, critBlocked };
}

function mdEscape(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function renderMarkdown({ artifact, areas }) {
  const lines = [];
  lines.push('# MMPI-1 PRODUCTION VALIDATION — ÇALIŞTIRMA RAPORU', '');
  lines.push(`- Tarih: ${artifact.timestamp}`);
  lines.push(`- Repo: ${artifact.repository}`);
  lines.push(`- Commit: ${artifact.commit}`);
  lines.push(`- Production URL: ${artifact.productionUrl ?? '(tanımsız)'}`);
  lines.push(`- Node: ${artifact.environment.node} · Platform: ${artifact.environment.platform}`);
  lines.push('');
  lines.push(`## FINAL STATUS: ${artifact.finalStatus}`);
  lines.push('');
  lines.push(`Nedeni: ${artifact.finalReason}`);
  lines.push('');
  lines.push('## Özet', '');
  lines.push('| PASS | FAIL | BLOCKED | CONDITIONAL | SKIPPED | N/A | EXTERNAL |');
  lines.push('|---|---|---|---|---|---|---|');
  const s = artifact.summary;
  lines.push(`| ${s.pass} | ${s.fail} | ${s.blocked} | ${s.conditional} | ${s.skipped} | ${s.notApplicable} | ${s.external} |`);
  lines.push('');
  lines.push('> OMR VALIDATION: EXTERNAL / USER-VALIDATED SEPARATELY — bu çalıştırma OMR doğruluğu hakkında karar vermez.');
  lines.push('');
  for (const { area, entries } of areas) {
    if (!entries.length) continue;
    lines.push(`## ${area}`, '');
    lines.push('| Status | Check | Expected | Actual | Endpoint/Resource |');
    lines.push('|---|---|---|---|---|');
    for (const e of entries) {
      const target = e.endpoint || e.resource || '';
      lines.push(`| ${e.status} | ${mdEscape(e.check)} | ${mdEscape(e.expected)} | ${mdEscape(e.actual)} | ${mdEscape(target)} |`);
    }
    lines.push('');
  }
  lines.push('## Güvenlik notu', '');
  lines.push('Bu rapor hiçbir token, parola, service-role anahtarı, AI sağlayıcı anahtarı veya danışan verisi içermez. Yalnızca HTTP durum kodları, satır sayıları ve boolean doğrulamalar saklanır.');
  lines.push('');
  return lines.join('\n');
}

export async function writeArtifacts(outDir, { artifact, areas }) {
  const dir = resolve(outDir);
  await mkdir(dir, { recursive: true });
  const jsonPath = resolve(dir, 'latest.json');
  const mdPath = resolve(dir, 'latest.md');
  await writeFile(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, renderMarkdown({ artifact, areas }), 'utf8');
  return { jsonPath, mdPath };
}
