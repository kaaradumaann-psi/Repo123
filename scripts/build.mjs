import { build } from 'esbuild';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const buildEnv = loadEnv('production', root, 'VITE_');
if (!buildEnv.VITE_SUPABASE_URL || !buildEnv.VITE_SUPABASE_ANON_KEY) {
  // Barındırma platformlarında (ör. Cloudflare Builds) bu değerler build değişkeni olarak
  // tanımlanmadıysa derleme sessizce çevrimdışı bir sürüm üretir: giriş, kayıt ve Supabase
  // yazma çalışmaz. Sessiz kalmak yerine günlükte açıkça uyar.
  console.warn('UYARI: VITE_SUPABASE_URL ve/veya VITE_SUPABASE_ANON_KEY derlemede tanımlı değil. ' +
    'Bu derleme çevrimdışıdır; giriş, kayıt ve Supabase erişimi kapalı olur (yalnızca /onizleme açılır). ' +
    'Barındırma platformunun build değişkenlerini kontrol edin.');
}

const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: true,
  write: false,
  outdir: 'dist',
  jsx: 'automatic',
  target: 'es2022',
  define: {
    'process.env.NODE_ENV': '"production"',
    // Replace the complete env object rather than only nested properties. This keeps the
    // IIFE/standalone output free of import.meta (which browsers do not expose in scripts
    // produced by this build) while preserving the same source contract used by Vite.
    'import.meta.env': JSON.stringify({
      VITE_SUPABASE_URL: buildEnv.VITE_SUPABASE_URL ?? '',
      VITE_SUPABASE_ANON_KEY: buildEnv.VITE_SUPABASE_ANON_KEY ?? '',
    }),
  },
  legalComments: 'none',
  plugins: [{
    name: 'asset-imports',
    setup(plugin) {
      const redirected = (suffix, namespace) => plugin.onResolve({ filter: suffix }, request => ({
        path: request.path.replace(suffix, ''), namespace, pluginData: { importer: request.importer },
      }));
      // import.meta.resolve ignores its parent argument on Node 20+, so relative paths must be
      // resolved against the importer directly; only bare specifiers need package resolution.
      const resolveFrom = args => args.path.startsWith('.') || isAbsolute(args.path)
        ? resolve(dirname(args.pluginData.importer), args.path)
        : fileURLToPath(import.meta.resolve(args.path, pathToFileURL(args.pluginData.importer)));
      redirected(/\?raw$/, 'raw');
      redirected(/\?inline$/, 'inline');
      plugin.onLoad({ filter: /.*/, namespace: 'raw' }, async args =>
        ({ contents: await readFile(resolveFrom(args), 'utf8'), loader: 'text' }));
      // Vite turns `?inline` into a data URI; esbuild has no equivalent, so emit the same shape.
      plugin.onLoad({ filter: /.*/, namespace: 'inline' }, async args => {
        const base64 = (await readFile(resolveFrom(args))).toString('base64');
        return { contents: `export default "data:application/pdf;base64,${base64}";`, loader: 'js' };
      });
    },
  }],
});
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = result.outputFiles.find(file => file.path.endsWith('.css')).text;
const shell = await readFile(new URL('../index.html', import.meta.url), 'utf8');
// Hash the script exactly as it will appear in the document (after the `</script`
// escape), because the browser computes the CSP hash over that literal content.
const scriptBody = js.replaceAll('</script', '<\\/script')
  // esbuild carries one intentional tab at the end of Supabase's base64 alphabet template
  // literal. Encode that literal tab so the generated HTML stays whitespace-clean without
  // changing the value evaluated by JavaScript.
  .replace(/\t(?=\r?\n)/g, '\\\\t');
const scriptHash = createHash('sha256').update(scriptBody).digest('base64');
// The single-file build runs offline by default: no remote fonts or scripts, one
// hash-pinned inline script, inline styles, and blob URLs for previews and the
// hardened pdf.js worker. When Supabase is configured at build time, connect-src
// allowlists exactly that origin (REST + Auth + Edge Functions run on the same
// host over HTTPS/WSS); without it no network connection is allowed at all.
const supabaseOrigin = (() => {
  const raw = (buildEnv.VITE_SUPABASE_URL ?? '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if ((!local && parsed.protocol !== 'https:') || (local && !['http:', 'https:'].includes(parsed.protocol)) ||
      parsed.pathname !== '/' || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error('Supabase URL yalnızca güvenli bir origin olmalıdır.');
    }
    return parsed.origin;
  } catch (error) {
    throw new Error(`VITE_SUPABASE_URL geçerli bir URL değil: ${raw}`, { cause: error });
  }
})();
const connectSrc = supabaseOrigin
  ? `connect-src ${supabaseOrigin} ${supabaseOrigin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')}; `
  : '';
const csp = `default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'unsafe-inline'; ` +
  `img-src blob: data:; worker-src blob:; child-src blob:; font-src 'none'; ${connectSrc}` +
  `object-src 'none'; base-uri 'none'; form-action 'none'`;
const licenses = await Promise.all(['react', 'react-dom', 'scheduler'].map(async name =>
  `${name}\n${await readFile(new URL(`../node_modules/${name}/LICENSE`, import.meta.url), 'utf8')}`,
));
const html = shell
  .replace('<!doctype html>', () => `<!doctype html>\n<!-- Bundled library notices\n${licenses.join('\n')}-->`)
  .replace('</head>', () => `<meta http-equiv="Content-Security-Policy" content="${csp}">\n<style>${css}</style></head>`)
  .replace('<script type="module" src="/src/main.tsx"></script>',
    () => `<script type="module">${scriptBody}</script>`);
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/index.html', import.meta.url), html);
await writeFile(new URL('../optik-form.html', import.meta.url), html);
// SPA fallback: Cloudflare (Pages ya da Workers statik varlıkları) eşleşmeyen
// pathname'lerde index.html döndürür. Workers yayınında aynı davranış
// `wrangler.jsonc` içindeki `assets.not_found_handling` ile de sağlanır.
await writeFile(new URL('../dist/_redirects', import.meta.url), '/*    /index.html   200\n');
console.log('Built dist/index.html, dist/_redirects and optik-form.html (self-contained).');
