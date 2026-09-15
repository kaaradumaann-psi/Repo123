import { useEffect, useRef, useState } from 'react';
import type { FormDefinition } from '../omr/omrTypes';
import { FORM, FORM_PAGES } from '../form/layout';
import { FormPage } from './FormPage';
import { Icon } from './Icon';

const MM_TO_CSS_PX = 96 / 25.4;

export function FormPreview({ current, onChange, definition, batchId }: {
  current: number;
  onChange: (index: number) => void;
  definition: FormDefinition;
  batchId: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.72);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const available = Math.max(entry.contentRect.width - 40, 1);
      setFit(Math.min(1, available / (FORM.pageWidthMm * MM_TO_CSS_PX)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = fit * zoom;
  const page = FORM_PAGES[current]!;
  return <section className="preview-panel" aria-label="A4 form önizlemesi">
    <div className="preview-toolbar">
      <div className="preview-label"><Icon name="sheet" size={17} /><strong>A4 önizleme</strong><span>210 × 297 mm</span></div>
      <div className="preview-zoom" role="group" aria-label="Yakınlaştırma">
        <button type="button" className="icon-button" disabled={zoom <= 0.8}
          onClick={() => setZoom(value => Math.max(0.8, Math.round((value - 0.1) * 10) / 10))} aria-label="Uzaklaştır">−</button>
        <span className="preview-fit"><Icon name="fit" size={15} /><b>%{Math.round(scale * 100)}</b></span>
        <button type="button" className="icon-button" disabled={zoom >= 1.4}
          onClick={() => setZoom(value => Math.min(1.4, Math.round((value + 0.1) * 10) / 10))} aria-label="Yakınlaştır">+</button>
        <button type="button" className="icon-button" disabled={zoom === 1} onClick={() => setZoom(1)}
          aria-label="Genişliğe sığdır">1:1</button>
      </div>
    </div>
    <div className="paper-stage" ref={container} id="paper-preview">
      <div className="scaled-paper" style={{ width: FORM.pageWidthMm * MM_TO_CSS_PX * scale,
        height: FORM.pageHeightMm * MM_TO_CSS_PX * scale }}>
        <div className="paper-stack" style={{ transform: `scale(${scale})` }}>
          {FORM_PAGES.map((item, index) => <FormPage key={item.pageId} page={item} definition={definition}
            batchId={batchId} active={index === current} />)}
        </div>
      </div>
    </div>
    <div className="preview-bottom">
      <span><span className="paper-dot" />Ekran ölçeği, yazdırma ölçüsünü değiştirmez.</span>
      <div className="pagination">
        <button type="button" className="icon-button" disabled={current === 0}
          onClick={() => onChange(current - 1)} aria-label="Önceki sayfa"><Icon name="left" size={16} /></button>
        <span role="status" aria-live="polite" aria-atomic="true">{page.pageNumber} <i>/ {FORM_PAGES.length}</i></span>
        <button type="button" className="icon-button" disabled={current === FORM_PAGES.length - 1}
          onClick={() => onChange(current + 1)} aria-label="Sonraki sayfa"><Icon name="right" size={16} /></button>
      </div>
    </div>
  </section>;
}
