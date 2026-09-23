import { useEffect, useState } from 'react';
import { listOwnRecordsPaged } from '../records/supabaseRecords';
import { loadDraft, loadOutbox, isDraftNonEmpty } from '../workspace/draftStorage';
import type { AuthenticatedUser } from '../auth/authTypes';
import { todayIsoDate } from '../workspace/caseTypes';
import { Icon } from './Icon';
import { navigate } from '../router';
import '../styles/dashboard.css';

type Props = { user: AuthenticatedUser };

export function Dashboard({ user }: Props) {
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [draftExists, setDraftExists] = useState(false);
  const [outboxCount, setOutboxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const today = todayIsoDate();
      try {
        const res = await listOwnRecordsPaged({ dateFrom: today, dateTo: today, page: 0, pageSize: 1 });
        if (!cancelled) setTodayCount(res.count ?? res.records.length);
      } catch {
        if (!cancelled) setTodayCount(null);
      }
      // Draft / outbox localStorage — synchronous
      try {
        const draft = loadDraft(user.id);
        if (!cancelled) setDraftExists(!!draft && isDraftNonEmpty(draft));
      } catch {
        if (!cancelled) setDraftExists(false);
      }
      try {
        const outbox = loadOutbox(user.id);
        if (!cancelled) setOutboxCount(outbox.length);
      } catch {
        if (!cancelled) setOutboxCount(0);
      }
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [user.id]);

  if (loading) {
    return (
      <div className="dashboard-grid dashboard-container">
        <div className="loading-state-card dashboard-loading"><div className="spinner" /></div>
      </div>
    );
  }

  const cards: { icon: 'trend' | 'file' | 'alert'; label: string; value: string; hint: string; action?: () => void }[] = [
    {
      icon: 'trend',
      label: 'Bugün',
      value: todayCount != null ? `${todayCount} kayıt` : '—',
      hint: 'Uygulama tarihi bugün olan kayıtlar',
    },
    {
      icon: 'file',
      label: 'Taslak',
      value: draftExists ? 'Devam ediyor' : 'Yok',
      hint: draftExists ? 'İşlem sekmesinde kaldığı yerden devam eder' : 'İşlem sekmesinden yeni test başlatın',
      action: draftExists ? () => navigate('/islem') : undefined,
    },
    {
      icon: 'alert',
      label: 'OMR / kuyruk',
      value: outboxCount > 0 ? `${outboxCount} bekliyor` : 'Bekleyen yok',
      hint: outboxCount > 0 ? 'Çevrimdışı kuyruk — bağlantı gelince otomatik yollanır' : 'Taranacak/paylaşıma hazır bekleyen OMR yok',
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {cards.map(card => (
          <div key={card.label} className="modern-table-card dashboard-card">
            <div className="dashboard-card-head">
              <Icon name={card.icon} size={16} />
              <span className="text-muted-sm dashboard-card-label">{card.label}</span>
            </div>
            <strong className="dashboard-card-value">{card.value}</strong>
            <span className="text-muted-sm dashboard-card-hint">{card.hint}</span>
            {card.action && (
              <button type="button" className="btn-secondary btn-sm dashboard-card-action" onClick={card.action}>
                Devam et
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="dashboard-actions">
        <button type="button" className="btn-primary btn-sm" onClick={() => navigate('/islem')}>+ Yeni MMPI başlat</button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/kayitlar')}>Kayıtlara git</button>
      </div>
    </div>
  );
}
