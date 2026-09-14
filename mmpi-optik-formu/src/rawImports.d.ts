/**
 * Bundlers (Vite natively, esbuild through scripts/build.mjs) resolve the `?raw`
 * suffix to the file's UTF-8 text. TypeScript has no built-in notion of it, so the
 * suffix is declared here once instead of per import site.
 */
declare module '*?raw' {
  const content: string;
  export default content;
}
