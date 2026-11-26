import { store } from '../../config/store.config.js';

const INK = '#15130f';
const PAPER = '#f2eee6';
const CARD = '#fbf9f5';
const MUTED = '#7a7266';
const LINE = '#e2dccf';
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,'Courier New',monospace";

const moneyFmt = new Intl.NumberFormat(store.locale, {
  style: 'currency',
  currency: store.currency,
  maximumFractionDigits: 0,
});
export const money = (n) => moneyFmt.format(Number(n) || 0);

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ticketCode = (code) => `${store.orderPrefix}-${code}`;

const paymentLabel = (id) => store.paymentMethods.find((p) => p.id === id)?.label || id;

function layout({ preheader, body }) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(store.name)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 18px;font:800 22px/1 ${FONT};color:${INK};letter-spacing:-0.5px;">
      ${esc(store.name)}<span style="color:${store.accent}">.</span>
    </td></tr>
    <tr><td style="background:${CARD};border:1px solid ${LINE};border-radius:20px;padding:34px 30px;font:400 15px/1.6 ${FONT};color:${INK};">
      ${body}
    </td></tr>
    <tr><td style="padding:22px 6px;font:400 12px/1.6 ${FONT};color:${MUTED};">
      ${esc(store.name)} · ${esc(store.contact.address)}<br>
      ${esc(store.contact.email)} · WhatsApp ${esc(store.contact.phone)}
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const button = (href, label) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font:700 15px/1 ${FONT};padding:16px 26px;border-radius:999px;">${esc(label)}</a>`;

/* ── Código de verificación ─────────────────────────────── */

export function codeEmail({ code }) {
  const subject = `${code} es tu código para ingresar a ${store.name}`;
  const body = `
    <p style="margin:0 0 6px;font:700 12px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${MUTED}">Verificación</p>
    <h1 style="margin:0 0 12px;font:800 28px/1.15 ${FONT};letter-spacing:-0.6px;">Tu código de acceso</h1>
    <p style="margin:0 0 22px;color:#3b3730">Escribilo en la pantalla de ingreso. Vence en <b>10 minutos</b>.</p>
    <div style="background:${INK};color:#ffffff;border-radius:16px;padding:24px 0;text-align:center;font:700 40px/1 ${MONO};letter-spacing:14px;">${esc(code)}</div>
    <p style="margin:22px 0 0;font-size:13px;color:${MUTED}">Si no pediste este código, ignorá este mensaje: nadie puede entrar a tu cuenta sin él.</p>`;
  const text = `Tu código para ingresar a ${store.name} es: ${code}\nVence en 10 minutos. Si no lo pediste, ignorá este mensaje.`;
  return { subject, html: layout({ preheader: `Tu código es ${code}`, body }), text };
}

/* ── Instrucciones de pago ──────────────────────────────── */

function paymentHtml(order) {
  if (order.payment_method === 'transferencia') {
    return `
      <div style="background:${PAPER};border-radius:14px;padding:18px 20px;margin-top:22px;">
        <p style="margin:0 0 8px;font-weight:700">Datos para la transferencia</p>
        <p style="margin:0;font-size:14px;color:#3b3730">
          Titular: <b>${esc(store.bank.holder)}</b><br>
          Banco: ${esc(store.bank.bankName)}<br>
          Alias: <b style="font-family:${MONO}">${esc(store.bank.alias)}</b><br>
          CBU: <span style="font-family:${MONO}">${esc(store.bank.cbu)}</span><br>
          Importe: <b>${money(order.total)}</b>
        </p>
        <p style="margin:10px 0 0;font-size:13px;color:${MUTED}">Mandanos el comprobante por WhatsApp indicando el ticket ${esc(ticketCode(order.code))}.</p>
      </div>`;
  }
  if (order.payment_method === 'tarjeta') {
    return `<p style="margin:22px 0 0;background:${PAPER};border-radius:14px;padding:16px 20px;font-size:14px;">Te vamos a enviar un <b>link de pago seguro</b> para abonar con tarjeta en ${store.installments} cuotas sin interés.</p>`;
  }
  return `<p style="margin:22px 0 0;background:${PAPER};border-radius:14px;padding:16px 20px;font-size:14px;">Pagás <b>en efectivo</b> al ${order.delivery_method === 'retiro' ? 'retirar' : 'recibir'} el pedido.</p>`;
}

/* ── Ticket de compra ───────────────────────────────────── */

