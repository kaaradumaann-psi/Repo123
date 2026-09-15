import { useEffect, useState } from 'react';
import { listOwnRecords } from '../records/supabaseRecords';
import type { RecordSummary } from '../records/supabaseRecords';

export function MyRecordsPanel() {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    void listOwnRecords().then(result => {
      if (alive) setRecords(result);
    }).catch(cause => {
      if (alive) setError(cause instanceof Error ? cause.message : 'Kayıtlar alınamadı.');
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return <section className="record-card saved-records" aria-labelledby="saved-records-title">
    <div className="record-heading"><div><p className="auth-eyebrow">Supabase kayıtları</p><h3 id="saved-records-title">Kayıtlarım</h3><p>Yalnızca bu psikolog hesabının oluşturduğu kayıtlar gösterilir.</p></div><span className="record-ready">Son 100 kayıt</span></div>
    {loading && <p className="admin-empty">Kayıtlar yükleniyor…</p>}
    {error && <p className="record-error" role="alert">{error}</p>}
    {!loading && !error && !records.length && <p className="admin-empty">Henüz kayıt oluşturulmadı.</p>}
    {!loading && !error && records.length > 0 && <div className="saved-records-table-wrap"><table className="saved-records-table"><thead><tr><th>Kayıt ID</th><th>Danışan</th><th>Uygulanma</th><th>Kayıt tarihi</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td><code>{record.id}</code></td><td>{record.firstName} {record.lastName}</td><td>{record.applicationDate}</td><td>{new Date(record.createdAt).toLocaleString('tr-TR')}</td></tr>)}</tbody></table></div>}
  </section>;
}
