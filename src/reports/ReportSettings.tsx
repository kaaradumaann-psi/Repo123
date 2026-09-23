import { useState } from 'react';
import { saveSettings } from './reportsApi';
import type { Letterhead } from './templateEngine';
import { safeReportImage } from './ReportPreview';
export function ReportSettings({
  userId,
  initial,
  onSaved,
}: {
  userId: string;
  initial: Letterhead;
  onSaved: (h: Letterhead) => void;
}) {
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function image(file: File | undefined, field: 'logo' | 'signature') {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 600000) {
      setMessage('PNG, JPEG veya WebP; en fazla 600 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      if (safeReportImage(url)) setValue((v) => ({ ...v, [field]: url }));
    };
    reader.readAsDataURL(file);
  }
  return (
    <details className="report-settings">
      <summary>Antet ve imza ayarları (isteğe bağlı)</summary>
      <p>Yeni raporlara eklenir. Eski raporların anteti kendiliğinden değişmez.</p>
      <div className="report-settings-grid">
        {(['name', 'title', 'institution', 'phone', 'email', 'address'] as const).map((k, i) => (
          <label key={k}>
            {['Ad Soyad', 'Unvan', 'Kurum', 'Telefon', 'E-posta', 'Adres'][i]}
            <input
              value={value[k]}
              maxLength={400}
              onChange={(e) => setValue({ ...value, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
      {(['logo', 'signature'] as const).map((k) => (
        <label key={k}>
          {k === 'logo' ? 'Logo' : 'İmza'}{' '}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => void image(e.target.files?.[0], k)}
          />
          {safeReportImage(value[k]) && (
            <>
              <img width="80" src={value[k]} alt={k} />
              <button onClick={() => setValue({ ...value, [k]: '' })}>Kaldır</button>
            </>
          )}
        </label>
      ))}
      <button
        disabled={busy}
        className="btn-secondary"
        onClick={async () => {
          setBusy(true);
          try {
            await saveSettings(userId, value);
            onSaved(value);
            setMessage('Antet kaydedildi.');
          } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Kaydedilemedi.');
          } finally {
            setBusy(false);
          }
        }}
      >
        Ayarları Kaydet
      </button>
      <p role="status">{message}</p>
    </details>
  );
}
