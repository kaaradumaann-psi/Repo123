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
      <div className="scan-crop-map" aria-hidden="true">
        {item.responseAreas.map(area => (
          <span
            key={area.responseId}
            style={{ left: `${((area.x + area.width / 2 - rect.x) / rect.width) * 100}%` }}
          >
            {area.choiceId}
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
        Madde {item.itemNumber} · {item.columnIndex + 1}. sütun, {item.rowIndex + 1}. satır · normalize görüntüden kırpıntı
      </figcaption>
      {error && (
        <p className="status-banner error-banner" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </p>
      )}
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

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'muted'> = {
  reliable: 'ok',
  single: 'warn',
  ambiguous: 'warn',
  multiple: 'bad',
  invalid: 'bad',
  blank: 'muted',
  unread: 'muted',
};

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

  const statusTone = STATUS_TONE[resolved?.original?.status ?? 'unread'] ?? 'muted';
  const qualityPct = Math.round(page.quality.score * 100);

  return (
    <section className="scan-review-panel ws-card" aria-labelledby={`${id}-title`}>
      <div className="ws-card-head">
        <div>
          <p className="ws-eyebrow">Sayfa inceleme</p>
          <h3 id={`${id}-title`} className="ws-review-title">
            {page.pageNumber}. Sayfa · Madde {expected.firstItem}–{expected.lastItem}
          </h3>
          <p className="ws-source-line">
            Kaynak: <strong>{page.sourceName}</strong>
            <span className="ws-source-sep" aria-hidden="true">·</span>
            {unresolved.length > 0 ? (
              <span className="ws-todo-inline">{unresolved.length} madde kontrol bekliyor</span>
            ) : (
              <span className="ws-done-inline">Bekleyen kontrol yok</span>
            )}
          </p>
        </div>
        <button type="button" className="btn-secondary btn-danger-soft btn-sm" onClick={onRemove}>
          <Icon name="trash" size={15} />
          <span>Sayfayı Kaldır</span>
        </button>
      </div>

      <div className="scan-review-columns">
        {/* Sol: sayfa önizleme ve kalite */}
        <aside className="scan-preview-aside" aria-label="Sayfa önizleme ve görüntü kalitesi">
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

          <div className={`ws-quality${page.quality.ok ? '' : ' is-low'}`}>
            <div className="ws-quality-head">
              <span className="ws-quality-label">Görüntü kalitesi</span>
              <strong className="ws-quality-score">%{qualityPct}</strong>
            </div>
            <div className="ws-quality-bar" aria-hidden="true">
              <span style={{ width: `${qualityPct}%` }} />
            </div>
            <dl className="ws-quality-metrics">
              <div>
                <dt>Parlaklık</dt>
                <dd>{page.quality.metrics.brightness.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Netlik</dt>
                <dd>{page.quality.metrics.laplacianVariance.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Çözünürlük</dt>
                <dd>{page.quality.metrics.pixelsPerMm.toFixed(1)} px/mm</dd>
              </div>
            </dl>
          </div>

          {!page.quality.ok && page.quality.reasons.length > 0 && (
            <div className="status-banner warning-banner ws-quality-reasons" role="status">
              <Icon name="alert" size={18} />
              <div>
                <p>
                  <strong>Otomatik güvenilir cevap üretilmedi;</strong> maddeleri tek tek doğrulayın.
                </p>
                {page.quality.reasons.map(reason => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Sağ: madde listesi ve inceleme */}
        <div className="scan-items-workspace">
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

          <ul className="ws-legend" aria-label="Durum renkleri">
            {STATUS_OPTIONS.filter(([val]) => val !== 'all').map(([val, label]) => (
              <li key={val}>
                <span className={`ws-legend-dot status-${val}`} aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="items-selector-grid" aria-label="İncelenecek maddeler">
            {filtered.slice(start, start + pageSize).map(item => {
              const itemResult = resolveItem(item, page);
              const isSelected = selected?.itemId === item.itemId;
              const hasReview = Boolean(itemResult.review);
              const originalStatus = itemResult.original?.status ?? 'unread';

              return (
                <button
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  key={item.itemId}
                  className={`item-select-chip ${isSelected ? 'active' : ''} ${hasReview ? 'reviewed' : ''} status-${originalStatus}`}
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
              <div className="empty-state-icon" aria-hidden="true">
                <Icon name="search" size={26} />
              </div>
              <h4>Sonuç bulunamadı</h4>
              <p>Bu filtre kriterine uygun madde bulunamadı.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="ws-list-count" role="status">
              {filtered.length} madde listeleniyor
              {selected ? ` · Madde ${selected.itemNumber} seçili` : ''}
            </p>
          )}

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
                <Icon name="left" size={14} />
                <span>Önceki maddeler</span>
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
                <span>Sonraki maddeler</span>
                <Icon name="right" size={14} />
              </button>
            </div>
          )}

          {selected && resolved && (
            <div className="item-inspection-box" aria-labelledby={`${id}-item`}>
              <div className="inspection-header">
                <h4 id={`${id}-item`} className="inspection-title">
                  Madde {selected.itemNumber}
                </h4>
                <span className={`ws-status-badge tone-${statusTone}`}>
                  {readStatusLabel(resolved.original)}
                </span>
              </div>

              <ItemCrop item={selected} page={page} definition={definition} onRendered={setRenderedCrop} />

              <dl className="ws-evidence">
                <div className="ws-evidence-row">
                  <dt>Özgün okuma</dt>
                  <dd>
                    {resolved.original
                      ? <>{resolved.original.choiceId ?? 'Yanıt seçilmedi'} · {resolved.original.reason}</>
                      : 'Algoritma bu madde için sonuç üretmedi.'}
                  </dd>
                </div>
                {resolved.original && (
                  <div className="ws-evidence-row">
                    <dt>İşaret gücü</dt>
                    <dd>
                      %{Math.round(resolved.original.confidence * 100)}
                      <span className="ws-evidence-note">sezgisel ölçüm, olasılık değil</span>
                    </dd>
                  </div>
                )}
              </dl>

              {resolved.original && resolved.original.measurements.length > 0 ? (
                <div className="ws-measures">
                  <p className="ws-measures-title">Seçenek koyuluk ölçümleri</p>
                  <ul className="ws-measure-list">
                    {choices.map(area => {
                      const measurement = resolved.original!.measurements.find(m => m.responseId === area.responseId);
                      const pct = Math.round((measurement?.darkness ?? 0) * 100);
                      return (
                        <li key={area.responseId}>
                          <span className="ws-measure-choice">{area.choiceId}</span>
                          <span className="ws-measure-bar" aria-hidden="true">
                            <span style={{ width: `${pct}%` }} />
                          </span>
                          <span className="ws-measure-val">%{pct}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="ws-no-measure">Bu madde için seçenek ölçümü üretilmedi.</p>
              )}

              <div className="ws-verdict">
                <p className="ws-verdict-prompt">Kırpıntıyı inceleyip kararı onaylayın:</p>
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
              </div>
              {!canReview && (
                <p className="ws-crop-wait" role="status">
                  Satır görüntüsü hazırlanıyor; butonlar kırpıntı ekrana geldiğinde aktifleşir.
                </p>
              )}

              <p className="scan-review-provenance" role="status">
                {resolved.review
                  ? `Manuel inceleme: ${resolved.review.choiceId ?? 'Boş (açıkça onaylandı)'} · ${new Date(resolved.review.reviewedAt).toLocaleString('tr-TR')}`
                  : history.length
                  ? 'Manuel inceleme geri alındı; geçmiş korunuyor. Özgün algoritma çıktısı etkin.'
                  : 'Manuel düzeltme yok. Özgün algoritma çıktısı korunuyor.'}
              </p>

              {resolved.review && (
                <div className="undo-review-row">
                  <span className="undo-info">Manuel inceleme uygulandı.</span>
                  <button
                    type="button"
                    className="btn-text-danger"
                    onClick={() => onReview(selected.itemId, undefined)}
                  >
                    Geri al
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
