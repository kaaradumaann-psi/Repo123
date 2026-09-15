import type { GrayImage, PixelImage } from '../omr/omrTypes';

export const SCAN_LIMITS = {
  fileBytes: 24 * 1024 * 1024, batchBytes: 96 * 1024 * 1024, files: 12,
  sourcePixels: 40_000_000, sourceDimension: 16_000, longSide: 2800, pdfWidth: 1680, pdfPages: 12, batchPages: 24,
} as const;

export type ImageCodec = 'jpeg' | 'png' | 'webp' | 'heic' | 'gif' | 'unknown';
export type SniffResult =
  | { kind: 'image'; codec: ImageCodec }
  | { kind: 'pdf' }
  | { kind: 'unknown' };

export function checkAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('İşlem iptal edildi.', 'AbortError');
}

export async function yieldToScreen(signal: AbortSignal): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  checkAborted(signal);
}

export function boundedSize(width: number, height: number, longSide: number = SCAN_LIMITS.longSide) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Görüntü boyutları okunamadı.');
  }
  const scale = Math.min(1, longSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function capturePixels(source: CanvasImageSource, width: number, height: number): PixelImage {
  const size = boundedSize(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  try {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Tarayıcı görüntü işleme alanını açamadı. Başka bir güncel tarayıcı deneyin.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, size.width, size.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, size.width, size.height);
    return { ...size, data: context.getImageData(0, 0, size.width, size.height).data };
  } finally { canvas.width = canvas.height = 0; }
}

export function checkFileSize(file: Pick<File, 'size'>): void {
  if (file.size === 0) throw new Error('Dosya boş. Başka bir JPG, PNG, WEBP, HEIC veya PDF seçin.');
  if (file.size > SCAN_LIMITS.fileBytes) throw new Error('Dosya 24 MB sınırını aşıyor. Daha küçük bir dosya seçin.');
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, Math.min(bytes.length, start + length)));
}

/** Magic-byte sniff used by both the upload path and unit tests. */
export function sniffBytes(bytes: Uint8Array): SniffResult {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return { kind: 'image', codec: 'jpeg' };
  if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    return { kind: 'image', codec: 'png' };
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return { kind: 'image', codec: 'webp' };
  }
  if (bytes.length >= 6 && ascii(bytes, 0, 3) === 'GIF') return { kind: 'image', codec: 'gif' };
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp') {
    const brands = ascii(bytes, 8, Math.min(32, bytes.length - 8)).toLowerCase();
    if (['heic', 'heix', 'heif', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].some(brand => brands.includes(brand))) {
      return { kind: 'image', codec: 'heic' };
    }
    if (brands.includes('avif') || brands.includes('avis')) return { kind: 'image', codec: 'unknown' };
  }
  const signature = [0x25, 0x50, 0x44, 0x46, 0x2d];
  for (let at = 0; at + signature.length <= Math.min(bytes.length, 1024); at++) {
    if (signature.every((value, index) => bytes[at + index] === value)) return { kind: 'pdf' };
  }
  return { kind: 'unknown' };
}

export async function identifyFile(file: File): Promise<'image' | 'pdf'> {
  checkFileSize(file);
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const sniffed = sniffBytes(bytes);
  if (sniffed.kind === 'image' || sniffed.kind === 'pdf') return sniffed.kind;
  if (file.type.toLowerCase().startsWith('image/')) return 'image';
  throw new Error('Dosya biçimi desteklenmiyor. JPG, PNG, WEBP, HEIC veya PDF yükleyin.');
}

function codecMime(codec: ImageCodec): string {
  return ({
    jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic',
    gif: 'image/gif', unknown: 'application/octet-stream',
  })[codec];
}

function decodeFailureMessage(codec: ImageCodec, cause: unknown): string {
  const detail = cause instanceof Error && cause.message ? ` ${cause.message}` : '';
  if (codec === 'heic') {
    return 'Bu görüntü HEIC/HEIF biçiminde ve bu tarayıcı açamadı. iPhone’dan gönderirken “En Uyumlu” (JPG) seçin veya fotoğrafı JPG olarak kaydedin.';
  }
  if (codec === 'webp') {
    return 'WEBP görüntüsü açılamadı. Dosyayı JPG veya PNG olarak kaydedip yeniden yükleyin.';
  }
  return `Görüntü açılamadı. Standart JPG, PNG, WEBP veya HEIC kullanın.${detail}`;
}

/** Check encoded dimensions before allocating the decoded bitmap. JPEG/PNG only. */
export function encodedImageSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length >= 24 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) break;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === undefined || marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) {
        return { height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
      }
      offset += length;
    }
  }
  throw new Error('ENCODED_SIZE_UNKNOWN');
}

function guardDimensions(width: number, height: number): void {
  if (width < 1 || height < 1 || width * height > SCAN_LIMITS.sourcePixels ||
    Math.max(width, height) > SCAN_LIMITS.sourceDimension) {
    throw new Error('Görüntü çok büyük veya boyutu geçersiz. En çok 40 megapiksel ve 16.000 piksel kenar uzunluğu desteklenir.');
  }
}

export async function readImageFile(file: File, signal: AbortSignal): Promise<PixelImage> {
  checkFileSize(file);
  checkAborted(signal);
  const bytes = new Uint8Array(await file.arrayBuffer());
  checkAborted(signal);
  const sniffed = sniffBytes(bytes);
  const codec: ImageCodec = sniffed.kind === 'image' ? sniffed.codec : 'unknown';
  if (codec === 'jpeg' || codec === 'png') {
    try {
      const size = encodedImageSize(bytes);
      guardDimensions(size.width, size.height);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'ENCODED_SIZE_UNKNOWN') throw error;
    }
  }
  checkAborted(signal);
  const mime = codecMime(codec);
  const blob = new Blob([bytes], { type: mime === 'application/octet-stream' ? file.type || mime : mime });
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    checkAborted(signal);
    guardDimensions(bitmap.width, bitmap.height);
    return capturePixels(bitmap, bitmap.width, bitmap.height);
  } catch (error) {
    checkAborted(signal);
    if (error instanceof Error && error.message.includes('megapiksel')) throw error;
    throw new Error(decodeFailureMessage(codec, error));
  } finally { bitmap?.close(); }
}

export async function normalizedThumbnail(image: GrayImage, signal: AbortSignal): Promise<string> {
  checkAborted(signal);
  const canvas = document.createElement('canvas');
  const size = boundedSize(image.width, image.height, 600);
  canvas.width = size.width;
  canvas.height = size.height;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Sayfa önizlemesi oluşturulamadı.');
    const pixels = context.createImageData(size.width, size.height);
    for (let y = 0; y < size.height; y++) for (let x = 0; x < size.width; x++) {
      const value = image.data[Math.floor(y * image.height / size.height) * image.width + Math.floor(x * image.width / size.width)]!;
      const index = (y * size.width + x) * 4;
      pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = value;
      pixels.data[index + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value)
      : reject(new Error('Sayfa önizlemesi oluşturulamadı.')), 'image/jpeg', 0.88));
    checkAborted(signal);
    return URL.createObjectURL(blob);
  } finally { canvas.width = canvas.height = 0; }
}
