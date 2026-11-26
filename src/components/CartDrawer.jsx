import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { useCart } from '../context/CartContext.jsx';
import { useEscape, useLockScroll } from '../lib/hooks.js';
import { img, money } from '../lib/format.js';
import { Img, QtyStepper } from './ui.jsx';
import { IconArrow, IconBag, IconClose, IconTrash, IconTruck } from './Icons.jsx';

export default function CartDrawer() {
  const { items, count, subtotal, open, closeCart, setQty, remove } = useCart();
  const navigate = useNavigate();
  const closeRef = useRef(null);

  useLockScroll(open);
  useEscape(open, closeCart);
  useEffect(() => {
    if (open) setTimeout(() => closeRef.current?.focus(), 50);
  }, [open]);

  const missing = Math.max(0, store.shipping.freeFrom - subtotal);
  const progress = Math.min(100, (subtotal / store.shipping.freeFrom) * 100);

  const checkout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="drawer__scrim" onClick={closeCart} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-label="Carrito de compras">
        <header className="drawer__head">
          <h2>
            Tu carrito <sup>{count}</sup>
          </h2>
          <button ref={closeRef} type="button" className="icon-btn" onClick={closeCart} aria-label="Cerrar carrito">
            <IconClose />
          </button>
        </header>

        {items.length > 0 && (
          <div className="ship-progress">
            <p>
              <IconTruck size={18} />
              {missing > 0 ? (
                <span>
                  Te faltan <b>{money(missing)}</b> para el envío gratis
                </span>
              ) : (
                <span>
                  <b>¡Tenés envío gratis!</b> Lo despachamos en 24 h.
                </span>
              )}
            </p>
            <div className="ship-progress__bar">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="drawer__empty">
            <div className="drawer__empty-icon">
              <IconBag size={30} />
            </div>
            <h3>Tu carrito está vacío</h3>
            <p>Date una vuelta por la tienda: seguro algo te gusta.</p>
            <Link to="/tienda" className="btn btn--primary" onClick={closeCart}>
              Ir a la tienda <IconArrow size={18} />
            </Link>
          </div>
        ) : (
          <ul className="drawer__items">
            {items.map((item, i) => (
              <li key={item.id} className="line" style={{ '--i': i }}>
                <Link to={`/producto/${item.slug}`} onClick={closeCart} className="line__img">
                  <Img src={img(item.image_url, 200)} alt={item.name} />
                </Link>
                <div className="line__info">
                  <Link to={`/producto/${item.slug}`} onClick={closeCart} className="line__name">
                    {item.name}
                  </Link>
                  <span className="line__unit">{money(item.price)} c/u</span>
                  <div className="line__row">
                    <QtyStepper size="sm" value={item.qty} max={item.stock} onChange={(q) => setQty(item.id, q)} />
                    <button type="button" className="line__remove" onClick={() => remove(item.id)} aria-label={`Quitar ${item.name}`}>
                      <IconTrash size={17} />
                    </button>
                  </div>
                </div>
                <b className="line__total">{money(item.price * item.qty)}</b>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <footer className="drawer__foot">
            <div className="drawer__sum">
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <p className="drawer__note">Envío y medio de pago se eligen en el próximo paso.</p>
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={checkout}>
              Finalizar compra <IconArrow size={18} />
            </button>
            <button type="button" className="btn btn--link btn--block" onClick={closeCart}>
              Seguir comprando
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
