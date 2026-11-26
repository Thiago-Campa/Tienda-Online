import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ORDER_STATUSES, store } from '../../../config/store.config.js';
import { api } from '../../lib/api.js';
import { useAsync, useDebounced, useEscape, useLockScroll } from '../../lib/hooks.js';
import { dateTime, money, paymentLabel, shortDate, STATUS, ticketCode, toDate } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner, StatusPill } from '../../components/ui.jsx';
import { IconArrowUpRight, IconClose, IconDownload, IconMail, IconSearch, IconWhatsapp } from '../../components/Icons.jsx';

function StatusSelect({ order, onChange, disabled }) {
  const tone = STATUS[order.status]?.tone || 'neutral';
  return (
    <label className={`status-select pill--${tone}`} onClick={(e) => e.stopPropagation()}>
      <span className="sr-only">Estado del pedido {ticketCode(order.code)}</span>
      <i aria-hidden="true" />
      <select value={order.status} onChange={(e) => onChange(order, e.target.value)} disabled={disabled || order.status === 'cancelado'}>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS[s].label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OrderDrawer({ code, onClose, onStatus, busy }) {
  const open = Boolean(code);
  // Conserva el último pedido mientras el panel se cierra (para que no "salte").
  const [shown, setShown] = useState(code);
  useEffect(() => {
    if (code) setShown(code);
  }, [code]);
  useLockScroll(open);
  useEscape(open, onClose);
  const detail = useAsync(() => (shown ? api(`/api/orders/${shown}`).then((d) => d.order) : Promise.resolve(null)), [shown]);
  const o = detail.data;
  const phone = (o?.shipping_phone || '').replace(/\D/g, '');

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="drawer__scrim" onClick={onClose} />
      <aside className="drawer__panel drawer__panel--wide" role="dialog" aria-modal="true" aria-label="Detalle del pedido">
        <header className="drawer__head">
          <h2>{o ? ticketCode(o.code) : 'Pedido'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose />
          </button>
        </header>
        {!o || detail.loading ? (
          <Spinner />
        ) : (
          <div className="order-detail">
            <div className="order-detail__status">
              <StatusSelect
                order={o}
                disabled={busy}
                onChange={async (ord, status) => {
                  const updated = await onStatus(ord, status);
                  if (updated) detail.setData(updated);
                }}
              />
              <span className="muted">{dateTime(o.created_at)}</span>
            </div>

            <section>
              <h3>Cliente</h3>
              <p>
                <b>{o.shipping_name || o.customer_name}</b>
                <br />
                {o.customer_email}
                {o.shipping_phone && (
                  <>
                    <br />
                    {o.shipping_phone}
                  </>
                )}
              </p>
              <div className="order-detail__contact">
                <a className="btn btn--ghost btn--sm" href={`mailto:${o.customer_email}?subject=${encodeURIComponent(`Tu pedido ${ticketCode(o.code)}`)}`}>
                  <IconMail size={16} /> Email
                </a>
                {phone && (
                  <a
                    className="btn btn--ghost btn--sm"
                    href={`https://wa.me/${phone.length <= 10 ? `549${phone}` : phone}?text=${encodeURIComponent(
                      `Hola ${(o.shipping_name || '').split(' ')[0]}, te escribimos de ${store.name} por tu pedido ${ticketCode(o.code)}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconWhatsapp size={16} /> WhatsApp
                  </a>
                )}
              </div>
            </section>

            <section>
              <h3>Entrega y pago</h3>
              <p>
                {o.delivery_method === 'retiro'
                  ? 'Retiro en el local'
                  : `Envío a ${[o.shipping_address, o.shipping_city, o.shipping_zip].filter(Boolean).join(', ')}`}
                <br />
                {paymentLabel(o.payment_method)}
              </p>
              {o.notes && <p className="order-detail__notes">“{o.notes}”</p>}
            </section>

            <section>
              <h3>Productos</h3>
              <ul className="order-detail__items">
                {o.items.map((it, i) => (
                  <li key={i}>
                    <span>
                      {it.product_name} <small>× {it.quantity}</small>
                    </span>
                    <b>{money(it.line_total)}</b>
                  </li>
                ))}
              </ul>
              <dl className="order-detail__totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(o.subtotal)}</dd>
                </div>
                <div>
                  <dt>Envío</dt>
                  <dd>{o.shipping ? money(o.shipping) : 'Gratis'}</dd>
                </div>
                <div className="is-total">
                  <dt>Total</dt>
                  <dd>{money(o.total)}</dd>
                </div>
              </dl>
            </section>

            <Link to={`/ticket/${o.code}`} target="_blank" className="btn btn--primary btn--block">
              Ver ticket del cliente <IconArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function exportCsv(orders) {
  const head = ['Ticket', 'Fecha', 'Cliente', 'Email', 'Teléfono', 'Unidades', 'Total', 'Pago', 'Entrega', 'Ciudad', 'Estado'];
  const rows = orders.map((o) => [
    ticketCode(o.code),
    toDate(o.created_at).toLocaleString(store.locale),
    o.customer_name || '',
    o.customer_email,
    o.customer_phone || '',
    o.items,
    String(o.total).replace('.', ','),
    paymentLabel(o.payment_method),
    o.delivery_method === 'retiro' ? 'Retiro' : 'Envío',
    o.shipping_city || '',
    STATUS[o.status]?.label || o.status,
  ]);
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Orders() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = ORDER_STATUSES.includes(params.get('estado')) ? params.get('estado') : 'todos';
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim(), 300);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const list = useAsync(
    () => api(`/api/admin/orders?status=${status}&q=${encodeURIComponent(dq)}`),
    [status, dq]
  );
  const orders = list.data?.orders || [];
  const counts = list.data?.counts || {};

  useEffect(() => {
    if (params.get('pedido')) setSelected(params.get('pedido'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatusFilter = (s) => {
    const next = new URLSearchParams(params);
    if (s === 'todos') next.delete('estado');
    else next.set('estado', s);
    setParams(next, { replace: true });
  };

  const changeStatus = async (order, newStatus) => {
    if (newStatus === order.status) return null;
    if (newStatus === 'cancelado' && !window.confirm(`¿Cancelar el pedido ${ticketCode(order.code)}? El stock vuelve al inventario y no se puede deshacer.`)) {
      return null;
    }
    setBusy(true);
    try {
      const { order: updated, notified } = await api(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status: newStatus } });
      list.setData((data) =>
        data
          ? {
              ...data,
              orders: data.orders.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)),
              counts: {
                ...data.counts,
                [order.status]: Math.max(0, (data.counts[order.status] || 1) - 1),
                [updated.status]: (data.counts[updated.status] || 0) + 1,
              },
            }
          : data
      );
      toast(`${ticketCode(order.code)} → ${STATUS[newStatus].label}${notified ? ' · le avisamos al cliente por email' : ''}`, { type: 'success' });
      return updated;
    } catch (err) {
      toast(err.message, { type: 'error' });
      return null;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div className="status-tabs" role="tablist" aria-label="Filtrar por estado">
          {['todos', ...ORDER_STATUSES].map((s) => (
            <button key={s} type="button" role="tab" aria-selected={status === s} className={status === s ? 'is-active' : ''} onClick={() => setStatusFilter(s)}>
              {s === 'todos' ? 'Todos' : STATUS[s].label}
              <small>{counts[s] ?? 0}</small>
            </button>
          ))}
        </div>
        <div className="admin-toolbar__right">
          <label className="search-field search-field--sm">
            <IconSearch size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ticket, cliente o email" aria-label="Buscar pedidos" />
          </label>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => exportCsv(orders)} disabled={!orders.length}>
            <IconDownload size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className={`table-wrap ${list.loading ? 'is-refreshing' : ''}`}>
        {list.loading && !list.data ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <div className="empty">
            <h3>No hay pedidos</h3>
            <p>{dq ? 'Probá con otra búsqueda.' : 'Cuando entren ventas, las vas a ver acá.'}</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th className="num">Unid.</th>
                <th className="num">Total</th>
                <th>Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => setSelected(o.code)} className="is-clickable">
                  <td className="mono">{ticketCode(o.code)}</td>
                  <td>
                    {shortDate(o.created_at)}
                    <small>{toDate(o.created_at).toLocaleTimeString(store.locale, { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td>
                    <b>{o.customer_name || '—'}</b>
                    <small>{o.customer_email}</small>
                  </td>
                  <td className="num">{o.items}</td>
                  <td className="num">
                    <b>{money(o.total)}</b>
                  </td>
                  <td>
                    {paymentLabel(o.payment_method).split(' ')[0]}
                    <small>{o.delivery_method === 'retiro' ? 'Retiro' : o.shipping_city || 'Envío'}</small>
                  </td>
                  <td>
                    <StatusSelect order={o} onChange={changeStatus} disabled={busy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <OrderDrawer code={selected} onClose={() => setSelected(null)} onStatus={changeStatus} busy={busy} />
    </div>
  );
}
