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

export function repoRoot() {
  return ROOT;
}
