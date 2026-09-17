import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { ITEM_COUNT, MMPI_MAX_BLANK, answerLabel, countAnswers, mapQuickKey } from '../workspace/caseTypes';
import type { ItemAnswer } from '../workspace/caseTypes';
import { Icon } from './Icon';

type QuickEntryProps = {
  answers: ItemAnswer[];
  current: number;
  onCurrent: (index: number) => void;
  onAnswers: (next: ItemAnswer[]) => void;
};

export function QuickEntry({ answers, current, onCurrent, onAnswers }: QuickEntryProps) {
  const focus = useRef<HTMLDivElement>(null);
  const counts = countAnswers(answers);
  const item = Math.min(Math.max(current, 0), ITEM_COUNT - 1);
  const value = answers[item];
  const percent = Math.round((counts.entered / ITEM_COUNT) * 100);
  const firstMissing = answers.findIndex(answer => answer === undefined);

  useEffect(() => {
    focus.current?.focus();
  }, []);

  function setAt(index: number, answer: ItemAnswer) {
    const next = answers.slice();
    next[index] = answer;
    onAnswers(next);
  }

  function apply(answer: ItemAnswer) {
    setAt(item, answer);
    if (item < ITEM_COUNT - 1) onCurrent(item + 1);
    focus.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const mapped = mapQuickKey(event.key);
    if (mapped !== 'ignore') {
      event.preventDefault();
      apply(mapped);
      return;
    }
    if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
      event.preventDefault();
      onCurrent(Math.max(0, item - 1));
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onCurrent(Math.min(ITEM_COUNT - 1, item + 1));
    }
  }

  return (
    <section className="ws-panel qe" aria-labelledby="qe-title">
      <header className="ws-panel-head">
        <div>
          <span className="section-badge badge-primary">03 · Veri</span>
          <h2 id="qe-title" className="ws-panel-title">
            Hızlı <em>veri girişi</em>
          </h2>
          <p className="ws-muted">
            1 = Doğru · 2 = Yanlış · 0 = Boş. Her tuş anında taslağa yazılır; F5 ve internet kesintisinde korunur.
            Dokunmatik ekranda aşağıdaki düğmeleri kullanabilirsiniz.
          </p>
        </div>
        <div className="qe-counts" aria-label="İlerleme">
          <span>%{percent} · {counts.entered} / {ITEM_COUNT}</span>
          <span className="ws-chip qe-d">D {counts.correct}</span>
          <span className="ws-chip qe-y">Y {counts.wrong}</span>
          <span className={`ws-chip ${counts.blank > MMPI_MAX_BLANK ? 'qe-blank-over' : ''}`}>Boş {counts.blank}</span>
        </div>
      </header>

      {counts.blank > MMPI_MAX_BLANK && (
        <p className="qe-blank-warning" role="alert">
          Boş bırakılan madde sayısı {MMPI_MAX_BLANK} sınırını aşıyor; bu durum testi geçersiz sayabilir.
          Kontrol adımında kayıt engellenecek.
        </p>
      )}

      <div
        ref={focus}
        className="qe-stage"
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="group"
        aria-label="Klavye ile madde girişi"
      >
        <p className="qe-current" aria-live="polite">
          Şu anki madde: <strong>{item + 1}</strong> / {ITEM_COUNT}
        </p>
        <div className="qe-answer-btns">
          <button
            type="button"
            className={`qe-answer-btn is-d ${value === 'D' ? 'is-on' : ''}`}
            onClick={() => apply('D')}
            aria-pressed={value === 'D'}
          >
            <kbd>1</kbd> Doğru
          </button>
          <button
            type="button"
            className={`qe-answer-btn is-y ${value === 'Y' ? 'is-on' : ''}`}
            onClick={() => apply('Y')}
            aria-pressed={value === 'Y'}
          >
            <kbd>2</kbd> Yanlış
          </button>
          <button
            type="button"
            className={`qe-answer-btn is-b ${value === null ? 'is-on' : ''}`}
            onClick={() => apply(null)}
            aria-pressed={value === null}
          >
            <kbd>0</kbd> Boş
          </button>
        </div>
        <p className="qe-value">Kayıtlı: <strong>{answerLabel(value)}</strong></p>
        <div className="qe-nav-btns">
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={item === 0}
            onClick={() => {
              onCurrent(item - 1);
              focus.current?.focus();
            }}
          >
            <Icon name="left" size={14} /> Önceki
          </button>
          {firstMissing !== -1 && firstMissing !== item && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                onCurrent(firstMissing);
                focus.current?.focus();
              }}
            >
              İlk eksik ({firstMissing + 1})
            </button>
          )}
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={item >= ITEM_COUNT - 1}
            onClick={() => {
              onCurrent(item + 1);
              focus.current?.focus();
            }}
          >
            Sonraki <Icon name="right" size={14} />
          </button>
        </div>
      </div>

      <div className="qe-progress" role="progressbar" aria-valuenow={counts.entered} aria-valuemin={0} aria-valuemax={ITEM_COUNT} aria-label="Girilen madde">
        <div className="qe-progress-fill" style={{ width: `${(counts.entered / ITEM_COUNT) * 100}%` }} />
      </div>
      <p className="ws-hint">
        {counts.pending === 0
          ? 'Tüm maddeler girildi; Kontrol adımına geçebilirsiniz.'
          : `${counts.pending} madde eksik. Haritadan eksik maddeye dokunarak atlayabilirsiniz.`}
      </p>

      <div className="qe-map" role="listbox" aria-label="566 madde haritası">
        {answers.map((answer, index) => {
          const cls = answer === 'D' ? 'is-d' : answer === 'Y' ? 'is-y' : answer === null ? 'is-blank' : 'is-pending';
          return (
            <button
              type="button"
              role="option"
              key={index}
              aria-selected={index === item}
              aria-label={`${index + 1}. madde: ${answerLabel(answer)}`}
              className={`qe-cell ${cls} ${index === item ? 'is-current' : ''}`}
              title={`${index + 1}: ${answerLabel(answer)}`}
              onClick={() => {
                onCurrent(index);
                focus.current?.focus();
              }}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}
