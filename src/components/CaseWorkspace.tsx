import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { FormDefinition } from '../omr/omrTypes';
import type { AuthenticatedUser } from '../auth/authTypes';
import type { ScanSet } from '../scanner/pageSequence';
import { sortedPages } from '../scanner/pageSequence';
import { canCreateRecord, createDataRecord, createRecord } from '../records/supabaseRecords';
import type { MMPIRecord } from '../records/supabaseRecords';
import { summarizeResults } from '../results/resultNormalizer';
import { ScannerWorkspace } from './ScannerWorkspace';
import { QuickEntry } from './QuickEntry';
import { RawScoreEntry } from './RawScoreEntry';
import { Icon } from './Icon';
import {
  EDUCATION_OPTIONS,
  FOLLOW_UP_OPTIONS,
  ITEM_COUNT,
  MARITAL_OPTIONS,
  RAW_SCORE_FIELDS,
  clientContextPayload,
  countAnswers,
  emptyAnswers,
  emptyClientIntake,
  emptyRawScores,
  methodLabel,
  rawScoresComplete,
  recordInputFromIntake,
  validateIntake,
} from '../workspace/caseTypes';
import type {
  CaseStep,
  ClientIntake,
  EducationLevel,
  EntryMethod,
  FollowUpStatus,
  IntakeGender,
  ItemAnswer,
  MaritalStatus,
  RawScores,
} from '../workspace/caseTypes';

const STEPS: { id: Exclude<CaseStep, 'home'>; label: string }[] = [
  { id: 'intake', label: 'Danışan' },
  { id: 'method', label: 'Yöntem' },
  { id: 'entry', label: 'Veri' },
  { id: 'review', label: 'Kontrol' },
];

type CaseWorkspaceProps = {
  definition: FormDefinition;
  actor: AuthenticatedUser;
};

