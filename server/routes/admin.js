import { Router } from 'express';
import { store, ORDER_STATUSES } from '../../config/store.config.js';
import { query, one } from '../lib/db.js';
import { HttpError, ah, clean, slugify, siteUrl } from '../lib/http.js';
import { requireAdmin } from '../lib/auth.js';
import { sendMail } from '../lib/mailer.js';
import { statusEmail } from '../lib/emails.js';
import { PRODUCT_COLS, PRODUCT_FROM } from './catalog.js';
import { getOrder } from './orders.js';

const router = Router();
router.use(requireAdmin);

const TZ = store.timezone;
const RANGES = {
  '30d': `now() - interval '30 days'`,
  '90d': `now() - interval '90 days'`,
  '12m': `now() - interval '12 months'`,
  all: `'-infinity'::timestamptz`,
};

/* ── Estadísticas del dashboard ─────────────────────────── */

router.get(
  '/stats',
  ah(async (req, res) => {
    const range = RANGES[req.query.range] ? req.query.range : '12m';
    const since = RANGES[range];

    const [kpis, monthly, top, categories, allCategories, weekdays, statuses, lowStock, recent] = await Promise.all([
      one(
        `WITH w AS (
           SELECT cur, prev, LEAST(prev + (now() - cur), cur) AS prev_cut FROM (
             SELECT (date_trunc('month', now() AT TIME ZONE $1::text) AT TIME ZONE $1::text) AS cur,
                    (date_trunc('month', (now() AT TIME ZONE $1::text) - interval '1 month') AT TIME ZONE $1::text) AS prev
           ) b
         ), o AS (
           SELECT total, created_at FROM orders WHERE status <> 'cancelado'
         )
         SELECT
           (SELECT COALESCE(SUM(total), 0) FROM o, w WHERE o.created_at >= w.cur)::float8 AS revenue_cur,
           (SELECT COALESCE(SUM(total), 0) FROM o, w WHERE o.created_at >= w.prev AND o.created_at < w.prev_cut)::float8 AS revenue_prev,
           (SELECT COUNT(*) FROM o, w WHERE o.created_at >= w.cur)::int AS orders_cur,
           (SELECT COUNT(*) FROM o, w WHERE o.created_at >= w.prev AND o.created_at < w.prev_cut)::int AS orders_prev,
           (SELECT COALESCE(SUM(total), 0) FROM o)::float8 AS revenue_total,
           (SELECT COUNT(*) FROM o)::int AS orders_total,
           (SELECT COUNT(*) FROM users u, w WHERE u.role = 'customer' AND u.created_at >= w.cur)::int AS customers_cur,
           (SELECT COUNT(*) FROM users u, w WHERE u.role = 'customer' AND u.created_at >= w.prev AND u.created_at < w.prev_cut)::int AS customers_prev,
           (SELECT COUNT(*) FROM users WHERE role = 'customer')::int AS customers_total,
           (SELECT COUNT(*) FROM orders WHERE status = 'pendiente')::int AS pending,
           (SELECT COUNT(*) FROM products WHERE active AND stock = 0)::int AS out_of_stock,
           (SELECT COUNT(*) FROM products WHERE active AND stock > 0 AND stock <= $2::int)::int AS low_stock,
           (SELECT COALESCE(SUM(price * stock), 0) FROM products WHERE active)::float8 AS inventory_value,
           (SELECT COALESCE(SUM(stock), 0) FROM products WHERE active)::int AS inventory_units,
           (SELECT COUNT(*) FROM newsletter)::int AS subscribers`,
        [TZ, store.lowStock]
      ),
      query(
        `SELECT to_char(m.month, 'YYYY-MM') AS month,
                COALESCE(SUM(o.total), 0)::float8 AS revenue,
                COUNT(o.id)::int AS orders
           FROM generate_series(
                  date_trunc('month', now() AT TIME ZONE $1::text) - interval '11 months',
                  date_trunc('month', now() AT TIME ZONE $1::text),
                  interval '1 month') AS m(month)
           LEFT JOIN orders o
             ON o.status <> 'cancelado'
            AND date_trunc('month', o.created_at AT TIME ZONE $1::text) = m.month
          GROUP BY m.month
          ORDER BY m.month`,
        [TZ]
      ),
      query(
        `SELECT oi.product_id, oi.product_name AS name, MAX(p.image_url) AS image_url,
                SUM(oi.quantity)::int AS units, SUM(oi.line_total)::float8 AS revenue
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           LEFT JOIN products p ON p.id = oi.product_id
          WHERE o.status <> 'cancelado' AND o.created_at >= ${since}
          GROUP BY oi.product_id, oi.product_name
          ORDER BY units DESC, revenue DESC
          LIMIT 6`
      ),
      query(
        `SELECT c.id, COALESCE(c.name, 'Sin categoría') AS name,
                SUM(oi.line_total)::float8 AS revenue, SUM(oi.quantity)::int AS units
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           LEFT JOIN products p ON p.id = oi.product_id
           LEFT JOIN categories c ON c.id = p.category_id
          WHERE o.status <> 'cancelado' AND o.created_at >= ${since}
          GROUP BY c.id, c.name
          ORDER BY revenue DESC`
      ),
      query(`SELECT id, name FROM categories ORDER BY sort_order, id`),
      query(
        `SELECT EXTRACT(ISODOW FROM o.created_at AT TIME ZONE $1::text)::int AS dow,
                COUNT(*)::int AS orders, COALESCE(SUM(o.total), 0)::float8 AS revenue
           FROM orders o
          WHERE o.status <> 'cancelado' AND o.created_at >= ${since}
          GROUP BY 1 ORDER BY 1`,
        [TZ]
      ),
      query(`SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status`),
      query(
        `SELECT id, name, stock, image_url FROM products
          WHERE active AND stock <= $1::int ORDER BY stock, name LIMIT 8`,
        [store.lowStock]
      ),
      query(
        `SELECT o.id, o.code, o.status, o.total::float8 AS total, o.created_at,
                u.name AS customer_name, u.email AS customer_email
           FROM orders o JOIN users u ON u.id = o.user_id
          ORDER BY o.created_at DESC LIMIT 6`
      ),
    ]);

    const week = Array.from({ length: 7 }, (_, i) => {
      const found = weekdays.find((d) => d.dow === i + 1);
      return { dow: i + 1, orders: found?.orders ?? 0, revenue: found?.revenue ?? 0 };
    });

    res.json({
      range,
      kpis,
      monthly,
      top,
      categories,
      allCategories,
      weekdays: week,
      statuses: Object.fromEntries(statuses.map((s) => [s.status, s.n])),
      lowStock,
      recent,
    });
  })
);

