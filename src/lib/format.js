import { store } from '../../config/store.config.js';

const moneyFmt = new Intl.NumberFormat(store.locale, {
  style: 'currency',
  currency: store.currency,
  maximumFractionDigits: 0,
});
const numberFmt = new Intl.NumberFormat(store.locale, { maximumFractionDigits: 1 });
const compactFmt = new Intl.NumberFormat(store.locale, { notation: 'compact', maximumFractionDigits: 1 });

export const money = (n) => moneyFmt.format(Number(n) || 0);
export const number = (n) => numberFmt.format(Number(n) || 0);
export const compactMoney = (n) => `$${compactFmt.format(Number(n) || 0)}`;
export const percent = (n) => `${numberFmt.format(Math.abs(n))}%`;

export const installment = (price) => money(Math.ceil(price / store.installments));
export const discountPct = (price, compare) => (compare > price ? Math.round((1 - price / compare) * 100) : 0);

export const ticketCode = (code) => `${store.orderPrefix}-${code}`;

/** Acepta Date, ISO o el formato de Postgres ("2026-11-26 12:00:00+00"). */
export function toDate(value) {
  if (value instanceof Date) return value;
  if (!value) return new Date(NaN);
  let s = String(value);
  if (/^\d{4}-\d{2}-\d{2} /.test(s)) s = s.replace(' ', 'T');
  s = s.replace(/([+-]\d{2})$/, '$1:00');
  return new Date(s);
}

export const shortDate = (v) =>
  toDate(v).toLocaleDateString(store.locale, { day: '2-digit', month: 'short', year: 'numeric' });

export const dateTime = (v) =>
  toDate(v).toLocaleString(store.locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function timeAgo(v) {
  const diff = (Date.now() - toDate(v).getTime()) / 1000;
  if (diff < 60) return 'recién';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) {
    const d = Math.floor(diff / 86400);
    return `hace ${d} día${d === 1 ? '' : 's'}`;
  }
  return shortDate(v);
}

export const STATUS = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  pagado: { label: 'Pagado', tone: 'info' },
  enviado: { label: 'Enviado', tone: 'accent' },
  entregado: { label: 'Entregado', tone: 'good' },
  cancelado: { label: 'Cancelado', tone: 'critical' },
};

export const paymentLabel = (id) => store.paymentMethods.find((p) => p.id === id)?.label || id;

/** Pide a Unsplash el tamaño justo de imagen (ahorra datos en celulares). */
export function img(url, width) {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('w', String(width));
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}

/** Convierte "precios *honestos*" en partes para pintar en itálica. */
export function emphasis(text) {
  return String(text)
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith('*') && part.endsWith('*') ? { em: true, text: part.slice(1, -1) } : { em: false, text: part }));
}
