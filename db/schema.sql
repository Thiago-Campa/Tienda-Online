-- ─────────────────────────────────────────────────────────────
--  Estructura de la base (Neon / PostgreSQL)
--  Se puede correr varias veces sin romper nada.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT,
  phone          TEXT,
  role           TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_codes_email_idx ON verification_codes (email, created_at DESC);

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id                SERIAL PRIMARY KEY,
  category_id       INT REFERENCES categories(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT NOT NULL DEFAULT '',
  price             NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_at_price  NUMERIC(12, 2) CHECK (compare_at_price >= 0),
  stock             INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url         TEXT,
  badge             TEXT,
  featured          BOOLEAN NOT NULL DEFAULT false,
  active            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id);

CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  code              TEXT NOT NULL UNIQUE,
  user_id           INT NOT NULL REFERENCES users(id),
  status            TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (status IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  subtotal          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method    TEXT NOT NULL,
  delivery_method   TEXT NOT NULL CHECK (delivery_method IN ('envio', 'retiro')),
  shipping_name     TEXT,
  shipping_phone    TEXT,
  shipping_address  TEXT,
  shipping_city     TEXT,
  shipping_zip      TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INT REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  unit_price    NUMERIC(12, 2) NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  line_total    NUMERIC(12, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_id);

CREATE TABLE IF NOT EXISTS newsletter (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
--  create_order(): crea el pedido de forma atómica.
--  Toma los precios de la base (no del navegador), bloquea las
--  filas de producto, verifica stock y lo descuenta. Si algo
--  falla, no se guarda nada.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_order(
  p_user_id     INT,
  p_items       JSONB,
  p_ship_cost   NUMERIC,
  p_free_from   NUMERIC,
  p_payment     TEXT,
  p_delivery    TEXT,
  p_name        TEXT,
  p_phone       TEXT,
  p_address     TEXT,
  p_city        TEXT,
  p_zip         TEXT,
  p_notes       TEXT
) RETURNS TEXT AS $$
DECLARE
  v_order_id  INT;
  v_code      TEXT;
  v_subtotal  NUMERIC(12, 2) := 0;
  v_shipping  NUMERIC(12, 2) := 0;
  r           RECORD;
  v_prod      RECORD;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'CART_EMPTY';
  END IF;

  LOOP
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE code = v_code);
  END LOOP;

  INSERT INTO orders (code, user_id, payment_method, delivery_method, shipping_name, shipping_phone,
                      shipping_address, shipping_city, shipping_zip, notes)
  VALUES (v_code, p_user_id, p_payment, p_delivery, p_name, p_phone, p_address, p_city, p_zip, p_notes)
  RETURNING id INTO v_order_id;

  FOR r IN
    SELECT (e->>'id')::int AS product_id, SUM((e->>'qty')::int) AS qty
      FROM jsonb_array_elements(p_items) AS e
     GROUP BY 1
     ORDER BY 1
  LOOP
    IF r.qty IS NULL OR r.qty <= 0 THEN
      RAISE EXCEPTION 'BAD_QTY';
    END IF;

    SELECT id, name, price, stock, active INTO v_prod
      FROM products WHERE id = r.product_id
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'NOT_AVAILABLE:%', r.product_id;
    END IF;
    IF NOT v_prod.active THEN
      RAISE EXCEPTION 'NOT_AVAILABLE:%', r.product_id;
    END IF;
    IF v_prod.stock < r.qty THEN
      RAISE EXCEPTION 'NO_STOCK:%', v_prod.name;
    END IF;

    UPDATE products SET stock = stock - r.qty, updated_at = now() WHERE id = v_prod.id;

    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    VALUES (v_order_id, v_prod.id, v_prod.name, v_prod.price, r.qty, v_prod.price * r.qty);

    v_subtotal := v_subtotal + v_prod.price * r.qty;
  END LOOP;

  IF p_delivery = 'envio' AND v_subtotal < p_free_from THEN
    v_shipping := p_ship_cost;
  END IF;

  UPDATE orders
     SET subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping
   WHERE id = v_order_id;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;
