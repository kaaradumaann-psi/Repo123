import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { FormDefinition } from '../omr/omrTypes';
import type { AuthenticatedUser } from '../auth/authTypes';
import { canCreateRecord, createRecord } from '../records/supabaseRecords';
import type { Gender, MMPIRecord } from '../records/supabaseRecords';
import type { ScanSet } from '../scanner/pageSequence';
import { sortedPages } from '../scanner/pageSequence';

const today = () => new Date().toISOString().slice(0, 10);

type RecordCaptureProps = { definition: FormDefinition; scan: ScanSet; actor: AuthenticatedUser; onSaved?: () => void };

export function RecordCapture({ definition, scan, actor, onSaved }: RecordCaptureProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [applicationDate, setApplicationDate] = useState(today);
  const [requestedBy, setRequestedBy] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<MMPIRecord | null>(null);
  const saving = useRef(false);
  const submissionKey = useRef(crypto.randomUUID());
  const pages = sortedPages(scan);
  const ready = actor.role === 'PSYCHOLOG' && actor.active && canCreateRecord(pages, definition);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || !ready) return;
    if (!gender) { setError('Cinsiyet seçin.'); return; }
    setError(''); saving.current = true; setBusy(true);
    try {
      const record = await createRecord({ client: { firstName, lastName, gender, age: Number(age), occupation, education, applicationDate, requestedBy } }, pages, definition, actor, submissionKey.current);
      setSaved(record);
      onSaved?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Kayıt oluşturulamadı.'); }
    finally { saving.current = false; setBusy(false); }
  }

  if (actor.role !== 'PSYCHOLOG') return null;
  if (!ready) return <section className="record-card record-card-locked" aria-labelledby="record-title"><div><p className="auth-eyebrow">Tarama sonrası kayıt</p><h3 id="record-title">Kayıt için dört sayfayı tamamlayın</h3><p>Danışan bilgileri, form setinin dört sayfası kabul edilmiş ve taranmış cevaplar mevcut olduğunda açılır. Eksik sayfalar mevcut set bilgisinde gösteriliyor.</p></div></section>;
  if (saved) return <section className="record-card record-success" aria-labelledby="record-success-title"><span className="record-success-icon" aria-hidden="true">✓</span><div><p className="auth-eyebrow">Kayıt tamamlandı</p><h3 id="record-success-title">Danışan ve ham cevaplar Supabase'e kaydedildi</h3><p>Kayıt ID'si: <strong className="record-id">{saved.id}</strong></p><p className="record-note">Bu sürüm klinik puanlama veya yorumlama yapmaz. Yeni kayıt için “Yeni set / sıfırla” ile yeni bir tarama oturumu başlatın.</p></div></section>;

  return <section className="record-card" aria-labelledby="record-title"><div className="record-heading"><div><p className="auth-eyebrow">Tarama sonrası kayıt</p><h3 id="record-title">Danışan bilgilerini tamamlayın</h3><p>Form seti hazır. Ham OMR cevapları değiştirilmeden Supabase'e gönderilecek.</p></div><span className="record-ready">{pages.length} / {definition.totalPages} sayfa hazır</span></div>
    <form className="record-form" onSubmit={submit}>
      <div className="record-form-grid"><label>Ad<input required value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="off" /></label>
        <label>Soyad<input required value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="off" /></label>
        <label>Cinsiyet<select required value={gender} onChange={event => setGender(event.target.value as Gender | '')}><option value="">Seçin</option><option>Kadın</option><option>Erkek</option><option>Belirtmek istemiyor</option><option>Diğer</option></select></label>
        <label>Yaş<input required type="number" min="0" max="120" step="1" value={age} onChange={event => setAge(event.target.value)} inputMode="numeric" /></label>
        <label>Meslek<input required value={occupation} onChange={event => setOccupation(event.target.value)} autoComplete="off" /></label>
        <label>Eğitim durumu<input required value={education} onChange={event => setEducation(event.target.value)} autoComplete="off" /></label>
        <label>Uygulanma tarihi<input required type="date" value={applicationDate} onChange={event => setApplicationDate(event.target.value)} /></label>
        <label>İstekte bulunan<input required value={requestedBy} onChange={event => setRequestedBy(event.target.value)} autoComplete="off" /></label>
      </div>
      {error && <p className="record-error" role="alert">{error}</p>}
      <div className="record-submit-row"><p>Kaydı oluşturan: <strong>{actor.firstName} {actor.lastName}</strong>. Cevap formatı ve özgün ölçümler korunur.</p><button className="record-submit" type="submit" disabled={busy}>{busy ? 'Supabase’e kaydediliyor…' : 'Cevapları ve bilgileri kaydet'}</button></div>
    </form>
  </section>;
}
