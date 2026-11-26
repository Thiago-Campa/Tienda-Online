import { Router } from 'express';
import { store } from '../../config/store.config.js';
import { query, one } from '../lib/db.js';
import { HttpError, ah, clean, siteUrl } from '../lib/http.js';
import { requireAuth } from '../lib/auth.js';
import { sendMail } from '../lib/mailer.js';
import { orderEmail } from '../lib/emails.js';

const router = Router();

/** Pedido completo con sus ítems (o null). */
export async function getOrder(code) {
  const order = await one(
    `SELECT o.id, o.code, o.status, o.user_id,
            o.subtotal::float8 AS subtotal, o.shipping::float8 AS shipping, o.total::float8 AS total,
            o.payment_method, o.delivery_method,
            o.shipping_name, o.shipping_phone, o.shipping_address, o.shipping_city, o.shipping_zip, o.notes,
            o.created_at, o.updated_at,
            u.email AS customer_email, u.name AS customer_name
       FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.code = $1`,
    [code]
  );
  if (!order) return null;
  order.items = await query(
    `SELECT oi.product_id, oi.product_name, oi.quantity,
            oi.unit_price::float8 AS unit_price, oi.line_total::float8 AS line_total,
            p.image_url, p.slug
       FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
    [order.id]
  );
  return order;
}

/** Traduce los errores que lanza la función create_order() de la base. */
function orderError(err) {
  const msg = String(err?.message || '');
  const noStock = msg.match(/NO_STOCK:([^\n]+)/);
  if (noStock) {
    return new HttpError(409, `No hay stock suficiente de "${noStock[1].trim()}". Actualizamos tu carrito.`, {
      code: 'NO_STOCK',
    });
  }
  if (msg.includes('NOT_AVAILABLE')) {
    return new HttpError(409, 'Uno de los productos ya no está disponible. Actualizamos tu carrito.', {
      code: 'NOT_AVAILABLE',
    });
  }
  if (msg.includes('CART_EMPTY')) return new HttpError(400, 'Tu carrito está vacío.');
  return err;
}

/** Crear pedido: valida, descuenta stock (todo en una transacción en la base) y manda el ticket por mail. */
router.post(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const b = req.body || {};
    const items = (Array.isArray(b.items) ? b.items : [])
      .slice(0, 50)
      .map((i) => ({ id: Number.parseInt(i?.id, 10), qty: Number.parseInt(i?.qty, 10) }))
      .filter((i) => i.id > 0 && i.qty > 0 && i.qty <= 99);
    if (!items.length) throw new HttpError(400, 'Tu carrito está vacío.');

    const delivery = b.delivery === 'retiro' ? 'retiro' : 'envio';
    const payment = store.paymentMethods.find((p) => p.id === b.payment)?.id;
    if (!payment) throw new HttpError(400, 'Elegí un medio de pago.');

    const name = clean(b.name, 80);
    const phone = clean(b.phone, 40);
    const address = clean(b.address, 160);
    const city = clean(b.city, 80);
    const zip = clean(b.zip, 12);
    const notes = clean(b.notes, 300);

    if (name.length < 2) throw new HttpError(400, 'Ingresá tu nombre y apellido.');
    if (phone.replace(/\D/g, '').length < 6) throw new HttpError(400, 'Ingresá un teléfono de contacto.');
    if (delivery === 'envio' && (address.length < 4 || city.length < 2)) {
      throw new HttpError(400, 'Completá la dirección y la ciudad de entrega.');
    }

    let code;
    try {
      const row = await one(
        `SELECT create_order($1::int, $2::jsonb, $3::numeric, $4::numeric, $5::text, $6::text,
                             $7::text, $8::text, $9::text, $10::text, $11::text, $12::text) AS code`,
        [
          req.user.id,
          JSON.stringify(items),
          store.shipping.cost,
          store.shipping.freeFrom,
          payment,
          delivery,
          name,
          phone,
          delivery === 'envio' ? address : null,
          delivery === 'envio' ? city : null,
          delivery === 'envio' && zip ? zip : null,
          notes || null,
        ]
      );
      code = row.code;
    } catch (err) {
      throw orderError(err);
    }

    // Guardamos nombre y teléfono en el perfil si todavía no los tenía.
    await query(
      `UPDATE users SET name = COALESCE(NULLIF(name, ''), $2), phone = COALESCE(NULLIF(phone, ''), $3) WHERE id = $1`,
      [req.user.id, name, phone]
    );

    const order = await getOrder(code);
    try {
      await sendMail({ to: req.user.email, ...orderEmail({ order, url: `${siteUrl(req)}/ticket/${code}` }) });
      order.email_sent = true;
    } catch (err) {
      console.error('No se pudo enviar el ticket por mail:', err);
      order.email_sent = false;
    }

    res.status(201).json({ order });
  })
);

/** Mis pedidos */
router.get(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const rows = await query(
      `SELECT o.code, o.status, o.total::float8 AS total, o.created_at, o.delivery_method, o.payment_method,
              (SELECT COALESCE(SUM(quantity), 0)::int FROM order_items WHERE order_id = o.id) AS items,
              (SELECT COALESCE(json_agg(x.image_url), '[]'::json) FROM (
                 SELECT p.image_url FROM order_items oi JOIN products p ON p.id = oi.product_id
                  WHERE oi.order_id = o.id ORDER BY oi.id LIMIT 4) x) AS images
         FROM orders o
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
        LIMIT 100`,
      [req.user.id]
    );
    const orders = rows.map((r) => ({
      ...r,
      images: (typeof r.images === 'string' ? JSON.parse(r.images) : r.images || []).filter(Boolean),
    }));
    res.json({ orders });
  })
);

/** Ticket: solo lo ve el dueño del pedido o un admin. */
router.get(
  '/:code',
  requireAuth,
  ah(async (req, res) => {
    const code = clean(String(req.params.code), 20).toUpperCase();
    const order = await getOrder(code);
    if (!order || (order.user_id !== req.user.id && req.user.role !== 'admin')) {
      throw new HttpError(404, 'No encontramos ese ticket.');
    }
    res.json({ order });
  })
);

export default router;
