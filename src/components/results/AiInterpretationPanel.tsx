import { useId, useRef, useState } from 'react';
import type { MMPIProfile } from '../../scoring/mmpiScoring';
import { supabaseConfig } from '../../auth/supabaseClient';
import {
  buildAiProfileSummary,
  requestAiInterpretation,
  type AiInterpretationResult,
} from '../../ai/aiInterpretation';
import { Icon } from '../Icon';

export type AiInterpretationPanelProps = {
  profile: MMPIProfile;
  method: 'quick' | 'raw' | 'omr';
  client: { firstName: string; lastName: string; age: number } | null;
  /** Kayıt detayında recordId verilir: Edge Function kayıt sahipliğini doğrular. */
  recordId?: string;
  /** Verildiğinde sonuç, uzman notu taslağına eklenebilir. */
  onInsertIntoNotes?: (text: string) => void;
};

/**
 * Sonuçların yapay zekâ destekli yorumu — "analiz sayfası"nın karar destek katmanı.
 * Yorum; tanı koyar, tedavi önerir ya da klinik karar verir gibi sunulmaz: her
 * çıktının altında kalıcı bir sınır bildirimi vardır ve metin yalnızca bu
 * sayfada üretilen sayısal profil özetinden türetilir.
 */
export function AiInterpretationPanel({ profile, method, client, recordId, onInsertIntoNotes }: AiInterpretationPanelProps) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiInterpretationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  // Sonuç üretilmişken düğme "Yeniden Oluştur" davranır ve ağa zorla çıkar
  // (önbellek atlanır); ilk üretim cihaz önbelleğini kullanabilir.
  const forceRef = useRef(false);

  if (!supabaseConfig.configured) return null;

  async function generate() {
    if (busy) return;
    const force = forceRef.current;
    setBusy(true);
    setError('');
    setCopied(false);
    setInserted(false);
    if (force) setResult(null);
    try {
      const summary = buildAiProfileSummary(profile, method, client);
      const next = await requestAiInterpretation({ summary, recordId, ignoreCache: force });
      setResult(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Yapay zekâ yorumu üretilemedi.');
    } finally {
      forceRef.current = false;
      setBusy(false);
    }
  }

  function requestRegenerate() {
    forceRef.current = true;
    void generate();
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* pano erişimi yoksa sessiz geç */
    }
  }

  function insertIntoNotes() {
    if (!result || !onInsertIntoNotes) return;
    onInsertIntoNotes(result.text);
    setInserted(true);
  }

  return (
    <section className="report-section ai-interpretation-section card-elevated" aria-labelledby={`${id}-title`}>
      <div className="ai-interpretation-head">
        <div>
          <h3 id={`${id}-title`} className="report-section-title">
            <Icon name="sparkles" size={16} /> Yapay Zekâ Yorumu
          </h3>
          <p className="ws-muted ai-interpretation-sub">
            Hesaplanan profilin (T skorları, geçerlik bulguları) yapay zekâ destekli kısa yorumu.
            Tanı koymaz; klinik kararın yerine geçmez.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => (result ? requestRegenerate() : void generate())}
          disabled={busy}
        >
          {busy ? (
            <>
              <div className="spinner-inline" />
              <span>Yorumlanıyor…</span>
            </>
          ) : result ? (
            <>
              <Icon name="refresh" size={14} />
              <span>Yeniden Oluştur</span>
            </>
          ) : (
            <>
              <Icon name="sparkles" size={14} />
              <span>AI Yorumu Oluştur</span>
            </>
          )}
        </button>
      </div>

      {busy && (
        <p className="ws-muted" role="status">
          Profil özetleniyor ve yapay zekâya gönderiliyor… (ilk denemede ~10-30 sn sürebilir)
        </p>
      )}

      {error && !busy && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      )}

      {result && !busy && (
        <div className="ai-interpretation-result">
          <div className="ai-interpretation-meta">
            <span className="ws-muted">
              Model: {result.model} · {new Date(result.generatedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="ai-interpretation-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={() => void copy()}>
                <Icon name={copied ? 'check' : 'file'} size={13} />
                <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>
              {onInsertIntoNotes && (
                <button type="button" className="btn-secondary btn-sm" onClick={insertIntoNotes} disabled={inserted}>
                  <Icon name={inserted ? 'check' : 'sheet'} size={13} />
                  <span>{inserted ? 'Nota eklendi' : 'Uzman Notuna Ekle'}</span>
                </button>
              )}
            </div>
          </div>
          <p className="ai-interpretation-text" role="region" aria-label="Yapay zekâ yorumu">{result.text}</p>
        </div>
      )}

      <p className="ai-disclaimer" role="note">
        <Icon name="info" size={13} />
        <span>
          Bu bölüm bir karar destek aracıdır: yalnızca yukarıdaki sayısal profilden yola çıkar, tanı koyamaz,
          tedavi öneremez ve uygulayıcı uzmanın klinik değerlendirmesinin yerine geçmez.
        </span>
      </p>
    </section>
  );
}