/* ── Productos ──────────────────────────────────────────── */

function readProduct(b = {}) {
  const name = clean(b.name, 120);
  if (name.length < 2) throw new HttpError(400, 'El nombre es obligatorio.');

  const price = Number(b.price);
  if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'El precio no es válido.');

  const rawCompare = b.compare_at_price;
  const compare = rawCompare === '' || rawCompare === null || rawCompare === undefined ? null : Number(rawCompare);
  if (compare !== null && (!Number.isFinite(compare) || compare < 0)) {
    throw new HttpError(400, 'El precio anterior no es válido.');
  }

  const stock = Number.parseInt(b.stock, 10);
  if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, 'El stock tiene que ser un número entero.');

  const categoryId = b.category_id ? Number.parseInt(b.category_id, 10) : null;
  const image = clean(b.image_url, 800) || null;
  if (image && !/^https?:\/\//i.test(image) && !image.startsWith('/')) {
    throw new HttpError(400, 'La imagen tiene que ser una URL (https://…).');
  }

  return {
    name,
    price,
    compare_at_price: compare && compare > price ? compare : null,
    stock,
    category_id: Number.isInteger(categoryId) ? categoryId : null,
    image_url: image,
    badge: clean(b.badge, 30) || null,
    description: clean(b.description, 4000),
    featured: Boolean(b.featured),
    active: b.active !== false,
  };
}

