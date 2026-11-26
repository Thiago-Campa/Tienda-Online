import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { api } from '../lib/api.js';
import { img, money } from '../lib/format.js';
import { useAppReady, useAsync, useCountUp, useTitle } from '../lib/hooks.js';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import { Countdown, Em, Img, Reveal } from '../components/ui.jsx';
import { BENEFIT_ICONS, IconArrow, IconArrowUpRight, IconSparkle, IconStar } from '../components/Icons.jsx';

function nextSundayNight() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  d.setHours(23, 59, 59, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 7);
  return d;
}

/* ── Hero ──────────────────────────────────────────────── */

function Stat({ stat }) {
  const ready = useAppReady();
  const value = useCountUp(stat.value, { decimals: stat.decimals || 0, duration: 1800, enabled: ready });
  const formatted = new Intl.NumberFormat(store.locale, {
    minimumFractionDigits: stat.decimals || 0,
    maximumFractionDigits: stat.decimals || 0,
  }).format(value);
  return (
    <li>
      <b>
        {stat.prefix}
        {formatted}
        {stat.suffix}
      </b>
      <span>{stat.label}</span>
    </li>
  );
}

function RoundBadge() {
  const text = `Envío gratis desde ${money(store.shipping.freeFrom)} · Envío gratis desde ${money(store.shipping.freeFrom)} · `;
  return (
    <div className="round-badge" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <defs>
          <path id="round-badge-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text>
          <textPath href="#round-badge-path" textLength="488">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="round-badge__core">
        <IconSparkle size={26} />
      </span>
    </div>
  );
}

function Hero({ products }) {
  const stageRef = useRef(null);
  const onMove = (e) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onLeave = () => {
    stageRef.current?.style.setProperty('--mx', 0);
    stageRef.current?.style.setProperty('--my', 0);
  };
  const cards = products.slice(0, 3);

  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow">
            <span className="pulse-dot" aria-hidden="true" />
            {store.hero.eyebrow}
          </p>
          <h1 className="hero__title">
            {store.hero.title.map((line, i) => (
              <span className="hero__line" key={i}>
                <span style={{ '--i': i }}>
                  <Em text={line} />
                </span>
              </span>
            ))}
          </h1>
          <p className="hero__lead">{store.hero.lead}</p>
          <div className="hero__ctas">
            <Link to={store.hero.primary.to} className="btn btn--primary btn--lg">
              {store.hero.primary.label} <IconArrow size={18} />
            </Link>
            <Link to={store.hero.secondary.to} className="btn btn--ghost btn--lg">
              {store.hero.secondary.label}
            </Link>
          </div>
          <ul className="hero__stats">
            {store.stats.map((s) => (
              <Stat key={s.label} stat={s} />
            ))}
          </ul>
        </div>

        <div className="hero__stage" ref={stageRef} onMouseMove={onMove} onMouseLeave={onLeave}>
          {cards.length === 0
            ? [0, 1, 2].map((i) => <div key={i} className={`hero__card hero__card--${i} skeleton`} />)
            : cards.map((p, i) => (
                <Link key={p.id} to={`/producto/${p.slug}`} className={`hero__card hero__card--${i}`}>
                  <Img src={img(p.image_url, 700)} alt={p.name} />
                  <span className="hero__tag">
                    <span>{p.name}</span>
                    <b>{money(p.price)}</b>
                  </span>
                </Link>
              ))}
          <RoundBadge />
        </div>
      </div>
    </section>
  );
}

/* ── Cinta de beneficios ──────────────────────────────── */

