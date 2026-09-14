import { FORM_PAGES } from '../form/layout';
import { Icon } from './Icon';

function PageThumbnail({ last }: { last: boolean }) {
  return <svg className="page-thumbnail" viewBox="0 0 42 58" aria-hidden="true">
    <rect x=".5" y=".5" width="41" height="57" rx="1.5" fill="white" stroke="currentColor" strokeOpacity=".25" />
    <path d="M5 5h2v2H5zM35 5h2v2h-2zM5 51h2v2H5zM35 51h2v2h-2z" fill="currentColor" />
    <path d="M10 7h14M10 10h22M10 14h22" stroke="currentColor" strokeWidth="1" opacity=".4" />
    {[0, 1, 2].map(col => <g key={col} opacity=".48">
      {Array.from({ length: last && col === 2 ? 10 : 13 }, (_, row) => <path key={row}
        d={`M${9 + col * 9} ${19 + row * 2.3}h2m2 0h1m2 0h1`} stroke="currentColor" strokeWidth=".7" />)}
    </g>)}
  </svg>;
}

export function PageNavigation({ current, onChange }: { current: number; onChange: (index: number) => void }) {
  return <nav className="page-navigation" aria-label="Form sayfaları">
    <div className="section-label">SAYFALAR <span>{FORM_PAGES.length}</span></div>
    <div className="page-list">{FORM_PAGES.map((page, index) => <button type="button" key={page.pageNumber}
      className={`page-option${current === index ? ' selected' : ''}`} onClick={() => onChange(index)}
      aria-current={current === index ? 'page' : undefined} aria-controls="paper-preview">
      <PageThumbnail last={index === FORM_PAGES.length - 1} />
      <span className="page-option-copy"><strong>Sayfa {String(page.pageNumber).padStart(2, '0')}</strong>
        <span>{page.firstItem}–{page.lastItem}. maddeler{index === 0 ? ' · kimlik' : ''}</span></span>
      {current === index && <span className="selected-check"><Icon name="check" size={12} /></span>}
    </button>)}</div>
  </nav>;
}
