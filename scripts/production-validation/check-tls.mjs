/**
 * 13 — TLS / HTTPS doğrulaması (rapor §15-TLS).
 * Hem production web domaini hem Supabase hostu için: sertifika zinciri,
 * geçerlilik penceresi, protokol ve hostname uyumu. node:tls kullanır (bağımlılık yok).
 */
import tls from 'node:tls';
import { Collector, SEVERITY } from './lib/output.mjs';
import { envValue } from './lib/env.mjs';
import { hostOf } from './lib/http.mjs';

function portOf(urlText) {
  try {
    const url = new URL(urlText);
    if (url.port) return Number(url.port);
    return url.protocol === 'https:' ? 443 : 80;
  } catch {
    return 443;
  }
}

function probeTls(host, port = 443) {
  return new Promise((resolvePromise) => {
    const socket = tls.connect({
      host,
      port,
      servername: /^(\d{1,3}\.){3}\d{1,3}$/.test(host) ? undefined : host,
      rejectUnauthorized: true,
      timeout: 12_000,
    }, () => {
      const cert = socket.getPeerCertificate();
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher()?.name ?? null;
      const authorized = socket.authorized;
      const authError = socket.authorizationError ? String(socket.authorizationError).slice(0, 120) : null;
      socket.end();
      resolvePromise({
        ok: true,
        authorized,
        authError,
        protocol,
        cipher,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        subjectCN: cert.subject?.CN ?? null,
        issuerCN: cert.issuer?.CN ?? null,
        san: typeof cert.subjectaltname === 'string' ? cert.subjectaltname.split(',').length : null,
        daysRemaining: cert.valid_to ? Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000) : null,
      });
    });
    socket.on('timeout', () => { socket.destroy(); resolvePromise({ ok: false, error: 'timeout' }); });
    socket.on('error', (error) => resolvePromise({ ok: false, error: String(error?.code || error?.message || error).slice(0, 120) }));
  });
}

export async function run(ctx) {
  const out = new Collector('TLS / HTTPS');
  const targets = [
    { label: 'Production domain', url: envValue('PRODUCTION_URL'), severity: SEVERITY.CRITICAL },
    { label: 'Supabase host', url: envValue('SUPABASE_URL'), severity: SEVERITY.HIGH },
  ];
  let any = false;
  for (const target of targets) {
    if (!target.url) {
      out.blocked(`${target.label} TLS`, `${target.label === 'Production domain' ? 'PRODUCTION_URL' : 'SUPABASE_URL'} tanımsız`, { expected: 'geçerli sertifika zinciri', severity: target.severity });
      continue;
    }
    any = true;
    const host = hostOf(target.url);
    if (!host) { out.fail(`${target.label} TLS`, 'ayrıştırılabilir host', 'host ayrıştırılamadı', { severity: target.severity }); continue; }
    const probe = await probeTls(host, portOf(target.url));
    if (!probe.ok) {
      out.blocked(`${target.label} TLS (${host})`, `bağlantı kurulamadı (${probe.error})`, { expected: 'TLS 1.2/1.3 + geçerli sertifika', endpoint: host, severity: target.severity, action: 'Ağ/firewall 443 engelli olabilir; veya domain down.' });
      continue;
    }
    if (!probe.authorized) {
      out.fail(`${target.label} TLS (${host})`, 'doğrulanabilir sertifika zinciri', `zincir hatası: ${probe.authError}`, { endpoint: host, severity: target.severity, action: 'Sertifika zinciri/hostname uyumsuzluğu — hosting sertifikasını doğrulayın.' });
      continue;
    }
    const protocolOk = probe.protocol === 'TLSv1.3' || probe.protocol === 'TLSv1.2';
    const days = probe.daysRemaining;
    const expiryOk = typeof days === 'number' && days > 7;
    if (protocolOk && expiryOk) {
      out.pass(`${target.label} TLS (${host})`, 'TLS ≥1.2 + geçerli sertifika', `${probe.protocol} · ${days} gün kaldı · issuer=${probe.issuerCN ?? '?'}`, { endpoint: host, severity: target.severity });
    } else if (!protocolOk) {
      out.fail(`${target.label} TLS (${host})`, 'TLS ≥1.2', `protokol=${probe.protocol}`, { endpoint: host, severity: SEVERITY.HIGH });
    } else {
      out.conditional(`${target.label} TLS (${host})`, 'sertifika süresi > 7 gün', `${days} gün kaldı`, { endpoint: host, severity: SEVERITY.MEDIUM, action: 'Sertifika yenileme döngüsünü kontrol edin.' });
    }
  }
  if (!any) out.blocked('TLS doğrulaması', 'hedef host yok', { severity: SEVERITY.CRITICAL });
  return out;
}
