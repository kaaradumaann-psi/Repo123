import { useEffect, useId, useRef, useState } from 'react';
import type { PixelImage } from '../omr/omrTypes';
import { capturePixels } from '../scanner/imageIO';

export type CameraCaptureProps = {
  onCapture: (image: PixelImage, sourceName: string) => void | Promise<void>;
  disabled?: boolean;
};

function cameraError(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Kamera izni verilmedi. Tarayıcının site izinlerinden kameraya izin verin veya JPG/PNG/PDF yükleyin.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'Kamera bulunamadı. Bir kamera bağlayın veya dosya yükleyin.';
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'Kamera başka bir uygulamada açık olabilir. Diğer uygulamayı kapatıp yeniden deneyin.';
  if (name === 'SecurityError') return 'Tarayıcı kamera erişimini engelliyor. HTTPS bağlantısı ve site izinlerini kontrol edin.';
  return 'Kamera başlatılamadı. Site izinlerini kontrol edin, tekrar deneyin veya dosya yükleyin.';
}

export function CameraCapture({ onCapture, disabled = false }: CameraCaptureProps) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const attempt = useRef(0);
  const alive = useRef(true);
  const capturing = useRef(false);
  const [active, setActive] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [ready, setReady] = useState(false);
  const [aspect, setAspect] = useState(3 / 4);
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState<{ brightness: number; blur: number } | null>(null);
  const labelId = useId();

  function stop() {
    attempt.current++;
    stream.current?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    stream.current = null;
    if (video.current) { video.current.pause(); video.current.srcObject = null; }
    if (alive.current) { setActive(false); setRequesting(false); setReady(false); setAdvice(null); }
  }

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; stop(); };
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = document.createElement('canvas');
    const timer = window.setInterval(() => {
      const element = video.current;
      if (!element || element.readyState < 2 || !element.videoWidth) return;
      canvas.width = 240;
      canvas.height = Math.max(1, Math.round(240 * element.videoHeight / element.videoWidth));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      try {
        context.drawImage(element, 0, 0, canvas.width, canvas.height);
        const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const gray = new Float32Array(canvas.width * canvas.height);
        let light = 0, sum = 0, squared = 0, count = 0;
        for (let i = 0; i < gray.length; i++) {
          gray[i] = 0.299 * rgba[i * 4]! + 0.587 * rgba[i * 4 + 1]! + 0.114 * rgba[i * 4 + 2]!;
          light += gray[i]!;
        }
        for (let y = 1; y < canvas.height - 1; y++) for (let x = 1; x < canvas.width - 1; x++) {
          const i = y * canvas.width + x;
          const lap = 4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - canvas.width]! - gray[i + canvas.width]!;
          sum += lap; squared += lap * lap; count++;
        }
        if (count) setAdvice({ brightness: light / gray.length, blur: Math.max(0, squared / count - (sum / count) ** 2) });
      } catch { setAdvice(null); }
    }, 850);
    return () => { window.clearInterval(timer); canvas.width = canvas.height = 0; };
  }, [active]);

  async function start() {
    if (disabled || requesting || active) return;
    setError('');
    // The capability check comes first: on an insecure origin the browser does not
    // expose navigator.mediaDevices at all, and no web page can change that.
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(window.isSecureContext
        ? 'Bu tarayıcı kamera erişimini desteklemiyor. Güncel bir tarayıcı veya dosya yükleme kullanın.'
        : 'Tarayıcı kamerayı yalnızca HTTPS veya localhost üzerinde açar; bu kural tarayıcıya aittir, ' +
          'uygulama aşamaz. Siteyi HTTPS ile yayınlayın ya da http://localhost üzerinden açın. ' +
          'Şimdilik dosya yükleme ile devam edebilirsiniz.');
      return;
    }
    const ticket = ++attempt.current;
    setRequesting(true);
    try {
      const next = await navigator.mediaDevices.getUserMedia({ audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1920 } } });
      if (!alive.current || ticket !== attempt.current) { next.getTracks().forEach(track => track.stop()); return; }
      stream.current = next;
      next.getVideoTracks().forEach(track => {
        track.onended = () => {
          if (alive.current && ticket === attempt.current) { stop(); setError('Kamera bağlantısı kesildi. Yeniden başlatın veya dosya yükleyin.'); }
        };
      });
      if (!video.current) { stop(); return; }
      video.current.srcObject = next;
      setActive(true);
      await video.current.play();
      if (!alive.current || ticket !== attempt.current) return;
      setReady(video.current.readyState >= 2 && video.current.videoWidth > 0);
      setRequesting(false);
    } catch (failure) {
      if (!alive.current || ticket !== attempt.current) return;
      stop();
      setError(cameraError(failure));
    }
  }

  async function capture() {
    if (!video.current || disabled || !ready || capturing.current) return;
    capturing.current = true;
    setError('');
    try {
      const image = capturePixels(video.current, video.current.videoWidth, video.current.videoHeight);
      stop();
      await onCapture(image, `Kamera · ${new Date().toLocaleString('tr-TR')}`);
    } catch (failure) {
      if (alive.current) setError(failure instanceof Error ? failure.message : 'Çekim alınamadı. Lütfen yeniden deneyin.');
    } finally { capturing.current = false; }
  }

  return <section className="scan-camera" aria-labelledby={labelId}>
    <h3 id={labelId}>Kamerayla sayfa ekle</h3>
    <p>Kağıdı düz tutun; dört köşe işareti ve QR kodu görünür olsun. Çerçeve yalnızca rehberdir; görüntü kırpılmaz.</p>
    <div className="scan-camera-stage" hidden={!active && !requesting} style={{ aspectRatio: aspect }}>
      <video ref={video} playsInline muted autoPlay aria-label="Canlı kamera görüntüsü"
        onLoadedData={() => {
          if (stream.current && video.current?.videoWidth && video.current.videoHeight) {
            setReady(true); setAspect(video.current.videoWidth / video.current.videoHeight);
          }
        }} />
      <div className="scan-camera-overlay" aria-hidden="true"><span>A4 · tüm sayfa</span></div>
      {requesting && <span className="scan-camera-wait">Kamera izni / görüntü bekleniyor…</span>}
    </div>
    {advice && <p className="scan-camera-advice" role="status">
      Işık: {advice.brightness < 80 ? 'düşük; aydınlatın' : advice.brightness > 235 ? 'çok parlak; yansımayı kontrol edin' : 'uygun görünüyor'}.
      {' '}Netlik: {advice.blur < 55 ? 'düşük olabilir; sabit tutun' : 'yeterli görünüyor'}.
    </p>}
    <div className="scan-actions">
      {!active && !requesting && <button type="button" className="scan-primary" onClick={() => void start()} disabled={disabled}>Kamerayı başlat</button>}
      {(active || requesting) && <button type="button" onClick={stop}>Kamerayı durdur</button>}
      {active && <button type="button" className="scan-primary" disabled={!ready || disabled || requesting} onClick={() => void capture()}>Sayfayı çek ve oku</button>}
    </div>
    {error && <p className="scan-alert" role="alert">{error}</p>}
  </section>;
}
