/**
 * 11 — Gizli-değer sızıntısı taraması (rapor §12, §25, §26, §27, §43).
 *
 * Kapsam: src/, supabase/functions/, scripts/, docs/, dist/ (varsa) ve
 * CANLI production HTML/asset yanıtı. Bulunan secret DEĞERİ hiçbir çıktıya
 * yazılmaz; yalnızca kalıp adı + dosya:satır raporlanır.
 * Yanlış-pozitif kontrolleri: anon JWT (public), sb_publishable, placeholder,
 * regex tanım satırları, .env.example benzeri dokümantasyon dosyaları.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { Collector, SEVERITY } from './lib/output.mjs';
import { repoRoot, envValue } from './lib/env.mjs';
import { request } from './lib/http.mjs';
import { scanFileForSecrets } from './lib/secret-patterns.mjs';

const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.jsonc', '.md', '.txt', '.toml', '.html', '.css', '.example', '']);
const SCAN_DIRS = ['src', 'supabase/functions', 'scripts', 'docs', 'dist'];
const SKIP_FILES = new Set(['package-lock.json', 'optik-form.html']);
// Dokümantasyonda "örnek secret biçimi" konuşulabilir; bu dosyalar taramaya
// dahildir ancak açık örnek satırları (YOUR_/example) zaten elenir.

async function collectFiles(dirPath, out = []) {
  if (!existsSync(dirPath)) return out;
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (/^(node_modules|\.git|temp|\.temp)$/.test(entry.name)) continue;
      await collectFiles(full, out);
    } else if (entry.isFile() && !SKIP_FILES.has(entry.name)) {
      const ext = extname(entry.name).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) continue;
      try {
        const info = await stat(full);
        if (info.size > 4_000_000) continue; // büyük ikili/derleme artefaktları
      } catch { continue; }
      out.push(full);
    }
  }
  return out;
}

export async function run(ctx) {
  const out = new Collector('Secrets');
  const files = [];
  for (const dir of SCAN_DIRS) await collectFiles(resolve(repoRoot(), dir), files);

  let secretFindings = 0;
  let publicFindings = 0;
  let maybeFindings = 0;
  for (const file of files) {
    let text;
    try { text = await readFile(file, 'utf8'); } catch { continue; }
    for (const finding of scanFileForSecrets(file, text)) {
      if (finding.classification === 'secret') {
        secretFindings += 1;
        out.fail(`Depo secret kalıbı: ${finding.pattern}`, 'hiç secret yok', `${finding.file}:${finding.line} ${finding.note ?? ''}`.trim(), {
          severity: SEVERITY.CRITICAL,
          resource: finding.file.replace(repoRoot(), '').replace(/^[/\\]/, ''),
          action: 'Değeri HEMEN rotate edin (Supabase Dashboard / AI sağlayıcı) ve dosyadan kaldırın. Değer bu rapora bilinçli olarak yazılmadı.',
        });
      } else if (finding.classification === 'public-config') {
        publicFindings += 1;
      } else {
        maybeFindings += 1;
        out.conditional(`Tanımsız kimlik kalıbı: ${finding.pattern}`, 'public veya placeholder olduğu doğrulanır', `${finding.file.replace(repoRoot(), '')}:${finding.line}`, {
          severity: SEVERITY.MEDIUM,
          resource: finding.file.replace(repoRoot(), '').replace(/^[/\\]/, ''),
        });
      }
    }
  }
  out[secretFindings === 0 ? 'pass' : 'fail']('Depo gizli-değer taraması', '0 kritik bulgu', `${files.length} dosya tarandı · ${secretFindings} secret · ${maybeFindings} belirsiz · ${publicFindings} public-config (anon/publishable — false-positive ayrımı)`, { severity: SEVERITY.CRITICAL });

  // build artefaktı varsa ayrıca işaretle (dist zaten taramaya dahil; yalnızca özet).
  if (!existsSync(resolve(repoRoot(), 'dist/index.html'))) {
    out.skipped('dist/ build artefakt taraması', 'dist/ yok — npm run build sonrası tekrarlayın', { severity: SEVERITY.MEDIUM });
  }

  // CANLI production yanıtı üzerinde kalıp taraması (deployed bundle kanıtı).
  const productionUrl = envValue('PRODUCTION_URL');
  if (productionUrl && ctx.productionHtml) {
    const live = scanFileForSecrets('<production-HTML>', ctx.productionHtml);
    const liveSecrets = live.filter((f) => f.classification === 'secret');
    const livePublic = live.filter((f) => f.classification === 'public-config');
    if (liveSecrets.length === 0) out.pass('[LIVE] production yanıtı secret taraması', '0 kritik bulgu', `0 secret · ${livePublic.length} public-config`, { severity: SEVERITY.CRITICAL, endpoint: '/' });
    else {
      for (const finding of liveSecrets.slice(0, 10)) {
        out.fail(`[LIVE] production yanıtı secret kalıbı: ${finding.pattern}`, 'hiç secret yok', `${finding.note ?? 'deployed artefaktta değer'} (değer yazılmaz)`, { severity: SEVERITY.CRITICAL, endpoint: '/', action: 'Deploy pipeline’ına gizli değer karışmış. Rotate edin ve build değişkenlerini ayıklayın.' });
      }
    }

    // Tarayıcının gördüğü ağ yükünde sağlayıcı anahtarı ARANIR (AI provider key frontend’e sızmamalı).
    const providerLeak = /AIza[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|sb_secret_[A-Za-z0-9]{10,}|x-goog-api-key/i.test(ctx.productionHtml);
    if (!providerLeak) out.pass('[LIVE] AI provider anahtarı frontend’de yok', 'kalıp yok', 'kalıp yok', { severity: SEVERITY.CRITICAL });
    else out.fail('[LIVE] AI provider anahtarı frontend’de yok', 'kalıp yok', 'kalıp eşleşti (değer yazılmaz)', { severity: SEVERITY.CRITICAL, action: 'AI_API_KEY yalnızca Edge runtime’da kalmalıdır.' });
  } else {
    out.blocked('[LIVE] deployed bundle secret taraması', 'PRODUCTION_URL tanımsız veya sayfa alınamadı', { severity: SEVERITY.CRITICAL, expected: '0 kritik bulgu' });
  }

  // Frontend'e asla girmemesi gereken env kontratı (repo).
  // verify-production-config.mjs ile aynı case-sensitive semantik: yorumlardaki
  // "service_role geçme" uyarıları false-positive ÜRETMEZ; yalnızca gerçek
  // değişken tanımları yakalanır.
  const envExamplePath = resolve(repoRoot(), '.env.example');
  if (existsSync(envExamplePath)) {
    const example = await readFile(envExamplePath, 'utf8');
    const definitions = example.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
    const badNames = definitions.filter((l) => /^(SERVICE_ROLE|AI_API_KEY|[A-Z0-9_]*SECRET[A-Z0-9_]*)\s*=/.test(l));
    if (badNames.length === 0) out.pass('.env.example frontend-güvenli', 'yalnızca VITE_ + placeholder', 'temiz', { severity: SEVERITY.HIGH });
    else out.fail('.env.example frontend-güvenli', 'yalnızca VITE_ + placeholder', 'yasak değişken tanımı bulundu', { severity: SEVERITY.HIGH });
  }

  return out;
}
