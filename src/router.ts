import { useEffect, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Route type                                                         */
/* ------------------------------------------------------------------ */

export type AppRoute =
  | { page: 'home' }
  | { page: 'islem' }
  | { page: 'form' }
  | { page: 'kayitlar' }
  | { page: 'kayit'; id: string }
  | { page: 'raporlar'; id: string; reportId?: string }
  | { page: 'yonetim' }
  | { page: 'ayarlar' }
  | { page: 'denetim' }
  | { page: 'sss' }
  | { page: 'gizlilik' }
  | { page: 'kullanim' }
  | { page: 'kaynaklar' }
  | { page: 'onizleme' }
  | { page: 'bulunamadi' };

/* ------------------------------------------------------------------ */
/*  Pathname → route                                                   */
/* ------------------------------------------------------------------ */

export function parseRoute(pathname: string): AppRoute {
  const raw = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const path = raw || '/';
  if (path === '/' || path === '/index.html' || path === '/optik-form.html') return { page: 'home' };
  if (path === '/islem') return { page: 'islem' };
  if (path === '/form') return { page: 'form' };
  if (path === '/kayitlar') return { page: 'kayitlar' };
  if (path === '/yonetim') return { page: 'yonetim' };
  if (path === '/ayarlar') return { page: 'ayarlar' };
  if (path === '/denetim') return { page: 'denetim' };
  if (path === '/sss') return { page: 'sss' };
  if (path === '/gizlilik') return { page: 'gizlilik' };
  if (path === '/kullanim') return { page: 'kullanim' };
  if (path === '/kaynaklar') return { page: 'kaynaklar' };
  if (path === '/onizleme') return { page: 'onizleme' };
  const reportMatch = /^\/kayitlar\/([^/]+)\/raporlar(?:\/([^/]+))?$/.exec(path);
  if (reportMatch) return { page: 'raporlar', id: reportMatch[1]!, ...(reportMatch[2] ? { reportId: reportMatch[2] } : {}) };
  const kayitMatch = /^\/kayitlar\/([^/]+)$/.exec(path);
  if (kayitMatch) return { page: 'kayit', id: kayitMatch[1]! };
  return { page: 'bulunamadi' };
}

/* ------------------------------------------------------------------ */
/*  History API navigation                                             */
/* ------------------------------------------------------------------ */

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  for (const fn of listeners) fn();
}

const navigationGuards = new Set<() => boolean>();
/** Only active editors register a guard; all other routes keep their existing behavior. */
export function registerNavigationGuard(guard: () => boolean): () => void {
  navigationGuards.add(guard);
  return () => { navigationGuards.delete(guard); };
}
export function navigate(to: string, options?: { replace?: boolean }): void {
  if ([...navigationGuards].some(guard => !guard())) return;
  if (options?.replace) {
    window.history.replaceState(null, '', to);
  } else {
    window.history.pushState(null, '', to);
  }
  notify();
}

/* ------------------------------------------------------------------ */
/*  useRoute — re-renders the component on every navigation            */
/* ------------------------------------------------------------------ */

export function useRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname));
  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.pathname));
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  return route;
}

/* ------------------------------------------------------------------ */
/*  Global <a> click interceptor                                       */
/* ------------------------------------------------------------------ */

/**
 * Installs a document-level click handler that intercepts same-origin <a>
 * clicks and uses the History API instead of full-page navigation. Every
 * <a> in the app gets SPA behaviour without modifying individual components.
 *
 * Skipped: hash anchors, mailto / tel / blob / data links, download
 * attributes, target=_blank, cross-origin, /api/* paths, and clicks with
 * modifier keys.
 */
export function installLinkInterceptor(): void {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const anchor = (e.target as HTMLElement | null)?.closest?.('a') as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.startsWith('blob:') || href.startsWith('data:')) return;
    if (anchor.hasAttribute('download')) return;
    if (anchor.target === '_blank') return;
    if (anchor.origin !== window.location.origin) return;
    if (href.startsWith('/api/')) return;

    e.preventDefault();
    navigate(anchor.pathname + anchor.search + anchor.hash);
  });
}