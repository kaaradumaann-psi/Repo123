import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { ITEM_COUNT, answerLabel, countAnswers, mapQuickKey } from '../workspace/caseTypes';
import type { ItemAnswer } from '../workspace/caseTypes';

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

  useEffect(() => {
    focus.current?.focus();
  }, [item]);

  function setAt(index: number, answer: ItemAnswer) {
    const next = answers.slice();
    next[index] = answer;
    onAnswers(next);
  }

  function apply(answer: ItemAnswer) {
    setAt(item, answer);
    if (item < ITEM_COUNT - 1) onCurrent(item + 1);
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
          <h2 id="qe-title">Uzman hızlı veri girişi</h2>
          <p className="ws-muted">1 = Doğru · 2 = Yanlış · 0 = Boş. Kayıt anında yazılır.</p>
        </div>
        <div className="qe-counts" aria-label="İlerleme">
          <span>{counts.entered} / {ITEM_COUNT}</span>
          <span className="ws-chip qe-d">D {counts.correct}</span>
          <span className="ws-chip qe-y">Y {counts.wrong}</span>
          <span className="ws-chip">Boş {counts.blank}</span>
        </div>
      </header>

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
        <div className="qe-keys" aria-hidden="true">
          <span className={value === 'D' ? 'is-on' : ''}><kbd>1</kbd> Doğru</span>
          <span className={value === 'Y' ? 'is-on' : ''}><kbd>2</kbd> Yanlış</span>
          <span className={value === null ? 'is-on' : ''}><kbd>0</kbd> Boş</span>
        </div>
        <p className="qe-value">Kayıtlı: <strong>{answerLabel(value)}</strong></p>
      </div>

      <div className="qe-map" role="listbox" aria-label="566 madde haritası">
        {answers.map((answer, index) => {
          const cls = answer === 'D' ? 'is-d' : answer === 'Y' ? 'is-y' : answer === null ? 'is-blank' : 'is-pending';
          return (
            <button
              type="button"
              role="option"
              key={index}
              aria-selected={index === item}
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
