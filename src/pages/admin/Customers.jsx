import { useMemo, useState } from 'react';
import { store } from '../../../config/store.config.js';
import { api } from '../../lib/api.js';
import { useAsync, useDebounced } from '../../lib/hooks.js';
import { money, number, shortDate, timeAgo } from '../../lib/format.js';
import { Spinner } from '../../components/ui.jsx';
import { IconMail, IconSearch, IconWhatsapp } from '../../components/Icons.jsx';

const waLink = (phone, name) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  const full = digits.length <= 10 ? `549${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(`Hola ${(name || '').split(' ')[0]}, te escribimos de ${store.name}.`)}`;
};

export default function Customers() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim(), 300);
  const list = useAsync(() => api(`/api/admin/customers?q=${encodeURIComponent(dq)}`).then((d) => d.customers), [dq], []);
  const customers = list.data;

  const summary = useMemo(() => {
    const buyers = customers.filter((c) => c.orders > 0);
    const spent = buyers.reduce((a, c) => a + c.spent, 0);
    const repeat = buyers.filter((c) => c.orders > 1).length;
    return {
      total: customers.length,
      buyers: buyers.length,
      avg: buyers.length ? spent / buyers.length : 0,
      repeatRate: buyers.length ? Math.round((repeat / buyers.length) * 100) : 0,
    };
  }, [customers]);

  return (
    <div className="admin-page">
      <div className="minis minis--4">
        <div className="mini">
          <span className="mini__label">Clientes registrados</span>
          <b>{number(summary.total)}</b>
        </div>
        <div className="mini">
          <span className="mini__label">Ya compraron</span>
          <b>{number(summary.buyers)}</b>
        </div>
        <div className="mini">
          <span className="mini__label">Gasto promedio por cliente</span>
          <b>{money(summary.avg)}</b>
        </div>
        <div className="mini">
          <span className="mini__label">Volvieron a comprar</span>
          <b>{summary.repeatRate}%</b>
        </div>
      </div>

      <div className="admin-toolbar">
        <p className="muted">Ordenados por lo que gastaron en la tienda.</p>
        <label className="search-field search-field--sm">
          <IconSearch size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, email o teléfono" aria-label="Buscar clientes" />
        </label>
      </div>

      <div className={`table-wrap ${list.loading ? 'is-refreshing' : ''}`}>
        {list.loading && !customers.length ? (
          <Spinner />
        ) : customers.length === 0 ? (
          <div className="empty">
            <h3>No hay clientes</h3>
            <p>{dq ? 'Probá con otra búsqueda.' : 'Cuando alguien se registre, aparece acá.'}</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th className="num">Pedidos</th>
                <th className="num">Total gastado</th>
                <th>Última compra</th>
                <th>Alta</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => {
                const wa = waLink(c.phone, c.name);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="prod-cell">
                        <span className={`avatar avatar--sm ${i < 3 && c.spent > 0 ? '' : 'avatar--quiet'}`}>{(c.name || c.email)[0].toUpperCase()}</span>
                        <span>
                          <b>
                            {c.name || 'Sin nombre'}
                            {i < 3 && c.spent > 0 && <span className="vip">TOP {i + 1}</span>}
                          </b>
                          <small>{c.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>{c.phone || <span className="muted">—</span>}</td>
                    <td className="num">{c.orders}</td>
                    <td className="num">
                      <b>{money(c.spent)}</b>
                    </td>
                    <td>{c.last_order ? timeAgo(c.last_order) : <span className="muted">Nunca</span>}</td>
                    <td>{shortDate(c.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <a href={`mailto:${c.email}`} className="icon-btn icon-btn--sm" aria-label={`Escribir a ${c.email}`} title="Enviar email">
                          <IconMail size={16} />
                        </a>
                        {wa && (
                          <a href={wa} target="_blank" rel="noreferrer" className="icon-btn icon-btn--sm" aria-label="Escribir por WhatsApp" title="WhatsApp">
                            <IconWhatsapp size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
