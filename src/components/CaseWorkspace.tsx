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
  MMPI_AGE_MAX,
  MMPI_AGE_MESSAGE,
  MMPI_AGE_MIN,
  MMPI_BLANK_MESSAGE,
  MMPI_DURATION_REFERENCE,
  MMPI_EDUCATION_MESSAGE,
  MMPI_MAX_BLANK,
  RAW_SCORE_FIELDS,
  assessDuration,
  buildCaseMeta,
  buildQuickPayload,
  buildRawPayload,
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

const METHOD_CARDS: { id: EntryMethod; icon: 'file' | 'sheet' | 'camera'; title: string; desc: string }[] = [
  {
    id: 'quick',
    icon: 'file',
    title: 'Hızlı veri girişi',
    desc: 'Basılı formdaki cevaplar klavyeyle girilir: 1 Doğru · 2 Yanlış · 0 Boş.',
  },
  {
    id: 'raw',
    icon: 'sheet',
    title: 'Ham puan',
    desc: 'Geçerlik ve klinik ölçekler; Hs, Pd, Pt, Sc ve Ma K düzeltmesiz girilir.',
  },
  {
    id: 'omr',
    icon: 'camera',
    title: 'OMR / Kamera',
    desc: 'Basılı optik form: mevcut okuma hattıyla dosya veya kamera ile aktarılır.',
  },
];

type CaseWorkspaceProps = {
  definition: FormDefinition;
  actor: AuthenticatedUser;
  onSaved?: () => void;
};

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('tr-TR');
}

function formatDuration(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '—';
  return /dk|dakika/i.test(trimmed) ? trimmed : `${trimmed} dk`;
}

