import { useEffect, useState, type RefObject } from 'react';

/** Width of an element, kept current (the QR module size depends on the room it has). */
export function useWidth(ref: RefObject<HTMLElement | null>, fallback = 390): number {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setW(Math.round(el.getBoundingClientRect().width) || fallback);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallback]);
  return w;
}
