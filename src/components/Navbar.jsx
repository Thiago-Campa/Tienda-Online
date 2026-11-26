import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useEscape, useLockScroll } from '../lib/hooks.js';
import { ThemeToggle } from './ui.jsx';
import { IconArrow, IconBag, IconClose, IconMenu, IconSearch, IconUser } from './Icons.jsx';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/tienda', label: 'Tienda' },
  { to: '/tienda?ofertas=1', label: 'Ofertas' },
  { to: '/tienda?orden=nuevos', label: 'Novedades' },
];

function Announcement() {
  const [i, setI] = useState(0);
  const items = store.announcements;
  useEffect(() => {
    if (items.length < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 4200);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <div className="announce">
      <p key={i} className="announce__msg">
        {items[i]}
      </p>
    </div>
  );
}

export default function Navbar() {
  const { count, openCart, bump } = useCart();
  const { user } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [term, setTerm] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [loc.pathname, loc.search]);

  useEffect(() => {
    if (search) setTimeout(() => inputRef.current?.focus(), 60);
  }, [search]);

  useLockScroll(menu);
  useEscape(menu || search, () => {
    setMenu(false);
    setSearch(false);
  });

  const submitSearch = (e) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/tienda?q=${encodeURIComponent(q)}` : '/tienda');
    setTerm('');
  };

  const isActive = (to, end) => {
    const [path, query] = to.split('?');
    if (end) return loc.pathname === path;
    if (query) return loc.pathname === path && loc.search.includes(query);
    return loc.pathname.startsWith(path) && !LINKS.some((l) => l.to.includes('?') && loc.search.includes(l.to.split('?')[1]));
  };

  return (
    <>
      <Announcement />
      <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${search ? 'is-searching' : ''}`}>
        <div className="nav__inner container">
          <button type="button" className="icon-btn nav__burger" onClick={() => setMenu(true)} aria-label="Abrir menú">
            <IconMenu />
          </button>

          <Link to="/" className="brand" aria-label={`${store.name}, ir al inicio`}>
            {store.name}
            <span className="brand__dot" aria-hidden="true" />
          </Link>

          <nav className="nav__links" aria-label="Principal">
            {LINKS.map((l) => {
              const active = isActive(l.to, l.end);
              return (
                <Link key={l.to} to={l.to} className={`nav__link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="nav__actions">
            <button type="button" className="icon-btn nav__search-btn" onClick={() => setSearch((s) => !s)} aria-label="Buscar productos" aria-expanded={search}>
              {search ? <IconClose /> : <IconSearch />}
            </button>
            <ThemeToggle />
            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/mi-cuenta') : '/ingresar'}
              className="icon-btn nav__account"
              aria-label={user ? 'Mi cuenta' : 'Ingresar'}
              title={user ? user.email : 'Ingresar'}
            >
              {user ? <span className="avatar avatar--sm">{(user.name || user.email)[0].toUpperCase()}</span> : <IconUser />}
            </Link>
            <button type="button" className="cart-btn" onClick={openCart} aria-label={`Abrir carrito (${count} productos)`}>
              <IconBag />
              <span className="cart-btn__label">Carrito</span>
              <span key={bump} className={`cart-btn__count ${count ? 'has-items' : ''} ${bump ? 'is-bumping' : ''}`}>
                {count}
              </span>
            </button>
          </div>
        </div>

        <form className="nav__search" onSubmit={submitSearch} role="search" aria-hidden={!search}>
          <div className="container nav__search-inner">
            <IconSearch />
            <input
              ref={inputRef}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="¿Qué estás buscando? Auriculares, relojes, zapatillas…"
              aria-label="Buscar"
              tabIndex={search ? 0 : -1}
            />
            <button type="submit" className="btn btn--primary btn--sm" tabIndex={search ? 0 : -1}>
              Buscar
            </button>
          </div>
        </form>
      </header>

      <div className={`mobile-menu ${menu ? 'is-open' : ''}`} aria-hidden={!menu}>
        <div className="mobile-menu__head container">
          <Link to="/" className="brand">
            {store.name}
            <span className="brand__dot" aria-hidden="true" />
          </Link>
          <button type="button" className="icon-btn" onClick={() => setMenu(false)} aria-label="Cerrar menú" tabIndex={menu ? 0 : -1}>
            <IconClose />
          </button>
        </div>
        <nav className="mobile-menu__links container" aria-label="Menú móvil">
          {[...LINKS, { to: user ? '/mi-cuenta' : '/ingresar', label: user ? 'Mi cuenta' : 'Ingresar' }].map((l, i) => (
            <Link key={l.to} to={l.to} style={{ '--i': i }} tabIndex={menu ? 0 : -1}>
              <span>{l.label}</span>
              <IconArrow />
            </Link>
          ))}
        </nav>
        <div className="mobile-menu__foot container">
          <p>{store.contact.hours}</p>
          <a href={`https://wa.me/${store.contact.whatsapp}`} target="_blank" rel="noreferrer" tabIndex={menu ? 0 : -1}>
            WhatsApp {store.contact.phone}
          </a>
        </div>
      </div>
    </>
  );
}
