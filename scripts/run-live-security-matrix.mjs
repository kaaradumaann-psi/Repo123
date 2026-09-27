#!/usr/bin/env node
/**
 * Credential-driven Supabase REST/IDOR release harness.
 * It never embeds credentials and records no token or response body.
 *
 * Usage:
 *   LIVE_MATRIX_SPEC=docs/live-security-matrix.example.json \
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... USER_A_JWT=... ... \
 *   node scripts/run-live-security-matrix.mjs
 *
 * Non-GET scenarios require LIVE_MATRIX_ALLOW_WRITES=YES and must target
 * dedicated disposable fixtures. The example remains intentionally blocked
 * until all placeholders and credentials are supplied.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const specPath = resolve(process.env.LIVE_MATRIX_SPEC || process.argv[2] || 'docs/live-security-matrix.example.json');
const outputPath = resolve(process.env.LIVE_MATRIX_OUTPUT || `live-security-results-${Date.now()}.json`);
const baseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = String(process.env.SUPABASE_ANON_KEY || '');
const writesAllowed = process.env.LIVE_MATRIX_ALLOW_WRITES === 'YES';
const TIMEOUT_MS = 15_000;

function fail(message) {
  console.error(message);
  process.exit(2);
}
if (!baseUrl || !/^https:\/\//.test(baseUrl)) fail('SUPABASE_URL (https) is required.');
if (!anonKey) fail('SUPABASE_ANON_KEY is required.');

const spec = JSON.parse(await readFile(specPath, 'utf8'));
if (spec.schemaVersion !== 1 || !Array.isArray(spec.scenarios)) fail('Invalid live matrix spec.');

function expand(value) {
  if (typeof value === 'string') {
    return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_all, name) => {
      const replacement = process.env[name];
      if (!replacement) throw new Error(`Missing environment placeholder: ${name}`);
      return replacement;
    });
  }
  if (Array.isArray(value)) return value.map(expand);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, expand(v)]));
  return value;
}

const results = [];
for (const scenario of spec.scenarios) {
  const startedAt = new Date().toISOString();
  const method = String(scenario.method || 'GET').toUpperCase();
  const base = {
    id: String(scenario.id || ''), role: String(scenario.role || ''), resource: String(scenario.resource || ''),
    operation: String(scenario.operation || method), expected: scenario.expectedStatus,
  };
  try {
    if (!base.id || !scenario.path || !scenario.tokenEnv) throw new Error('Scenario id/path/tokenEnv is required');
    if (method !== 'GET' && method !== 'HEAD' && !writesAllowed) throw new Error('WRITE_BLOCKED: set LIVE_MATRIX_ALLOW_WRITES=YES for disposable fixtures');
    const token = process.env[scenario.tokenEnv];
    if (!token) throw new Error(`Missing token env: ${scenario.tokenEnv}`);
    const path = expand(scenario.path);
    const body = scenario.body === undefined ? undefined : JSON.stringify(expand(scenario.body));
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(scenario.prefer ? { Prefer: String(scenario.prefer) } : {}),
      },
      body,
    });
    // Count rows without retaining/logging response records or PII.
    const raw = await response.text();
    let actualRows = null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) actualRows = parsed.length;
    } catch { /* status-only response */ }
    const expected = Array.isArray(scenario.expectedStatus) ? scenario.expectedStatus : [scenario.expectedStatus];
    const statusMatches = expected.includes(response.status);
    const rowsMatch = scenario.expectedRows === undefined || actualRows === scenario.expectedRows;
    results.push({
      ...base, actual: response.status,
      expectedRows: scenario.expectedRows ?? null, actualRows,
      status: statusMatches && rowsMatch ? 'PASS' : 'FAIL',
      startedAt, completedAt: new Date().toISOString(),
    });
  } catch (error) {
    results.push({ ...base, actual: null, status: 'BLOCKED', reason: String(error?.message || error).slice(0, 240), startedAt, completedAt: new Date().toISOString() });
  }
}

const counts = results.reduce((acc, row) => ({ ...acc, [row.status]: (acc[row.status] || 0) + 1 }), {});
const artifact = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  targetOrigin: new URL(baseUrl).origin,
  spec: specPath,
  counts,
  results,
  finalStatus: results.every(row => row.status === 'PASS') ? 'PASS' : results.some(row => row.status === 'FAIL') ? 'FAIL' : 'BLOCKED',
};
await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, { mode: 0o600 });
console.log(`Live security matrix: ${artifact.finalStatus} · ${JSON.stringify(counts)} · ${outputPath}`);
process.exit(artifact.finalStatus === 'PASS' ? 0 : 1);
