import { build } from 'esbuild';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const buildEnv = loadEnv('production', root, 'VITE_');

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
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(buildEnv.VITE_SUPABASE_URL ?? ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(buildEnv.VITE_SUPABASE_ANON_KEY ?? ''),
  },
  legalComments: 'none',
  loader: {
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl',
    '.png': 'dataurl',
    '.webp': 'dataurl',
  },
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
const scriptBody = js.replaceAll('</script', '<\\/script');
const scriptHash = createHash('sha256').update(scriptBody).digest('base64');
// The single-file build runs fully offline: no connects, no remote fonts or scripts,
// one hash-pinned inline script, inline styles, and blob URLs for previews and the
// hardened pdf.js worker.
const csp = `default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'unsafe-inline'; ` +
  `img-src blob: data:; worker-src blob:; child-src blob:; font-src 'none'; ` +
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
console.log('Built dist/index.html and optik-form.html (self-contained).');
