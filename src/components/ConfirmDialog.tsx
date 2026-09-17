import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

/**
 * `window.confirm` yerine geçen erişilebilir doğrulama penceresi.
 * - Odak diyalog açıldığında içeri alınır, Esc ile vazgeçilir.
 * - Yıkıcı eylemde düğme kırmızı, metin açık sonuç bildirir (geri alınamaz vb.).
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  busy = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  tone?: 'danger' | 'neutral';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={event => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="modal-container confirm-dialog" role="document">
        <header className="modal-header">
          <div>
            <div className={`badge-chip ${tone === 'danger' ? 'badge-default' : 'badge-primary'}`}>
              <Icon name="alert" size={13} />
              Onay gerekli
            </div>
            <h2 id="confirm-dialog-title">{title}</h2>
            <p className="modal-subtitle">{description}</p>
          </div>
          <button type="button" className="icon-close-btn" onClick={onCancel} disabled={busy} aria-label="Vazgeç">
            <Icon name="close" size={18} />
          </button>
        </header>
        <footer className="modal-footer confirm-footer">
          <button ref={cancelRef} type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Vazgeç
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'İşleniyor…' : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
