import { useCallback, useEffect, useRef, useState } from 'react';
import { store } from '../../config/store.config.js';

/** Ejecuta una función async y expone { data, error, loading, reload, setData }. */
export function useAsync(fn, deps = [], initial = null) {
  const [state, setState] = useState({ data: initial, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => fnRef.current())
      .then(
        (data) => alive && setState({ data, error: null, loading: false }),
        (error) => alive && setState((s) => ({ data: s.data, error, loading: false }))
      );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback(
    (d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })),
    []
  );
  return { ...state, reload, setData };
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${store.name}` : `${store.name} — ${store.tagline}`;
  }, [title]);
}

/** Anima un número desde su valor anterior al nuevo. */
export function useCountUp(value, { duration = 1100, decimals = 0, enabled = true } = {}) {
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined; // espera (ej: a que termine la pantalla de carga)
    const to = Number(value) || 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = currentRef.current;
    if (reduce || from === to) {
      currentRef.current = to;
      setDisplay(to);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const factor = 10 ** decimals;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const v = from + (to - from) * eased;
      currentRef.current = v;
      setDisplay(Math.round(v * factor) / factor);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, decimals, enabled]);

  return display;
}

/** true cuando terminó la pantalla de carga (para arrancar animaciones a la vista). */
export function useAppReady() {
  const [ready, setReady] = useState(() => document.documentElement.classList.contains('is-ready'));
  useEffect(() => {
    if (ready) return undefined;
    const on = () => setReady(true);
    window.addEventListener('app:ready', on);
    return () => window.removeEventListener('app:ready', on);
  }, [ready]);
  return ready;
}

export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Bloquea el scroll del body mientras `active` sea true. */
export function useLockScroll(active) {
  useEffect(() => {
    if (!active) return undefined;
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [active]);
}

export function useEscape(active, onEscape) {
  const ref = useRef(onEscape);
  ref.current = onEscape;
  useEffect(() => {
    if (!active) return undefined;
    const on = (e) => e.key === 'Escape' && ref.current();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [active]);
}
