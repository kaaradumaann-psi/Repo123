import { useEffect, useState } from 'react';
import { listOwnRecordsPaged } from '../records/supabaseRecords';
import type { RecordSummary } from '../records/supabaseRecords';
import { loadDraft, loadOutbox, isDraftNonEmpty } from '../workspace/draftStorage';
import type { CaseDraftV1, OutboxEntry } from '../workspace/draftStorage';
import type { AuthenticatedUser } from '../auth/authTypes';
import { methodLabel, todayIsoDate } from '../workspace/caseTypes';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { navigate } from '../router';
import '../styles/dashboard.css';

type Props = { user: AuthenticatedUser };

const SHORTCUTS: { icon: IconName; title: string; detail: string; path: string }[] = [
  { icon: 'scan', title: 'İşlem', detail: 'MMPI akışını aç', path: '/islem' },
  { icon: 'sheet', title: 'Form', detail: 'Optik form setini indir', path: '/form' },
  { icon: 'file', title: 'Kayıtlarım', detail: 'Kayıtları görüntüle', path: '/kayitlar' },
];

const TIME_ZONE = 'Europe/Istanbul';

/**
 * Devam eden taslağı doğrudan düzenlemeye açan adres. CaseWorkspace bu
 * parametreyi görünce kayıtlı taslağı (yeni girişte bile) anında yükler ve
 * adresi temizler; bkz. `resumeRequested`.
 */
const DRAFT_RESUME_PATH = '/islem?taslak=devam';

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

function recordMeta(record: RecordSummary): string {
  const bits: string[] = [];
  const who = [record.gender, record.age != null ? `${record.age} yaş` : ''].filter(Boolean).join(' · ');
  if (who !== '') bits.push(who);
  if (record.applicationDate !== '') bits.push(`Uygulama ${formatDate(record.applicationDate)}`);
  return bits.join(' · ');
}

