import { useEffect, useState } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { supabaseConfig } from '../auth/supabaseClient';
import { Icon } from '../components/Icon';
import { navigate } from '../router';
import {
  deviceAuditActionLabel,
  deviceAuditEntityLabel,
  formatDeviceAuditTime,
  getDeviceAudit,
  shortEntityId,
  subscribeDeviceAudit,
} from './auditTrail';
import type { DeviceAuditEvent } from './auditTrail';
import { SERVER_AUDIT_LIMIT, listServerAudit } from './serverAudit';
import type { ServerAuditEvent } from './serverAudit';

function formatServerTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Denetim kaydı.
 *
 * Sunucu tarafı `audit_logs` (trigger yazar, RLS yalnızca yöneticiye açık) ve
 * bu cihazdaki işlem izi yan yana gösterilir; psikolog reposundaki
 * "Denetim kaydı" ekranının bulut karşılığı budur.
 */
export function AuditPage({ viewer }: { viewer: AuthenticatedUser }) {
  const canAdmin = viewer.role === 'ADMIN';
  const configured = supabaseConfig.configured;
  const [deviceEvents, setDeviceEvents] = useState<DeviceAuditEvent[]>(() => getDeviceAudit(viewer.id));
  const [serverEvents, setServerEvents] = useState<ServerAuditEvent[]>([]);
  const [loadingServer, setLoadingServer] = useState(configured && canAdmin);
  const [serverError, setServerError] = useState('');

  useEffect(() => subscribeDeviceAudit(() => setDeviceEvents(getDeviceAudit(viewer.id))), [viewer.id]);

  async function loadServer() {
    if (!configured || !canAdmin) return;
    setLoadingServer(true);
    setServerError('');
    try {
      setServerEvents(await listServerAudit());
    } catch (cause) {
      setServerEvents([]);
      setServerError(cause instanceof Error ? cause.message : 'Sunucu denetim izi okunamadı.');
    } finally {
      setLoadingServer(false);
    }
  }

  useEffect(() => {
    void loadServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer.id]);

  return (
    <div className="settings-page">
      <header className="settings-head">
        <div className="settings-head-text">
          <span className="settings-kicker">
            <span className="settings-kicker-dot" aria-hidden="true" />
            <span>Kayıt izi</span>
          </span>
          <h1 id="audit-title">Denetim kaydı</h1>
          <p>Bu cihazdaki son kaydetme ve silme işlemleri. Bulut açıksa sunucu kendi kaydını ayrıca tutar.</p>
        </div>
        <div className="settings-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/ayarlar')}>
            <Icon name="left" size={15} />
            <span>Ayarlara dön</span>
          </button>
          {canAdmin && configured && (
            <button type="button" className="btn-secondary btn-sm" onClick={() => void loadServer()} disabled={loadingServer}>
              <Icon name="refresh" size={15} />
              <span>Yenile</span>
            </button>
          )}
        </div>
      </header>

      <section className="settings-card" aria-labelledby="audit-server-title">
        <div className="settings-card-head">
          <h2 id="audit-server-title">Sunucu denetim izi</h2>
          <p>
            <code>audit_logs</code> tablosu test kayıtları üzerindeki her ekleme, güncelleme ve silmede otomatik
            yazılır (en yeni {SERVER_AUDIT_LIMIT} kayıt).
          </p>
        </div>

        {!configured ? (
          <div className="status-banner info-banner" role="status">
            <Icon name="info" size={16} />
            <span style={{ flex: 1 }}>Supabase bağlı değil; sunucu denetim izi bu kurulumda kapalı.</span>
          </div>
        ) : !canAdmin ? (
          <div className="status-banner info-banner" role="status">
            <Icon name="info" size={16} />
            <span style={{ flex: 1 }}>
              Sunucu denetim izi RLS gereği yalnızca yönetici hesabında görünür. Kendi işlemleriniz aşağıdaki cihaz
              kaydında listelenir.
            </span>
          </div>
        ) : loadingServer ? (
          <div className="settings-loading">
            <div className="spinner" />
            <span>Denetim izi yükleniyor…</span>
          </div>
        ) : serverError !== '' ? (
          <div className="status-banner error-banner" role="alert">
            <Icon name="alert" size={18} />
            <span style={{ flex: 1 }}>{serverError}</span>
            <button type="button" className="btn-secondary btn-sm" onClick={() => void loadServer()}>
              Tekrar dene
            </button>
          </div>
        ) : serverEvents.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <Icon name="list" size={30} />
            </div>
            <h4>Kayıt yok</h4>
            <p>Test kaydı eklenip güncellendikçe sunucu denetim izi burada listelenir.</p>
          </div>
        ) : (
          <div className="settings-table-wrapper">
            <table className="settings-table">
              <caption className="settings-table-caption">Sunucu tarafında tutulan değişmez kayıtlar.</caption>
              <thead>
                <tr>
                  <th scope="col">Zaman</th>
                  <th scope="col">İşlem</th>
                  <th scope="col">Varlık</th>
                  <th scope="col">Kayıt</th>
                  <th scope="col">Aktör</th>
                </tr>
              </thead>
              <tbody>
                {serverEvents.map(event => (
                  <tr key={event.id}>
                    <td data-label="Zaman">{formatServerTime(event.createdAt)}</td>
                    <td data-label="İşlem">{event.actionLabel}</td>
                    <td data-label="Varlık">{event.targetLabel}</td>
                    <td data-label="Kayıt" className="mono-sub">
                      {event.targetId ? `${event.targetId.slice(0, 8)}…` : '—'}
                    </td>
                    <td data-label="Aktör">{event.actorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="settings-card" aria-labelledby="audit-device-title">
        <div className="settings-card-head">
          <h2 id="audit-device-title">Bu cihazdaki işlemler</h2>
          <p>
            Bu tarayıcıda yapılan kaydetme, silme ve yedekleme adımları. Danışan adı yerine kayıt kimliği tutulur;
            kayıtlar cihazda saklanır ve en fazla 200 satır gösterilir.
          </p>
        </div>
        {deviceEvents.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <Icon name="list" size={30} />
            </div>
            <h4>Kayıt yok</h4>
            <p>Kaydetme ve silme işlemleri burada görünür.</p>
          </div>
        ) : (
          <div className="settings-table-wrapper">
            <table className="settings-table">
              <caption className="settings-table-caption">Cihaz kaydı yalnızca bu tarayıcıda tutulur.</caption>
              <thead>
                <tr>
                  <th scope="col">Zaman</th>
                  <th scope="col">İşlem</th>
                  <th scope="col">Varlık</th>
                  <th scope="col">Kayıt</th>
                  <th scope="col">Özet</th>
                </tr>
              </thead>
              <tbody>
                {deviceEvents.map(event => (
                  <tr key={event.id}>
                    <td data-label="Zaman">{formatDeviceAuditTime(event.at)}</td>
                    <td data-label="İşlem">{deviceAuditActionLabel(event.action)}</td>
                    <td data-label="Varlık">{deviceAuditEntityLabel(event.entity)}</td>
                    <td data-label="Kayıt" className="mono-sub">
                      {shortEntityId(event.entityId)}
                    </td>
                    <td data-label="Özet">{event.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
