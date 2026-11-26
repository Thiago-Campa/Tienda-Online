import { useEffect, useRef, useState } from 'react';
import { store } from '../../config/store.config.js';

/**
 * Pantalla de carga: las letras de la marca suben una por una, un contador
 * llega a 100 y dos telones (oscuro + color de marca) se levantan.
 * La primera visita de la sesión dura ~2 s; las siguientes, menos de 1 s.
 */
export default function Loader({ ready, onDone }) {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    document.getElementById('boot')?.remove();
    document.documentElement.classList.add('is-loading');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem('loader-seen') === '1';
    } catch {
      /* sin storage */
    }
    const minTime = reduce ? 250 : seen ? 650 : 2100;
    const start = performance.now();
    let value = 0;
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      const canFinish = readyRef.current && elapsed >= minTime;
      const progress = Math.min(elapsed / minTime, 1);
      const target = canFinish ? 100 : 88 * (1 - Math.pow(1 - progress, 2.2));
      value += (target - value) * (canFinish ? 0.2 : 0.12);
      if (canFinish && value > 99.5) value = 100;
      setPct(value);

      if (value >= 100) {
        try {
          sessionStorage.setItem('loader-seen', '1');
        } catch {
          /* sin storage */
        }
        setLeaving(true);
        document.documentElement.classList.remove('is-loading');
        document.documentElement.classList.add('is-ready');
        window.dispatchEvent(new Event('app:ready'));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!leaving) return undefined;
    const t = setTimeout(() => doneRef.current?.(), 1250);
    return () => clearTimeout(t);
  }, [leaving]);

  const chars = [...store.name];
  const count = String(Math.round(pct)).padStart(3, '0');

  return (
    <div className={`loader ${leaving ? 'is-leaving' : ''}`} role="status" aria-live="polite" aria-label="Cargando la tienda">
      <div className="loader__curtain loader__curtain--accent" />
      <div className="loader__curtain">
        <div className="loader__top">
          <span>
            {store.name} © {new Date().getFullYear()}
          </span>
          <span className="loader__dot">Tienda online</span>
        </div>

        <div className="loader__center">
          <p className="loader__brand" aria-hidden="true">
            {chars.map((ch, i) => (
              <span className="loader__char" key={i}>
                <span style={{ '--i': i }}>{ch === ' ' ? ' ' : ch}</span>
              </span>
            ))}
          </p>
          <p className="loader__tag">{store.tagline}</p>
        </div>

        <div className="loader__bottom">
          <div className="loader__bar">
            <span style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
          <div className="loader__count" aria-hidden="true">
            {count}
            <small>%</small>
          </div>
        </div>
      </div>
    </div>
  );
}