export function CaseWorkspace({ definition, actor }: CaseWorkspaceProps) {
  const [step, setStep] = useState<CaseStep>('home');
  const [client, setClient] = useState<ClientIntake>(emptyClientIntake);
  const [method, setMethod] = useState<EntryMethod | null>(null);
  const [answers, setAnswers] = useState<ItemAnswer[]>(emptyAnswers);
  const [currentItem, setCurrentItem] = useState(0);
  const [raw, setRaw] = useState<RawScores>(emptyRawScores);
  const [scan, setScan] = useState<ScanSet | null>(null);
  const [scanKey, setScanKey] = useState(0);
  const [intakeError, setIntakeError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState<MMPIRecord | null>(null);
  const submissionKey = useRef(crypto.randomUUID());

  function startNew() {
    setClient(emptyClientIntake());
    setMethod(null);
    setAnswers(emptyAnswers());
    setCurrentItem(0);
    setRaw(emptyRawScores());
    setScan(null);
    setScanKey(key => key + 1);
    setIntakeError('');
    setSaveError('');
    setSaved(null);
    submissionKey.current = crypto.randomUUID();
    setStep('intake');
  }

  function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateIntake(client);
    if (message) {
      setIntakeError(message);
      return;
    }
    setIntakeError('');
    setStep('method');
  }

  const omrReady = scan ? canCreateRecord(sortedPages(scan), definition) : false;
  const quickReady = countAnswers(answers).entered === ITEM_COUNT;
  const rawReady = rawScoresComplete(raw);
  const entryReady = method === 'quick' ? quickReady : method === 'raw' ? rawReady : omrReady;

  async function saveAndAnalyze() {
    if (saved || busy) return;
    setSaveError('');
    if (actor.role !== 'PSYCHOLOG' || !actor.active) {
      setSaveError('Kayıt yalnızca aktif psikolog hesabıyla yazılır. Veriler bu oturumda analize hazır.');
      setSaved({ id: 'local', createdAt: new Date().toISOString() });
      return;
    }
    setBusy(true);
    try {
      const input = recordInputFromIntake(client);
      const extras: unknown[] = [clientContextPayload(client)];
      let record: MMPIRecord;
      if (method === 'omr') {
        if (!scan || !omrReady) throw new Error('Dört sayfa onaylanmadan kayıt tamamlanamaz.');
        extras.push({ kind: 'entry-method', method: 'omr' });
        record = await createRecord(input, sortedPages(scan), definition, actor, submissionKey.current, extras);
      } else if (method === 'quick') {
        extras.push({ kind: 'quick-entry', answers: answers.map(answer => (answer === undefined ? null : answer)) });
        record = await createDataRecord(input, actor, submissionKey.current, extras);
      } else if (method === 'raw') {
        extras.push({ kind: 'raw-scores', scales: raw });
        record = await createDataRecord(input, actor, submissionKey.current, extras);
      } else {
        throw new Error('Veri giriş yöntemi seçilmedi.');
      }
      setSaved(record);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Kayıt yazılamadı.');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'home') {
    return (
      <div className="ws-home">
        <h1>Çalışma alanı</h1>
        <p className="ws-muted">Yeni bir MMPI işlemi başlatın. Veri girişi, optik okuma ve kayıt bu oturumda yürür.</p>
        <div className="ws-actions">
          <button type="button" className="btn-primary" onClick={startNew}>
            Yeni MMPI işlemi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-flow">
      <ol className="ws-stepper">
        {STEPS.map((item, index) => {
          const currentIndex = STEPS.findIndex(stepItem => stepItem.id === step);
          const state = index < currentIndex ? 'is-done' : index === currentIndex ? 'is-on' : '';
          return (
            <li key={item.id} className={`ws-step ${state}`}>
              {index + 1}. {item.label}
            </li>
          );
        })}
      </ol>

      {step === 'intake' && (
        <IntakeForm
          client={client}
          error={intakeError}
          onChange={setClient}
          onSubmit={submitIntake}
          onCancel={() => setStep('home')}
        />
      )}

      {step === 'method' && (
        <section className="ws-panel">
          <header className="ws-panel-head">
            <div>
              <h2>Veri giriş yöntemi</h2>
              <p className="ws-muted">{client.lastName}, {client.firstName} · {client.gender} · {client.age}</p>
            </div>
          </header>
          <div className="ws-methods">
            <button type="button" className="ws-method" onClick={() => { setMethod('quick'); setStep('entry'); }}>
              <Icon name="file" size={18} />
              <strong>Hızlı veri girişi</strong>
              <span>Basılı cevaplar. 1 / 2 / 0.</span>
            </button>
            <button type="button" className="ws-method" onClick={() => { setMethod('raw'); setStep('entry'); }}>
              <Icon name="sheet" size={18} />
              <strong>Ham puan</strong>
              <span>Geçerlik ve klinik ölçekler, K’sız.</span>
            </button>
            <button type="button" className="ws-method" onClick={() => { setMethod('omr'); setStep('entry'); }}>
              <Icon name="camera" size={18} />
              <strong>OMR / Kamera</strong>
              <span>Mevcut optik okuma hattı.</span>
            </button>
          </div>
          <div className="ws-nav">
            <button type="button" className="btn-secondary" onClick={() => setStep('intake')}>Geri</button>
          </div>
        </section>
      )}

      {step === 'entry' && method && (
        <>
          {method === 'quick' && (
            <QuickEntry answers={answers} current={currentItem} onCurrent={setCurrentItem} onAnswers={setAnswers} />
          )}
          {method === 'raw' && <RawScoreEntry scores={raw} onChange={setRaw} />}
          {method === 'omr' && (
            <ScannerWorkspace
              key={scanKey}
              definition={definition}
              actor={actor}
              embedded
              onScanChange={setScan}
            />
          )}
          <div className="ws-nav">
            <button type="button" className="btn-secondary" onClick={() => setStep('method')}>Geri</button>
            <button type="button" className="btn-primary" disabled={!entryReady} onClick={() => setStep('review')}>
              Kontrol
            </button>
          </div>
        </>
      )}

      {step === 'review' && method && (
        <ReviewPanel
          actor={actor}
          client={client}
          method={method}
          answers={answers}
          raw={raw}
          scan={scan}
          definition={definition}
          busy={busy}
          saved={saved}
          error={saveError}
          onBack={() => setStep('entry')}
          onSave={() => void saveAndAnalyze()}
          onNew={startNew}
        />
      )}
    </div>
  );
}

function IntakeForm({
  client,
  error,
  onChange,
  onSubmit,
  onCancel,
}: {
  client: ClientIntake;
  error: string;
  onChange: (next: ClientIntake) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const set = <K extends keyof ClientIntake>(key: K, value: ClientIntake[K]) => onChange({ ...client, [key]: value });

  return (
    <form className="ws-panel" onSubmit={onSubmit}>
      <header className="ws-panel-head">
        <div>
          <h2>Danışan / test</h2>
          <p className="ws-muted">Zorunlu alanlar cinsiyet, yaş ve test tarihi. Arşiv için ad soyad da gerekir.</p>
        </div>
      </header>

      <div className="ws-form">
        <div className="form-group">
          <label htmlFor={`${id}-first`}>Ad *</label>
          <input id={`${id}-first`} required value={client.firstName} onChange={e => set('firstName', e.target.value)} autoComplete="off" />
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-last`}>Soyad *</label>
          <input id={`${id}-last`} required value={client.lastName} onChange={e => set('lastName', e.target.value)} autoComplete="off" />
        </div>
        <div className="form-group">
          <span>Cinsiyet *</span>
          <div className="ws-choice-row">
            {(['Erkek', 'Kadın'] as IntakeGender[]).map(option => (
              <label key={option}>
                <input
                  type="radio"
                  name={`${id}-gender`}
                  checked={client.gender === option}
                  onChange={() => set('gender', option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-age`}>Yaş *</label>
          <input
            id={`${id}-age`}
            required
            type="number"
            min={1}
            max={120}
            value={client.age || ''}
            onChange={e => set('age', Number(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-date`}>Test tarihi *</label>
          <input id={`${id}-date`} required type="date" value={client.testDate} onChange={e => set('testDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-duration`}>Test süresi</label>
          <input id={`${id}-duration`} value={client.testDuration} onChange={e => set('testDuration', e.target.value)} placeholder="dk" />
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-job`}>Meslek</label>
          <input id={`${id}-job`} value={client.occupation} onChange={e => set('occupation', e.target.value)} autoComplete="off" />
        </div>
        <div className="form-group">
          <span>İzlem</span>
          <div className="ws-choice-row">
            {FOLLOW_UP_OPTIONS.map(option => (
              <label key={option}>
                <input
                  type="radio"
                  name={`${id}-follow`}
                  checked={client.followUp === option}
                  onChange={() => set('followUp', option as FollowUpStatus)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-edu`}>Eğitim</label>
          <select
            id={`${id}-edu`}
            value={client.education}
            onChange={e => set('education', e.target.value as EducationLevel | '')}
          >
            <option value="">—</option>
            {EDUCATION_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-marital`}>Medeni durum</label>
          <select
            id={`${id}-marital`}
            value={client.maritalStatus}
            onChange={e => set('maritalStatus', e.target.value as MaritalStatus | '')}
          >
            <option value="">—</option>
            {MARITAL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="form-group span-2">
          <label htmlFor={`${id}-reason`}>Başvuru nedeni</label>
          <input id={`${id}-reason`} value={client.applicationReason} onChange={e => set('applicationReason', e.target.value)} />
        </div>
        <div className="form-group span-2">
          <label htmlFor={`${id}-ctx`}>Kısa öykü / klinik bağlam</label>
          <textarea id={`${id}-ctx`} value={client.clinicalContext} onChange={e => set('clinicalContext', e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="ws-nav">
        <button type="button" className="btn-secondary" onClick={onCancel}>İptal</button>
        <button type="submit" className="btn-primary">Devam</button>
      </div>
    </form>
  );
}

function ReviewPanel({
  actor,
  client,
  method,
  answers,
  raw,
  scan,
  definition,
  busy,
  saved,
  error,
  onBack,
  onSave,
  onNew,
}: {
  actor: AuthenticatedUser;
  client: ClientIntake;
  method: EntryMethod;
  answers: ItemAnswer[];
  raw: RawScores;
  scan: ScanSet | null;
  definition: FormDefinition;
  busy: boolean;
  saved: MMPIRecord | null;
  error: string;
  onBack: () => void;
  onSave: () => void;
  onNew: () => void;
}) {
  const counts = countAnswers(answers);
  const omrSummary = scan ? summarizeResults(definition, sortedPages(scan)) : null;

  return (
    <section className="ws-review">
      <header className="ws-panel-head">
        <div>
          <h2>Kontrol</h2>
          <p className="ws-muted">Veriler analize hazırlanmadan önce gözden geçirilir. Klinik puanlama motoru bu sürümde bağlı değildir.</p>
        </div>
      </header>

      <dl className="ws-dl">
        <div><dt>Danışan</dt><dd>{client.firstName} {client.lastName}</dd></div>
        <div><dt>Cinsiyet</dt><dd>{client.gender}</dd></div>
        <div><dt>Yaş</dt><dd>{client.age}</dd></div>
        <div><dt>Test tarihi</dt><dd>{client.testDate}</dd></div>
        {client.testDuration ? <div><dt>Süre</dt><dd>{client.testDuration}</dd></div> : null}
        {client.occupation ? <div><dt>Meslek</dt><dd>{client.occupation}</dd></div> : null}
        {client.followUp ? <div><dt>İzlem</dt><dd>{client.followUp}</dd></div> : null}
        {client.education ? <div><dt>Eğitim</dt><dd>{client.education}</dd></div> : null}
        {client.maritalStatus ? <div><dt>Medeni durum</dt><dd>{client.maritalStatus}</dd></div> : null}
        <div><dt>Yöntem</dt><dd>{methodLabel(method)}</dd></div>
        <div><dt>Uzman</dt><dd>{actor.firstName} {actor.lastName}</dd></div>
      </dl>

      {method === 'quick' && (
        <dl className="ws-dl">
          <div><dt>Girilen</dt><dd>{counts.entered} / {ITEM_COUNT}</dd></div>
          <div><dt>Doğru</dt><dd>{counts.correct}</dd></div>
          <div><dt>Yanlış</dt><dd>{counts.wrong}</dd></div>
          <div><dt>Boş</dt><dd>{counts.blank}</dd></div>
        </dl>
      )}

      {method === 'raw' && (
        <dl className="ws-dl">
          {RAW_SCORE_FIELDS.map(field => (
            <div key={field.key}>
              <dt>{field.label}{field.kRaw ? ' (K’sız)' : ''}</dt>
              <dd>{raw[field.key] === '' ? '—' : raw[field.key]}</dd>
            </div>
          ))}
        </dl>
      )}

      {method === 'omr' && omrSummary && (
        <dl className="ws-dl">
          <div><dt>Sayfa</dt><dd>{omrSummary.acceptedPages} / {omrSummary.expectedPages}</dd></div>
          <div><dt>Okunan</dt><dd>{omrSummary.readItems} / {omrSummary.expectedItems}</dd></div>
          <div><dt>Güvenilir</dt><dd>{omrSummary.reliableAnswers}</dd></div>
          <div><dt>İnceleme</dt><dd>{omrSummary.ambiguous + omrSummary.multiple}</dd></div>
          <div><dt>Boş</dt><dd>{omrSummary.blank}</dd></div>
        </dl>
      )}

      {error && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      )}

      {saved ? (
        <div className="ws-ready" role="status">
          Veriler analize hazır.
          {saved.id !== 'local' ? <> Kayıt: <strong>{saved.id}</strong>.</> : null}
          {' '}Klinik puanlama bu çalışma alanında henüz bağlı değil; ham veri korundu.
        </div>
      ) : null}

      <div className="ws-nav">
        {saved ? (
          <button type="button" className="btn-primary" onClick={onNew}>Yeni işlem</button>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onBack}>Geri</button>
            <button type="button" className="btn-primary" disabled={busy} onClick={onSave}>
              {busy ? 'Kaydediliyor…' : 'Analizi başlat'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
