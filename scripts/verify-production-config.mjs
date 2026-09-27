#!/usr/bin/env node
/** Repository and optional deployed production security verification. */
import { readFile } from 'node:fs/promises';

const repositoryOnly = process.argv.includes('--repository-only');
const findings = [];
const add = (area, status, evidence) => findings.push({ area, status, evidence });

async function text(path) {
  try { return await readFile(path, 'utf8'); } catch { return ''; }
}

const headers = await text('dist/_headers');
const html = await text('dist/index.html');
const requiredHeaders = [
  'Strict-Transport-Security:', 'X-Content-Type-Options: nosniff', 'Referrer-Policy:',
  'X-Frame-Options: DENY', "Content-Security-Policy: frame-ancestors 'none'", 'Permissions-Policy:',
];
for (const marker of requiredHeaders) add(`build-header:${marker.split(':')[0]}`, headers.includes(marker) ? 'PASS' : 'FAIL', marker);
add('inline-csp', /<meta http-equiv="Content-Security-Policy"/.test(html) ? 'PASS' : 'FAIL', 'dist/index.html CSP meta');

const envExample = await text('.env.example');
add('frontend-env-separation', /VITE_SUPABASE_URL/.test(envExample) && /VITE_SUPABASE_ANON_KEY/.test(envExample) && !/SERVICE_ROLE|AI_API_KEY/.test(envExample)
  ? 'PASS' : 'FAIL', '.env.example contains frontend-safe names only');

const secretPatterns = [
  { name: 'Supabase service-role JWT', regex: /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/ },
  { name: 'OpenAI-style secret', regex: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: 'Google API key', regex: /AIza[A-Za-z0-9_-]{30,}/ },
  { name: 'Supabase secret key', regex: /sb_secret_[A-Za-z0-9_-]{20,}/ },
];
for (const pattern of secretPatterns) add(`bundle-secret:${pattern.name}`, pattern.regex.test(html) ? 'FAIL' : 'PASS', 'dist/index.html scan');

const productionUrl = process.env.PRODUCTION_URL || '';
if (!repositoryOnly && productionUrl) {
  try {
    const response = await fetch(productionUrl, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
    add('production-https', new URL(productionUrl).protocol === 'https:' && response.status >= 200 && response.status < 400 ? 'PASS' : 'FAIL', `HTTP ${response.status}`);
    const liveRequired = ['strict-transport-security', 'x-content-type-options', 'referrer-policy', 'content-security-policy'];
    for (const name of liveRequired) add(`live-header:${name}`, response.headers.has(name) ? 'PASS' : 'FAIL', response.headers.get(name) || 'missing');
  } catch (error) {
    add('production-https', 'BLOCKED', String(error?.message || error).slice(0, 200));
  }
} else if (!repositoryOnly) {
  add('production-https', 'BLOCKED', 'PRODUCTION_URL not supplied');
}

for (const row of findings) console.log(`[${row.status}] ${row.area} — ${row.evidence}`);
const status = findings.some(x => x.status === 'FAIL') ? 'FAIL' : findings.some(x => x.status === 'BLOCKED') ? 'BLOCKED' : 'PASS';
console.log(`PRODUCTION CONFIG VERIFICATION: ${status}`);
process.exit(status === 'PASS' ? 0 : status === 'BLOCKED' ? 2 : 1);
