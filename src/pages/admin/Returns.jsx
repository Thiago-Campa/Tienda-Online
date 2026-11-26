import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RETURN_STATUSES, store } from '../../../config/store.config.js';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { RETURN_STATUS, money, shortDate, ticketCode } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner } from '../../components/ui.jsx';
import { IconMail } from '../../components/Icons.jsx';

const FILTERS = ['todas', ...RETURN_STATUSES];

function ReturnSelect({ ret, onChange, disabled }) {
  const tone = RETURN_STATUS[ret.status]?.tone || 'neutral';
  return (
    <label className={`status-select pill--${tone}`}>
      <span className="sr-only">Estado de la devolución {ticketCode(ret.code)}</span>
      <i aria-hidden="true" />
      <select value={ret.status} onChange={(e) => onChange(ret, e.target.value)} disabled={disabled}>
        {RETURN_STATUSES.map((s) => (
          <option key={s} value={s}>
            {RETURN_STATUS[s].label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Returns() {
  const toast = useToast();
  const [status, setStatus] = useState('todas');
  const [busy, setBusy] = useState(false);

  const list = useAsync(() => api(`/api/admin/returns${status === 'todas' ? '' : `?status=${status}`}`), [status]);
  const returns = list.data?.returns || [];
  const counts = list.data?.counts || {};

  const change = async (ret, newStatus) => {
    if (newStatus === ret.status) return;
    let note = '';
    if (newStatus === 'aprobada' || newStatus === 'rechazada') {
      const answer = window.prompt(
        `Mensaje para el cliente (opcional). Se lo enviamos por mail junto con el aviso de "${RETURN_STATUS[newStatus].label.toLowerCase()}".`,
        ret.admin_note || ''
      );
      if (answer === null) return; // canceló
      note = answer.trim();
    }
    setBusy(true);
    try {
      const { notified } = await api(`/api/admin/returns/${ret.id}`, { method: 'PATCH', body: { status: newStatus, note } });
      toast(`${ticketCode(ret.code)} → ${RETURN_STATUS[newStatus].label}${notified ? ' · le avisamos al cliente por email' : ''}`, { type: 'success' });
      list.reload();
    } catch (err) {
      toast(err.message, { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div className="status-tabs" role="tablist" aria-label="Filtrar por estado">
          {FILTERS.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={status === s} className={status === s ? 'is-active' : ''} onClick={() => setStatus(s)}>
              {s === 'todas' ? 'Todas' : RETURN_STATUS[s].label}
              <small>{counts[s] ?? 0}</small>
            </button>
          ))}
        </div>
      </div>

      <p className="muted returns-hint">
        Plazo de devolución: {store.returns.days} días desde que el pedido figura como entregado. Al aprobar o completar una devolución, el stock
        no se modifica solo: ajustalo en Productos si el artículo vuelve a estar disponible.
      </p>

      <div className={`table-wrap ${list.loading ? 'is-refreshing' : ''}`}>
        {list.loading && !list.data ? (
          <Spinner />
        ) : returns.length === 0 ? (
          <div className="empty">
            <h3>No hay devoluciones</h3>
            <p>Cuando un cliente pida una, la vas a ver acá y te llega el detalle completo.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Productos y motivo</th>
                <th>Pide</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id}>
                  <td>{shortDate(r.created_at)}</td>
                  <td>
                    <Link className="mono" to={`/admin/pedidos?pedido=${r.code}`}>
                      {ticketCode(r.code)}
                    </Link>
                    <small>{money(r.total)}</small>
                  </td>
                  <td>
                    <b>{r.customer_name || '—'}</b>
                    <small>
                      <a href={`mailto:${r.customer_email}`}>
                        <IconMail size={13} /> {r.customer_email}
                      </a>
                    </small>
                  </td>
                  <td>
                    {(Array.isArray(r.items) ? r.items : []).map((i) => (
                      <span key={i.order_item_id} className="returns-item">
                        {i.quantity} × {i.product_name}
                      </span>
                    ))}
                    <small>
                      <b>{r.reason}</b>
                      {r.details ? ` — ${r.details}` : ''}
                    </small>
                    {r.admin_note && <small>Tu mensaje: {r.admin_note}</small>}
                  </td>
                  <td>{r.resolution === 'cambio' ? 'Cambio' : 'Reembolso'}</td>
                  <td>
                    <ReturnSelect ret={r} onChange={change} disabled={busy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
