import jsQR from 'jsqr';
import type { GrayImage, Point } from './omrTypes';

export const MAX_QR_PIXELS = 4_000_000;

/** Bounded decode buffer. Corners are always returned in original source pixel coordinates. */
export function decodePageQr(image: GrayImage): { text: string; corners: Point[] } | null {
  const scale = Math.min(1, Math.sqrt(MAX_QR_PIXELS / (image.width * image.height)));
  const width = Math.max(1, Math.floor(image.width * scale)), height = Math.max(1, Math.floor(image.height * scale));
  const scaleX = image.width / width, scaleY = image.height / height;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.min(image.width - 1, Math.round((x + .5) * scaleX - .5));
    const sy = Math.min(image.height - 1, Math.round((y + .5) * scaleY - .5));
    const value = image.data[sy * image.width + sx]!, at = (y * width + x) * 4;
    data[at] = value; data[at + 1] = value; data[at + 2] = value; data[at + 3] = 255;
  }
  const decoded = jsQR(data, width, height, { inversionAttempts: 'dontInvert' });
  if (!decoded) return null;
  const location = decoded.location;
  const corners = [location.topLeftCorner, location.topRightCorner, location.bottomRightCorner, location.bottomLeftCorner]
    .map(p => ({ x: (p.x + .5) * scaleX - .5, y: (p.y + .5) * scaleY - .5 }));
  return { text: decoded.data, corners };
}
