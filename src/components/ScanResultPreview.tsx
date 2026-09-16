import { useEffect, useId, useRef, useState } from 'react';
import type { FormDefinition, ItemDefinition } from '../omr/omrTypes';
import type { ManualReview, StoredScanPage } from '../results/scanResultTypes';
import { readStatusLabel, resolveItem } from '../results/resultNormalizer';
import { itemRowRect } from '../scanner/reviewGeometry';
import { Icon } from './Icon';

export type ScanResultPreviewProps = {
  definition: FormDefinition;
  page: StoredScanPage;
  onReview: (itemId: string, review: ManualReview | undefined) => void;
  onRemove: () => void;
};

type RenderedCrop = { item: ItemDefinition; image: StoredScanPage['normalized']; definition: FormDefinition };

function ItemCrop({
  item,
  page,
  definition,
  onRendered,
}: {
  item: ItemDefinition;
  page: StoredScanPage;
  definition: FormDefinition;
  onRendered: (crop: RenderedCrop | null) => void;
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
      const x = Math.max(0, Math.floor((crop.x / definition.pageWidthMm) * image.width));
      const y = Math.max(0, Math.floor((crop.y / definition.pageHeightMm) * image.height));
      const width = Math.min(image.width - x, Math.ceil((crop.width / definition.pageWidthMm) * image.width));
      const height = Math.min(image.height - y, Math.ceil((crop.height / definition.pageHeightMm) * image.height));
      if (width <= 0 || height <= 0) {
        throw new Error('Satır görüntüsü sayfa sınırları dışında kaldı.');
      }
      element.width = width;
      element.height = height;
      const context = element.getContext('2d');
      if (!context) {
        throw new Error('Görüntü oluşturulamadı.');
      }
      const pixels = context.createImageData(width, height);
      for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
          const value = image.data[(y + row) * image.width + x + column]!;
          const index = (row * width + column) * 4;
          pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = value;
          pixels.data[index + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      onRendered({ item, image, definition });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Satır görseli gösterilemedi.');
    }
    return () => {
      onRendered(null);
      element.width = element.height = 0;
    };
  }, [item, page.normalized, definition, onRendered]);

  return (
    <figure className="scan-crop-figure">
      <div className="scan-crop-map">
        {item.responseAreas.map(area => (
          <span
            key={area.responseId}
            style={{ left: `${((area.x + area.width / 2 - rect.x) / rect.width) * 100}%` }}
          >
            {area.choiceId} ({area.label})
          </span>
        ))}
      </div>
      <div className="scan-crop-image">
        <canvas
          ref={canvas}
          role="img"
          aria-label={`${item.itemNumber}. maddenin taranan satır görüntüsü`}
        />
        {item.responseAreas.map(area => (
          <span
            className="scan-response-outline"
            key={area.responseId}
            aria-hidden="true"
            style={{
              left: `${((area.x - rect.x) / rect.width) * 100}%`,
              top: `${((area.y - rect.y) / rect.height) * 100}%`,
              width: `${(area.width / rect.width) * 100}%`,
              height: `${(area.height / rect.height) * 100}%`,
            }}
          />
        ))}
      </div>
      <figcaption className="crop-meta-caption">
        Madde {item.itemNumber} (Optik Form {item.columnIndex + 1}. Sütun, {item.rowIndex + 1}. Satır)
      </figcaption>
      {error && <p className="status-banner error-banner">{error}</p>}
    </figure>
  );
}

const STATUS_OPTIONS = [
  ['all', 'Tüm Okuma Durumları'],
  ['reliable', 'Güvenilir İşaret'],
  ['single', 'Tek İşaret / İnceleyin'],
  ['ambiguous', 'Belirsiz'],
  ['multiple', 'Çoklu İşaret'],
  ['blank', 'Boş'],
  ['invalid', 'Geçersiz'],
  ['unread', 'Okunamadı'],
] as const;