async function uniqueSlug(table, base, excludeId = null) {
  const rows = await query(
    `SELECT slug FROM ${table} WHERE (slug = $1 OR slug LIKE $1 || '-%') AND ($2::int IS NULL OR id <> $2::int)`,
    [base, excludeId]
  );
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

const productById = (id) => one(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.id = $1`, [id]);

const readId = (req) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'ID inválido.');
  return id;
};

router.get(
  '/products',
  ah(async (_req, res) => {
    const products = await query(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} ORDER BY p.active DESC, p.created_at DESC, p.id DESC`);
    res.json({ products });
  })
);

router.post(
  '/products',
  ah(async (req, res) => {
    const p = readProduct(req.body);
    const slug = await uniqueSlug('products', slugify(p.name));
    const row = await one(
      `INSERT INTO products (name, slug, description, price, compare_at_price, stock, category_id, image_url, badge, featured, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [p.name, slug, p.description, p.price, p.compare_at_price, p.stock, p.category_id, p.image_url, p.badge, p.featured, p.active]
    );
    res.status(201).json({ product: await productById(row.id) });
  })
);

router.put(
  '/products/:id',
  ah(async (req, res) => {
    const id = readId(req);
    const p = readProduct(req.body);
    const row = await one(
      `UPDATE products SET name = $2, description = $3, price = $4, compare_at_price = $5, stock = $6,
              category_id = $7, image_url = $8, badge = $9, featured = $10, active = $11, updated_at = now()
        WHERE id = $1 RETURNING id`,
      [id, p.name, p.description, p.price, p.compare_at_price, p.stock, p.category_id, p.image_url, p.badge, p.featured, p.active]
    );
    if (!row) throw new HttpError(404, 'Producto no encontrado.');
    res.json({ product: await productById(id) });
  })
);

/** Cambios rápidos desde la tabla: stock, activo, destacado. */
router.patch(
  '/products/:id',
  ah(async (req, res) => {
    const id = readId(req);
    const b = req.body || {};
    const sets = [];
    const params = [id];
    if ('stock' in b) {
      const stock = Number.parseInt(b.stock, 10);
      if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, 'El stock tiene que ser un número entero.');
      params.push(stock);
      sets.push(`stock = $${params.length}`);
    }
    if ('active' in b) {
      params.push(Boolean(b.active));
      sets.push(`active = $${params.length}`);
    }
    if ('featured' in b) {
      params.push(Boolean(b.featured));
      sets.push(`featured = $${params.length}`);
    }
    if (!sets.length) throw new HttpError(400, 'Nada para actualizar.');
    const row = await one(`UPDATE products SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING id`, params);
    if (!row) throw new HttpError(404, 'Producto no encontrado.');
    res.json({ product: await productById(id) });
  })
);

router.delete(
  '/products/:id',
  ah(async (req, res) => {
    const id = readId(req);
    // Las ventas viejas conservan nombre y precio del producto (order_items guarda una copia).
    await query(`DELETE FROM products WHERE id = $1`, [id]);
    res.json({ ok: true });
  })
);

/* ── Categorías ─────────────────────────────────────────── */

router.post(
  '/categories',
  ah(async (req, res) => {
    const name = clean(req.body?.name, 60);
    if (name.length < 2) throw new HttpError(400, 'Escribí el nombre de la categoría.');
    const slug = await uniqueSlug('categories', slugify(name));
    const category = await one(
      `INSERT INTO categories (name, slug, sort_order)
       VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
       RETURNING id, name, slug`,
      [name, slug]
    );
    res.status(201).json({ category });
  })
);

router.delete(
  '/categories/:id',
  ah(async (req, res) => {
    await query(`DELETE FROM categories WHERE id = $1`, [readId(req)]);
    res.json({ ok: true });
  })
);

/* ── Pedidos ────────────────────────────────────────────── */

router.get(
  '/orders',
  ah(async (req, res) => {
    const status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : 'todos';
    const prefix = new RegExp(`^${store.orderPrefix}-?`, 'i');
    const q = clean(String(req.query.q || ''), 80).replace(prefix, '');

    const [orders, counts] = await Promise.all([
      query(
        `SELECT o.id, o.code, o.status, o.total::float8 AS total, o.payment_method, o.delivery_method,
                o.shipping_city, o.created_at,
                u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
                (SELECT COALESCE(SUM(quantity), 0)::int FROM order_items WHERE order_id = o.id) AS items
           FROM orders o JOIN users u ON u.id = o.user_id
          WHERE ($1::text = 'todos' OR o.status = $1::text)
            AND ($2::text = '' OR o.code ILIKE $2::text || '%' OR u.email ILIKE '%' || $2::text || '%'
                 OR u.name ILIKE '%' || $2::text || '%')
          ORDER BY o.created_at DESC
          LIMIT 300`,
        [status, q]
      ),
      query(`SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status`),
    ]);

    const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));
    byStatus.todos = counts.reduce((acc, c) => acc + c.n, 0);
    res.json({ orders, counts: byStatus });
  })
);

router.patch(
  '/orders/:id',
  ah(async (req, res) => {
    const id = readId(req);
    const status = req.body?.status;
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Estado inválido.');

    const current = await one(`SELECT id, code, status FROM orders WHERE id = $1`, [id]);
    if (!current) throw new HttpError(404, 'Pedido no encontrado.');
    if (current.status === status) return res.json({ order: await getOrder(current.code), notified: false });
    if (current.status === 'cancelado') {
      throw new HttpError(409, 'Un pedido cancelado no se puede reactivar. Pedile al cliente que compre de nuevo.');
    }

    if (status === 'cancelado') {
      // Cancelar devuelve el stock en la misma sentencia.
      await query(
        `WITH o AS (
           UPDATE orders SET status = 'cancelado', updated_at = now()
            WHERE id = $1 AND status <> 'cancelado' RETURNING id
         )
         UPDATE products p SET stock = p.stock + oi.quantity, updated_at = now()
           FROM order_items oi JOIN o ON o.id = oi.order_id
          WHERE p.id = oi.product_id`,
        [id]
      );
    } else {
      await query(`UPDATE orders SET status = $2, updated_at = now() WHERE id = $1`, [id, status]);
    }

    const order = await getOrder(current.code);
    let notified = false;
    const mail = statusEmail({ order, url: `${siteUrl(req)}/ticket/${order.code}` });
    if (mail) {
      try {
        await sendMail({ to: order.customer_email, ...mail });
        notified = true;
      } catch (err) {
        console.error('No se pudo avisar el cambio de estado:', err);
      }
    }
    res.json({ order, notified });
  })
);

/* ── Clientes ───────────────────────────────────────────── */

router.get(
  '/customers',
  ah(async (req, res) => {
    const q = clean(String(req.query.q || ''), 80);
    const customers = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, u.last_login_at,
              COUNT(o.id) FILTER (WHERE o.status <> 'cancelado')::int AS orders,
              COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'cancelado'), 0)::float8 AS spent,
              MAX(o.created_at) AS last_order
         FROM users u
         LEFT JOIN orders o ON o.user_id = u.id
        WHERE u.role = 'customer'
          AND ($1::text = '' OR u.name ILIKE '%' || $1::text || '%' OR u.email ILIKE '%' || $1::text || '%'
               OR u.phone ILIKE '%' || $1::text || '%')
        GROUP BY u.id
        ORDER BY spent DESC, u.created_at DESC
        LIMIT 500`,
      [q]
    );
    res.json({ customers });
  })
);

export default router;
