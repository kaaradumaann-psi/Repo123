import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { supabaseConfig } from '../auth/supabaseClient';
import { Icon } from '../components/Icon';
import { EMPTY_LETTERHEAD } from '../reports/templateEngine';
import type { Letterhead } from '../reports/templateEngine';
import { getSettings, saveSettings } from '../reports/reportsApi';
import { safeReportImage } from '../reports/ReportPreview';
import { navigate } from '../router';
import { recordDeviceAudit } from './auditTrail';
import { BackupDialog } from './BackupDialog';
import { CloudAccountsPanel } from './CloudAccountsPanel';

/**
 * Logo ve imza sınırı: yalnızca PNG/JPEG/WebP ve tek bir boyut sınırı.
 * (psikolog reposundaki `MAX_BRAND_ASSET_BYTES` kuralının karşılığı.)
 */
const MAX_ASSET_BYTES = 600_000;
const ASSET_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readAsset(file: File, onDone: (dataUrl: string) => void, onError: (message: string) => void) {
  if (!ASSET_TYPES.includes(file.type)) {
    onError('Logo ve imza yalnızca PNG, JPEG veya WebP olabilir.');
    return;
  }
  if (file.size > MAX_ASSET_BYTES) {
    onError('Görsel 600 KB sınırını aşıyor.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const url = typeof reader.result === 'string' ? reader.result : '';
    if (safeReportImage(url)) onDone(url);
    else onError('Görsel okunamadı.');
  };
  reader.onerror = () => onError('Görsel okunamadı.');
  reader.readAsDataURL(file);
}

/**
 * Ayarlar.
 *
 * psikolog reposundaki Ayarlar ekranının birebir karşılığı: uzman/klinik
 * bilgileri, antet metni, logo ve imza; üstte "Denetim izi" ve "Yedekle"
 * eylemleri, altta Bulut bölümü. Yeni raporlar buradaki uzman adını kullanır.
 */
export function SettingsPage({ user }: { user: AuthenticatedUser }) {
  const canAdmin = user.role === 'ADMIN';
  const [letterhead, setLetterhead] = useState<Letterhead>(EMPTY_LETTERHEAD);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const savedTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSettings(user.id)
      .then(loaded => {
        if (!cancelled) {
          setLetterhead(loaded);
          setLoadError('');
        }
      })
      .catch(cause => {
        if (!cancelled) {
          setLoadError(cause instanceof Error ? cause.message : 'Ayarlar okunamadı.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => () => {
    if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
  }, []);

  function update<K extends keyof Letterhead>(key: K, value: Letterhead[K]) {
    setLetterhead(current => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const email = letterhead.email.trim();
    if (email !== '' && !EMAIL_PATTERN.test(email)) {
      setMessage({ kind: 'error', text: 'E-posta adresi geçersiz görünüyor; düzeltip tekrar kaydedin.' });
      return;
    }
    const cleaned: Letterhead = {
      name: letterhead.name.trim().slice(0, 120),
      title: letterhead.title.trim().slice(0, 120),
      institution: letterhead.institution.trim().slice(0, 180),
      phone: letterhead.phone.trim().slice(0, 40),
      email,
      address: letterhead.address.trim().slice(0, 240),
      letterhead: letterhead.letterhead.replace(/\r\n/g, '\n').trim().slice(0, 800),
      logo: safeReportImage(letterhead.logo) ?? '',
      signature: safeReportImage(letterhead.signature) ?? '',
    };
    setSaving(true);
    try {
      await saveSettings(user.id, cleaned);
      setLetterhead(cleaned);
      recordDeviceAudit(user.id, {
        action: 'save',
        entity: 'settings',
        entityId: 'settings',
        summary: 'Antet ve imza ayarları güncellendi',
      });
      setMessage({ kind: 'success', text: 'Kaydedildi' });
      if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setMessage(null), 2400);
    } catch (cause) {
      setMessage({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Ayarlar kaydedilemedi.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="clinical-container settings-page">
      <div className="clinical-header">
        <div className="clinical-title-wrap">
          <div className="clinical-kicker"><span className="clinical-kicker-dot" /><span>Uygulama</span></div>
          <h1>Ayarlar</h1>
          <p>Antet, imza ve yedek. Yeni raporlar buradaki uzman adını kullanır.</p>
        </div>
        <div className="clinical-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/denetim')}>
            <Icon name="list" size={16} />
            <span>Denetim izi</span>
          </button>
          <button type="button" className="btn-secondary" onClick={() => setBackupOpen(true)}>
            <Icon name="database" size={16} />
            <span>Yedekle</span>
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="modern-table-card settings-form">
        <div className="form-row-2">
          <label className="form-group">
            Uzman adı
            <input
              value={letterhead.name}
              onChange={event => update('name', event.target.value)}
              maxLength={120}
              autoComplete="name"
            />
          </label>
          <label className="form-group">
            Ünvan
            <input value={letterhead.title} onChange={event => update('title', event.target.value)} maxLength={120} />
          </label>
        </div>

        <label className="form-group">
          Klinik adı
          <input
            value={letterhead.institution}
            onChange={event => update('institution', event.target.value)}
            maxLength={180}
          />
        </label>

        <div className="form-row-2">
          <label className="form-group">
            Telefon
            <input
              value={letterhead.phone}
              onChange={event => update('phone', event.target.value)}
              maxLength={40}
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label className="form-group">
            E-posta
            <input
              type="email"
              value={letterhead.email}
              onChange={event => update('email', event.target.value)}
              maxLength={120}
              autoComplete="email"
            />
          </label>
        </div>

        <label className="form-group">
          Adres
          <input
            value={letterhead.address}
            onChange={event => update('address', event.target.value)}
            maxLength={240}
            autoComplete="street-address"
          />
        </label>

        <label className="form-group">
          Antet metni
          <textarea
            value={letterhead.letterhead}
            onChange={event => update('letterhead', event.target.value)}
            maxLength={800}
            rows={3}
          />
        </label>

        <div className="form-row-2">
          <label className="form-group">
            Logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                readAsset(file, dataUrl => update('logo', dataUrl), error => setMessage({ kind: 'error', text: error }));
              }}
            />
          </label>
          <label className="form-group">
            İmza
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                readAsset(file, dataUrl => update('signature', dataUrl), error => setMessage({ kind: 'error', text: error }));
              }}
            />
          </label>
        </div>

        {(safeReportImage(letterhead.logo) || safeReportImage(letterhead.signature)) && (
          <div className="settings-assets">
            {safeReportImage(letterhead.logo) && (
              <span className="settings-asset">
                <img src={safeReportImage(letterhead.logo)} alt="Logo önizleme" />
                <button type="button" className="btn-secondary btn-sm" onClick={() => update('logo', '')}>
                  Kaldır
                </button>
              </span>
            )}
            {safeReportImage(letterhead.signature) && (
              <span className="settings-asset">
                <img src={safeReportImage(letterhead.signature)} alt="İmza önizleme" />
                <button type="button" className="btn-secondary btn-sm" onClick={() => update('signature', '')}>
                  Kaldır
                </button>
              </span>
            )}
          </div>
        )}

        {loading && <p className="settings-note">Ayarlar yükleniyor…</p>}
        {loadError !== '' && <p className="settings-error">{loadError}</p>}
        {message?.kind === 'error' && <p className="settings-error">{message.text}</p>}

        <div className="settings-form-actions">
          {message?.kind === 'success' && <span className="settings-saved">{message.text}</span>}
          <button type="submit" className="btn-primary" disabled={saving || loading}>
            {saving ? 'Kaydediliyor…' : 'Ayarları kaydet'}
          </button>
        </div>
      </form>

      <section className="modern-table-card settings-cloud">
        <h2>Bulut</h2>
        {supabaseConfig.configured ? (
          <p>Supabase bağlı. Kurum verisi RLS ile ayrılır. Yerel dosya yine bu cihazda kalır; bulut danışanları ayrı şemadadır.</p>
        ) : (
          <p>
            Supabase tanımlı değil — uygulama çevrimdışı modda açılır, oturum ve kayıt çalışmaz. Kurulum için{' '}
            <code>.env</code> dosyasına yalnızca anon anahtar yazılır; hizmet rolü anahtarı tarayıcıya girmez.
          </p>
        )}
        {canAdmin && supabaseConfig.configured && <CloudAccountsPanel />}
      </section>

      {backupOpen && <BackupDialog user={user} onClose={() => setBackupOpen(false)} />}
    </div>
  );
}
