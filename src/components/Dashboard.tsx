import { useEffect, useState } from 'react';
import { listOwnRecordsPaged } from '../records/supabaseRecords';
import { loadDraft, loadOutbox, isDraftNonEmpty } from '../workspace/draftStorage';
import type { AuthenticatedUser } from '../auth/authTypes';
import { todayIsoDate } from '../workspace/caseTypes';
import { Icon } from './Icon';
import { navigate } from '../router';

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
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="loading-state-card" style={{ padding: '0.75rem' }}><div className="spinner" /></div>
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
    <div style={{ marginBottom: '1rem' }}>
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {cards.map(card => (
          <div key={card.label} className="modern-table-card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name={card.icon} size={16} />
              <span className="text-muted-sm" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</span>
            </div>
            <strong style={{ fontSize: 18, lineHeight: 1 }}>{card.value}</strong>
            <span className="text-muted-sm" style={{ fontSize: 11 }}>{card.hint}</span>
            {card.action && (
              <button type="button" className="btn-secondary btn-sm" style={{ marginTop: '0.35rem', alignSelf: 'flex-start' }} onClick={card.action}>
                Devam et
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn-primary btn-sm" onClick={() => navigate('/islem')}>+ Yeni MMPI başlat</button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/kayitlar')}>Kayıtlara git</button>
      </div>
    </div>
  );
}
