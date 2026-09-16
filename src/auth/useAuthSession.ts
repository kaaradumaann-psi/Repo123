import { useCallback, useEffect, useState } from 'react';
import type { AuthenticatedUser } from './authTypes';
import { getSession, onAuthChange, signIn as signInWithPassword, signOut as signOutSession, userFromSession } from './supabaseAuth';
import { supabase, supabaseConfig } from './supabaseClient';

export type AuthSession = {
  user: AuthenticatedUser | null;
  checking: boolean;
  error: string;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthenticatedUser>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

/**
 * Shared session state for the public landing page and the authenticated
 * workspace. Same semantics as the former AuthGate: hydrate once from the
 * stored session, follow auth changes, and re-validate the profile every
 * minute (and on window focus) so a deactivated account is signed out.
 */
export function useAuthSession(): AuthSession {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    let alive = true;
    async function hydrate() {
      try {
        const session = await getSession();
        const profile = await userFromSession(session);
        if (alive) {
          setUser(profile);
          setError('');
        }
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : 'Kullanıcı oturumu doğrulanamadı.');
      } finally {
        if (alive) setChecking(false);
      }
    }
    void hydrate();
    const { data } = onAuthChange((_event, session) => {
      if (!session) {
        if (alive) setUser(null);
        return;
      }
      window.setTimeout(() => {
        void userFromSession(session)
          .then(profile => {
            if (alive) {
              setUser(profile);
              setError('');
              setChecking(false);
            }
          })
          .catch(cause => {
            if (alive) {
              setUser(null);
              setError(cause instanceof Error ? cause.message : 'Kullanıcı yetkisi doğrulanamadı.');
              setChecking(false);
            }
          });
      }, 0);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    let alive = true;
    const validate = async () => {
      try {
        const session = await getSession();
        const profile = await userFromSession(session);
        if (!profile && alive) setUser(null);
      } catch {
        if (alive) setUser(null);
      }
    };
    const interval = window.setInterval(() => {
      void validate();
    }, 60_000);
    window.addEventListener('focus', validate);
    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', validate);
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const profile = await signInWithPassword(email, password);
    setUser(profile);
    setError('');
    return profile;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutSession();
    } finally {
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return { user, checking, error, configured: supabaseConfig.configured, signIn, signOut, clearError };
}
