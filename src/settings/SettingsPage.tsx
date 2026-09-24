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

/** Antet görselleri için tek sınır: rapor ayarlarıyla aynı kural (PNG/JPEG/WebP, ≤600 KB). */
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
      setMessage({ kind: 'success', text: 'Ayarlar kaydedildi.' });
      if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setMessage(null), 3200);
    } catch (cause) {
      setMessage({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Ayarlar kaydedilemedi.',
      });
    } finally {
      setSaving(false);
    }
  }

  const previewName = [letterhead.name, letterhead.title].filter(Boolean).join(' · ');

  return (
    <div className="settings-page">
      <header className="settings-head">
        <div className="settings-head-text">
          <span className="settings-kicker">
            <span className="settings-kicker-dot" aria-hidden="true" />
            <span>Uygulama</span>
          </span>
          <h1 id="settings-title">Ayarlar</h1>
          <p>Antet, imza ve yedek. Yeni raporlar buradaki uzman adını kullanır.</p>
        </div>
        <div className="settings-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/denetim')}>
            <Icon name="list" size={15} />
            <span>Denetim izi</span>
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setBackupOpen(true)}>
            <Icon name="database" size={15} />
            <span>Yedekle</span>
          </button>
        </div>
      </header>

      {loadError !== '' && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={18} />
          <span style={{ flex: 1 }}>{loadError}</span>
          <button type="button" className="btn-secondary btn-sm" onClick={() => window.location.reload()}>
            Yeniden dene
          </button>
        </div>
      )}

      <form className="settings-card" onSubmit={onSubmit} aria-labelledby="settings-antet-title">
        <div className="settings-card-head">
          <h2 id="settings-antet-title">Antet ve imza</h2>
          <p>
            Bu bilgiler <strong>yalnızca yeni oluşturulan raporlara</strong> eklenir; daha önce oluşturulmuş raporların
            anteti kendiliğinden değişmez. Antet, raporun en üstünde kurum bilgisi olarak basılır.
          </p>
        </div>

        {loading ? (
          <div className="settings-loading">
            <div className="spinner" />
            <span>Ayarlar yükleniyor…</span>
          </div>
        ) : (
          <>
            <div className="settings-grid-2">
              <label className="settings-field">
                <span>Uzman adı</span>
                <input
                  value={letterhead.name}
                  onChange={event => update('name', event.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Uzm. Psk. Halil Karaduman"
                />
              </label>
              <label className="settings-field">
                <span>Ünvan</span>
                <input
                  value={letterhead.title}
                  onChange={event => update('title', event.target.value)}
                  maxLength={120}
                  placeholder="Klinik Psikolog"
                />
              </label>
            </div>

            <label className="settings-field">
              <span>Klinik adı</span>
              <input
                value={letterhead.institution}
                onChange={event => update('institution', event.target.value)}
                maxLength={180}
                placeholder="Halil Karaduman Psikoloji"
              />
            </label>

            <div className="settings-grid-2">
              <label className="settings-field">
                <span>Telefon</span>
                <input
                  value={letterhead.phone}
                  onChange={event => update('phone', event.target.value)}
                  maxLength={40}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              <label className="settings-field">
                <span>E-posta</span>
                <input
                  type="email"
                  value={letterhead.email}
                  onChange={event => update('email', event.target.value)}
                  maxLength={120}
                  autoComplete="email"
                />
              </label>
            </div>

            <label className="settings-field">
              <span>Adres</span>
              <input
                value={letterhead.address}
                onChange={event => update('address', event.target.value)}
                maxLength={240}
                autoComplete="street-address"
              />
            </label>

            <div className="settings-assets">
              {(['logo', 'signature'] as const).map(field => (
                <div className="settings-asset" key={field}>
                  <strong>{field === 'logo' ? 'Logo (antette, üstte)' : 'İmza / kaşe (rapor sonu)'}</strong>
                  <span className="settings-hint">PNG, JPEG veya WebP · en fazla 600 KB.</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    aria-label={field === 'logo' ? 'Logo yükle' : 'İmza yükle'}
                    onChange={event => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      readAsset(
                        file,
                        dataUrl => {
                          update(field, dataUrl);
                          setMessage(null);
                        },
                        error => setMessage({ kind: 'error', text: error }),
                      );
                    }}
                  />
                  {safeReportImage(letterhead[field]) && (
                    <span className="settings-asset-preview">
                      <img
                        src={safeReportImage(letterhead[field])}
                        alt={field === 'logo' ? 'Logo önizleme' : 'İmza önizleme'}
                      />
                      <button type="button" className="btn-secondary btn-sm" onClick={() => update(field, '')}>
                        Kaldır
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="settings-preview" aria-label="Antet önizleme">
              {safeReportImage(letterhead.logo) && <img src={safeReportImage(letterhead.logo)} alt="" />}
              <div className="settings-preview-text">
                <strong>{letterhead.institution || 'Klinik adı'}</strong>
                <span>{previewName || 'Uzman adı · Ünvan'}</span>
                <span className="settings-hint">
                  {[letterhead.phone, letterhead.email, letterhead.address].filter(Boolean).join(' · ') ||
                    'Telefon · E-posta · Adres'}
                </span>
              </div>
            </div>

            <div className="settings-footer">
              {message && (
                <span
                  className={`settings-message ${message.kind === 'success' ? 'is-success' : 'is-error'}`}
                  role="status"
                >
                  {message.text}
                </span>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Ayarları kaydet'}
              </button>
            </div>
          </>
        )}
      </form>

      <section className="settings-card" aria-labelledby="settings-cloud-title">
        <div className="settings-card-head">
          <h2 id="settings-cloud-title">Bulut</h2>
          {supabaseConfig.configured ? (
            <>
              <p>
                Supabase bağlı. Kurum verisi RLS ile ayrılır. Yerel dosya yine bu cihazda kalır; bulut danışanları
                ayrı şemadadır.
              </p>
              <p>
                Bu uygulamada test kayıtları ve psikolog raporları bulutta tutulur; taslak ve çevrimdışı kuyruk
                yalnızca bu tarayıcıda saklanır. Antet ayarları hesabınıza bağlı tek satırda durur ve bu satır RLS ile
                korunur.
              </p>
            </>
          ) : (
            <p>
              Supabase tanımlı değil — uygulama çevrimdışı modda açılır, oturum ve kayıt çalışmaz. Kurulum için{' '}
              <code>.env</code> dosyasına yalnızca anon anahtar yazılır; hizmet rolü anahtarı tarayıcıya girmez.
            </p>
          )}
        </div>
        {canAdmin && supabaseConfig.configured && <CloudAccountsPanel admin={user} />}
      </section>

      {backupOpen && <BackupDialog user={user} onClose={() => setBackupOpen(false)} />}
    </div>
  );
}
