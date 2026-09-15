import { useEffect, useId, useRef, useState } from 'react';
import type { FormDefinition, ItemDefinition } from '../omr/omrTypes';
import type { ManualReview, StoredScanPage } from '../results/scanResultTypes';
import { readStatusLabel, resolveItem } from '../results/resultNormalizer';
import { itemRowRect } from '../scanner/reviewGeometry';

export type ScanResultPreviewProps = {
  definition: FormDefinition;
  page: StoredScanPage;
  onReview: (itemId: string, review: ManualReview | undefined) => void;
  onRemove: () => void;
};

type RenderedCrop = { item: ItemDefinition; image: StoredScanPage['normalized']; definition: FormDefinition };

function ItemCrop({ item, page, definition, onRendered }: {
  item: ItemDefinition; page: StoredScanPage; definition: FormDefinition; onRendered: (crop: RenderedCrop | null) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const rect = itemRowRect(item, definition);
  useEffect(() => {
    onRendered(null);
    const element = canvas.current;
    if (!element) return;
    setError('');
    try {
      const image = page.normalized;
      const crop = itemRowRect(item, definition);
      const x = Math.max(0, Math.floor(crop.x / definition.pageWidthMm * image.width));
      const y = Math.max(0, Math.floor(crop.y / definition.pageHeightMm * image.height));
      const width = Math.min(image.width - x, Math.ceil(crop.width / definition.pageWidthMm * image.width));
      const height = Math.min(image.height - y, Math.ceil(crop.height / definition.pageHeightMm * image.height));
      if (width <= 0 || height <= 0) throw new Error('Satır görüntüsü sayfa sınırları dışında. Sayfayı yeniden tarayın.');
      element.width = width;
      element.height = height;
      const context = element.getContext('2d');
      if (!context) throw new Error('Satır görüntüsü gösterilemiyor. Yanıt vermeden önce başka tarayıcıda tekrar deneyin.');
      const pixels = context.createImageData(width, height);
      for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
        const value = image.data[(y + row) * image.width + x + column]!;
        const index = (row * width + column) * 4;
        pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = value;
        pixels.data[index + 3] = 255;
      }
      context.putImageData(pixels, 0, 0);
      onRendered({ item, image, definition });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Satır görüntüsü gösterilemedi.'); }
    return () => { onRendered(null); element.width = element.height = 0; };
  }, [item, page.normalized, definition, onRendered]);
  return <figure className="scan-crop-figure">
    <div className="scan-crop-map">
      {item.responseAreas.map(area => <span key={area.responseId} style={{ left: `${(area.x + area.width / 2 - rect.x) / rect.width * 100}%` }}>{area.choiceId}</span>)}
    </div>
    <div className="scan-crop-image">
      <canvas ref={canvas} role="img" aria-label={`${item.itemNumber}. maddenin düzeltilmiş sayfadan gerçek satır görüntüsü`} />
      {item.responseAreas.map(area => <span className="scan-response-outline" key={area.responseId} aria-hidden="true" style={{
        left: `${(area.x - rect.x) / rect.width * 100}%`, top: `${(area.y - rect.y) / rect.height * 100}%`,
        width: `${area.width / rect.width * 100}%`, height: `${area.height / rect.height * 100}%`,
      }} />)}
    </div>
    <figcaption>Madde {item.itemNumber} · Sütun {item.columnIndex + 1}, satır {item.rowIndex + 1}. Mavi çerçeveler tanımdaki yanıt alanlarıdır; yanıt eklemez.</figcaption>
    {error && <p className="scan-alert" role="alert">{error}</p>}
  </figure>;
}

export function ScanResultPreview({ definition, page, onReview, onRemove }: ScanResultPreviewProps) {
  const expected = definition.pages.find(p => p.pageNumber === page.pageNumber)!;
  const [filter, setFilter] = useState<'unresolved' | 'all' | 'reviewed'>('unresolved');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [renderedCrop, setRenderedCrop] = useState<RenderedCrop | null>(null);
  const id = useId();
  const unresolved = expected.items.filter(item => resolveItem(item, page).unresolved);
  const filtered = expected.items.filter(item => {
    const resolved = resolveItem(item, page);
    return (filter === 'all' || (filter === 'reviewed' ? !!resolved.review : resolved.unresolved)) &&
      String(item.itemNumber).includes(query.trim());
  });
  const pageSize = 18;
  const start = Math.min(offset, Math.max(0, Math.floor((filtered.length - 1) / pageSize) * pageSize));
  const selected = expected.items.find(item => item.itemId === selectedId) ?? filtered[start];
  const resolved = selected ? resolveItem(selected, page) : undefined;
  const history = selected ? page.reviewHistory.filter(event => event.itemId === selected.itemId) : [];
  const canReview = !!selected && renderedCrop?.item === selected &&
    renderedCrop.image === page.normalized && renderedCrop.definition === definition;
  const row = selected ? itemRowRect(selected, definition) : undefined;
  const choices = selected ? [...selected.responseAreas].sort((a, b) => a.x - b.x) : [];
  const choose = (choiceId: string | null) => {
    if (selected && canReview) {
      setSelectedId(selected.itemId);
      onReview(selected.itemId, { choiceId, reviewedAt: new Date().toISOString() });
    }
  };
  return <section className="scan-review" aria-labelledby={`${id}-title`}>
    <div className="scan-section-heading">
      <div><h3 id={`${id}-title`}>{page.pageNumber}. sayfayı incele</h3><p className="scan-source">{page.sourceName}</p></div>
      <button type="button" className="scan-danger" onClick={onRemove}>Sayfayı sil / yeniden tara</button>
    </div>
    {page.warnings.length > 0 && <div className="scan-notice" role="status"><strong>Okuyucu uyarıları</strong><ul>{page.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></div>}
    <div className="scan-review-layout">
      <aside className="scan-page-overview">
        <div className="scan-normalized-page">
          <img src={page.previewUrl} alt={`${page.pageNumber}. sayfanın perspektifi düzeltilmiş önizlemesi`} />
          {row && <span className="scan-row-location" aria-hidden="true" style={{ left: `${row.x / definition.pageWidthMm * 100}%`,
            top: `${row.y / definition.pageHeightMm * 100}%`, width: `${row.width / definition.pageWidthMm * 100}%`, height: `${row.height / definition.pageHeightMm * 100}%` }} />}
        </div>
        <p className="scan-muted">Mavi şerit, seçili maddenin sayfadaki konumudur.</p>
        <details className="scan-quality"><summary>Teknik kalite ölçümleri</summary>
          <dl><div><dt>Kalite indeksi</dt><dd>{page.quality.score.toFixed(2)} / 1</dd></div>
            <div><dt>Parlaklık</dt><dd>{page.quality.metrics.brightness.toFixed(1)}</dd></div>
            <div><dt>Netlik varyansı</dt><dd>{page.quality.metrics.laplacianVariance.toFixed(1)}</dd></div>
            <div><dt>Piksel / mm</dt><dd>{page.quality.metrics.pixelsPerMm.toFixed(1)}</dd></div></dl>
          {page.quality.reasons.map((reason, i) => <p key={i}>{reason}</p>)}
        </details>
      </aside>
      <div className="scan-items-panel">
        <div className="scan-filter-row">
          <label htmlFor={`${id}-filter`}>Göster<select id={`${id}-filter`} value={filter} onChange={event => {
            setFilter(event.target.value as typeof filter); setSelectedId(null); setOffset(0);
          }}><option value="unresolved">İnceleme bekleyen ({unresolved.length})</option><option value="all">Tüm maddeler ({expected.items.length})</option>
            <option value="reviewed">Elle incelenenler</option></select></label>
          <label htmlFor={`${id}-search`}>Madde numarası<input id={`${id}-search`} type="search" inputMode="numeric" value={query}
            placeholder="Örn. 145" onChange={event => { setQuery(event.target.value); setOffset(0); setSelectedId(null); }} /></label>
        </div>
        <p className="scan-muted">Boşlar dahil güvenilir olmayan sonuçlar inceleme bekler. Güvenilir okumaları değiştirmek için “Tüm maddeler”i seçin.</p>
        <div className="scan-item-list" aria-label="İncelenecek maddeler">
          {filtered.slice(start, start + pageSize).map(item => {
            const itemResult = resolveItem(item, page);
            return <button type="button" key={item.itemId} aria-pressed={selected?.itemId === item.itemId}
              onClick={() => setSelectedId(item.itemId)} title={itemResult.review ? 'Elle incelendi' : readStatusLabel(itemResult.original)}>
              <strong>{item.itemNumber}</strong><span>{itemResult.review ? 'İncelendi' : readStatusLabel(itemResult.original)}</span>
            </button>;
          })}
        </div>
        {!filtered.length && <p className="scan-empty" role="status">Bu filtrede madde yok. Diğer okumaları kontrol etmek için “Tüm maddeler”i seçebilirsiniz.</p>}
        {filtered.length > pageSize && <nav className="scan-pagination" aria-label="Madde listesi sayfaları">
          <button type="button" disabled={start === 0} onClick={() => { setSelectedId(null); setOffset(start - pageSize); }}>Önceki maddeler</button>
          <span>{start + 1}–{Math.min(start + pageSize, filtered.length)} / {filtered.length}</span>
          <button type="button" disabled={start + pageSize >= filtered.length} onClick={() => { setSelectedId(null); setOffset(start + pageSize); }}>Sonraki maddeler</button>
        </nav>}
        {selected && resolved && <article className="scan-item-detail" aria-labelledby={`${id}-item`}>
          <h4 id={`${id}-item`}>Madde {selected.itemNumber} <span>{readStatusLabel(resolved.original)}</span></h4>
          <ItemCrop item={selected} page={page} definition={definition} onRendered={setRenderedCrop} />
          <p><strong>Özgün okuma:</strong> {resolved.original ? `${resolved.original.choiceId ?? 'Yanıt seçilmedi'} · ${resolved.original.reason}` : 'Algoritma bu madde için sonuç üretmedi.'}</p>
          {resolved.original && <p className="scan-muted">Sezgisel güven indeksi: {resolved.original.confidence.toFixed(2)} / 1. Doğruluk olasılığı değildir.</p>}
          <fieldset className="scan-review-controls" disabled={!canReview}><legend>Görüntüye göre manuel inceleme</legend>
            {choices.map(area => <button type="button" key={area.responseId} aria-pressed={!!resolved.review && resolved.review.choiceId === area.choiceId}
              onClick={() => choose(area.choiceId)} aria-label={`Madde ${selected.itemNumber}: ${area.choiceId}, ${area.label} olarak incele`}>{area.choiceId} · {area.label}</button>)}
            <button type="button" aria-pressed={!!resolved.review && resolved.review.choiceId === null} onClick={() => choose(null)}>Boş olarak onayla</button>
          </fieldset>
          <p className="scan-review-provenance" role="status">{resolved.review
            ? `Manuel inceleme: ${resolved.review.choiceId ?? 'Boş (açıkça onaylandı)'} · ${new Date(resolved.review.reviewedAt).toLocaleString('tr-TR')}`
            : history.length ? 'Manuel inceleme geri alındı; geçmiş korunuyor. Özgün algoritma çıktısı etkin.'
              : 'Manuel düzeltme yok. Özgün algoritma çıktısı korunuyor.'}</p>
          {resolved.review && <button type="button" onClick={() => onReview(selected.itemId, undefined)}>Manuel incelemeyi geri al</button>}
          {history.length > 0 && <details className="scan-measurements"><summary>Manuel inceleme geçmişi ({history.length})</summary>
            <ol>{history.map((event, index) => <li key={index}>
              {event.action === 'undo' ? 'Geri alındı' : `İncelendi: ${event.next?.choiceId ?? 'Boş (açıkça onaylandı)'}`}
              {' · '}{new Date(event.recordedAt).toLocaleString('tr-TR')}{' · Oturum: '}{event.reviewerId}
            </li>)}</ol>
          </details>}
          <details className="scan-measurements"><summary>Özgün seçenek ölçümleri (değiştirilmez)</summary>
            {resolved.original?.measurements.length ? <table><thead><tr><th>Seçenek</th><th>Koyuluk</th><th>Doluluk</th></tr></thead>
              <tbody>{resolved.original.measurements.map(measurement => <tr key={measurement.responseId}><th scope="row">{measurement.choiceId}</th>
                <td>{measurement.darkness.toFixed(3)}</td><td>{measurement.coverage.toFixed(3)}</td></tr>)}</tbody></table> : <p>Başarılı ölçüm yok.</p>}
          </details>
        </article>}
      </div>
    </div>
  </section>;
}
