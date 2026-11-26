-- ⚠  BORRA TODA LA BASE (tablas y datos). Solo para empezar de cero.
DROP FUNCTION IF EXISTS create_order(INT, JSONB, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS returns, order_items, orders, products, categories, verification_codes, newsletter, users CASCADE;
