import { useRef, useState } from 'react';
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
  /** Yalnız yaş taşınır; ad/soyad LLM istemine katılmaz (KVKK). */
  client: { age: number } | null;
  /** Kayıt detayında recordId verilir: Edge Function kayıt sahipliğini doğrular. */
  recordId?: string;
  /** Verildiğinde sonuç, uzman notu taslağına eklenebilir. */
  onInsertIntoNotes?: (text: string) => void;
};

/**
 * "Yapay Zekâ Yorumu" sekmesi — sonuç panelinin son sekmesi, karar destek katmanı.
 * Yorum; tanı koyar, tedavi önerir ya da klinik karar verir gibi sunulmaz: her
 * çıktının altında kalıcı bir sınır bildirimi vardır ve metin yalnızca bu
 * analizde üretilen sayısal profil özetinden türetilir.
 *
 * Düzen sekmeye uygun, kendi dilinde: hero kartı (başlık + eylem), durum
 * kartları (yoğun / hata / sonuç) ve disaclaimer şeridi.
 */
export function AiInterpretationPanel({ profile, method, client, recordId, onInsertIntoNotes }: AiInterpretationPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiInterpretationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  // Sonuç üretilmişken düğme "Yeniden Oluştur" davranır ve ağa zorla çıkar
  // (önbellek atlanır); ilk üretim cihaz önbelleğini kullanabilir.
  const forceRef = useRef(false);

  if (!supabaseConfig.configured) {
    return (
      <div role="tabpanel" className="mmpi-tab-panel">
        <div className="mmpi-box info">
          <Icon name="info" size={14} />
          <span>
            Bu kurulumda yapay zekâ yorumu etkin değil (Supabase bağlantısı yapılandırılmamış).
            Yorum yalnızca bu analizin sayısal profil özetinden üretilir; tanı koymaz.
          </span>
        </div>
      </div>
    );
  }

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
    <div role="tabpanel" className="mmpi-tab-panel ai-tab">
      {/* Hero: sekmenin kimliği — başlık, çerçeveleyen açıklama ve üretim eylemi */}
      <section className="ai-hero">
        <div className="ai-hero-badge" aria-hidden="true">
          <Icon name="sparkles" size={20} />
        </div>
        <div className="ai-hero-body">
          <h4 className="ai-hero-title">
            Yapay Zekâ <em>Yorumu</em>
          </h4>
          <p className="ai-hero-sub">
            Hesaplanan profilin (T skorları, geçerlik bulguları) yapay zekâ destekli kısa yorumu.
            Tanı koymaz; klinik kararın yerine geçmez.
          </p>
          <div className="ai-hero-chips">
            <span className="mmpi-chip">Yalnız sayısal profil gönderilir</span>
            <span className="mmpi-chip">Tanı koymaz</span>
            <span className="mmpi-chip">Karar destek aracı</span>
          </div>
        </div>
        <button
          type="button"
          className="btn-primary btn-sm ai-hero-btn"
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
      </section>

      {busy && (
        <section className="ai-status-card" role="status" aria-live="polite">
          <div className="ai-status-row">
            <div className="spinner-inline" />
            <span>
              Profil özetleniyor ve yapay zekâya gönderiliyor… (ilk denemede ~10-30 sn sürebilir)
            </span>
          </div>
          <div className="ai-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>
      )}

      {error && !busy && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" className="btn-secondary btn-sm" onClick={() => void generate()}>
            <Icon name="refresh" size={13} />
            <span>Tekrar dene</span>
          </button>
        </div>
      )}

      {result && !busy && (
        <section className="ai-result-card">
          <header className="ai-result-head">
            <div className="ai-result-meta">
              <span className="ai-result-chip">
                <Icon name="sparkles" size={12} />
                Yapay zekâ yorumu
              </span>
              <span className="ws-muted">
                Model: {result.model} ·{' '}
                {new Date(result.generatedAt).toLocaleString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
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
          </header>
          <p className="ai-interpretation-text" role="region" aria-label="Yapay zekâ yorumu">
            {result.text}
          </p>
        </section>
      )}

      <p className="ai-disclaimer" role="note">
        <Icon name="info" size={13} />
        <span>
          Bu bölüm bir karar destek aracıdır: yalnızca bu analizin sayısal profil özetinden yola çıkar,
          tanı koyamaz, tedavi öneremez ve uygulayıcı uzmanın klinik değerlendirmesinin yerine geçmez.
        </span>
      </p>
    </div>
  );
}
