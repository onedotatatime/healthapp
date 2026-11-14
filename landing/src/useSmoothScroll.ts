import { useEffect } from 'react';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One Lenis instance at the app root. Off under prefers-reduced-motion (native scroll). */
export function useSmoothScroll() {
  useEffect(() => {
    const go = (lenis: Lenis | null) => (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
      else target.scrollIntoView({ behavior: 'auto' });
      history.replaceState(null, '', a.getAttribute('href')!);
    };

    if (prefersReducedMotion()) {
      const onClick = go(null);
      document.addEventListener('click', onClick);
      return () => document.removeEventListener('click', onClick);
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    // Pins add height after Lenis measured the page: re-measure its scroll limit on every ScrollTrigger refresh.
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener('refresh', onRefresh);
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onClick = go(lenis);
    document.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      document.removeEventListener('click', onClick);
      lenis.destroy();
    };
  }, []);
}
