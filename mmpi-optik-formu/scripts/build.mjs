import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: true,
  write: false,
  outdir: 'dist',
  jsx: 'automatic',
  target: 'es2022',
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'none',
  plugins: [{
    name: 'raw-imports',
    setup(plugin) {
      plugin.onResolve({ filter: /\?raw$/ }, args => ({
        path: args.path.replace(/\?raw$/, ''),
        namespace: 'raw',
        pluginData: { importer: args.importer },
      }));
      plugin.onLoad({ filter: /.*/, namespace: 'raw' }, async args => {
        const resolved = await import.meta.resolve
          ? fileURLToPath(import.meta.resolve(args.path, pathToFileURL(args.pluginData.importer)))
          : join(dirname(args.pluginData.importer), args.path);
        return { contents: await readFile(resolved, 'utf8'), loader: 'text' };
      });
    },
  }],
});
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = result.outputFiles.find(file => file.path.endsWith('.css')).text;
const shell = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const licenses = await Promise.all(['react', 'react-dom', 'scheduler'].map(async name =>
  `${name}\n${await readFile(new URL(`../node_modules/${name}/LICENSE`, import.meta.url), 'utf8')}`,
));
const html = shell
  .replace('<!doctype html>', () => `<!doctype html>\n<!-- Bundled library notices\n${licenses.join('\n')}-->`)
  .replace('</head>', () => `<style>${css}</style></head>`)
  .replace('<script type="module" src="/src/main.tsx"></script>',
    () => `<script type="module">${js.replaceAll('</script', '<\\/script')}</script>`);
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/index.html', import.meta.url), html);
await writeFile(new URL('../../optik-form.html', import.meta.url), html);
console.log('Built dist/index.html and ../optik-form.html (self-contained).');
