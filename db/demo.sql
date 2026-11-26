-- ─────────────────────────────────────────────────────────────
--  Ventas de DEMOSTRACIÓN para que el panel tenga datos para
--  mostrar (12 meses de pedidos). Los clientes demo usan emails
--  @example.com. Para borrarlos: npm run db:clear-demo
-- ─────────────────────────────────────────────────────────────

INSERT INTO users (email, name, phone, role, created_at) VALUES
  ('lucia.fernandez@example.com',  'Lucía Fernández',  '11 5023-4411', 'customer', now() - interval '350 days'),
  ('martin.gomez@example.com',     'Martín Gómez',     '341 555-0192', 'customer', now() - interval '330 days'),
  ('sofia.ramirez@example.com',    'Sofía Ramírez',    '351 555-7720', 'customer', now() - interval '300 days'),
  ('joaquin.paz@example.com',      'Joaquín Paz',      '221 555-3381', 'customer', now() - interval '280 days'),
  ('valentina.mendez@example.com', 'Valentina Méndez', '261 555-9016', 'customer', now() - interval '250 days'),
  ('tomas.herrera@example.com',    'Tomás Herrera',    '11 5550-2214', 'customer', now() - interval '220 days'),
  ('camila.sosa@example.com',      'Camila Sosa',      '223 555-4470', 'customer', now() - interval '190 days'),
  ('nicolas.aguirre@example.com',  'Nicolás Aguirre',  '299 555-1188', 'customer', now() - interval '160 days'),
  ('micaela.rojas@example.com',    'Micaela Rojas',    '387 555-6624', 'customer', now() - interval '130 days'),
  ('federico.luna@example.com',    'Federico Luna',    '11 5551-7731', 'customer', now() - interval '100 days'),
  ('agustina.vera@example.com',    'Agustina Vera',    '341 555-2093', 'customer', now() - interval '70 days'),
  ('bruno.castro@example.com',     'Bruno Castro',     '351 555-8840', 'customer', now() - interval '45 days'),
  ('julieta.ortiz@example.com',    'Julieta Ortiz',    '11 5552-6612', 'customer', now() - interval '20 days'),
  ('lautaro.molina@example.com',   'Lautaro Molina',   '221 555-5157', 'customer', now() - interval '9 days'),
  ('renata.silva@example.com',     'Renata Silva',     '261 555-0475', 'customer', now() - interval '3 days')
ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
  i          INT;
  n_items    INT;
  q          INT;
  v_order    INT;
  v_user     INT;
  v_date     TIMESTAMPTZ;
  v_age      INTERVAL;
  v_sub      NUMERIC(12, 2);
  v_ship     NUMERIC(12, 2);
  v_status   TEXT;
  v_delivery TEXT;
  v_payment  TEXT;
  p          RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email LIKE '%@example.com'
  ) THEN
    RAISE NOTICE 'Ya hay ventas de demostración: no se agregan de nuevo.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products) THEN
    RAISE NOTICE 'No hay productos: corré primero seed.sql.';
    RETURN;
  END IF;

  FOR i IN 1..260 LOOP
    -- Más pedidos en los meses recientes (la tienda "crece").
    v_date := now()
            - ((0.72 * (1 - sqrt(random())) + 0.28 * random()) * interval '360 days')
            - (random() * interval '10 hours');
    v_age := now() - v_date;

    SELECT id INTO v_user FROM users WHERE email LIKE '%@example.com' ORDER BY random() LIMIT 1;

    v_status := CASE
      WHEN random() < 0.05 THEN 'cancelado'
      WHEN v_age > interval '12 days' THEN 'entregado'
      WHEN v_age > interval '4 days' THEN (ARRAY['enviado', 'entregado'])[1 + floor(random() * 2)::int]
      ELSE (ARRAY['pendiente', 'pagado', 'enviado'])[1 + floor(random() * 3)::int]
    END;
    v_delivery := CASE WHEN random() < 0.7 THEN 'envio' ELSE 'retiro' END;
    v_payment := (ARRAY['transferencia', 'tarjeta', 'efectivo'])[1 + floor(random() * 3)::int];

    INSERT INTO orders (code, user_id, status, payment_method, delivery_method, shipping_name, shipping_phone,
                        shipping_address, shipping_city, created_at, updated_at)
    SELECT upper(substr(md5(random()::text || clock_timestamp()::text || i::text), 1, 8)),
           u.id, v_status, v_payment, v_delivery, u.name, u.phone,
           CASE WHEN v_delivery = 'envio' THEN 'Calle ' || (100 + floor(random() * 3000)::int) END,
           CASE WHEN v_delivery = 'envio' THEN
             (ARRAY['CABA', 'La Plata', 'Rosario', 'Córdoba', 'Mendoza', 'Mar del Plata', 'Neuquén', 'Salta'])[1 + floor(random() * 8)::int]
           END,
           v_date, v_date
      FROM users u WHERE u.id = v_user
    RETURNING id INTO v_order;

    v_sub := 0;
    n_items := 1 + floor(random() * random() * 3.2)::int;

    FOR p IN
      SELECT id, name, price FROM products
       ORDER BY -ln(1 - random()) / (CASE WHEN featured THEN 2.6 ELSE 1.0 END + CASE WHEN price < 50000 THEN 0.8 ELSE 0 END)
       LIMIT n_items
    LOOP
      q := CASE WHEN random() < 0.82 THEN 1 ELSE 2 END;
      INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
      VALUES (v_order, p.id, p.name, p.price, q, p.price * q);
      v_sub := v_sub + p.price * q;
    END LOOP;

    v_ship := CASE WHEN v_delivery = 'envio' AND v_sub < 80000 THEN 4500 ELSE 0 END;
    UPDATE orders SET subtotal = v_sub, shipping = v_ship, total = v_sub + v_ship WHERE id = v_order;
  END LOOP;
END $$;

INSERT INTO newsletter (email, created_at)
SELECT 'suscriptor' || g || '@example.com', now() - (g || ' days')::interval
  FROM generate_series(1, 64) AS g
ON CONFLICT (email) DO NOTHING;
