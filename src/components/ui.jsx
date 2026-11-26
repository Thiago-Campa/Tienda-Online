import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { IconMinus, IconMoon, IconPlus, IconSun } from './Icons.jsx';
import { STATUS, emphasis } from '../lib/format.js';

/** Aparece suavemente al entrar en pantalla. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-in');
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ '--d': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

/** Texto con *énfasis* en itálica serif. */
export function Em({ text }) {
  return emphasis(text).map((part, i) => (part.em ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>));
}

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`icon-btn theme-toggle ${dark ? 'is-dark' : ''} ${className}`}
      onClick={toggle}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
    >
      <span className="theme-toggle__icon theme-toggle__sun">
        <IconSun />
      </span>
      <span className="theme-toggle__icon theme-toggle__moon">
        <IconMoon />
      </span>
    </button>
  );
}

export function QtyStepper({ value, max, onChange, size = 'md' }) {
  return (
    <div className={`stepper stepper--${size}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Restar uno">
        <IconMinus size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Sumar uno">
        <IconPlus size={16} />
      </button>
    </div>
  );
}

export function StatusPill({ status }) {
  const s = STATUS[status] || { label: status, tone: 'neutral' };
  return (
    <span className={`pill pill--${s.tone}`}>
      <i aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="page-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function RequireAuth({ children, admin = false }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/ingresar?next=${next}`} replace />;
  }
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

/** Cuenta regresiva hasta `target` (Date). */
export function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const parts = [
    ['Días', Math.floor(diff / 86400000)],
    ['Horas', Math.floor(diff / 3600000) % 24],
    ['Min', Math.floor(diff / 60000) % 60],
    ['Seg', Math.floor(diff / 1000) % 60],
  ];
  return (
    <div className="countdown" role="timer" aria-label="Tiempo restante de la promoción">
      {parts.map(([label, value]) => (
        <div className="countdown__cell" key={label}>
          <span className="countdown__num" key={`${label}-${value}`}>
            {String(value).padStart(2, '0')}
          </span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

/** Imagen con fundido al cargar y fondo de respaldo si falla. */
export function Img({ src, alt = '', className = '', ...rest }) {
  const [state, setState] = useState('loading');
  useEffect(() => setState('loading'), [src]);
  return (
    <span className={`img img--${state} ${className}`}>
      {src && state !== 'error' ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          {...rest}
        />
      ) : (
        <span className="img__fallback" aria-hidden="true" />
      )}
    </span>
  );
}