export function CaseWorkspace({ definition, actor, onSaved }: CaseWorkspaceProps) {
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
  const stepIndex = STEPS.findIndex(item => item.id === step);

  const omrReady = scan ? canCreateRecord(sortedPages(scan), definition) : false;
  const quickReady = countAnswers(answers).entered === ITEM_COUNT;
  const rawReady = rawScoresComplete(raw);
  const entryReady = method === 'quick' ? quickReady : method === 'raw' ? rawReady : method === 'omr' ? omrReady : false;
  const blankCount =
    method === 'quick'
      ? countAnswers(answers).blank
      : method === 'raw'
        ? typeof raw.blank === 'number'
          ? raw.blank
          : 0
        : scan
          ? summarizeResults(definition, sortedPages(scan)).blank
          : 0;
  const blankExceeded = blankCount > MMPI_MAX_BLANK;
  const hasPartialIntake =
    client.firstName.trim() !== '' ||
    client.lastName.trim() !== '' ||
    client.gender !== '' ||
    client.age > 0 ||
    client.testDuration.trim() !== '' ||
    client.occupation.trim() !== '' ||
    client.followUp !== '' ||
    client.education !== '' ||
    client.maritalStatus !== '' ||
    client.applicationReason.trim() !== '' ||
    client.clinicalContext.trim() !== '';

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

  function goBack() {
    if (step === 'intake') {
      setIntakeError('');
      setStep('home');
    } else if (step === 'method') {
      setIntakeError('');
      setStep('intake');
    } else if (step === 'entry') {
      setStep('method');
    } else if (step === 'review') {
      setStep('entry');
    }
  }

  /** Tamamlanmış adımlara geri dön; ileriye sıçrama yok (hazırlık koşulu adımın kendisidir). */
  function gotoStep(target: 'intake' | 'method' | 'entry') {
    if (target === 'intake' && (step === 'method' || step === 'entry' || step === 'review')) {
      setIntakeError('');
      setStep('intake');
    } else if (target === 'method' && (step === 'entry' || step === 'review')) {
      setStep('method');
    } else if (target === 'entry' && step === 'review' && method) {
      setStep('entry');
    }
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

  function selectMethod(next: EntryMethod) {
    if (method !== next) {
      setMethod(next);
      if (next !== 'omr') {
        // OMR oturumu bileşen içinde yaşar; yöntemi terk ederken kayıtsızlaştır ki
        // eski bir tarama "hazır" görünerek yeni yöntemle kaydedilmesin.
        setScan(null);
        setScanKey(key => key + 1);
      }
    }
    setStep('entry');
  }

  async function saveAndAnalyze() {
    if (saved || busy || !method) return;
    setSaveError('');
    if (blankExceeded) {
      setSaveError(MMPI_BLANK_MESSAGE);
      return;
    }
    if (actor.role !== 'PSYCHOLOG' || !actor.active) {
      setSaved({ id: 'local', createdAt: new Date().toISOString() });
      return;
    }
    setBusy(true);
    try {
      const input = recordInputFromIntake(client);
      const meta = buildCaseMeta(method, client);
      let record: MMPIRecord;
      if (method === 'omr') {
        if (!scan || !omrReady) throw new Error('Dört sayfa onaylanmadan kayıt tamamlanamaz.');
        record = await createRecord(input, sortedPages(scan), definition, actor, submissionKey.current, [meta]);
      } else if (method === 'quick') {
        record = await createDataRecord(input, actor, submissionKey.current, [meta, buildQuickPayload(answers)]);
      } else if (method === 'raw') {
        record = await createDataRecord(input, actor, submissionKey.current, [meta, buildRawPayload(raw)]);
      } else {
        throw new Error('Veri giriş yöntemi seçilmedi.');
      }
      setSaved(record);
      onSaved?.();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Kayıt yazılamadı.');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'home') {
    return (
      <section className="ws-home" aria-labelledby="ws-home-title">
        <span className="section-badge badge-primary">MMPI-566 · Uzman çalışma alanı</span>
        <h1 id="ws-home-title" className="ws-home-title">
          Yeni bir MMPI <em>işlemi</em> başlatın
        </h1>
        <p className="ws-home-sub">
          Danışan bilgisi, veri girişi ve kontrol tek akışta yürür. Optik okuma mevcut OMR
          hattını kullanır; klinik puanlama motoru bu sürümde bağlı değildir.
        </p>
        <div className="ws-actions">
          {hasPartialIntake ? (
            <>
              <button type="button" className="btn-primary" onClick={() => setStep('intake')}>
                İşleme devam et
                <Icon name="arrowRight" size={16} />
              </button>
              <button type="button" className="btn-secondary" onClick={startNew}>
                <Icon name="refresh" size={16} />
                Yeni işlem
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={startNew}>
              Yeni MMPI işlemi
              <Icon name="arrowRight" size={16} />
            </button>
          )}
        </div>
        <dl className="ws-facts">
          <div>
            <dt>Madde</dt>
            <dd>{ITEM_COUNT}</dd>
          </div>
          <div>
            <dt>Optik form</dt>
            <dd>4 sayfa A4</dd>
          </div>
          <div>
            <dt>Tipik süre</dt>
            <dd>60–120 dk</dd>
          </div>
          <div>
            <dt>Uygulama yaşı</dt>
            <dd>{MMPI_AGE_MIN}+</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <div className="ws-flow">
      <div className="ws-flowbar" aria-label="İşlem adımları">
        <button type="button" className="btn-secondary btn-sm" onClick={goBack}>
          <Icon name="left" size={14} />
          <span>{step === 'intake' ? 'Çalışma alanı' : 'Geri'}</span>
        </button>

        <ol className="ws-stepper">
          {STEPS.map((item, index) => {
            const state = index < stepIndex ? 'is-done' : index === stepIndex ? 'is-on' : '';
            const canJump = index < stepIndex;
            return (
              <li key={item.id} className={`ws-step ${state}`} aria-current={index === stepIndex ? 'step' : undefined}>
                {canJump ? (
                  <button type="button" onClick={() => gotoStep(item.id as 'intake' | 'method' | 'entry')}>
                    {index + 1}. {item.label}
                  </button>
                ) : (
                  <span>{index + 1}. {item.label}</span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="ws-flowbar-action">
          {step === 'intake' && (
            <button type="submit" form="intake-form" className="btn-primary btn-sm">
              Devam
            </button>
          )}
          {step === 'entry' && (
            <button type="button" className="btn-primary btn-sm" disabled={!entryReady} onClick={() => setStep('review')}>
              Kontrol
            </button>
          )}
          {step === 'review' && (
            <button type="button" className="btn-primary btn-sm" disabled={busy || !!saved || blankExceeded} onClick={() => void saveAndAnalyze()}>
              {busy ? 'Kaydediliyor…' : 'Analizi başlat'}
            </button>
          )}
        </div>
      </div>

      {step === 'intake' && (
        <IntakeForm
          client={client}
          error={intakeError}
          onChange={setClient}
          onSubmit={submitIntake}
        />
      )}

      {step === 'method' && (
        <section className="ws-panel" aria-labelledby="ws-method-title">
          <header className="ws-panel-head">
            <div>
              <span className="section-badge badge-primary">02 · Yöntem</span>
              <h2 id="ws-method-title" className="ws-panel-title">
                Veri giriş <em>yöntemi</em>
              </h2>
              <p className="ws-muted">
                Yöntemi her an değiştirebilirsiniz; danışan bilgisi ve girdiğiniz veriler korunur.
              </p>
            </div>
          </header>
          <p className="ws-client-chip">
            <Icon name="user" size={14} />
            <span>
              <strong>
                {client.firstName} {client.lastName}
              </strong>
              {' · '}
              {client.gender} · {client.age} yaş · {formatDate(client.testDate)}
            </span>
          </p>
          <div className="ws-methods" role="radiogroup" aria-label="Veri giriş yöntemi">
            {METHOD_CARDS.map(card => (
              <button
                key={card.id}
                type="button"
                role="radio"
                aria-checked={method === card.id}
                className={`ws-method ${method === card.id ? 'is-selected' : ''}`}
                onClick={() => selectMethod(card.id)}
              >
                <span className="ws-method-icon">
                  <Icon name={card.icon} size={18} />
                </span>
                <strong>{card.title}</strong>
                <span>{card.desc}</span>
                {method === card.id && <span className="ws-method-flag">Seçili</span>}
              </button>
            ))}
          </div>
          <div className="ws-nav">
            <button type="button" className="btn-secondary" onClick={() => setStep('intake')}>
              Geri
            </button>
            <button type="button" className="btn-primary" disabled={!method} onClick={() => setStep('entry')}>
              Devam
            </button>
          </div>
        </section>
      )}

      {step === 'entry' && method && (
        <>
          {method === 'quick' && (
            <QuickEntry answers={answers} current={currentItem} onCurrent={setCurrentItem} onAnswers={setAnswers} />
          )}
          {method === 'raw' && <RawScoreEntry scores={raw} onChange={setRaw} />}
        </>
      )}

      {/* OMR oturumu yöntem 'omr' olduğu sürece canlı kalır; böylece Geri → Kontrol
          arasında gidip gelince tarama yitirilmez. Başka yönteme geçilirse sıfırlanır. */}
      {method === 'omr' && (
        <div className={step === 'entry' ? undefined : 'is-screen-hidden'}>
          <ScannerWorkspace key={scanKey} definition={definition} actor={actor} embedded onScanChange={setScan} />
        </div>
      )}

      {/* Alt nav her adımda korunur (rapor §3.4); OMR modunda uzun içerikten
          sonra "Kontrol" eylemine en kısa yoldan erişim için OMR bloğunun altındadır. */}
      {step === 'entry' && method && (
        <div className="ws-nav">
          <button type="button" className="btn-secondary" onClick={() => setStep('method')}>
            Geri
          </button>
          <button type="button" className="btn-primary" disabled={!entryReady} onClick={() => setStep('review')}>
            Kontrol
          </button>
        </div>
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
          blankCount={blankCount}
          blankExceeded={blankExceeded}
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
}: {
  client: ClientIntake;
  error: string;
  onChange: (next: ClientIntake) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const id = useId();
  const set = <K extends keyof ClientIntake>(key: K, value: ClientIntake[K]) => onChange({ ...client, [key]: value });

  const ageOutOfRange = client.age > 0 && client.age < MMPI_AGE_MIN;
  const educationInvalid = client.education === 'İlkokul';
  const durationInfo = assessDuration(client.testDuration);
  const showDurationHint = client.testDuration.trim() !== '' || durationInfo.level !== 'empty';

  return (
    <form id="intake-form" className="ws-panel" noValidate onSubmit={onSubmit}>
      <header className="ws-panel-head">
        <div>
          <span className="section-badge badge-primary">01 · Danışan</span>
          <h2 className="ws-panel-title">
            Danışan / test <em>bilgileri</em>
          </h2>
          <p className="ws-muted">
            Cinsiyet, yaş, test tarihi ve ad soyad zorunludur. MMPI {MMPI_AGE_MIN} yaş ve
            üzerine, en az ortaokul düzeyine uygulanır.
          </p>
        </div>
      </header>

      <div className="ws-form">
        <div className="ws-section-label" role="group" aria-label="Danışan bilgileri">
          Danışan
        </div>
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
            min={MMPI_AGE_MIN}
            max={MMPI_AGE_MAX}
            value={client.age || ''}
            onChange={e => set('age', Number(e.target.value) || 0)}
          />
          {ageOutOfRange && <small className="ws-hint is-error">{MMPI_AGE_MESSAGE}</small>}
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-edu`}>Eğitim</label>
          <select
            id={`${id}-edu`}
            value={client.education}
            onChange={e => set('education', e.target.value as EducationLevel | '')}
          >
            <option value="">—</option>
            {EDUCATION_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {educationInvalid && <small className="ws-hint is-error">{MMPI_EDUCATION_MESSAGE}</small>}
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-marital`}>Medeni durum</label>
          <select
            id={`${id}-marital`}
            value={client.maritalStatus}
            onChange={e => set('maritalStatus', e.target.value as MaritalStatus | '')}
          >
            <option value="">—</option>
            {MARITAL_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group span-2">
          <label htmlFor={`${id}-job`}>Meslek</label>
          <input id={`${id}-job`} value={client.occupation} onChange={e => set('occupation', e.target.value)} autoComplete="off" />
        </div>

        <div className="ws-section-label" role="group" aria-label="Test bilgileri">
          Test
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-date`}>Test tarihi *</label>
          <input id={`${id}-date`} required type="date" value={client.testDate} onChange={e => set('testDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-duration`}>Test süresi</label>
          <div className="ws-duration">
            <input
              id={`${id}-duration`}
              type="number"
              min={1}
              max={600}
              inputMode="numeric"
              value={client.testDuration}
              onChange={e => set('testDuration', e.target.value)}
              placeholder="75"
            />
            <span className="ws-duration-suffix">dk</span>
          </div>
          {showDurationHint && durationInfo.level === 'invalid' && <small className="ws-hint is-error">{durationInfo.message}</small>}
          {showDurationHint && durationInfo.level === 'very-short' && <small className="ws-hint is-error">{durationInfo.message}</small>}
          {showDurationHint && durationInfo.level === 'short' && <small className="ws-hint is-warn">{durationInfo.message}</small>}
          {showDurationHint && durationInfo.level === 'long' && <small className="ws-hint is-warn">{durationInfo.message}</small>}
          {showDurationHint && durationInfo.level === 'ok' && <small className="ws-hint">{MMPI_DURATION_REFERENCE}</small>}
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
        <span />
        <button type="submit" className="btn-primary">
          Devam
        </button>
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
  blankCount,
  blankExceeded,
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
  blankCount: number;
  blankExceeded: boolean;
  onBack: () => void;
  onSave: () => void;
  onNew: () => void;
}) {
  const counts = countAnswers(answers);
  const omrSummary = scan ? summarizeResults(definition, sortedPages(scan)) : null;
  const durationInfo = assessDuration(client.testDuration);

  return (
    <section className="ws-review">
      <header className="ws-panel-head">
        <div>
          <span className="section-badge badge-primary">04 · Kontrol</span>
          <h2 className="ws-panel-title">
            Verileri <em>gözden geçirin</em>
          </h2>
          <p className="ws-muted">
            Kayıt veritabanına bu ekrandan yazılır. Klinik puanlama motoru bu sürümde bağlı değildir.
          </p>
        </div>
      </header>

      {blankExceeded && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={16} />
          <span>{MMPI_BLANK_MESSAGE} (Boş: {blankCount})</span>
        </div>
      )}

      {(durationInfo.level === 'very-short' || durationInfo.level === 'short' || durationInfo.level === 'long') && (
        <div
          className={`status-banner ${durationInfo.level === 'very-short' ? 'error-banner' : 'warning-banner'}`}
          role="alert"
        >
          <Icon name="alert" size={16} />
          <span>{durationInfo.message}</span>
        </div>
      )}

      <p className="ws-conditions-note">
        Uygulama koşulları: danışan akut psikotik durumda değil, madde/sedatif etkisi altında
        değil, testi tek başına ve yönlendirme olmaksızın doldurmuştur; uygulamayı yetkin bir
        uzman yürütmüştür.
      </p>

      <dl className="ws-dl">
        <div>
          <dt>Danışan</dt>
          <dd>
            {client.firstName} {client.lastName}
          </dd>
        </div>
        <div>
          <dt>Cinsiyet</dt>
          <dd>{client.gender}</dd>
        </div>
        <div>
          <dt>Yaş</dt>
          <dd>{client.age}</dd>
        </div>
        <div>
          <dt>Test tarihi</dt>
          <dd>{formatDate(client.testDate)}</dd>
        </div>
        <div>
          <dt>Süre</dt>
          <dd>{client.testDuration.trim() ? formatDuration(client.testDuration) : '—'}</dd>
        </div>
        {client.occupation && (
          <div>
            <dt>Meslek</dt>
            <dd>{client.occupation}</dd>
          </div>
        )}
        {client.followUp && (
          <div>
            <dt>İzlem</dt>
            <dd>{client.followUp}</dd>
          </div>
        )}
        {client.education && (
          <div>
            <dt>Eğitim</dt>
            <dd>{client.education}</dd>
          </div>
        )}
        {client.maritalStatus && (
          <div>
            <dt>Medeni durum</dt>
            <dd>{client.maritalStatus}</dd>
          </div>
        )}
        <div>
          <dt>Yöntem</dt>
          <dd>{methodLabel(method)}</dd>
        </div>
        <div>
          <dt>Uzman</dt>
          <dd>
            {actor.firstName} {actor.lastName}
          </dd>
        </div>
      </dl>

      {method === 'quick' && (
        <dl className="ws-dl">
          <div>
            <dt>Girilen</dt>
            <dd>
              {counts.entered} / {ITEM_COUNT}
            </dd>
          </div>
          <div>
            <dt>Doğru</dt>
            <dd>{counts.correct}</dd>
          </div>
          <div>
            <dt>Yanlış</dt>
            <dd>{counts.wrong}</dd>
          </div>
          <div>
            <dt>Boş</dt>
            <dd>{counts.blank}</dd>
          </div>
        </dl>
      )}

      {method === 'raw' && (
        <dl className="ws-dl">
          {RAW_SCORE_FIELDS.map(field => (
            <div key={field.key}>
              <dt>
                {field.label}
                {field.kRaw ? ' (K’sız)' : ''}
              </dt>
              <dd>{raw[field.key] === '' ? '—' : raw[field.key]}</dd>
            </div>
          ))}
        </dl>
      )}

      {method === 'omr' && omrSummary && (
        <dl className="ws-dl">
          <div>
            <dt>Sayfa</dt>
            <dd>
              {omrSummary.acceptedPages} / {omrSummary.expectedPages}
            </dd>
          </div>
          <div>
            <dt>Okunan</dt>
            <dd>
              {omrSummary.readItems} / {omrSummary.expectedItems}
            </dd>
          </div>
          <div>
            <dt>Güvenilir</dt>
            <dd>{omrSummary.reliableAnswers}</dd>
          </div>
          <div>
            <dt>İnceleme</dt>
            <dd>{omrSummary.ambiguous + omrSummary.multiple}</dd>
          </div>
          <div>
            <dt>Boş</dt>
            <dd>{omrSummary.blank}</dd>
          </div>
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
          {saved.id === 'local'
            ? 'Veriler bu oturumda analize hazır. Kayıt yalnızca aktif psikolog hesabıyla veritabanına yazılır.'
            : <>
                Veriler kaydedildi. Kayıt: <strong>{saved.id}</strong>. Klinik puanlama bu sürümde bağlı değil.
              </>}
        </div>
      ) : null}

      <div className="ws-nav">
        {saved ? (
          <button type="button" className="btn-primary" onClick={onNew}>
            Yeni işlem
          </button>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onBack}>
              Geri
            </button>
            <button type="button" className="btn-primary" disabled={busy || blankExceeded} onClick={onSave}>
              {busy ? 'Kaydediliyor…' : 'Analizi başlat'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
