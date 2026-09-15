import type { CSSProperties } from 'react';
import type { FormDefinition, PageDefinition } from '../omr/omrTypes';
import { FORM } from '../form/layout';
import { AnswerColumn } from './AnswerColumn';
import { PageQr } from './PageQr';
import { RegistrationMarks } from './RegistrationMarks';

const geometryStyle = {
  '--paper-width': `${FORM.pageWidthMm}mm`,
  '--paper-height': `${FORM.pageHeightMm}mm`,
  '--content-left': `${FORM.contentLeftMm}mm`,
  '--content-width': `${FORM.contentWidthMm}mm`,
  '--header-width': `${FORM.qrArea.x - FORM.contentLeftMm - 4}mm`,
  '--grid-top': `${FORM.gridTopMm}mm`,
  '--grid-header': `${FORM.gridHeaderMm}mm`,
  '--column-gap': `${FORM.columnGapMm}mm`,
  '--column-count': FORM.columnCount,
  '--row-pitch': `${FORM.rowPitchMm}mm`,
  '--bubble-diameter': `${FORM.bubbleDiameterMm}mm`,
  '--column-height': `${FORM.rowsPerColumn * FORM.rowPitchMm}mm`,
} as CSSProperties;

export function FormPage({ page, definition, batchId, active }: {
  page: PageDefinition;
  definition: FormDefinition;
  batchId: string;
  active: boolean;
}) {
  const firstPage = page.pageNumber === 1;
  return <article className={`form-page${active ? ' is-active' : ''}`} style={geometryStyle}
    data-page={page.pageNumber} data-identity={firstPage ? 'cover' : 'continuation'}
    aria-label={`Cevap formu, sayfa ${page.pageNumber}, ${page.firstItem}–${page.lastItem}. maddeler`}>
    <RegistrationMarks />
    <PageQr definition={definition} batchId={batchId} pageNumber={page.pageNumber} />
    <header className="paper-header">
      <div className="paper-title-row">
        <div><h2>MMPI-566</h2><p>OPTİK CEVAP FORMU <span>/ {definition.version}</span></p></div>
        <div className="paper-page-number"><strong>{String(page.pageNumber).padStart(2, '0')}<span> / {String(definition.totalPages).padStart(2, '0')}</span></strong>
          <span>{page.firstItem}–{page.lastItem}. maddeler</span></div>
      </div>
      {firstPage && <div className="identity-fields">
        <div><span>FORM KİMLİĞİ</span><i /></div>
        <div><span>KATILIMCI KODU</span><i /></div>
        <div className="date-field"><span>TARİH</span><i><b>/</b><b>/</b></i></div>
      </div>}
      <div className={`paper-instructions${firstPage ? '' : ' is-compact'}`}>
        <div><strong>D: Doğru&nbsp;&nbsp; Y: Yanlış</strong>
          <span>{firstPage
            ? 'Her maddede yalnızca bir dairenin içini tamamen doldurun. El yazısı kimlik yalnızca bu sayfadadır.'
            : 'Devam sayfası. İşaretleme kuralı ilk sayfadakiyle aynıdır.'}</span></div>
        {firstPage && <div className="marking-example"><span className="filled-example" aria-hidden="true" /><span>Örnek işaretleme</span></div>}
      </div>
      {firstPage && <p className="paper-reminder">Numaraları sütun boyunca aşağıya doğru izleyin. Dört sayfayı aynı oturumda yazdırın; sağ üstteki QR kodu sayfaları otomatik eşleştirir.</p>}
    </header>
    <div className="answer-columns">{page.columns.map((column, index) =>
      <AnswerColumn key={index} column={column} />)}</div>
    <footer className="paper-footer">
      <div><strong>{FORM.templateId}</strong></div>
      <div><strong>Sayfa {page.pageNumber} / {definition.totalPages}</strong><span>A4 · 210 × 297 mm · Tek yüz</span></div>
    </footer>
  </article>;
}