export function orderEmail({ order, url }) {
  const first = (order.customer_name || order.shipping_name || '').split(' ')[0];
  const rows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;">${esc(it.product_name)} <span style="color:${MUTED}">× ${it.quantity}</span></td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;white-space:nowrap;">${money(it.line_total)}</td>
      </tr>`
    )
    .join('');

  const delivery =
    order.delivery_method === 'retiro'
      ? `Retiro en el local: ${esc(store.shipping.pickup)}`
      : `Envío a ${esc([order.shipping_address, order.shipping_city, order.shipping_zip].filter(Boolean).join(', '))}`;

  const body = `
    <p style="margin:0 0 6px;font:700 12px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${MUTED}">Ticket de compra</p>
    <h1 style="margin:0 0 10px;font:800 28px/1.15 ${FONT};letter-spacing:-0.6px;">¡Gracias por tu compra${first ? `, ${esc(first)}` : ''}!</h1>
    <p style="margin:0 0 22px;color:#3b3730">Recibimos tu pedido y ya lo estamos preparando. Guardá este mail: es tu comprobante.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px dashed ${LINE};border-radius:14px;margin-bottom:20px;">
      <tr><td style="padding:16px 18px;">
        <span style="font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:1.5px">N° de ticket</span><br>
        <span style="font:700 22px/1.4 ${MONO};letter-spacing:1px">${esc(ticketCode(order.code))}</span>
      </td><td align="right" style="padding:16px 18px;font-size:13px;color:${MUTED}">
        ${new Date(order.created_at).toLocaleString(store.locale, { timeZone: store.timezone, dateStyle: 'medium', timeStyle: 'short' })}
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows}
      <tr><td style="padding:10px 0 2px;font-size:14px;color:${MUTED}">Subtotal</td><td align="right" style="padding:10px 0 2px;font-size:14px;color:${MUTED}">${money(order.subtotal)}</td></tr>
      <tr><td style="padding:2px 0 10px;font-size:14px;color:${MUTED}">Envío</td><td align="right" style="padding:2px 0 10px;font-size:14px;color:${MUTED}">${Number(order.shipping) ? money(order.shipping) : 'Gratis'}</td></tr>
      <tr><td style="padding:12px 0 0;border-top:2px solid ${INK};font:800 18px/1 ${FONT}">Total</td><td align="right" style="padding:12px 0 0;border-top:2px solid ${INK};font:800 18px/1 ${FONT}">${money(order.total)}</td></tr>
    </table>

    <p style="margin:22px 0 0;font-size:14px;color:#3b3730"><b>Entrega:</b> ${delivery}<br><b>Pago:</b> ${esc(paymentLabel(order.payment_method))}</p>
    ${paymentHtml(order)}
    <p style="margin:28px 0 0;">${button(url, 'Ver mi ticket')}</p>`;

  const text = [
    `¡Gracias por tu compra! Ticket ${ticketCode(order.code)}`,
    '',
    ...order.items.map((it) => `- ${it.product_name} x${it.quantity}: ${money(it.line_total)}`),
    '',
    `Envío: ${Number(order.shipping) ? money(order.shipping) : 'Gratis'}`,
    `TOTAL: ${money(order.total)}`,
    `Pago: ${paymentLabel(order.payment_method)}`,
    order.payment_method === 'transferencia' ? `Alias: ${store.bank.alias} · CBU: ${store.bank.cbu}` : '',
    '',
    `Ver ticket: ${url}`,
  ].join('\n');

  return {
    subject: `Tu ticket ${ticketCode(order.code)} · ${store.name}`,
    html: layout({ preheader: `Recibimos tu pedido por ${money(order.total)}`, body }),
    text,
  };
}

/* ── Cambio de estado ───────────────────────────────────── */

const STATUS_COPY = {
  pagado: { title: 'Recibimos tu pago', text: 'Tu pago fue acreditado. Ya estamos preparando tu pedido.' },
  enviado: { title: 'Tu pedido está en camino', text: `Ya lo despachamos. Llega en ${store.shipping.eta}.` },
  entregado: { title: 'Pedido entregado', text: '¡Que lo disfrutes! Si algo no está bien, respondé este mail.' },
  cancelado: { title: 'Tu pedido fue cancelado', text: 'Si no esperabas esto, escribinos y lo resolvemos.' },
};

export function statusEmail({ order, url }) {
  const copy = STATUS_COPY[order.status];
  if (!copy) return null;
  const body = `
    <p style="margin:0 0 6px;font:700 12px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${MUTED}">Ticket ${esc(ticketCode(order.code))}</p>
    <h1 style="margin:0 0 12px;font:800 28px/1.15 ${FONT};letter-spacing:-0.6px;">${esc(copy.title)}</h1>
    <p style="margin:0 0 24px;color:#3b3730">${esc(copy.text)}</p>
    <p style="margin:0">${button(url, 'Ver el estado del pedido')}</p>`;
  return {
    subject: `${copy.title} · ${ticketCode(order.code)}`,
    html: layout({ preheader: copy.text, body }),
    text: `${copy.title}\n${copy.text}\n\nVer pedido: ${url}`,
  };
}
