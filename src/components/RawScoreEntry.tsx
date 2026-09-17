import { RAW_SCORE_FIELDS, RAW_SCORE_MAX } from '../workspace/caseTypes';
import type { RawScoreKey, RawScores } from '../workspace/caseTypes';

type RawScoreEntryProps = {
  scores: RawScores;
  onChange: (next: RawScores) => void;
};

export function RawScoreEntry({ scores, onChange }: RawScoreEntryProps) {
  function setField(key: RawScoreKey, raw: string) {
    if (raw === '') {
      onChange({ ...scores, [key]: '' });
      return;
    }
    if (!/^\d+$/.test(raw)) return;
    const number = Number(raw);
    const max = RAW_SCORE_MAX[key];
    if (number > max) return;
    onChange({ ...scores, [key]: number });
  }

  const validity = RAW_SCORE_FIELDS.filter(field => field.group === 'validity');
  const clinical = RAW_SCORE_FIELDS.filter(field => field.group === 'clinical');

  return (
    <section className="ws-panel" aria-labelledby="raw-title">
      <header className="ws-panel-head">
        <div>
          <h2 id="raw-title">Ham puan</h2>
          <p className="ws-muted">Hs, Pd, Pt, Sc ve Ma K düzeltmesi yapılmadan girilir.</p>
        </div>
      </header>

      <div className="raw-grid-wrap">
        <fieldset className="raw-group">
          <legend>Geçerlik göstergeleri</legend>
          <div className="raw-grid">
            {validity.map(field => (
              <label key={field.key} className="raw-field">
                <span>{field.label}</span>
                <input
                  inputMode="numeric"
                  type="number"
                  min={0}
                  max={field.max}
                  value={scores[field.key]}
                  onChange={event => setField(field.key, event.target.value)}
                />
                <small>0–{field.max}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="raw-group">
          <legend>Klinik ölçekler</legend>
          <div className="raw-grid">
            {clinical.map(field => (
              <label key={field.key} className="raw-field">
                <span>
                  {field.label}
                  {field.kRaw ? <em> K−</em> : null}
                </span>
                <input
                  inputMode="numeric"
                  type="number"
                  min={0}
                  max={field.max}
                  value={scores[field.key]}
                  onChange={event => setField(field.key, event.target.value)}
                />
                <small>0–{field.max}{field.kRaw ? ' · K’sız' : ''}</small>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
