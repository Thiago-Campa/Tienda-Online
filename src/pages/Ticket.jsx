import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { store } from '../../config/store.config.js';
import { api } from '../lib/api.js';
import { useAsync, useTitle } from '../lib/hooks.js';
import { dateTime, money, paymentLabel, ticketCode } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Spinner, StatusPill } from '../components/ui.jsx';
import { IconArrow, IconCheck, IconCopy, IconMail, IconPrinter } from '../components/Icons.jsx';

const STEPS = ['pendiente', 'pagado', 'enviado', 'entregado'];

/** Código de barras decorativo generado a partir del número de ticket. */
function Barcode({ value }) {
  const bars = useMemo(() => {
    const out = [];
    for (const ch of `*${value}*`) {
      const n = ch.charCodeAt(0);
      for (let b = 0; b < 6; b++) out.push({ w: ((n >> b) & 1) + 1 + ((n + b) % 3 === 0 ? 1 : 0), gap: ((n >> (b + 1)) & 1) + 1 });
    }
    return out;
  }, [value]);
  return (
    <div className="barcode" aria-hidden="true">
      {bars.map((b, i) => (
        <span key={i} style={{ width: b.w, marginRight: b.gap }} />
      ))}
    </div>
  );
}

function CopyRow({ label, value }) {
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copiado`, { type: 'success', duration: 2000 });
    } catch {
      toast('No se pudo copiar', { type: 'error' });
    }
  };
  return (
    <div className="copy-row">
      <span>{label}</span>
      <b>{value}</b>
      <button type="button" className="icon-btn icon-btn--sm" onClick={copy} aria-label={`Copiar ${label}`}>
        <IconCopy size={16} />
      </button>
    </div>
  );
}

function PaymentInfo({ order }) {
  if (order.status === 'cancelado') return null;
  if (order.payment_method === 'transferencia') {
    return (
      <div className="ticket__pay">
        <p>
          <b>Transferí {money(order.total)}</b> y mandanos el comprobante por WhatsApp con el número de ticket.
        </p>
        <CopyRow label="Alias" value={store.bank.alias} />
        <CopyRow label="CBU" value={store.bank.cbu} />
        <div className="copy-row">
          <span>Titular</span>
          <b>{store.bank.holder}</b>
        </div>
      </div>
    );
  }
  if (order.payment_method === 'tarjeta') {
    return (
      <div className="ticket__pay">
        <p>
          Te vamos a enviar un <b>link de pago seguro</b> para abonar con tarjeta en {store.installments} cuotas sin interés.
        </p>
      </div>
    );
  }
  return (
    <div className="ticket__pay">
      <p>
        Pagás <b>en efectivo</b> al {order.delivery_method === 'retiro' ? 'retirar' : 'recibir'} el pedido.
      </p>
    </div>
  );
}

export default function Ticket() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const isNew = params.get('nuevo') === '1';
  const initial = state?.order?.code === code ? state.order : null;

  const { data, error, loading } = useAsync(() => api(`/api/orders/${encodeURIComponent(code)}`).then((d) => d.order), [code], initial);
  // El aviso de "mail enviado" solo viene en la respuesta de la compra: lo conservamos.
  const order = data && initial ? { email_sent: initial.email_sent, ...data } : data;
  const [qr, setQr] = useState('');

  useTitle(order ? `Ticket ${ticketCode(order.code)}` : 'Ticket');

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/ticket/${code}`, {
      margin: 0,
      width: 240,
      errorCorrectionLevel: 'M',
      color: { dark: '#15130f', light: '#00000000' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, [code]);

  if (!order && loading) return <Spinner />;
  if (!order || error?.status === 404) {
    return (
      <div className="container empty empty--page">
        <h1>No encontramos ese ticket</h1>
        <p>{error?.message || 'Revisá el link o buscalo en tus pedidos.'}</p>
        <Link to="/mi-cuenta" className="btn btn--primary">
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(order.status);
  const firstName = (order.customer_name || order.shipping_name || user?.name || '').split(' ')[0];

  return (
    <div className="ticket-page container">
      {isNew && (
        <header className="ticket-hero">
          <span className="ticket-hero__check">
            <IconCheck size={30} />
          </span>
          <h1>¡Gracias por tu compra{firstName ? `, ${firstName}` : ''}!</h1>
          <p>
            <IconMail size={18} />
            {order.email_sent === false
              ? 'Tu pedido quedó registrado. Guardá este ticket (no pudimos enviarte el mail).'
              : `Te enviamos el ticket a ${order.customer_email || user?.email}.`}
          </p>
        </header>
      )}

      <div className="ticket-layout">
        <div className="ticket-wrap">
        <article className="ticket" aria-label={`Ticket ${ticketCode(order.code)}`}>
          <div className="ticket__head">
            <div>
              <p className="ticket__brand">
                {store.name}
                <span className="brand__dot" />
              </p>
              <p className="ticket__label">Ticket de compra</p>
            </div>
            <StatusPill status={order.status} />
          </div>

          <div className="ticket__code">
            <span>N° de ticket</span>
            <b>{ticketCode(order.code)}</b>
            <small>{dateTime(order.created_at)}</small>
          </div>

          <div className="ticket__tear" aria-hidden="true" />

          <table className="ticket__items">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td>
                    {it.product_name}
                    <small>{money(it.unit_price)} c/u</small>
                  </td>
                  <td>{it.quantity}</td>
                  <td>{money(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ticket__totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Envío</dt>
              <dd>{order.shipping ? money(order.shipping) : 'Gratis'}</dd>
            </div>
            <div className="ticket__total">
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>

          <div className="ticket__tear" aria-hidden="true" />

          <dl className="ticket__meta">
            <div>
              <dt>Cliente</dt>
              <dd>
                {order.shipping_name}
                <small>{order.customer_email}</small>
              </dd>
            </div>
            <div>
              <dt>Entrega</dt>
              <dd>
                {order.delivery_method === 'retiro'
                  ? `Retiro en el local · ${store.shipping.pickup}`
                  : [order.shipping_address, order.shipping_city, order.shipping_zip].filter(Boolean).join(', ')}
              </dd>
            </div>
            <div>
              <dt>Pago</dt>
              <dd>{paymentLabel(order.payment_method)}</dd>
            </div>
            {order.notes && (
              <div>
                <dt>Notas</dt>
                <dd>{order.notes}</dd>
              </div>
            )}
          </dl>

          <div className="ticket__foot">
            {qr && <img className="ticket__qr" src={qr} alt="Código QR del ticket" width="96" height="96" />}
            <div>
              <Barcode value={order.code} />
              <p>Presentá este ticket para retirar o hacer cambios.</p>
            </div>
          </div>
        </article>
        </div>

        <aside className="ticket-side">
          {order.status !== 'cancelado' ? (
            <div className="panel">
              <h2 className="panel__title">Estado del pedido</h2>
              <ol className="timeline">
                {STEPS.map((s, i) => (
                  <li key={s} className={i <= stepIndex ? 'is-done' : ''}>
                    <i aria-hidden="true">{i <= stepIndex ? <IconCheck size={14} /> : null}</i>
                    <span>
                      {
                        {
                          pendiente: 'Pedido recibido',
                          pagado: 'Pago acreditado',
                          enviado: order.delivery_method === 'retiro' ? 'Listo para retirar' : 'En camino',
                          entregado: 'Entregado',
                        }[s]
                      }
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="panel panel--danger">
              <h2 className="panel__title">Pedido cancelado</h2>
              <p className="muted">Si tenés dudas, escribinos por WhatsApp con el número de ticket.</p>
            </div>
          )}

          <div className="panel">
            <h2 className="panel__title">Cómo pagar</h2>
            <PaymentInfo order={order} />
          </div>

          <div className="ticket-actions">
            <button type="button" className="btn btn--primary btn--block" onClick={() => window.print()}>
              <IconPrinter size={18} /> Imprimir / guardar PDF
            </button>
            <Link to="/mi-cuenta" className="btn btn--ghost btn--block">
              Ver mis pedidos
            </Link>
            <Link to="/tienda" className="btn btn--link btn--block">
              Seguir comprando <IconArrow size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
