import { Suspense, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { store } from '../../../config/store.config.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEscape, useLockScroll } from '../../lib/hooks.js';
import { Spinner, ThemeToggle } from '../../components/ui.jsx';
import { IconArrowUpRight, IconBox, IconChart, IconClose, IconLogout, IconTag, IconUsers } from '../../components/Icons.jsx';
import '../../styles/admin.css';

const NAV = [
  { to: '/admin', label: 'Resumen', Icon: IconChart, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', Icon: IconBox },
  { to: '/admin/productos', label: 'Productos', Icon: IconTag },
  { to: '/admin/clientes', label: 'Clientes', Icon: IconUsers },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = [...NAV].reverse().find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to))) || NAV[0];

  useEffect(() => {
    document.title = `${current.label} · Panel · ${store.name}`;
    window.scrollTo(0, 0);
  }, [current.label]);

  const today = new Date().toLocaleDateString(store.locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const signOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin">
      <aside className="admin__side">
        <Link to="/" className="brand admin__brand">
          {store.name}
          <span className="brand__dot" aria-hidden="true" />
          <small>admin</small>
        </Link>
        <nav className="admin__nav" aria-label="Panel">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin__link ${isActive ? 'is-active' : ''}`}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin__side-foot">
          <Link to="/" className="admin__link">
            <IconArrowUpRight size={19} />
            <span>Ver la tienda</span>
          </Link>
          <div className="admin__me">
            <span className="avatar avatar--sm">{(user?.name || user?.email || '?')[0].toUpperCase()}</span>
            <span className="admin__me-text">
              <b>{user?.name || 'Administrador'}</b>
              <small>{user?.email}</small>
            </span>
            <button type="button" className="icon-btn icon-btn--sm" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
              <IconLogout size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="admin__main">
        <header className="admin__top">
          <div>
            <p className="admin__date">{today}</p>
            <h1 className="admin__title">{current.label}</h1>
          </div>
          <ThemeToggle />
        </header>
        <div className="admin__content" key={pathname}>
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

/* ── Piezas compartidas del panel ─────────────────────────── */

export function Modal({ open, title, onClose, children, footer, wide = false }) {
  useEscape(open, onClose);
  useLockScroll(open);
  if (!open) return null;
  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__scrim" onClick={onClose} />
      <div className={`modal__panel ${wide ? 'modal__panel--wide' : ''}`}>
        <header className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`acard ${className}`}>
      {(title || action) && (
        <header className="acard__head">
          {title && <h2>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'is-active' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
