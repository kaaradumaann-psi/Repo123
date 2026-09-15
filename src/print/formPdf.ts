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

function pdfBlob(bytes: Uint8Array): Blob {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type: 'application/pdf' });
}

/** Downloads through a Blob URL: a top-level navigation to a data URI is blocked by some browsers. */
export async function downloadFormPdf(): Promise<void> {
  const bytes = await formPdfBytes();
  const url = URL.createObjectURL(pdfBlob(bytes));
  const link = document.createElement('a');
  link.href = url;
  link.download = FORM_PDF_FILE_NAME;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Prints the verified 4-page A4 PDF, never the HTML portal. Falls back to opening or
 * downloading the same byte stream if the hidden-frame print path is blocked.
 */
export async function printFormPdf(): Promise<void> {
  const bytes = await formPdfBytes();
  const url = URL.createObjectURL(pdfBlob(bytes));
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.title = 'MMPI-566 yazdırma';
  Object.assign(frame.style, {
    position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0',
  });
  const cleanup = () => {
    window.setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 120_000);
  };
  try {
    await new Promise<void>(resolve => {
      const timer = window.setTimeout(() => {
        window.open(url, '_blank', 'noopener');
        resolve();
      }, 8_000);
      frame.onload = () => {
        window.clearTimeout(timer);
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {
          window.open(url, '_blank', 'noopener');
        }
        resolve();
      };
      document.body.append(frame);
      frame.src = url;
    });
  } catch {
    await downloadFormPdf();
  } finally {
    cleanup();
  }
}
