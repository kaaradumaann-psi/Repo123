import { useEffect, useState } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { listPsychologists } from '../auth/adminApi';
import { displayName } from '../auth/userDisplay';
import { ALL_RECORDS_LIMIT, listAllRecords, listAllRecordsPaged } from '../records/supabaseRecords';
import type { RecordSummary } from '../records/supabaseRecords';
import { todayIsoDate } from '../workspace/caseTypes';
import { navigate } from '../router';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import '../styles/dashboard.css';

type Props = { admin: AuthenticatedUser };

const TIME_ZONE = 'Europe/Istanbul';
const RECENT_LIMIT = 6;
const PEOPLE_LIMIT = 8;

function clientName(firstName: string, lastName: string, fallback: string): string {
  const full = `${firstName} ${lastName}`.trim();
  return full === '' ? fallback : full;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('tr-TR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('tr-TR', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Son test listesi satırı: kim, kime ve ne zaman uygulandı tek satırda. */
function recordMeta(record: RecordSummary): string {
  const bits = [
    record.psychologistName ? `Uygulayan: ${record.psychologistName}` : 'Uygulayan: —',
    record.gender ?? '',
    record.age != null ? `${record.age} yaş` : '',
    record.applicationDate !== '' ? `Uygulama ${formatDate(record.applicationDate)}` : '',
  ].filter(Boolean);
  return bits.join(' · ');
}

/**
 * Admin Genel Bakış — yönetim panosu.
 *
 * Psikolog gün panosunun admin karşılığı: tüm uzmanların yaptığı testler
 * (kim, kime, ne zaman) ve psikolog hesapları özetlenir. Detay ve yönetim
 * aksiyonları Yönetim paneline (/yonetim) gider; Genel bakış ile İşlem
 * ekranı bu sayede birbirinden ayrışır.
 */
export function AdminOverview({ admin }: Props) {
  const [users, setUsers] = useState<AuthenticatedUser[] | null>(null);
  const [records, setRecords] = useState<RecordSummary[] | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadFailed(false);
      const today = todayIsoDate();
      // allSettled: tek bir sorgu düşerse pano boşalmaz; kalan bölümler gösterilir.
      const [usersRes, recordsRes, totalRes, dayRes] = await Promise.allSettled([
        listPsychologists(),
        listAllRecords(),
        listAllRecordsPaged({ page: 0, pageSize: 1 }),
        listAllRecordsPaged({ dateFrom: today, dateTo: today, page: 0, pageSize: 1 }),
      ]);
      if (cancelled) return;
      setUsers(usersRes.status === 'fulfilled' ? usersRes.value : null);
      setRecords(recordsRes.status === 'fulfilled' ? recordsRes.value : null);
      setTotalCount(totalRes.status === 'fulfilled' ? totalRes.value.count : null);
      setTodayCount(dayRes.status === 'fulfilled' ? dayRes.value.count : null);
      setLoadFailed([usersRes, recordsRes, totalRes, dayRes].some(result => result.status === 'rejected'));
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="dashboard-container day-board">
        <div className="loading-state-card"><div className="spinner" /></div>
      </div>
    );
  }

  const now = new Date();
  const todayLabel = now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
  const latest = records && records.length > 0 ? records[0] : null;
  const recordsCapped = records != null && records.length >= ALL_RECORDS_LIMIT;
  const summary: { icon: IconName; label: string; value: number | null }[] = [
    { icon: 'database', label: 'Toplam test', value: totalCount },
    { icon: 'calendar', label: 'Bugün', value: todayCount },
    { icon: 'users', label: 'Psikolog', value: users ? users.length : null },
    { icon: 'user', label: 'Aktif psikolog', value: users ? users.filter(item => item.active).length : null },
  ];
  const latestDetail = latest
    ? [
        latest.applicationDate ? `Uygulama ${formatDate(latest.applicationDate)}` : '',
        `Kayıt ${formatDate(latest.createdAt)} ${formatTime(latest.createdAt)}`,
      ].filter(Boolean).join(' · ')
    : '';

  return (
    <div className="dashboard-container day-board">
      {loadFailed && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={18} />
          <span style={{ flex: 1 }}>Genel bakışın bir bölümü yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.</span>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setReloadKey(key => key + 1)}>
            Tekrar dene
          </button>
        </div>
      )}

      <section className="desk" aria-labelledby="admin-overview-title">
        <div className="desk-intro">
          <div className="desk-eyebrow"><span className="desk-eyebrow-dot" /> YÖNETİM PANOSU <span className="desk-eyebrow-sep">/</span> {todayLabel}</div>
          <h1 id="admin-overview-title">Genel bakış<span className="desk-title-dot" aria-hidden="true">.</span></h1>
          <p>Merhaba {admin.firstName}. Uzmanların yaptığı testler, kimin kime uyguladığı ve psikolog hesapları tek ekranda.</p>
          <div className="desk-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/yonetim')}>
              <Icon name="shield" size={17} /> Yönetim paneli
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/islem')}>
              İşlem akışı <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
        <div className="desk-now">
          {latest ? (
            <>
              <div className="desk-now-top">
                <span className="desk-now-symbol"><Icon name="file" size={19} /></span>
                <span>SON YAPILAN TEST</span>
              </div>
              <strong>{clientName(latest.firstName, latest.lastName, 'İsimsiz kayıt')}</strong>
              <span className="desk-now-name">
                {latest.psychologistName ? `Uygulayan: ${latest.psychologistName}` : 'Uygulayan bilinmiyor'}
              </span>
              <span className="desk-now-detail">{latestDetail}</span>
              <button type="button" onClick={() => navigate(`/kayitlar/${latest.id}`)}>
                Kaydı aç <Icon name="arrowRight" size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="desk-now-top">
                <span className="desk-now-symbol"><Icon name="calendar" size={19} /></span>
                <span>BUGÜNKÜ PLAN</span>
              </div>
              <strong>Henüz test yok.</strong>
              <span className="desk-now-detail">Psikologlar işlemi tamamladığında uygulamalar burada görünür.</span>
              <button type="button" onClick={() => navigate('/yonetim')}>
                Yönetim paneli <Icon name="arrowRight" size={16} />
              </button>
            </>
          )}
        </div>
      </section>

      <nav className="desk-rail" aria-label="Yönetim özeti">
        {summary.map((item) => (
          <button type="button" key={item.label} onClick={() => navigate('/yonetim')} aria-label={`${item.label}: ${item.value ?? '—'}`}>
            <span className="desk-rail-icon"><Icon name={item.icon} size={19} /></span>
            <strong>{item.value ?? '—'}</strong>
            <span className="desk-rail-label">{item.label}</span>
            <Icon name="arrowRight" size={16} className="desk-rail-arrow" />
          </button>
        ))}
      </nav>

      <div className="board-grid">
        <section className="board-schedule" aria-labelledby="admin-recent-title">
          <div className="board-section-head">
            <div>
              <span className="board-eyebrow">YAPILAN TESTLER</span>
              <h2 id="admin-recent-title">Son uygulamalar</h2>
            </div>
            <button type="button" className="board-text-link" onClick={() => navigate('/yonetim')}>
              Tüm kayıtlar <Icon name="arrowRight" size={16} />
            </button>
          </div>
          {records == null ? (
            <div className="board-empty">
              <span className="board-empty-icon"><Icon name="alert" size={25} /></span>
              <h3>Kayıtlar yüklenemedi.</h3>
              <p>Bağlantınızı kontrol edip yeniden deneyin.</p>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setReloadKey(key => key + 1)}>
                Yeniden dene <Icon name="refresh" size={15} />
              </button>
            </div>
          ) : records.length === 0 ? (
            <div className="board-empty">
              <span className="board-empty-icon"><Icon name="file" size={25} /></span>
              <h3>Henüz test kaydı yok.</h3>
              <p>Psikologlar işlem akışını tamamladığında uygulamalar burada listelenir.</p>
              <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/yonetim')}>
                Yönetim paneli <Icon name="arrowRight" size={15} />
              </button>
            </div>
          ) : (
            <div className="prep-list">
              {records.slice(0, RECENT_LIMIT).map(record => (
                <article key={record.id} className="prep-card">
                  <div className="prep-time"><strong>{formatTime(record.createdAt)}</strong><span>{formatDate(record.createdAt)}</span></div>
                  <div className="prep-body">
                    <div className="prep-title">
                      <h3>{clientName(record.firstName, record.lastName, 'İsimsiz kayıt')}</h3>
                    </div>
                    <p className="prep-meta">{recordMeta(record)}</p>
                    <div className="prep-actions">
                      <button type="button" className="btn-primary btn-sm" onClick={() => navigate(`/kayitlar/${record.id}`)}>Kaydı aç</button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => navigate(`/kayitlar/${record.id}/raporlar`)}>Raporlar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {recordsCapped && (
            <p className="ws-muted">En yeni {ALL_RECORDS_LIMIT} kayıt gösteriliyor; tam liste Yönetim panelinde.</p>
          )}
        </section>

        <aside className="board-side" aria-label="Psikolog hesapları">
          <section className="board-shortcuts" aria-labelledby="admin-team-title">
            <span className="board-eyebrow">PSİKOLOGLAR</span>
            <h2 id="admin-team-title">Uzman hesapları</h2>
            {users == null ? (
              <p className="ws-muted">Psikolog listesi alınamadı. Bağlantınızı kontrol edip yeniden deneyin.</p>
            ) : users.length === 0 ? (
              <p className="ws-muted">Kayıtlı psikolog yok. Yönetim panelinden ilk hesabı ekleyin.</p>
            ) : (
              users.slice(0, PEOPLE_LIMIT).map(user => {
                const count = records ? records.filter(record => record.createdBy === user.id).length : null;
                const detail = [count != null ? `${count} test` : null, user.active ? null : 'Pasif']
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <button type="button" key={user.id} onClick={() => navigate('/yonetim')}>
                    <Icon name="user" size={18} />
                    <span>{displayName(user)}{detail !== '' ? ` · ${detail}` : ''}</span>
                    <Icon name="arrowRight" size={15} />
                  </button>
                );
              })
            )}
            <button type="button" onClick={() => navigate('/yonetim')}>
              <Icon name="shield" size={18} />
              <span>Yönetim paneli</span>
              <Icon name="arrowRight" size={15} />
            </button>
          </section>
        </aside>
      </div>

      <div className="day-board-note">
        <Icon name="info" size={17} />
        <span>Genel bakış yalnızca özet bilgi sunar; hesap ve kayıt işlemleri Yönetim panelinden yürütülür.</span>
      </div>
    </div>
  );
}
