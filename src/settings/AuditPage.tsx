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

/**
 * Denetim kaydı.
 *
 * psikolog reposundaki "Denetim kaydı" ekranı: bu cihazdaki son kaydetme ve
 * silme işlemleri, düz bir tablo hâlinde. Bulut açıksa yönetici ayrıca sunucu
 * tarafındaki `audit_logs` kaydını görür (RLS).
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
    <div className="clinical-container settings-page">
      <div className="clinical-header">
        <div className="clinical-title-wrap">
          <div className="clinical-kicker"><span className="clinical-kicker-dot" /><span>Kayıt izi</span></div>
          <h1>Denetim kaydı</h1>
          <p>Bu cihazdaki son kaydetme ve silme işlemleri. Bulut açıksa sunucu kendi kaydını ayrıca tutar.</p>
        </div>
        <div className="clinical-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/ayarlar')}>
            <Icon name="left" size={16} />
            <span>Ayarlara dön</span>
          </button>
          {canAdmin && configured && (
            <button type="button" className="btn-secondary" onClick={() => void loadServer()} disabled={loadingServer}>
              <Icon name="refresh" size={16} />
              <span>Yenile</span>
            </button>
          )}
        </div>
      </div>

      {canAdmin && configured && (
        <section className="modern-table-card settings-audit">
          <h2>Sunucu denetim izi</h2>
          <p className="settings-note">
            <code>audit_logs</code> tablosu test kayıtları üzerindeki her ekleme, güncelleme ve silmede otomatik
            yazılır; en yeni {SERVER_AUDIT_LIMIT} kayıt gösterilir.
          </p>
          {loadingServer ? (
            <p className="settings-note">Denetim izi yükleniyor…</p>
          ) : serverError !== '' ? (
            <p className="settings-error">{serverError}</p>
          ) : serverEvents.length === 0 ? (
            <p className="settings-note">Kayıt yok. Test kaydı eklenip güncellendikçe burası dolar.</p>
          ) : (
            /* Telefonda kart görünümü: repo standardı data-mobile-cards. */
            <div className="table-responsive">
              <table className="modern-data-table" data-mobile-cards>
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
                      <td data-label="Zaman">{formatDeviceAuditTime(event.createdAt)}</td>
                      <td data-label="İşlem">{event.actionLabel}</td>
                      <td data-label="Varlık">{event.targetLabel}</td>
                      <td data-label="Kayıt" className="mono-sub">{shortEntityId(event.targetId ?? '')}</td>
                      <td data-label="Aktör">{event.actorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="modern-table-card settings-audit">
        <h2>Bu cihazdaki işlemler</h2>
        <p className="settings-note">
          Kaydetme, silme, not ve yedekleme adımları. Danışan adı yerine kayıt kimliği tutulur; kayıtlar bu tarayıcıda
          saklanır.
        </p>
        {deviceEvents.length === 0 ? (
          <div className="empty-state-card">
            <h4>Kayıt yok</h4>
            <p>Kaydetme ve silme işlemleri burada görünür.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-data-table" data-mobile-cards>
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
                    <td data-label="Kayıt" className="mono-sub">{shortEntityId(event.entityId)}</td>
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
