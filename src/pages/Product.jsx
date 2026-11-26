import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { api } from '../lib/api.js';
import { useAsync, useTitle } from '../lib/hooks.js';
import { discountPct, img, installment, money } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Img, QtyStepper, Reveal, Spinner } from '../components/ui.jsx';
import { IconArrow, IconBag, IconRefresh, IconShield, IconTruck } from '../components/Icons.jsx';

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add, items } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const { data, loading, error } = useAsync(() => api(`/api/products/${encodeURIComponent(slug)}`), [slug]);

  const product = data?.product;
  useTitle(product?.name || 'Producto');

  if (loading && !data) return <Spinner />;
  if (error || !product) {
    return (
      <div className="container empty empty--page">
        <p className="eyebrow">Error 404</p>
        <h1>No encontramos ese producto</h1>
        <p>Puede que ya no esté a la venta.</p>
        <Link to="/tienda" className="btn btn--primary">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const off = discountPct(product.price, product.compare_at_price);
  const inCart = items.find((i) => i.id === product.id)?.qty || 0;
  const available = Math.max(0, product.stock - inCart);
  const soldOut = product.stock <= 0;

  const zoom = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const addToCart = (goCheckout = false) => {
    const r = add(product, qty, { openDrawer: !goCheckout });
    if (!r.ok && !(goCheckout && r.reason === 'max')) {
      toast(r.reason === 'stock' ? 'Sin stock por ahora.' : 'Ya tenés en el carrito todo el stock disponible.', { type: 'warning' });
      return;
    }
    if (r.limited) toast(`Agregamos las unidades disponibles (${product.stock}).`, { type: 'warning' });
    setQty(1);
    if (goCheckout) navigate('/checkout');
  };

  return (
    <div className="pdp">
      <div className="container">
        <nav className="crumbs" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/tienda">Tienda</Link>
          {product.category_slug && (
            <>
              <span>/</span>
              <Link to={`/tienda?categoria=${product.category_slug}`}>{product.category_name}</Link>
            </>
          )}
        </nav>

        <div className="pdp__grid">
          <div className="pdp__media" onMouseMove={zoom}>
            <Img src={img(product.image_url, 1200)} alt={product.name} />
            <div className="pcard__badges">
              {off > 0 && <span className="badge badge--accent">-{off}%</span>}
              {product.badge && <span className="badge">{product.badge}</span>}
            </div>
          </div>

          <div className="pdp__info">
            <p className="eyebrow">{product.category_name}</p>
            <h1 className="pdp__title">{product.name}</h1>

            <div className="pdp__price">
              <b>{money(product.price)}</b>
              {off > 0 && (
                <>
                  <s>{money(product.compare_at_price)}</s>
                  <span className="badge badge--accent">Ahorrás {money(product.compare_at_price - product.price)}</span>
                </>
              )}
            </div>
            <p className="pdp__installments">
              {store.installments} cuotas sin interés de <b>{installment(product.price)}</b>
            </p>

            <p className="pdp__desc">{product.description}</p>

            <div className={`stock-line ${soldOut ? 'is-out' : product.stock <= store.lowStock ? 'is-low' : 'is-ok'}`}>
              <i aria-hidden="true" />
              {soldOut
                ? 'Sin stock por el momento'
                : product.stock <= store.lowStock
                  ? `¡Quedan solo ${product.stock} unidades!`
                  : 'En stock, listo para despachar'}
              {product.sold > 0 && <span className="stock-line__sold">· {product.sold} vendidos</span>}
            </div>

            {!soldOut && (
              <div className="pdp__buy">
                <QtyStepper value={qty} max={Math.max(1, available)} onChange={(v) => setQty(Math.max(1, Math.min(v, Math.max(1, available))))} />
                <button type="button" className="btn btn--primary btn--lg pdp__add" onClick={() => addToCart(false)} disabled={available <= 0}>
                  <IconBag size={19} /> {available <= 0 ? 'Ya está en tu carrito' : 'Agregar al carrito'}
                </button>
                <button type="button" className="btn btn--ghost btn--lg btn--block" onClick={() => addToCart(true)}>
                  Comprar ahora <IconArrow size={18} />
                </button>
              </div>
            )}

            <ul className="pdp__perks">
              <li>
                <IconTruck size={20} />
                <span>
                  <b>Envío {money(store.shipping.cost)}</b> · gratis desde {money(store.shipping.freeFrom)}. Llega en {store.shipping.eta}.
                </span>
              </li>
              <li>
                <IconRefresh size={20} />
                <span>
                  <b>Cambios sin vueltas</b> durante 30 días.
                </span>
              </li>
              <li>
                <IconShield size={20} />
                <span>
                  <b>Compra protegida</b> con ticket digital y seguimiento.
                </span>
              </li>
            </ul>

            <details className="faq__item">
              <summary>
                Retiro en el local
                <span className="faq__icon" aria-hidden="true" />
              </summary>
              <p>Sin cargo en {store.shipping.pickup}. Te avisamos por mail cuando esté listo.</p>
            </details>
          </div>
        </div>

        {data.related?.length > 0 && (
          <section className="section">
            <Reveal className="section__head section__head--row">
              <h2 className="section__title">
                También te puede <em>gustar</em>
              </h2>
              <Link to={product.category_slug ? `/tienda?categoria=${product.category_slug}` : '/tienda'} className="btn btn--ghost">
                Ver más <IconArrow size={18} />
              </Link>
            </Reveal>
            <div className="grid-products">
              {data.related.map((p, i) => (
                <Reveal key={p.id} delay={i * 70}>
                  <ProductCard product={p} index={i} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>

      {!soldOut && (
        <div className="buy-bar">
          <div>
            <small>{product.name}</small>
            <b>{money(product.price)}</b>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => addToCart(false)} disabled={available <= 0}>
            <IconBag size={18} /> Agregar
          </button>
        </div>
      )}
    </div>
  );
}
