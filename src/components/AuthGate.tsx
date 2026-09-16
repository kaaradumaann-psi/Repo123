import { useAuthSession } from '../auth/useAuthSession';
import type { ReactNode } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { LoginCard } from './LoginCard';

/**
 * Backwards-compatible gate kept for existing consumers. New code should use
 * `useAuthSession()` directly so public pages (landing) can render without a
 * session while the workspace stays protected.
 */
export function AuthGate({ children }: { children: (user: AuthenticatedUser, onLogout: () => void) => ReactNode }) {
  const { user, checking, error, configured, signIn, signOut, clearError } = useAuthSession();

  if (!configured) {
    return (
      <main className="auth-shell">
        <LoginCard mode="setup" error="" busy={false} onSubmit={() => Promise.resolve()} onClearError={clearError} />
      </main>
    );
  }
  if (checking) {
    return (
      <main className="auth-shell">
        <div className="auth-card auth-loading">
          <div className="spinner" />
          <p>Oturum doğrulanıyor, lütfen bekleyin...</p>
        </div>
      </main>
    );
  }
  if (user) {
    return (
      <>
        {children(user, () => {
          void signOut().catch(() => {});
        })}
      </>
    );
  }
  return (
    <main className="auth-shell">
      <LoginCard
        mode="signin"
        error={error}
        busy={false}
        onSubmit={(email, password) => signIn(email, password).then(() => {})}
        onClearError={clearError}
      />
    </main>
  );
}
