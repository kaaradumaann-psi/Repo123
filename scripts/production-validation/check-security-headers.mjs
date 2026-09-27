/**
 * 12 — Canlı güvenlik başlıkları + CSP (rapor §15).
 * Ölçüm yalnızca GERÇEK production yanıtı üzerindendir; repo dist/_headers
 * kanıtı Configuration bölümünde (REUSE) ayrıca tutulur.
 */
import { Collector, SEVERITY } from './lib/output.mjs';
import { envValue } from './lib/env.mjs';
import { request } from './lib/http.mjs';

function parseCsp(value) {
  const directives = new Map();
  if (!value) return directives;
  for (const part of value.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [name, ...rest] = trimmed.split(/\s+/);
    directives.set(name.toLowerCase(), rest.join(' '));
  }
  return directives;
}

export async function run(ctx) {
  const out = new Collector('Security Headers');
  const productionUrl = envValue('PRODUCTION_URL');
  if (!productionUrl) {
    out.blocked('Güvenlik başlıkları (canlı)', 'PRODUCTION_URL tanımsız', { severity: SEVERITY.CRITICAL, expected: 'canlı yanıt başlıkları' });
    return out;
  }
  const res = await request(productionUrl);
  if (!res.ok) {
    out.blocked('Güvenlik başlıkları (canlı)', `erişilemiyor (${res.error})`, { severity: SEVERITY.CRITICAL, expected: 'canlı yanıt başlıkları' });
    return out;
  }
  const h = (name) => res.headers.get(name);

  // HSTS
  const hsts = h('strict-transport-security');
  if (hsts && /max-age=\d{6,}/i.test(hsts)) out.pass('Strict-Transport-Security', 'mevcut + uzun max-age', 'mevcut', { endpoint: '/', severity: SEVERITY.HIGH });
  else if (hsts) out.conditional('Strict-Transport-Security', 'uzun max-age', 'mevcut ama kısa/belirsiz max-age', { endpoint: '/', severity: SEVERITY.MEDIUM });
  else out.fail('Strict-Transport-Security', 'mevcut', 'YOK', { endpoint: '/', severity: SEVERITY.HIGH, action: 'dist/_headers ve hosting yapılandırmasını doğrulayın.' });

  // nosniff
  if ((h('x-content-type-options') || '').toLowerCase().includes('nosniff')) out.pass('X-Content-Type-Options', 'nosniff', 'nosniff', { endpoint: '/', severity: SEVERITY.HIGH });
  else out.fail('X-Content-Type-Options', 'nosniff', h('x-content-type-options') ?? 'YOK', { endpoint: '/', severity: SEVERITY.HIGH });

  // CSP
  const csp = h('content-security-policy');
  if (!csp) {
    // Bazı dağıtımlarda CSP yalnızca <meta> içindedir — HTML’de kontrol et.
    const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i.exec(ctx.productionHtml ?? '');
    if (meta) out.conditional('Content-Security-Policy', 'HTTP başlığı (veya meta)', 'HTTP başlığı yok; <meta> CSP mevcut', { endpoint: '/', severity: SEVERITY.MEDIUM });
    else out.fail('Content-Security-Policy', 'mevcut', 'YOK', { endpoint: '/', severity: SEVERITY.HIGH, action: 'CSP üretimi build.mjs içinde tanımlı; deploy başlıklarını doğrulayın.' });
  } else {
    const directives = parseCsp(csp);
    out.pass('Content-Security-Policy', 'mevcut', `${directives.size} direktif`, { endpoint: '/', severity: SEVERITY.HIGH });
    if (directives.has('frame-ancestors')) out.pass('CSP frame-ancestors', "'none' veya kısıtlı", 'mevcut', { endpoint: '/', severity: SEVERITY.HIGH });
    else out.fail('CSP frame-ancestors', 'mevcut', 'YOK', { endpoint: '/', severity: SEVERITY.HIGH });
    const scriptSrc = directives.get('script-src') ?? '';
    if (/unsafe-eval/i.test(scriptSrc)) out.fail("CSP script-src unsafe-eval", 'yok', "'unsafe-eval' mevcut", { endpoint: '/', severity: SEVERITY.HIGH, action: 'Build CSP hash-pinned script modelini koruyun.' });
    else out.pass("CSP script-src unsafe-eval", 'yok', 'yok', { endpoint: '/', severity: SEVERITY.HIGH });
    if (/unsafe-inline/i.test(scriptSrc)) out.conditional('CSP script-src unsafe-inline', 'hash/nonce tabanlı', "'unsafe-inline' mevcut", { endpoint: '/', severity: SEVERITY.MEDIUM });
    const connectSrc = directives.get('connect-src');
    if (connectSrc) {
      const wildcard = /(^|\s)\*(\s|$)/.test(connectSrc);
      const httpAllowed = /http:\/\//.test(connectSrc);
      if (wildcard) out.fail('CSP connect-src', 'wildcard yok', 'wildcard * mevcut', { endpoint: '/', severity: SEVERITY.MEDIUM });
      else if (httpAllowed) out.conditional('CSP connect-src', 'yalnızca https/wss', 'http:// origin içeriyor', { endpoint: '/', severity: SEVERITY.LOW });
      else out.pass('CSP connect-src', 'kısıtlı origin kümesi', 'kısıtlı (wildcard yok)', { endpoint: '/', severity: SEVERITY.MEDIUM });
    } else out.conditional('CSP connect-src', 'mevcut', 'direktif yok', { endpoint: '/', severity: SEVERITY.LOW });
  }

  // Referrer-Policy
  if (h('referrer-policy')) out.pass('Referrer-Policy', 'mevcut', 'mevcut', { endpoint: '/', severity: SEVERITY.MEDIUM });
  else out.fail('Referrer-Policy', 'mevcut', 'YOK', { endpoint: '/', severity: SEVERITY.MEDIUM });

  // Permissions-Policy
  if (h('permissions-policy')) out.pass('Permissions-Policy', 'mevcut', 'mevcut', { endpoint: '/', severity: SEVERITY.MEDIUM });
  else out.conditional('Permissions-Policy', 'mevcut (önerilen)', 'YOK', { endpoint: '/', severity: SEVERITY.LOW });

  // Clickjacking: frame-ancestors veya X-Frame-Options.
  const xfo = (h('x-frame-options') || '').toUpperCase();
  const cspFa = csp && parseCsp(csp).has('frame-ancestors');
  if (xfo === 'DENY' || xfo === 'SAMEORIGIN' || cspFa) out.pass('Clickjacking koruması', "XFO DENY/SAMEORIGIN veya CSP frame-ancestors", xfo ? `X-Frame-Options ${xfo}` : 'CSP frame-ancestors', { endpoint: '/', severity: SEVERITY.HIGH });
  else out.fail('Clickjacking koruması', "XFO DENY/SAMEORIGIN veya CSP frame-ancestors", 'hiçbiri yok', { endpoint: '/', severity: SEVERITY.HIGH });

  return out;
}
