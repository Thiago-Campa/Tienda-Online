-- Borra SOLO los datos de demostración (clientes @example.com, sus pedidos y suscriptores demo).
-- Los productos y las ventas reales no se tocan.
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
DELETE FROM users WHERE email LIKE '%@example.com';
DELETE FROM newsletter WHERE email LIKE '%@example.com';
