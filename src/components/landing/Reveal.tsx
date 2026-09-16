import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms when several reveals share a viewport entry. */
  delay?: number;
  as?: 'div' | 'li' | 'article' | 'figure';
};

/** Scroll-triggered reveal. Adds `.is-visible` once the element enters the
 * viewport. Purely progressive enhancement: content is visible without JS
 * observers (the CSS hides only when `.reveal` is present *and* JS runs —
 * see landing.css where the hidden state is applied via `.js .reveal`). */
export function Reveal({ children, className = '', delay = 0, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const Tag = as as 'div';

  useEffect(() => {
    document.documentElement.classList.add('js');
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined = delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <Tag ref={ref} className={`reveal${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </Tag>
  );
}
