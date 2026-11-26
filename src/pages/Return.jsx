import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { api } from '../lib/api.js';
import { useAsync, useTitle } from '../lib/hooks.js';
import { img, money, shortDate, ticketCode } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';
import { Img, QtyStepper, ReturnPill, Spinner } from '../components/ui.jsx';
import { IconArrowLeft, IconCheck, IconClock, IconWhatsapp } from '../components/Icons.jsx';

const { days, reasons, resolutions } = store.returns;

/** Muestra la solicitud ya enviada (estado, productos y mensaje de la tienda). */
function Submitted({ order }) {
  const r = order.return;
  const items = Array.isArray(r.items) ? r.items : [];
  return (
    <div className="panel return-done">
      <div className="return-done__head">
        <span className="ticket-hero__check">
          <IconCheck size={26} />
        </span>
        <div>
          <h2 className="panel__title">Solicitud de devolución</h2>
          <p className="muted">Enviada el {shortDate(r.created_at)}</p>
        </div>
        <ReturnPill status={r.status} />
      </div>

      <dl className="return-done__meta">
        <div>
          <dt>Productos</dt>
          <dd>
            {items.map((i) => (
              <span key={i.order_item_id}>
                {i.quantity} × {i.product_name}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>Motivo</dt>
          <dd>{r.reason}</dd>
        </div>
        <div>
          <dt>Pedís</dt>
          <dd>{resolutions.find((x) => x.id === r.resolution)?.label || r.resolution}</dd>
        </div>
        {r.details && (
          <div>
            <dt>Detalle</dt>
            <dd>{r.details}</dd>
          </div>
        )}
        {r.admin_note && (
          <div>
            <dt>Mensaje de la tienda</dt>
            <dd>{r.admin_note}</dd>
          </div>
        )}
      </dl>

      <p className="muted">
        {r.status === 'solicitada' && 'La estamos revisando. Te avisamos por mail cuando tengamos novedades.'}
        {r.status === 'aprobada' && 'Escribinos por WhatsApp con tu número de ticket para coordinar la entrega del producto.'}
        {r.status === 'rechazada' && 'Si querés que lo revisemos de nuevo, escribinos por WhatsApp.'}
        {r.status === 'completada' && 'Ya está resuelta. ¡Gracias por avisarnos!'}
      </p>
      <div className="return-done__actions">
        <a className="btn btn--accent" href={`https://wa.me/${store.contact.whatsapp}`} target="_blank" rel="noreferrer">
          <IconWhatsapp size={18} /> Hablar por WhatsApp
        </a>
        <Link className="btn btn--ghost" to={`/ticket/${order.code}`}>
          Volver al ticket
        </Link>
      </div>
    </div>
  );
}

export default function ReturnPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  useTitle('Devolución');

  const { data: loaded, error, loading } = useAsync(
    () => api(`/api/orders/${encodeURIComponent(code)}`).then((d) => d.order),
    [code]
  );
  const [order, setOrder] = useState(null);
  useEffect(() => setOrder(loaded || null), [loaded]);

  const [qty, setQty] = useState({}); // order_item_id -> cantidad a devolver (0 = no se devuelve)
  const [reason, setReason] = useState('');
  const [resolution, setResolution] = useState(resolutions[0]?.id);
  const [details, setDetails] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const picked = useMemo(() => Object.values(qty).filter((n) => n > 0).length, [qty]);

  if (!order && loading) return <Spinner />;
  if (!order || error) {
    return (
      <div className="container empty empty--page">
        <h1>No encontramos ese pedido</h1>
        <p>{error?.message || 'Revisá el link o buscalo en tus pedidos.'}</p>
        <Link to="/mi-cuenta" className="btn btn--primary">
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!picked) errs.items = 'Elegí al menos un producto.';
    if (!reason) errs.reason = 'Elegí el motivo.';
    if (reason === 'otro' && details.trim().length < 5) errs.details = 'Contanos brevemente el motivo.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      const { order: updated } = await api(`/api/orders/${encodeURIComponent(order.code)}/return`, {
        method: 'POST',
        body: {
          reason,
          resolution,
          details,
          items: Object.entries(qty)
            .filter(([, n]) => n > 0)
            .map(([id, n]) => ({ id: Number(id), qty: n })),
        },
      });
      setOrder(updated);
      toast('Recibimos tu solicitud de devolución', { type: 'success' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast(err.message, { type: 'error', duration: 6000 });
    } finally {
      setSending(false);
    }
  };

  let content;
  if (order.return) {
    content = <Submitted order={order} />;
  } else if (order.status !== 'entregado') {
    content = (
      <div className="panel">
        <h2 className="panel__title">
          <IconClock size={22} /> Todavía no se puede pedir
        </h2>
        <p className="muted">
          Vas a poder solicitar la devolución cuando el pedido figure como <b>entregado</b>. Desde ese día tenés {days} días.
        </p>
        <Link to={`/ticket/${order.code}`} className="btn btn--ghost">
          Volver al ticket
        </Link>
      </div>
    );
  } else if (order.return_expired || !order.can_return) {
    content = (
      <div className="panel">
        <h2 className="panel__title">
          <IconClock size={22} /> El plazo terminó
        </h2>
        <p className="muted">
          Los {days} días para pedir la devolución vencieron el {shortDate(order.return_deadline)}. Si pasó algo con el
          producto, escribinos y lo vemos.
        </p>
        <a className="btn btn--accent" href={`https://wa.me/${store.contact.whatsapp}`} target="_blank" rel="noreferrer">
          <IconWhatsapp size={18} /> Hablar por WhatsApp
        </a>
      </div>
    );
  } else {
    content = (
      <form className="return-form" onSubmit={submit} noValidate>
        <p className="return-form__deadline">
          <IconClock size={18} />
          Te quedan <b>{order.return_days_left} día{order.return_days_left === 1 ? '' : 's'}</b> para pedir la devolución (hasta el{' '}
          {shortDate(order.return_deadline)}).
        </p>

        <section className="panel">
          <h2 className="panel__title">
            <span className="panel__num">1</span> ¿Qué querés devolver?
          </h2>
          <ul className="return-items">
            {order.items.map((it) => {
              const n = qty[it.id] || 0;
              return (
                <li key={it.id} className={n > 0 ? 'is-picked' : ''}>
                  <label className="return-items__check">
                    <input
                      type="checkbox"
                      checked={n > 0}
                      onChange={(e) => {
                        setQty((q) => ({ ...q, [it.id]: e.target.checked ? 1 : 0 }));
                        setErrors((er) => ({ ...er, items: undefined }));
                      }}
                    />
                    <span className="return-items__box" aria-hidden="true">
                      <IconCheck size={14} />
                    </span>
                    <span className="summary__img">
                      <Img src={img(it.image_url, 160)} alt="" />
                    </span>
                    <span className="return-items__name">
                      {it.product_name}
                      <small>
                        {money(it.unit_price)} c/u · compraste {it.quantity}
                      </small>
                    </span>
                  </label>
                  {n > 0 && it.quantity > 1 && (
                    <QtyStepper size="sm" value={n} max={it.quantity} onChange={(v) => setQty((q) => ({ ...q, [it.id]: Math.min(it.quantity, Math.max(1, v)) }))} />
                  )}
                </li>
              );
            })}
          </ul>
          {errors.items && <small className="field__error">{errors.items}</small>}
        </section>

        <section className="panel">
          <h2 className="panel__title">
            <span className="panel__num">2</span> Contanos qué pasó
          </h2>
          <label className={`field ${errors.reason ? 'has-error' : ''}`}>
            <span>Motivo</span>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors((er) => ({ ...er, reason: undefined }));
              }}
              aria-invalid={errors.reason ? 'true' : 'false'}
            >
              <option value="">Elegí un motivo…</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.reason && <small className="field__error">{errors.reason}</small>}
          </label>
          <label className={`field ${errors.details ? 'has-error' : ''}`}>
            <span>
              Detalle {reason !== 'otro' && <small>(opcional)</small>}
            </span>
            <textarea
              rows={4}
              maxLength={600}
              value={details}
              onChange={(e) => {
                setDetails(e.target.value);
                setErrors((er) => ({ ...er, details: undefined }));
              }}
              aria-invalid={errors.details ? 'true' : 'false'}
              placeholder="Estado del producto, qué falla, si tiene la caja original…"
            />
            {errors.details && <small className="field__error">{errors.details}</small>}
          </label>
        </section>

        <section className="panel">
          <h2 className="panel__title">
            <span className="panel__num">3</span> ¿Qué preferís?
          </h2>
          <div className="options">
            {resolutions.map((r) => (
              <label key={r.id} className={`option ${resolution === r.id ? 'is-selected' : ''}`}>
                <input type="radio" name="resolution" value={r.id} checked={resolution === r.id} onChange={() => setResolution(r.id)} />
                <span className="option__body">
                  <b>{r.label}</b>
                  <small>{r.detail}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="return-form__actions">
          <button type="submit" className="btn btn--primary btn--lg" disabled={sending}>
            {sending ? <span className="spinner spinner--sm" /> : null}
            {sending ? 'Enviando…' : 'Enviar solicitud de devolución'}
          </button>
          <button type="button" className="btn btn--ghost btn--lg" onClick={() => navigate(`/ticket/${order.code}`)}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="return-page container">
      <header className="checkout__head">
        <Link to={`/ticket/${order.code}`} className="btn btn--link">
          <IconArrowLeft size={16} /> Volver al ticket
        </Link>
        <p className="eyebrow">Pedido {ticketCode(order.code)}</p>
        <h1 className="shop__title">Devolución</h1>
      </header>
      {content}
    </div>
  );
}
