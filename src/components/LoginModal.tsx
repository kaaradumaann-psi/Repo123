import { useEffect, useRef } from 'react';
import { LoginCard } from './LoginCard';
import { Icon } from './Icon';

type LoginModalProps = {
  open: boolean;
  error: string;
  busy: boolean;
  configured: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
  onClearError: () => void;
};

/** Accessible modal wrapper around the shared login card. Focus is trapped
 * lightly: Escape closes, initial focus goes to the dialog, and the
 * previously focused element is restored on close. */
export function LoginModal({ open, error, busy, configured, onClose, onSubmit, onClearError }: LoginModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus();
    };
  }, [open ]);

  if (!open) return null;

  return (
    <div
      className="login-modal-scrim"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="login-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        tabIndex={-1}
      >
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="Giriş penceresini kapat">
          <Icon name="close" size={18} />
        </button>
        <LoginCard
          mode={configured ? 'signin' : 'setup'}
          error={error}
          busy={busy}
          onSubmit={onSubmit}
          onClearError={onClearError}
          compact
        />
      </div>
    </div>
  );
}
