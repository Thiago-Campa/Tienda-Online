import { Router } from 'express';
import { query, one } from '../lib/db.js';
import { HttpError, ah, clean, EMAIL_RE } from '../lib/http.js';

const router = Router();

export const PRODUCT_COLS = `
  p.id, p.name, p.slug, p.description,
  p.price::float8 AS price,
  p.compare_at_price::float8 AS compare_at_price,
  p.stock, p.image_url, p.badge, p.featured, p.active, p.category_id, p.created_at,
  c.name AS category_name, c.slug AS category_slug,
  COALESCE(s.sold, 0)::int AS sold`;

export const PRODUCT_FROM = `
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN (
    SELECT oi.product_id, SUM(oi.quantity) AS sold
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.status <> 'cancelado'
     GROUP BY oi.product_id
  ) s ON s.product_id = p.id`;

const SORTS = {
  relevancia: 'p.featured DESC, sold DESC, p.created_at DESC',
  'mas-vendidos': 'sold DESC, p.name',
  nuevos: 'p.created_at DESC',
  'precio-asc': 'p.price ASC',
  'precio-desc': 'p.price DESC',
  nombre: 'p.name ASC',
};

router.get(
  '/categories',
  ah(async (_req, res) => {
    const categories = await query(`
      SELECT c.id, c.name, c.slug,
             COUNT(p.id) FILTER (WHERE p.active)::int AS product_count,
             (SELECT p2.image_url FROM products p2
               WHERE p2.category_id = c.id AND p2.active AND p2.image_url IS NOT NULL
               ORDER BY p2.featured DESC, p2.id LIMIT 1) AS cover
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`);
    res.json({ categories });
  })
);

router.get(
  '/products',
  ah(async (req, res) => {
    const where = ['p.active'];
    const params = [];
    const param = (v) => `$${params.push(v)}`;
    const q = req.query;

    if (q.ids) {
      const ids = String(q.ids)
        .split(',')
        .map((n) => Number.parseInt(n, 10))
        .filter((n) => Number.isInteger(n) && n > 0)
        .slice(0, 100);
      if (!ids.length) return res.json({ products: [] });
      where.push(`p.id = ANY(${param(`{${ids.join(',')}}`)}::int[])`);
    }
    if (q.category) where.push(`c.slug = ${param(String(q.category))}`);
    if (q.q) {
      const ph = param(`%${clean(String(q.q), 80)}%`);
      where.push(`(p.name ILIKE ${ph} OR p.description ILIKE ${ph} OR c.name ILIKE ${ph})`);
    }
    const min = Number(q.min);
    const max = Number(q.max);
    if (q.min && Number.isFinite(min)) where.push(`p.price >= ${param(min)}`);
    if (q.max && Number.isFinite(max)) where.push(`p.price <= ${param(max)}`);
    if (q.stock === '1') where.push('p.stock > 0');
    if (q.featured === '1') where.push('p.featured');
    if (q.ofertas === '1') where.push('p.compare_at_price > p.price');

    const order = SORTS[q.sort] || SORTS.relevancia;
    const limit = Math.min(Math.max(Number.parseInt(q.limit, 10) || 60, 1), 100);

    const products = await query(
      `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM}
        WHERE ${where.join(' AND ')}
        ORDER BY (p.stock = 0), ${order}
        LIMIT ${limit}`,
      params
    );
    res.json({ products });
  })
);

router.get(
  '/products/:slug',
  ah(async (req, res) => {
    const product = await one(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.slug = $1 AND p.active`, [
      String(req.params.slug),
    ]);
    if (!product) throw new HttpError(404, 'No encontramos ese producto.');
    const related = await query(
      `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM}
        WHERE p.active AND p.id <> $1 AND ($2::int IS NULL OR p.category_id = $2)
        ORDER BY (p.stock = 0), p.featured DESC, sold DESC
        LIMIT 4`,
      [product.id, product.category_id]
    );
    res.json({ product, related });
  })
);

router.post(
  '/newsletter',
  ah(async (req, res) => {
    const email = clean(req.body?.email, 160).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Ingresá un email válido.');
    await query(`INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`, [email]);
    res.json({ ok: true });
  })
);

export default router;