function Marquee() {
  const items = [...store.marquee, ...store.marquee];
  return (
    <div className="marquee" aria-label={store.marquee.join(', ')}>
      <div className="marquee__track" aria-hidden="true">
        {[0, 1].map((k) => (
          <div className="marquee__group" key={k}>
            {items.map((t, i) => (
              <span key={`${k}-${i}`}>
                {t}
                <IconSparkle size={18} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Índice de categorías con vista previa que sigue al mouse ── */

function Categories({ categories }) {
  const [hover, setHover] = useState(null);
  const previewRef = useRef(null);

  const onMove = (e) => {
    const el = previewRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
  };

  if (!categories.length) return null;

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">Explorá por categoría</p>
          <h2 className="section__title">
            Todo lo que <em>buscás</em>, ordenado.
          </h2>
        </Reveal>

        <ul className="cat-index" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {categories.map((c, i) => (
            <Reveal as="li" key={c.id} delay={i * 60}>
              <Link to={`/tienda?categoria=${c.slug}`} className="cat-row" onMouseEnter={() => setHover(c.id)}>
                <span className="cat-row__n">{String(i + 1).padStart(2, '0')}</span>
                <span className="cat-row__name">{c.name}</span>
                <span className="cat-row__count">
                  {c.product_count} producto{c.product_count === 1 ? '' : 's'}
                </span>
                {c.cover && <Img className="cat-row__thumb" src={img(c.cover, 200)} alt="" />}
                <span className="cat-row__arrow">
                  <IconArrowUpRight />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>

        <div ref={previewRef} className={`cat-preview ${hover ? 'is-visible' : ''}`} aria-hidden="true">
          {categories.map((c) =>
            c.cover ? (
              <img key={c.id} src={img(c.cover, 520)} alt="" className={hover === c.id ? 'is-active' : ''} />
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Productos destacados ─────────────────────────────── */

function Featured({ products, loading }) {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="section__head section__head--row">
          <div>
            <p className="eyebrow">Lo más elegido</p>
            <h2 className="section__title">
              Favoritos de <em>la casa</em>
            </h2>
          </div>
          <Link to="/tienda" className="btn btn--ghost">
            Ver todo <IconArrow size={18} />
          </Link>
        </Reveal>
        <div className="grid-products">
          {loading && !products.length
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 8).map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 70}>
                  <ProductCard product={p} index={i} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ── Promo con cuenta regresiva ───────────────────────── */

function Promo() {
  const target = useMemo(() => (store.promo.endsAt ? new Date(store.promo.endsAt) : nextSundayNight()), []);
  if (target.getTime() < Date.now()) return null;
  return (
    <section className="section">
      <div className="container">
        <Reveal className="promo">
          <div className="promo__copy">
            <p className="eyebrow eyebrow--light">{store.promo.eyebrow}</p>
            <h2 className="promo__title">
              <Em text={store.promo.title} />
            </h2>
            <p className="promo__text">{store.promo.text}</p>
            <Countdown target={target} />
            <Link to={store.promo.cta.to} className="btn btn--accent btn--lg">
              {store.promo.cta.label} <IconArrow size={18} />
            </Link>
          </div>
          <div className="promo__media">
            <Img src={store.promo.image} alt="" />
            {store.promo.sticker && (
              <span className="promo__sticker">
                {store.promo.sticker[0]}
                <b>{store.promo.sticker[1]}</b>
              </span>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Beneficios ───────────────────────────────────────── */

function Benefits() {
  return (
    <section className="section section--tight">
      <div className="container benefits">
        {store.benefits.map((b, i) => {
          const Icon = BENEFIT_ICONS[b.icon] || IconSparkle;
          return (
            <Reveal className="benefit" key={b.title} delay={i * 80}>
              <span className="benefit__icon">
                <Icon size={24} />
              </span>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ── Opiniones ────────────────────────────────────────── */

function Testimonials() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">Opiniones reales</p>
          <h2 className="section__title">
            Lo que dicen <em>nuestros clientes</em>
          </h2>
        </Reveal>
      </div>
      <div className="testimonials">
        {store.testimonials.map((t, i) => (
          <Reveal as="figure" className="quote" key={t.name} delay={i * 70}>
            <div className="quote__stars" aria-label="5 de 5 estrellas">
              {Array.from({ length: 5 }, (_, k) => (
                <IconStar key={k} size={16} filled />
              ))}
            </div>
            <blockquote>“{t.text}”</blockquote>
            <figcaption>
              <span className="avatar">{t.name[0]}</span>
              <span>
                <b>{t.name}</b>
                <small>{t.city} · Compra verificada</small>
              </span>
            </figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Preguntas frecuentes + newsletter ────────────────── */

function FaqNewsletter() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api('/api/newsletter', { method: 'POST', body: { email } });
      toast('¡Listo! Te vamos a avisar de las novedades.', { type: 'success' });
      setEmail('');
    } catch (err) {
      toast(err.message, { type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="section">
      <div className="container faq-news">
        <Reveal className="faq">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 className="section__title">
            Antes de <em>comprar</em>
          </h2>
          <div className="faq__list">
            {store.faq.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>
                  {f.q}
                  <span className="faq__icon" aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>

        <Reveal className="newsletter" delay={120}>
          <p className="eyebrow eyebrow--light">Newsletter</p>
          <h3>
            Enterate <em>primero</em> de lanzamientos y ofertas.
          </h3>
          <p>Un mail cada tanto, sin spam. Te das de baja cuando quieras.</p>
          <form onSubmit={subscribe} className="newsletter__form">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              aria-label="Tu email"
            />
            <button type="submit" className="btn btn--accent" disabled={sending}>
              {sending ? 'Enviando…' : 'Suscribirme'}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  useTitle('');
  const featured = useAsync(() => api('/api/products?featured=1&limit=8').then((d) => d.products), [], []);
  const categories = useAsync(() => api('/api/categories').then((d) => d.categories), [], []);

  return (
    <>
      <Hero products={featured.data} />
      <Marquee />
      <Featured products={featured.data} loading={featured.loading} />
      <Categories categories={categories.data.filter((c) => c.product_count > 0)} />
      <Promo />
      <Benefits />
      <Testimonials />
      <FaqNewsletter />
    </>
  );
}