export function Dashboard({ user }: Props) {
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecordSummary[]>([]);
  const [draft, setDraft] = useState<CaseDraftV1 | null>(null);
  const [outbox, setOutbox] = useState<OutboxEntry[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      const today = todayIsoDate();
      try {
        const [todayRes, recentRes] = await Promise.all([
          listOwnRecordsPaged({ dateFrom: today, dateTo: today, page: 0, pageSize: 1 }),
          listOwnRecordsPaged({ page: 0, pageSize: 5 }),
        ]);
        if (cancelled) return;
        setTodayCount(todayRes.count ?? todayRes.records.length);
        setTotalCount(recentRes.count ?? recentRes.records.length);
        setRecent(recentRes.records);
      } catch {
        if (cancelled) return;
        setLoadError(true);
        setTodayCount(null);
        setTotalCount(null);
        setRecent([]);
      }
      // Draft / outbox localStorage — synchronous
      try {
        const stored = loadDraft(user.id);
        if (!cancelled) setDraft(stored && isDraftNonEmpty(stored) ? stored : null);
      } catch {
        if (!cancelled) setDraft(null);
      }
      try {
        const queue = loadOutbox(user.id);
        if (!cancelled) setOutbox(queue);
      } catch {
        if (!cancelled) setOutbox([]);
      }
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [user.id]);

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
  const draftExists = draft != null;
  const isEmpty = (totalCount ?? 0) === 0 && !draftExists && outbox.length === 0;
  const summary: { icon: IconName; label: string; value: number | null; path: string; alert?: boolean }[] = [
    { icon: 'calendar', label: 'Bugünkü kayıt', value: todayCount, path: '/kayitlar' },
    // "Taslak" döşemesi doğrudan kaldığı adıma açılır (hazırlık ekranı atlanır).
    { icon: 'clipboard', label: 'Taslak', value: draftExists ? 1 : 0, path: DRAFT_RESUME_PATH },
    { icon: 'alert', label: 'Bekleyen kuyruk', value: outbox.length, path: '/islem', alert: outbox.length > 0 },
    { icon: 'database', label: 'Toplam kayıt', value: totalCount, path: '/kayitlar' },
  ];

  return (
    <div className="dashboard-container day-board">
      {loadError && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={18} />
          <span>Kayıt özeti alınamadı. Bağlantınızı kontrol edip sayfayı yenileyin.</span>
        </div>
      )}

      <section className="desk" aria-labelledby="dashboard-title">
        <div className="desk-intro">
          <div className="desk-eyebrow"><span className="desk-eyebrow-dot" /> GÜNLÜK ÇALIŞMA ALANI <span className="desk-eyebrow-sep">/</span> {todayLabel}</div>
          <h1 id="dashboard-title">Bugünün tahtası<span className="desk-title-dot" aria-hidden="true">.</span></h1>
          <p>Merhaba {user.firstName}. Testleriniz, kayıtlarınız ve taslaklarınız için sakin bir başlangıç noktası.</p>
          <div className="desk-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/islem')}>
              <Icon name="plus" size={17} /> Yeni MMPI başlat
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/kayitlar')}>
              Kayıtlara git <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
        <div className="desk-now">
          {draft ? (
            <>
              <div className="desk-now-top">
                <span className="desk-now-symbol"><Icon name="clipboard" size={19} /></span>
                <span>DEVAM EDEN TASLAK</span>
              </div>
              <strong>{clientName(draft.client.firstName, draft.client.lastName, 'İsimsiz taslak')}</strong>
              <span className="desk-now-name">{draft.method ? methodLabel(draft.method) : 'Yöntem seçilmedi'}</span>
              <span className="desk-now-detail">Son düzenleme {formatDate(draft.updatedAt)} · {formatTime(draft.updatedAt)}</span>
              <button
                type="button"
                onClick={() => navigate(DRAFT_RESUME_PATH)}
                aria-label="Devam eden taslağı kaldığı yerden aç"
              >
                Devam et <Icon name="arrowRight" size={16} />
              </button>
            </>
          ) : outbox.length > 0 ? (
            <>
              <div className="desk-now-top">
                <span className="desk-now-symbol"><Icon name="alert" size={19} /></span>
                <span>EŞİTLEME BEKLİYOR</span>
              </div>
              <strong>{outbox.length} kayıt</strong>
              <span className="desk-now-detail">Bağlantı gelince otomatik gönderilir.</span>
              <button type="button" onClick={() => navigate('/islem')}>
                İşleme git <Icon name="arrowRight" size={16} />
              </button>
            </>
          ) : (todayCount ?? 0) > 0 ? (
            <>
              <div className="desk-now-top">
                <span className="desk-now-symbol"><Icon name="calendar" size={19} /></span>
                <span>BUGÜNKÜ ÖZET</span>
              </div>
              <strong>{todayCount} kayıt</strong>
              <span className="desk-now-detail">Uygulama tarihi bugün olan kayıtlar.</span>
              <button type="button" onClick={() => navigate('/kayitlar')}>
                Kayıtlara git <Icon name="arrowRight" size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="desk-now-top">
                <span className="desk-now-symbol"><Icon name="calendar" size={19} /></span>
                <span>BUGÜNKÜ PLAN</span>
              </div>
              <strong>Her şey hazır.</strong>
              <span className="desk-now-detail">Yeni bir test için işlem akışını başlatın.</span>
              <button type="button" onClick={() => navigate('/islem')}>
                Yeni MMPI başlat <Icon name="arrowRight" size={16} />
              </button>
            </>
          )}
        </div>
      </section>

      <nav className="desk-rail" aria-label="Çalışma alanı özeti">
        {summary.map((item) => (
          <button type="button" key={item.label} className={item.alert ? 'has-attention' : ''} onClick={() => navigate(item.path)} aria-label={`${item.label}: ${item.value ?? '—'}`}>
            <span className="desk-rail-icon"><Icon name={item.icon} size={19} /></span>
            <strong>{item.value ?? '—'}</strong>
            <span className="desk-rail-label">{item.label}</span>
            <Icon name="arrowRight" size={16} className="desk-rail-arrow" />
          </button>
        ))}
      </nav>

      {isEmpty ? (
        <>
          <section className="onboarding-panel" aria-labelledby="onboarding-title">
            <div className="onboarding-intro">
              <span className="board-eyebrow">İLK ADIMLAR</span>
              <h2 id="onboarding-title">Her şey bir testle başlar.</h2>
              <p>Henüz kayıtlı test yok. Önce bir işlem başlatın; danışan bilgisi, veri girişi ve sonuçlar aynı akışta toplansın.</p>
              <button type="button" className="btn-primary" onClick={() => navigate('/islem')}>
                İlk testi başlat <Icon name="arrowRight" size={16} />
              </button>
            </div>
            <ol className="onboarding-steps">
              <li><span>01</span><div><strong>Danışan bilgisini girin</strong><small>Temel bilgileri işlem akışında düzenleyin.</small></div><Icon name="users" size={19} /></li>
              <li><span>02</span><div><strong>Veriyi işleyin</strong><small>Optik okuma, hızlı giriş veya ham puan.</small></div><Icon name="scan" size={19} /></li>
              <li><span>03</span><div><strong>Kaydedip raporlayın</strong><small>Sonuç ve raporlar dosyada dursun.</small></div><Icon name="fileText" size={19} /></li>
            </ol>
          </section>
          <section className="board-tool-section">
            <div className="board-section-head">
              <div><span className="board-eyebrow">KISA YOLLAR</span><h2>Çalışma araçları</h2></div>
            </div>
            <div className="board-tool-grid">
              {SHORTCUTS.map((item) => (
                <button type="button" key={item.path} className="board-tool" onClick={() => navigate(item.path)}>
                  <span className="board-tool-icon"><Icon name={item.icon} size={20} /></span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                  <Icon name="arrowRight" size={16} className="board-tool-arrow" />
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="board-grid">
          <section className="board-schedule" aria-labelledby="prep-title">
            <div className="board-section-head">
              <div><span className="board-eyebrow">GÜN AKIŞI</span><h2 id="prep-title">Son kayıtlar</h2></div>
              <button type="button" className="board-text-link" onClick={() => navigate('/kayitlar')}>Kayıtlarım <Icon name="arrowRight" size={16} /></button>
            </div>
            {recent.length === 0 ? (
              <div className="board-empty">
                <span className="board-empty-icon"><Icon name="file" size={25} /></span>
                {loadError ? (
                  <>
                    <h3>Kayıtlar yüklenemedi.</h3>
                    <p>Bağlantınızı kontrol edip yeniden deneyin. Kayıtlarınız bulutta korunur.</p>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => window.location.reload()}>Yeniden dene <Icon name="refresh" size={15} /></button>
                  </>
                ) : (
                  <>
                    <h3>Henüz kayıt yok.</h3>
                    <p>İlk testinizi işlem akışında tamamlayın. Kaydedilen testler burada listelenecek.</p>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/islem')}>İşleme git <Icon name="arrowRight" size={15} /></button>
                  </>
                )}
              </div>
            ) : (
              <div className="prep-list">
                {recent.map((record) => (
                  <article key={record.id} className="prep-card">
                    <div className="prep-time"><strong>{formatTime(record.createdAt)}</strong><span>{formatDate(record.createdAt)}</span></div>
                    <div className="prep-body">
                      <div className="prep-title">
                        <h3>{clientName(record.firstName, record.lastName, 'İsimsiz kayıt')}</h3>
                      </div>
                      {recordMeta(record) !== '' && <p className="prep-meta">{recordMeta(record)}</p>}
                      <div className="prep-actions">
                        <button type="button" className="btn-primary btn-sm" onClick={() => navigate(`/kayitlar/${record.id}`)}>Kaydı aç</button>
                        <button type="button" className="btn-secondary btn-sm" onClick={() => navigate(`/kayitlar/${record.id}/raporlar`)}>Raporlar</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <aside className="board-side" aria-label="Takip ve kısayollar">
            {outbox.length > 0 ? (
              <section className="attention-panel">
                <div className="attention-head"><span><Icon name="alert" size={18} /></span><div><small>EŞİTLEME BEKLİYOR</small><h2>Gönderilmeyi bekleyenler</h2></div></div>
                <ul>
                  {outbox.slice(0, 4).map((entry) => (
                    <li key={entry.idempotencyKey}>
                      <button type="button" onClick={() => navigate('/islem')}>
                        <strong>{clientName(entry.client.firstName, entry.client.lastName, 'İsimsiz kayıt')}</strong>
                        <span>{methodLabel(entry.method)}</span>
                        <small>Kuyruğa eklenme {formatDate(entry.createdAt)} · {entry.attempts} deneme</small>
                        <Icon name="arrowRight" size={15} />
                      </button>
                    </li>
                  ))}
                  {outbox.length > 4 && (
                    <li><span className="score-empty">+{outbox.length - 4} kayıt daha İşlem ekranında.</span></li>
                  )}
                </ul>
              </section>
            ) : (
              <section className="board-clear">
                <span className="board-clear-icon"><Icon name="checkCircle" size={21} /></span>
                <span className="board-eyebrow">TAKİP DURUMU</span>
                <h2>Şu an uyarı yok.</h2>
                <p>Çevrimdışı kuyruk boş; bekleyen bir kayıt olursa burada görünür.</p>
              </section>
            )}
            <section className="board-shortcuts">
              <span className="board-eyebrow">HIZLI ERİŞİM</span>
              <h2>Çalışma araçları</h2>
              {SHORTCUTS.map((item) => (
                <button type="button" key={item.path} onClick={() => navigate(item.path)}>
                  <Icon name={item.icon} size={18} /> <span>{item.title}</span> <Icon name="arrowRight" size={15} />
                </button>
              ))}
            </section>
          </aside>
        </div>
      )}

      <div className="day-board-note">
        <Icon name="info" size={17} />
        <span>Puanlar ham veridir; yorum ve karar uzmana aittir.</span>
        <button type="button" onClick={() => navigate('/form')}><Icon name="sheet" size={15} /> Form setini aç</button>
      </div>
    </div>
  );
}
