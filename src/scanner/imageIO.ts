import type { GrayImage, PixelImage } from '../omr/omrTypes';

export const SCAN_LIMITS = {
  fileBytes: 24 * 1024 * 1024, batchBytes: 96 * 1024 * 1024, files: 12,
  sourcePixels: 40_000_000, sourceDimension: 16_000, longSide: 2800, pdfWidth: 1680, pdfPages: 12, batchPages: 24,
} as const;

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
  if (file.size === 0) throw new Error('Dosya boş. Başka bir JPG, PNG veya PDF seçin.');
  if (file.size > SCAN_LIMITS.fileBytes) throw new Error('Dosya 24 MB sınırını aşıyor. Daha küçük bir dosya seçin.');
}

export async function identifyFile(file: File): Promise<'image' | 'pdf'> {
  checkFileSize(file);
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 ||
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return 'image';
  // The PDF spec allows the %PDF- signature anywhere in the first 1024 bytes
  // (some producers prepend whitespace or a BOM), so search instead of pinning byte 0.
  const signature = [0x25, 0x50, 0x44, 0x46, 0x2d];
  for (let at = 0; at + signature.length <= bytes.length; at++) {
    if (signature.every((value, index) => bytes[at + index] === value)) return 'pdf';
  }
  throw new Error('Dosya biçimi desteklenmiyor. Yalnızca gerçek JPG, PNG veya PDF dosyaları açılabilir.');
}

/** Check encoded dimensions before allocating the decoded bitmap. */
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
  throw new Error('Görüntü başlığı okunamadı. Dosyayı standart JPG veya PNG olarak yeniden kaydedin.');
}

export async function readImageFile(file: File, signal: AbortSignal): Promise<PixelImage> {
  checkFileSize(file);
  checkAborted(signal);
  // The buffer is read once: the same bytes feed the encoded-size preflight and,
  // wrapped in a Blob, the decoder, so the file is never loaded from disk twice.
  const bytes = new Uint8Array(await file.arrayBuffer());
  checkAborted(signal);
  const size = encodedImageSize(bytes);
  if (size.width < 1 || size.height < 1 || size.width * size.height > SCAN_LIMITS.sourcePixels ||
    Math.max(size.width, size.height) > SCAN_LIMITS.sourceDimension) {
    throw new Error('Görüntü çok büyük veya boyutu geçersiz. En çok 40 megapiksel ve 16.000 piksel kenar uzunluğu desteklenir.');
  }
  checkAborted(signal);
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(new Blob([bytes]), { imageOrientation: 'from-image' });
    checkAborted(signal);
    return capturePixels(bitmap, bitmap.width, bitmap.height);
  } catch (error) {
    checkAborted(signal);
    throw new Error(`Görüntü açılamadı. Standart JPG/PNG kullanın. ${error instanceof Error ? error.message : ''}`);
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
