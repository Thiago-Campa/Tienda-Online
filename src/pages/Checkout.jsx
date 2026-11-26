import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { launchConfetti } from '../lib/confetti.js';
import { img, money } from '../lib/format.js';
import { useTitle } from '../lib/hooks.js';
import { Img } from '../components/ui.jsx';
import { IconArrow, IconBag, IconCard, IconShield, IconStore, IconTruck } from '../components/Icons.jsx';

export default function Checkout() {
  useTitle('Finalizar compra');
  const { items, subtotal, clear, refresh } = useCart();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    delivery: 'envio',
    address: '',
    city: '',
    zip: '',
    payment: store.paymentMethods[0]?.id,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    refresh()
      .then((notes) => notes.forEach((n) => toast(n, { type: 'warning', duration: 5000 })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const shipping = form.delivery === 'retiro' || subtotal >= store.shipping.freeFrom ? 0 : store.shipping.cost;
  const total = subtotal + shipping;

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Ingresá tu nombre y apellido.';
    if (form.phone.replace(/\D/g, '').length < 6) e.phone = 'Ingresá un teléfono válido.';
    if (form.delivery === 'envio') {
      if (form.address.trim().length < 4) e.address = 'Ingresá la dirección.';
      if (form.city.trim().length < 2) e.city = 'Ingresá la ciudad.';
    }
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setSending(true);
    try {
      const { order } = await api('/api/orders', {
        method: 'POST',
        body: { ...form, items: items.map((i) => ({ id: i.id, qty: i.qty })) },
      });
      clear();
      refreshUser();
      launchConfetti();
      navigate(`/ticket/${order.code}?nuevo=1`, { replace: true, state: { order } });
    } catch (err) {
      toast(err.message, { type: 'error', duration: 6000 });
      if (err.status === 409) refresh().catch(() => {});
      setSending(false);
    }
  };

  if (!items.length) {
    return (
      <div className="container empty empty--page">
        <div className="drawer__empty-icon">
          <IconBag size={30} />
        </div>
        <h1>Tu carrito está vacío</h1>
        <p>Agregá productos para finalizar la compra.</p>
        <Link to="/tienda" className="btn btn--primary btn--lg">
          Ir a la tienda <IconArrow size={18} />
        </Link>
      </div>
    );
  }

  const field = (key, label, props = {}) => (
    <label className={`field ${errors[key] ? 'has-error' : ''}`}>
      <span>{label}</span>
      <input value={form[key]} onChange={set(key)} aria-invalid={errors[key] ? 'true' : 'false'} {...props} />
      {errors[key] && <small className="field__error">{errors[key]}</small>}
    </label>
  );

  return (
    <div className="checkout container">
      <header className="checkout__head">
        <p className="eyebrow">Compra segura · {user?.email}</p>
        <h1 className="shop__title">Finalizar compra</h1>
      </header>

      <form className="checkout__grid" onSubmit={submit} ref={formRef} noValidate>
        <div className="checkout__main">
          <section className="panel">
            <h2 className="panel__title">
              <span className="panel__num">1</span> Tus datos
            </h2>
            <div className="form-grid">
              {field('name', 'Nombre y apellido', { autoComplete: 'name', placeholder: 'Ej: Lucía Fernández' })}
              {field('phone', 'Teléfono / WhatsApp', { type: 'tel', autoComplete: 'tel', placeholder: 'Ej: 11 5555-5555' })}
            </div>
          </section>

          <section className="panel">
            <h2 className="panel__title">
              <span className="panel__num">2</span> Entrega
            </h2>
            <div className="options">
              <label className={`option ${form.delivery === 'envio' ? 'is-selected' : ''}`}>
                <input type="radio" name="delivery" value="envio" checked={form.delivery === 'envio'} onChange={set('delivery')} />
                <IconTruck size={22} />
                <span className="option__body">
                  <b>Envío a domicilio</b>
                  <small>Llega en {store.shipping.eta}</small>
                </span>
                <span className="option__price">
                  {subtotal >= store.shipping.freeFrom ? 'Gratis' : money(store.shipping.cost)}
                </span>
              </label>
              <label className={`option ${form.delivery === 'retiro' ? 'is-selected' : ''}`}>
                <input type="radio" name="delivery" value="retiro" checked={form.delivery === 'retiro'} onChange={set('delivery')} />
                <IconStore size={22} />
                <span className="option__body">
                  <b>Retiro en el local</b>
                  <small>{store.shipping.pickup}</small>
                </span>
                <span className="option__price">Gratis</span>
              </label>
            </div>

            {form.delivery === 'envio' && (
              <div className="form-grid form-grid--address">
                {field('address', 'Dirección', { autoComplete: 'street-address', placeholder: 'Calle, número, piso, depto' })}
                {field('city', 'Ciudad', { autoComplete: 'address-level2', placeholder: 'Ej: Rosario' })}
                {field('zip', 'Código postal', { autoComplete: 'postal-code', placeholder: 'Ej: 2000' })}
              </div>
            )}
          </section>

          <section className="panel">
            <h2 className="panel__title">
              <span className="panel__num">3</span> Pago
            </h2>
            <div className="options">
              {store.paymentMethods.map((m) => (
                <label key={m.id} className={`option ${form.payment === m.id ? 'is-selected' : ''}`}>
                  <input type="radio" name="payment" value={m.id} checked={form.payment === m.id} onChange={set('payment')} />
                  <IconCard size={22} />
                  <span className="option__body">
                    <b>{m.label}</b>
                    <small>{m.detail}</small>
                  </span>
                </label>
              ))}
            </div>
            <label className="field">
              <span>
                Notas para el pedido <small>(opcional)</small>
              </span>
              <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Horario de entrega, timbre, regalo…" maxLength={300} />
            </label>
          </section>
        </div>

        <aside className="checkout__summary">
          <div className="summary">
            <h2 className="panel__title">Resumen</h2>
            <ul className="summary__items">
              {items.map((i) => (
                <li key={i.id}>
                  <span className="summary__img">
                    <Img src={img(i.image_url, 160)} alt="" />
                    <em>{i.qty}</em>
                  </span>
                  <span className="summary__name">{i.name}</span>
                  <b>{money(i.price * i.qty)}</b>
                </li>
              ))}
            </ul>
            <dl className="summary__totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{money(subtotal)}</dd>
              </div>
              <div>
                <dt>Envío</dt>
                <dd>{shipping ? money(shipping) : 'Gratis'}</dd>
              </div>
              <div className="summary__total">
                <dt>Total</dt>
                <dd>{money(total)}</dd>
              </div>
            </dl>
            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={sending}>
              {sending ? <span className="spinner spinner--sm" /> : null}
              {sending ? 'Procesando…' : `Confirmar compra · ${money(total)}`}
            </button>
            <p className="summary__safe">
              <IconShield size={16} /> Te enviamos el ticket a <b>{user?.email}</b>
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
