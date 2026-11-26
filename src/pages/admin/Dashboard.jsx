import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../../config/store.config.js';
import { api } from '../../lib/api.js';
import { useAsync, useCountUp } from '../../lib/hooks.js';
import { compactMoney, img, money, number, percent, STATUS, ticketCode, timeAgo } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { BarChart, Donut } from '../../components/charts.jsx';
import { Img, Spinner, StatusPill } from '../../components/ui.jsx';
import {
  IconAlert,
  IconArrow,
  IconBox,
  IconChart,
  IconMail,
  IconTag,
  IconTrendDown,
  IconTrendUp,
  IconUsers,
} from '../../components/Icons.jsx';
import { Card, Segmented } from './AdminLayout.jsx';

const RANGES = [
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
  { id: '12m', label: '12 meses' },
  { id: 'all', label: 'Todo' },
];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const CAT_SLOTS = 6;

const monthLabel = (ym, withYear = false) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const s = d.toLocaleDateString(store.locale, { month: 'short', ...(withYear ? { year: 'numeric' } : {}) }).replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function Kpi({ label, value, prev, format, Icon, accent = false }) {
  const shown = useCountUp(value, { duration: 1200 });
  const delta = prev > 0 ? ((value - prev) / prev) * 100 : null;
  return (
    <div className={`kpi ${accent ? 'kpi--accent' : ''}`}>
      <div className="kpi__top">
        <span className="kpi__icon">
          <Icon size={18} />
        </span>
        <span>{label}</span>
      </div>
      <b className="kpi__value">{format(shown)}</b>
      <div className="kpi__foot">
        {delta === null ? (
          <span className="kpi__hint">Sin datos del mes anterior</span>
        ) : (
          <>
            <span className={`delta ${delta >= 0 ? 'is-up' : 'is-down'}`}>
              {delta >= 0 ? <IconTrendUp size={14} /> : <IconTrendDown size={14} />}
              {delta >= 0 ? '+' : '−'}
              {percent(delta)}
            </span>
            <span className="kpi__hint">vs. mismo período del mes pasado</span>
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone, to }) {
  const content = (
    <>
      <span className="mini__label">{label}</span>
      <b className={tone ? `tone-${tone}` : ''}>{value}</b>
    </>
  );
  return to ? (
    <Link to={to} className="mini">
      {content}
    </Link>
  ) : (
    <div className="mini">{content}</div>
  );
}

function LowStock({ items, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState({});
  const save = async (p) => {
    const stock = Number.parseInt(values[p.id], 10);
    if (!Number.isInteger(stock) || stock < 0) return;
    try {
      await api(`/api/admin/products/${p.id}`, { method: 'PATCH', body: { stock } });
      toast(`Stock de "${p.name}" actualizado a ${stock}`, { type: 'success' });
      setValues((v) => ({ ...v, [p.id]: undefined }));
      onSaved();
    } catch (err) {
      toast(err.message, { type: 'error' });
    }
  };
  if (!items.length) return <p className="acard__empty">Todo el catálogo tiene stock suficiente. 🎉</p>;
  return (
    <ul className="stock-list">
      {items.map((p) => (
        <li key={p.id}>
          <Img src={img(p.image_url, 100)} alt="" className="stock-list__img" />
          <span className="stock-list__name">{p.name}</span>
          <span className={`stock-badge ${p.stock === 0 ? 'is-out' : 'is-low'}`}>{p.stock === 0 ? 'Sin stock' : `${p.stock} u.`}</span>
          <form
            className="stock-list__form"
            onSubmit={(e) => {
              e.preventDefault();
              save(p);
            }}
          >
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Nuevo"
              aria-label={`Nuevo stock para ${p.name}`}
              value={values[p.id] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
            />
            <button type="submit" className="btn btn--primary btn--sm" disabled={values[p.id] === undefined || values[p.id] === ''}>
              Guardar
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState('12m');
  const [metric, setMetric] = useState('revenue');
  const stats = useAsync(() => api(`/api/admin/stats?range=${range}`), [range]);
  const d = stats.data;

  const monthly = useMemo(
    () =>
      (d?.monthly || []).map((m, i, arr) => ({
        key: m.month,
        label: monthLabel(m.month),
        tipLabel: monthLabel(m.month, true) + (i === arr.length - 1 ? ' (en curso)' : ''),
        value: metric === 'revenue' ? m.revenue : m.orders,
        tip: metric === 'revenue' ? [`${m.orders} pedidos`] : [money(m.revenue)],
      })),
    [d, metric]
  );

  const categories = useMemo(() => {
    if (!d) return [];
    const slotOf = new Map(d.allCategories.map((c, i) => [c.id, i]));
    const rows = d.categories.map((c) => {
      const slot = slotOf.get(c.id);
      const color = slot !== undefined && slot < CAT_SLOTS ? `var(--cat-${slot + 1})` : 'var(--cat-other)';
      return { key: String(c.id ?? 'none'), label: c.name, value: c.revenue, units: c.units, color, slot: slot ?? 99 };
    });
    // Más de 6 categorías → el resto se agrupa en "Otras"
    const main = rows.filter((r) => r.slot < CAT_SLOTS);
    const rest = rows.filter((r) => r.slot >= CAT_SLOTS);
    if (rest.length) {
      main.push({
        key: 'otras',
        label: 'Otras',
        value: rest.reduce((a, r) => a + r.value, 0),
        units: rest.reduce((a, r) => a + r.units, 0),
        color: 'var(--cat-other)',
        slot: 100,
      });
    }
    return main.sort((a, b) => b.value - a.value);
  }, [d]);

  if (!d && stats.loading) return <Spinner label="Cargando estadísticas" />;
  if (!d) {
    return (
      <div className="empty">
        <h3>No pudimos cargar las estadísticas</h3>
        <p>{stats.error?.message}</p>
        <button type="button" className="btn btn--primary" onClick={stats.reload}>
          Reintentar
        </button>
      </div>
    );
  }

  const k = d.kpis;
  const avgCur = k.orders_cur ? k.revenue_cur / k.orders_cur : 0;
  const avgPrev = k.orders_prev ? k.revenue_prev / k.orders_prev : 0;
  const topMax = Math.max(1, ...d.top.map((t) => t.units));
  const catTotal = categories.reduce((a, c) => a + c.value, 0);
  const weekdays = d.weekdays.map((w) => ({
    key: String(w.dow),
    label: WEEKDAYS[w.dow - 1],
    value: w.orders,
    tip: [money(w.revenue)],
  }));
  const bestDay = [...d.weekdays].sort((a, b) => b.orders - a.orders)[0];
  const rangeLabel = RANGES.find((r) => r.id === range)?.label.toLowerCase();

  return (
    <div className={`dash ${stats.loading ? 'is-refreshing' : ''}`}>
      <div className="kpis">
        <Kpi label="Ingresos del mes" value={k.revenue_cur} prev={k.revenue_prev} format={money} Icon={IconChart} accent />
        <Kpi label="Pedidos del mes" value={k.orders_cur} prev={k.orders_prev} format={(v) => number(Math.round(v))} Icon={IconBox} />
        <Kpi label="Ticket promedio" value={avgCur} prev={avgPrev} format={money} Icon={IconTag} />
        <Kpi label="Clientes nuevos" value={k.customers_cur} prev={k.customers_prev} format={(v) => number(Math.round(v))} Icon={IconUsers} />
      </div>

      <div className="minis">
        <MiniStat label="Pedidos pendientes" value={k.pending} tone={k.pending ? 'warning' : null} to="/admin/pedidos" />
        <MiniStat label="Sin stock" value={k.out_of_stock} tone={k.out_of_stock ? 'critical' : null} to="/admin/productos" />
        <MiniStat label="Stock bajo" value={k.low_stock} tone={k.low_stock ? 'warning' : null} to="/admin/productos" />
        <MiniStat label="Valor del inventario" value={compactMoney(k.inventory_value)} />
        <MiniStat label="Ventas históricas" value={compactMoney(k.revenue_total)} />
        <MiniStat label="Suscriptores" value={number(k.subscribers)} />
      </div>

      <div className="dash__row dash__row--main">
        <Card
          title={metric === 'revenue' ? 'Ingresos por mes' : 'Pedidos por mes'}
          action={
            <Segmented
              label="Métrica"
              value={metric}
              onChange={setMetric}
              options={[
                { id: 'revenue', label: 'Ingresos' },
                { id: 'orders', label: 'Pedidos' },
              ]}
            />
          }
        >
          <BarChart
            key={metric}
            title="Ventas de los últimos 12 meses"
            data={monthly}
            height={300}
            formatAxis={metric === 'revenue' ? compactMoney : (v) => number(v)}
            formatValue={metric === 'revenue' ? money : (v) => `${number(v)} pedidos`}
          />
          <details className="chart-table">
            <summary>Ver los datos en tabla</summary>
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Pedidos</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {d.monthly.map((m) => (
                  <tr key={m.month}>
                    <td>{monthLabel(m.month, true)}</td>
                    <td>{m.orders}</td>
                    <td>{money(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>

        <Card title="Estado de los pedidos" action={<Link to="/admin/pedidos" className="btn btn--link btn--sm">Ver todos</Link>}>
          <ul className="status-list">
            {Object.keys(STATUS).map((s) => (
              <li key={s}>
                <StatusPill status={s} />
                <b>{d.statuses[s] || 0}</b>
              </li>
            ))}
          </ul>
          <div className="acard__sub">
            <h3>Últimos pedidos</h3>
            <ul className="recent">
              {d.recent.map((o) => (
                <li key={o.id}>
                  <span className="avatar avatar--sm">{(o.customer_name || o.customer_email)[0].toUpperCase()}</span>
                  <span className="recent__who">
                    <b>{o.customer_name || o.customer_email}</b>
                    <small>
                      {ticketCode(o.code)} · {timeAgo(o.created_at)}
                    </small>
                  </span>
                  <b className="recent__total">{money(o.total)}</b>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="dash__filter">
        <span>Período de análisis</span>
        <Segmented label="Período" value={range} onChange={setRange} options={RANGES} />
      </div>

      <div className="dash__row">
        <Card title="Productos más vendidos" action={<span className="acard__meta">por unidades · {rangeLabel}</span>}>
          {d.top.length === 0 ? (
            <p className="acard__empty">Todavía no hay ventas en este período.</p>
          ) : (
            <ol className="top-list">
              {d.top.map((t, i) => (
                <li key={`${t.product_id}-${t.name}`}>
                  <span className="top-list__rank">{i + 1}</span>
                  <Img src={img(t.image_url, 100)} alt="" className="top-list__img" />
                  <span className="top-list__body">
                    <span className="top-list__name">{t.name}</span>
                    <span className="top-list__bar">
                      <span style={{ width: `${(t.units / topMax) * 100}%`, '--i': i }} />
                    </span>
                  </span>
                  <span className="top-list__nums">
                    <b>{t.units} u.</b>
                    <small>{money(t.revenue)}</small>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Ventas por categoría" action={<span className="acard__meta">ingresos · {rangeLabel}</span>}>
          {categories.length === 0 ? (
            <p className="acard__empty">Todavía no hay ventas en este período.</p>
          ) : (
            <div className="cat-share">
              <Donut data={categories} formatValue={compactMoney} />
              <ul className="legend">
                {categories.map((c) => (
                  <li key={c.key}>
                    <i style={{ background: c.color }} aria-hidden="true" />
                    <span>{c.label}</span>
                    <b>{catTotal ? ((c.value / catTotal) * 100).toFixed(0) : 0}%</b>
                    <small>{money(c.value)}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="dash__row dash__row--three">
        <Card title="Días con más pedidos" action={<span className="acard__meta">{rangeLabel}</span>}>
          <BarChart
            title="Pedidos por día de la semana"
            data={weekdays}
            height={210}
            formatAxis={(v) => number(v)}
            formatValue={(v) => `${number(v)} pedidos`}
          />
          {bestDay?.orders > 0 && (
            <p className="acard__insight">
              <IconTrendUp size={16} /> El <b>{WEEKDAYS[bestDay.dow - 1].toLowerCase()}</b> es tu mejor día: conviene lanzar promos ahí.
            </p>
          )}
        </Card>

        <Card
          title="Alertas de stock"
          action={
            <Link to="/admin/productos" className="btn btn--link btn--sm">
              Inventario
            </Link>
          }
        >
          <LowStock items={d.lowStock} onSaved={stats.reload} />
        </Card>

        <Card title="Accesos rápidos">
          <div className="quick">
            <Link to="/admin/productos?nuevo=1" className="quick__item">
              <IconTag size={20} />
              <span>Cargar producto</span>
              <IconArrow size={16} />
            </Link>
            <Link to="/admin/pedidos?estado=pendiente" className="quick__item">
              <IconAlert size={20} />
              <span>Pedidos por confirmar</span>
              <b>{k.pending}</b>
            </Link>
            <Link to="/admin/clientes" className="quick__item">
              <IconUsers size={20} />
              <span>Clientes</span>
              <b>{number(k.customers_total)}</b>
            </Link>
            <a href={`mailto:${store.contact.email}`} className="quick__item">
              <IconMail size={20} />
              <span>Correo de la tienda</span>
              <IconArrow size={16} />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
