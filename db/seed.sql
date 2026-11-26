-- ─────────────────────────────────────────────────────────────
--  Catálogo de ejemplo. Reemplazalo por los productos del cliente
--  (o cargalos desde el panel /admin/productos).
-- ─────────────────────────────────────────────────────────────

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Audio',        'audio',        1),
  ('Relojes',      'relojes',      2),
  ('Calzado',      'calzado',      3),
  ('Accesorios',   'accesorios',   4),
  ('Hogar',        'hogar',        5),
  ('Indumentaria', 'indumentaria', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, price, compare_at_price, stock, image_url, badge, featured)
SELECT c.id, v.name, v.slug, v.description, v.price, v.compare_at_price, v.stock,
       'https://images.unsplash.com/photo-' || v.photo || '?w=900&q=75&auto=format&fit=crop',
       v.badge, v.featured
FROM (VALUES
  ('audio', 'Auriculares Studio Over-Ear', 'auriculares-studio-over-ear',
   'Almohadillas de espuma viscoelástica, 40 h de batería y un sonido cálido que no cansa. Plegables y con estuche rígido.',
   89900, 109900, 14, '1505740420928-5e560c06d30e', 'Oferta', true),
  ('audio', 'Auriculares Bluetooth Noise', 'auriculares-bluetooth-noise',
   'Cancelación activa de ruido, modo ambiente y carga rápida: 10 minutos te dan 5 horas de música.',
   129900, NULL, 8, '1484704849700-f032a568e944', 'Nuevo', true),
  ('audio', 'Auriculares Wireless Lite', 'auriculares-wireless-lite',
   'Livianos, con micrófono para llamadas y conexión multipunto. Ideales para el día a día.',
   64900, 74900, 22, '1546435770-a3e426bf472b', NULL, false),
  ('audio', 'Auriculares Pro Cancelación', 'auriculares-pro-cancelacion',
   'Nuestro modelo tope de gama: drivers de 50 mm, audio espacial y estuche de viaje en cuero vegano.',
   149900, 189900, 3, '1583394838336-acd977736f90', 'Oferta', false),

  ('relojes', 'Reloj Minimal Blanco', 'reloj-minimal-blanco',
   'Caja de 38 mm, cristal de zafiro y malla de cuero intercambiable. Resistente al agua 5 ATM.',
   74900, 89900, 11, '1523275335684-37898b6baf30', NULL, true),
  ('relojes', 'Reloj Cronógrafo Acero', 'reloj-cronografo-acero',
   'Cronógrafo de cuarzo japonés con caja de acero inoxidable 316L y malla milanesa.',
   119900, NULL, 6, '1524805444758-089113d48a6d', NULL, false),
  ('relojes', 'Smartwatch Serie Pulse', 'smartwatch-serie-pulse',
   'Pantalla AMOLED, GPS, monitor de sueño y 7 días de batería. Compatible con Android e iOS.',
   159900, NULL, 0, '1546868871-7041f2a55e12', 'Nuevo', false),

  ('calzado', 'Zapatillas Runner Rojas', 'zapatillas-runner-rojas',
   'Capellada de malla respirable y suela con amortiguación de espuma. Del entrenamiento a la calle.',
   99900, 124900, 18, '1542291026-7eec264c27ff', 'Top ventas', true),
  ('calzado', 'Zapatillas Urban Classic', 'zapatillas-urban-classic',
   'Un clásico de cuero con plantilla acolchada. Combinan con todo y duran años.',
   92900, NULL, 9, '1600185365483-26d7a4cc7519', NULL, false),
  ('calzado', 'Zapatillas Street Duo', 'zapatillas-street-duo',
   'Edición en dos tonos con suela de goma vulcanizada. Tirada corta.',
   105900, NULL, 4, '1491553895911-0055eca6402d', 'Edición limitada', false),

  ('accesorios', 'Anteojos de Sol Retro', 'anteojos-de-sol-retro',
   'Marco de acetato hecho a mano y lentes polarizadas con protección UV400. Incluyen funda.',
   45900, NULL, 25, '1572635196237-14b3f281503f', NULL, true),
  ('accesorios', 'Mochila Urbana 22L', 'mochila-urbana-22l',
   'Lona encerada impermeable, compartimento acolchado para notebook de 15" y bolsillo oculto.',
   68900, NULL, 12, '1553062407-98eeb64c6a62', NULL, false),
  ('accesorios', 'Cámara Instantánea', 'camara-instantanea',
   'Fotos reveladas en segundos, flash automático y espejo para selfies. Incluye 10 películas.',
   134900, NULL, 5, '1526170375885-4d8ecf77b99f', 'Nuevo', true),
  ('accesorios', 'Perfume Amber Nº 7', 'perfume-amber-n7',
   'Eau de parfum de 100 ml con notas de ámbar, vainilla y madera de cedro. Larga duración.',
   58900, NULL, 16, '1541643600914-78b084683601', NULL, false),

  ('hogar', 'Lámpara de Mesa Arco', 'lampara-de-mesa-arco',
   'Base de hierro, pantalla orientable y luz cálida regulable. Lámpara LED incluida.',
   54900, NULL, 7, '1507473885765-e6ed057f782c', NULL, false),
  ('hogar', 'Planta + Maceta Cerámica', 'planta-maceta-ceramica',
   'Planta de interior de bajo mantenimiento en maceta de cerámica esmaltada artesanal.',
   18900, NULL, 30, '1485955900006-10f4d324d411', NULL, false),

  ('indumentaria', 'Remera Esencial Algodón', 'remera-esencial-algodon',
   'Algodón peinado de 24/1, calce regular y costuras reforzadas. La remera que vas a usar siempre.',
   19900, NULL, 40, '1521572163474-6864f9cf17ab', NULL, false),
  ('indumentaria', 'Buzo Oversize Frisa', 'buzo-oversize-frisa',
   'Frisa invisible de algodón, capucha forrada y bolsillo canguro. Calce amplio.',
   42900, 49900, 2, '1556821840-3a63f95609a7', 'Oferta', false)
) AS v(cat, name, slug, description, price, compare_at_price, stock, photo, badge, featured)
JOIN categories c ON c.slug = v.cat
ON CONFLICT (slug) DO NOTHING;