export function ScanResultPreview({ definition, page, onReview, onRemove }: ScanResultPreviewProps) {
  const expected = definition.pages.find(p => p.pageNumber === page.pageNumber)!;
  const [filter, setFilter] = useState<'unresolved' | 'all' | 'reviewed'>('unresolved');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number][0]>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [renderedCrop, setRenderedCrop] = useState<RenderedCrop | null>(null);
  const id = useId();

  const unresolved = expected.items.filter(item => resolveItem(item, page).unresolved);
  const filtered = expected.items.filter(item => {
    const resolved = resolveItem(item, page);
    const status = resolved.original?.status ?? 'unread';
    return (
      (filter === 'all' || (filter === 'reviewed' ? !!resolved.review : resolved.unresolved)) &&
      (statusFilter === 'all' || status === statusFilter) &&
      String(item.itemNumber).includes(query.trim())
    );
  });

  const pageSize = 24;
  const start = Math.min(offset, Math.max(0, Math.floor((filtered.length - 1) / pageSize) * pageSize));
  const selected = expected.items.find(item => item.itemId === selectedId) ?? filtered[start];
  const resolved = selected ? resolveItem(selected, page) : undefined;
  const history = selected ? page.reviewHistory.filter(event => event.itemId === selected.itemId) : [];
  const canReview =
    !!selected &&
    renderedCrop?.item === selected &&
    renderedCrop.image === page.normalized &&
    renderedCrop.definition === definition;
  const row = selected ? itemRowRect(selected, definition) : undefined;
  const choices = selected ? [...selected.responseAreas].sort((a, b) => a.x - b.x) : [];

  const choose = (choiceId: string | null) => {
    if (selected && canReview) {
      setSelectedId(selected.itemId);
      onReview(selected.itemId, { choiceId, reviewedAt: new Date().toISOString() });
    }
  };

  return (
    <section className="scan-review-panel card-elevated" aria-labelledby={`${id}-title`}>
      <div className="section-header-row">
        <div>
          <span className="section-badge badge-primary">Sayfa inceleme</span>
          <h3 id={`${id}-title`} className="section-heading">
            {page.pageNumber}. sayfa cevapları
          </h3>
          <p className="section-subtext">
            Kaynak: <strong>{page.sourceName}</strong> · Belirsiz işaretleri görsel üzerinden kontrol edin.
          </p>
        </div>
        <button type="button" className="btn-secondary btn-danger-soft btn-sm" onClick={onRemove}>
          <Icon name="trash" size={15} />
          <span>Sayfayı Sil</span>
        </button>
      </div>

      <div className="scan-review-columns">
        {/* Sol Kolon: Sayfa Önizleme & Kalite Metrikleri */}
        <aside className="scan-preview-aside">
          <div className="normalized-sheet-card">
            <img src={page.previewUrl} alt={`${page.pageNumber}. sayfa düzeltilmiş önizleme`} />
            {row && (
              <span
                className="scan-row-location"
                aria-hidden="true"
                style={{
                  left: `${(row.x / definition.pageWidthMm) * 100}%`,
                  top: `${(row.y / definition.pageHeightMm) * 100}%`,
                  width: `${(row.width / definition.pageWidthMm) * 100}%`,
                  height: `${(row.height / definition.pageHeightMm) * 100}%`,
                }}
              />
            )}
          </div>

          {!page.quality.ok && page.quality.reasons.length > 0 && (
            <div className="status-banner warning-banner" role="status">
              <p>Otomatik güvenilir cevap üretilmedi; maddeleri elle doğrulayın.</p>
              {page.quality.reasons.map(reason => <p key={reason}>{reason}</p>)}
            </div>
          )}

          <details className="quality-dropdown">
            <summary>
              <Icon name="sparkles" size={15} />
              <span>Görsel Kalite Puanı: <strong>%{(page.quality.score * 100).toFixed(0)}</strong></span>
            </summary>
            <div className="quality-details-list">
              <div className="q-metric">
                <span>Parlaklık:</span>
                <strong>{page.quality.metrics.brightness.toFixed(1)}</strong>
              </div>
              <div className="q-metric">
                <span>Netlik Skoru:</span>
                <strong>{page.quality.metrics.laplacianVariance.toFixed(1)}</strong>
              </div>
              <div className="q-metric">
                <span>Çözünürlük:</span>
                <strong>{page.quality.metrics.pixelsPerMm.toFixed(1)} px/mm</strong>
              </div>
            </div>
          </details>
        </aside>

        {/* Sağ Kolon: Madde Filtreleme ve Düzeltme Alanı */}
        <div className="scan-items-workspace">
          {/* Filtre Kontrolleri */}
          <div className="review-filters-bar">
            <div className="filter-group">
              <label htmlFor={`${id}-filter`}>Filtre</label>
              <select
                id={`${id}-filter`}
                value={filter}
                onChange={event => {
                  setFilter(event.target.value as typeof filter);
                  setSelectedId(null);
                  setOffset(0);
                }}
              >
                <option value="unresolved">Kontrol Bekleyen ({unresolved.length})</option>
                <option value="all">Tüm Maddeler ({expected.items.length})</option>
                <option value="reviewed">Manuel İncelenenler</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor={`${id}-status`}>Okuma Durumu</label>
              <select
                id={`${id}-status`}
                value={statusFilter}
                onChange={event => {
                  setStatusFilter(event.target.value as typeof statusFilter);
                  setSelectedId(null);
                  setOffset(0);
                }}
              >
                {STATUS_OPTIONS.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group filter-search-group">
              <label htmlFor={`${id}-search`}>Madde No</label>
              <input
                id={`${id}-search`}
                type="search"
                inputMode="numeric"
                value={query}
                placeholder="Örn. 42"
                onChange={event => {
                  setQuery(event.target.value);
                  setOffset(0);
                  setSelectedId(null);
                }}
              />
            </div>
          </div>

          {/* Madde Butonları Tablosu */}
          <div className="items-selector-grid" aria-label="İncelenecek maddeler">
            {filtered.slice(start, start + pageSize).map(item => {
              const itemResult = resolveItem(item, page);
              const isSelected = selected?.itemId === item.itemId;
              const hasReview = Boolean(itemResult.review);
              const originalStatus = itemResult.original?.status;

              return (
                <button
                  type="button"
                  key={item.itemId}
                  className={`item-select-chip ${isSelected ? 'active' : ''} ${hasReview ? 'reviewed' : ''} status-${originalStatus || 'none'}`}
                  onClick={() => setSelectedId(item.itemId)}
                >
                  <span className="item-num">{item.itemNumber}</span>
                  <span className="item-ans">
                    {hasReview
                      ? `${itemResult.review?.choiceId || 'Boş'} ✎`
                      : itemResult.original?.choiceId || readStatusLabel(itemResult.original)}
                  </span>
                </button>
              );
            })}
          </div>

          {!filtered.length && (
            <div className="empty-state-card">
              <p>Bu filtre kriterine uygun madde bulunamadı.</p>
            </div>
          )}

          {/* Sayfalama */}
          {filtered.length > pageSize && (
            <div className="review-pagination-bar">
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={start === 0}
                onClick={() => {
                  setSelectedId(null);
                  setOffset(start - pageSize);
                }}
              >
                Önceki maddeler
              </button>
              <span className="page-indicator">
                {start + 1}–{Math.min(start + pageSize, filtered.length)} / {filtered.length}
              </span>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={start + pageSize >= filtered.length}
                onClick={() => {
                  setSelectedId(null);
                  setOffset(start + pageSize);
                }}
              >
                Sonraki maddeler
              </button>
            </div>
          )}

          {/* Seçilen Maddenin Optik Kırpılmış Görüntüsü ve Cevap Seçimi */}
          {selected && resolved && (
            <div className="item-inspection-box card-elevated" aria-labelledby={`${id}-item`}>
              <div className="inspection-header">
                <h4 id={`${id}-item`} className="inspection-title">
                  Madde {selected.itemNumber} <span>{readStatusLabel(resolved.original)}</span>
                </h4>
                <div className="badge-chip badge-default">
                  {readStatusLabel(resolved.original)}
                </div>
              </div>

              {/* Taranmış gerçek kırpıntı */}
              <ItemCrop item={selected} page={page} definition={definition} onRendered={setRenderedCrop} />

              <p className="original-reading-info">
                <strong>Özgün okuma:</strong>{' '}
                {resolved.original
                  ? `${resolved.original.choiceId ?? 'Yanıt seçilmedi'} · ${resolved.original.reason}`
                  : 'Algoritma bu madde için sonuç üretmedi.'}
              </p>

              <fieldset className="scan-review-controls" disabled={!canReview}>
                <legend className="visually-hidden">İşaretleme Düzeltmesi</legend>
                {choices.map(area => (
                  <button
                    type="button"
                    key={area.responseId}
                    className={`choice-action-btn ${resolved.review?.choiceId === area.choiceId ? 'selected' : ''}`}
                    onClick={() => choose(area.choiceId)}
                    aria-label={`Madde ${selected.itemNumber}: ${area.choiceId}, ${area.label} olarak incele`}
                  >
                    {area.choiceId} · {area.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`choice-action-btn blank-btn ${resolved.review?.choiceId === null ? 'selected' : ''}`}
                  onClick={() => choose(null)}
                >
                  Boş olarak onayla
                </button>
              </fieldset>

              <p className="scan-review-provenance" role="status">
                {resolved.review
                  ? `Manuel inceleme: ${resolved.review.choiceId ?? 'Boş (açıkça onaylandı)'} · ${new Date(resolved.review.reviewedAt).toLocaleString('tr-TR')}`
                  : history.length
                  ? 'Manuel inceleme geri alındı; geçmiş korunuyor. Özgün algoritma çıktısı etkin.'
                  : 'Manuel düzeltme yok. Özgün algoritma çıktısı korunuyor.'}
              </p>

              {resolved.review && (
                <div className="undo-review-row">
                  <button
                    type="button"
                    className="btn-text-danger"
                    onClick={() => onReview(selected.itemId, undefined)}
                  >
                    Manuel incelemeyi geri al
                  </button>
                </div>
              )}

              {history.length > 0 && (
                <details className="scan-measurements history-dropdown">
                  <summary>Manuel inceleme geçmişi ({history.length})</summary>
                  <ol className="history-list">
                    {history.map((ev, i) => (
                      <li key={i}>
                        {ev.action === 'undo'
                          ? 'Geri alındı'
                          : `İncelendi: ${ev.next?.choiceId ?? 'Boş (açıkça onaylandı)'}`}
                        {' · '}
                        {new Date(ev.recordedAt).toLocaleString('tr-TR')}
                        {' · Oturum: '}
                        {ev.reviewerId}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
