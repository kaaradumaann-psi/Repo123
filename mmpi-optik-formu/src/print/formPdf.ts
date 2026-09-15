/**
 * The verified, generator-produced form, embedded so the self-contained build stays a single file.
 * Both bundlers resolve `?inline` to a base64 data URI: Vite natively, esbuild through the plugin
 * in scripts/build.mjs. It is offered as a direct download because the browser's own print dialog
 * can silently rescale, re-margin or clip the sheet, while this exact byte stream is checked by
 * tests/pdfForm.test.ts (geometry read back out of the file) and tests/pdfScanPipeline.test.ts
 * (rasterised and read by the real OMR pipeline).
 */
import dataUrl from '../../MMPI-566-optik-cevap-formu.pdf?inline';

export const FORM_PDF_FILE_NAME = 'MMPI-566-optik-cevap-formu.pdf';

/**
 * The production build inlines the file as a data URI; the Vite dev server instead serves it as a
 * same-origin asset URL. Both have to work, because the dev server is what the preview shows.
 */
async function formPdfBytes(): Promise<Uint8Array<ArrayBuffer>> {
  if (dataUrl.startsWith('data:')) {
    const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`PDF alınamadı (HTTP ${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
}

/** Downloads through a Blob URL: a top-level navigation to a data URI is blocked by some browsers. */
export async function downloadFormPdf(): Promise<void> {
  const bytes = await formPdfBytes();
  const url = URL.createObjectURL(new Blob([bytes.buffer], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = FORM_PDF_FILE_NAME;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
