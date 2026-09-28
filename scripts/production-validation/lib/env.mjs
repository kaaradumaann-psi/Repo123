/**
 * Ortam değişkeni yardımcıları.
 *
 * Kurallar:
 *  - Secret DEĞERLERİ asla terminale/artifact'a yazılmaz; yalnızca
 *    "configured" / "missing" durumu raporlanır.
 *  - `.env.local` ve `.env.production-validation.local` dosyaları (Git'e
 *    hiçbir zaman girmez, .gitignore kapsamındadır) varsa okunur; halihazırda
 *    tanımlı kabuk değişkenleri ezilmez.
 *  - Bağımlılık yoktur; Windows PowerShell/CMD ile tam uyumludur.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ENV_CANDIDATES = ['.env.production-validation.local', '.env.local'];

/** KEY=VALUE satırlarını ayrıştırır; kabuk ortamını ezmez. Hangi dosyanın okunduğunu döndürür. */
export function loadLocalEnvFiles(rootDir = ROOT) {
  const loaded = [];
  for (const name of ENV_CANDIDATES) {
    const file = resolve(rootDir, name);
    if (!existsSync(file)) continue;
    try {
      const text = readFileSync(file, 'utf8');
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
        if (process.env[key] === undefined) process.env[key] = value;
      }
      loaded.push(name);
    } catch {
      // Okunamayan env dosyası sessizce atlanır; varlığı bile hata üretmez.
    }
  }
  return loaded;
}

export function envValue(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/** Değeri ASLA döndürmez; yalnızca durum bildirir. */
export function envPresence(name) {
  return envValue(name) ? 'configured' : 'missing';
}

export function writesAllowed() {
  return process.env.LIVE_MATRIX_ALLOW_WRITES === 'YES';
}

export function destructiveConfirmed() {
  return process.env.PRODUCTION_VALIDATION_CONFIRM === 'YES' && writesAllowed();
}

function stripNodeTestReporterOptions(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const tokens = value.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  const kept = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const raw = tokens[i];
    const token = raw.replace(/^(["'])(.*)\1$/, '$2');
    if (token === '--test-reporter' || token === '--test-reporter-destination') {
      i += 1;
      continue;
    }
    if (token.startsWith('--test-reporter=') || token.startsWith('--test-reporter-destination=')) continue;
    kept.push(raw);
  }
  return kept.join(' ').trim() || null;
}

/**
 * Production validation test subprocesses must emit parseable TAP output.
 * User machines may define NODE_OPTIONS=--test-reporter=spec/dot globally;
 * keep unrelated NODE_OPTIONS, but remove inherited test reporter overrides.
 */
export function validationChildEnv(extra = {}) {
  const env = { ...process.env, ...extra, NO_COLOR: '1' };
  const cleanedNodeOptions = stripNodeTestReporterOptions(env.NODE_OPTIONS);
  if (cleanedNodeOptions) env.NODE_OPTIONS = cleanedNodeOptions;
  else delete env.NODE_OPTIONS;
  return env;
}

export function repoRoot() {
  return ROOT;
}
