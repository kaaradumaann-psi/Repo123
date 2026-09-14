import type { CSSProperties } from 'react';
import { FORM, PAGE_COUNT, type FormPageDefinition } from '../form/layout';
import { AnswerColumn } from './AnswerColumn';
import { RegistrationMarks } from './RegistrationMarks';

const geometryStyle = {
  '--paper-width': `${FORM.pageWidthMm}mm`,
  '--paper-height': `${FORM.pageHeightMm}mm`,
  '--content-left': `${FORM.contentLeftMm}mm`,
  '--content-width': `${FORM.contentWidthMm}mm`,
  '--grid-top': `${FORM.gridTopMm}mm`,
  '--grid-header': `${FORM.gridHeaderMm}mm`,
  '--column-gap': `${FORM.columnGapMm}mm`,
  '--column-count': FORM.columnCount,
  '--row-pitch': `${FORM.rowPitchMm}mm`,
  '--bubble-diameter': `${FORM.bubbleDiameterMm}mm`,
  '--column-height': `${FORM.rowsPerColumn * FORM.rowPitchMm}mm`,
} as CSSProperties;

export function FormPage({ page, active }: { page: FormPageDefinition; active: boolean }) {
  return <article className={`form-page${active ? ' is-active' : ''}`} style={geometryStyle}
    data-page={page.number} aria-label={`Cevap formu, sayfa ${page.number}, ${page.firstItem}–${page.lastItem}. maddeler`}>
    <RegistrationMarks />
    <header className="paper-header">
      <div className="paper-title-row">
        <div><h2>MMPI-566</h2><p>OPTİK CEVAP FORMU <span>/ YERLEŞİM ŞABLONU</span></p></div>
        <div className="paper-page-number"><strong>{String(page.number).padStart(2, '0')}<span> / 0{PAGE_COUNT}</span></strong>
          <span>{page.firstItem}–{page.lastItem}. maddeler</span></div>
      </div>
      <div className="identity-fields">
        <div><span>FORM KİMLİĞİ</span><i /></div>
        <div><span>KATILIMCI KODU</span><i /></div>
        <div className="date-field"><span>TARİH</span><i><b>/</b><b>/</b></i></div>
      </div>
      <div className="paper-instructions">
        <div><strong>D: Doğru&nbsp;&nbsp; Y: Yanlış</strong><span>Her maddede yalnızca bir dairenin içini tamamen doldurun.</span></div>
        <div className="marking-example"><span className="filled-example" aria-hidden="true" /><span>Örnek işaretleme</span></div>
      </div>
      <p className="paper-reminder">Numaraları sütun boyunca aşağıya doğru izleyin. Tüm sayfalarda aynı form kimliğini kullanın.</p>
    </header>
    <div className="answer-columns">{page.columns.map(column => <AnswerColumn key={column.index} column={column} />)}</div>
    <footer className="paper-footer">
      <div><strong>{FORM.templateId}</strong><span>Yerleşim şablonu; yetkili test materyali değildir.</span></div>
      <div><strong>Sayfa {page.number} / {PAGE_COUNT}</strong><span>A4 · 210 × 297 mm · Tek yüz</span></div>
    </footer>
  </article>;
}
