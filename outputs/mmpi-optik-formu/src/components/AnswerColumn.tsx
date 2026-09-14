import type { CSSProperties } from 'react';
import { FORM, type FormColumn } from '../form/layout';

export function AnswerColumn({ column }: { column: FormColumn }) {
  return <section className="answer-column" aria-label={`${column.items[0]}–${column.items.at(-1)}. maddeler`}>
    <div className="column-heading" aria-hidden="true">
      <span className="item-number">No.</span>
      {FORM.choices.map(choice => <span key={choice.code} className="choice-heading"
        style={{ '--choice-x': `${choice.centerInColumnMm}mm` } as CSSProperties}>{choice.code}</span>)}
    </div>
    <div className="column-rows">
      {column.items.map(item => <div className="answer-row" key={item} data-item={item}>
        <span className="item-number">{item}</span>
        {FORM.choices.map(choice => <span key={choice.code} className="answer-bubble"
          role="img" aria-label={`${item}. madde, ${choice.label}: boş işaretleme alanı`}
          data-choice={choice.code}
          style={{ '--choice-x': `${choice.centerInColumnMm}mm` } as CSSProperties} />)}
      </div>)}
      {column.items.length < FORM.rowsPerColumn && <div className="column-end">
        <span>FORM SONU</span><br />Son madde: {FORM.totalItems}
      </div>}
    </div>
  </section>;
}
