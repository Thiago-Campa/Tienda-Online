/**
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURACIÓN DE LA TIENDA
 *  Este es el único archivo que tenés que tocar para adaptar
 *  la web a cada cliente: nombre, color, textos, envíos, pagos…
 *  Lo usan tanto la web (React) como el servidor (mails, tickets).
 * ─────────────────────────────────────────────────────────────
 */
export const store = {
  name: 'Mostrador',
  tagline: 'Cosas lindas, precios honestos.',
  description:
    'Audio, relojes, calzado y objetos de diseño elegidos uno por uno. Envíos a todo el país y cambios sin vueltas.',
  locale: 'es-AR',
  currency: 'ARS',
  timezone: 'America/Argentina/Buenos_Aires',
  /** Prefijo que se muestra en los tickets: MS-3F9A21BC */
  orderPrefix: 'MS',
  /** Color de marca. Todo el sitio se adapta a este color. */
  accent: '#ff4d1f',

  contact: {
    email: 'hola@mostrador.com.ar',
    phone: '+54 9 11 5555-0142',
    whatsapp: '5491155550142',
    address: 'Thames 1450, Palermo, CABA',
    hours: 'Lunes a sábado de 10 a 19 h',
  },

  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/',
  },

  shipping: {
    cost: 4500,
    freeFrom: 80000,
    eta: '24 a 72 h hábiles',
    pickup: 'Thames 1450, Palermo · Lun a Sáb de 10 a 19 h',
  },

  installments: 3,
  /** Desde cuántas unidades se avisa "últimas unidades" y aparece en alertas del panel */
  lowStock: 5,

  /** Los "id" no se cambian una vez que hay ventas (quedan guardados en cada pedido). */
  paymentMethods: [
    {
      id: 'transferencia',
      label: 'Transferencia bancaria',
      detail: 'Te pasamos los datos en el ticket y por mail.',
    },
    {
      id: 'tarjeta',
      label: 'Tarjeta de crédito o débito',
      detail: 'Te enviamos un link de pago seguro en minutos.',
    },
    {
      id: 'efectivo',
      label: 'Efectivo',
      detail: 'Pagás al retirar o cuando recibís el pedido.',
    },
  ],

  bank: {
    holder: 'Mostrador Tienda SRL',
    bankName: 'Banco Ejemplo',
    alias: 'MOSTRADOR.TIENDA',
    cbu: '0000003100012345678901',
  },

  announcements: [
    'Envío gratis en compras desde $80.000',
    '3 cuotas sin interés con todas las tarjetas',
    'Cambios sin vueltas durante 30 días',
  ],

  hero: {
    eyebrow: 'Temporada 2026 · Nuevos ingresos',
    /** Lo que va entre *asteriscos* se pinta en itálica con el color de marca */
    title: ['Cosas lindas,', 'precios *honestos*.'],
    lead: 'Elegimos cada producto como si fuera para nosotros. Lo despachamos en 24 h y, si no te convence, lo cambiamos.',
    primary: { label: 'Ver catálogo', to: '/tienda' },
    secondary: { label: 'Ofertas de la semana', to: '/tienda?ofertas=1' },
  },

  stats: [
    { value: 2400, prefix: '+', label: 'clientes felices' },
    { value: 4.9, decimals: 1, suffix: '★', label: 'promedio en reseñas' },
    { value: 24, suffix: ' h', label: 'para despachar' },
  ],

  marquee: [
    'Envíos a todo el país',
    'Cuotas sin interés',
    'Cambios en 30 días',
    'Compra protegida',
    'Atención por WhatsApp',
    'Retiro sin cargo',
  ],

  promo: {
    eyebrow: 'Solo por esta semana',
    title: 'Semana del *audio*',
    text: 'Auriculares seleccionados con hasta 25% off. Cuando el contador llega a cero, vuelven a precio de lista.',
    cta: { label: 'Ver ofertas de audio', to: '/tienda?categoria=audio' },
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=75&auto=format&fit=crop',
    /** Etiqueta circular sobre la foto (o null para ocultarla) */
    sticker: ['hasta', '-25%'],
    /** Fecha fija de fin (ej: '2026-12-31T23:59:59'). Si es null, se renueva cada domingo a la noche. */
    endsAt: null,
  },

  benefits: [
    { icon: 'truck', title: 'Envíos a todo el país', text: 'Gratis desde $80.000. Despachamos en 24 h hábiles.' },
    { icon: 'card', title: '3 cuotas sin interés', text: 'Con todas las tarjetas, sin letra chica.' },
    { icon: 'refresh', title: 'Cambios sin vueltas', text: 'Tenés 30 días para cambiarlo. Nosotros lo retiramos.' },
    { icon: 'shield', title: 'Compra protegida', text: 'Cuenta verificada por email y ticket digital al instante.' },
  ],

  testimonials: [
    { name: 'Lucía F.', city: 'CABA', text: 'Compré unos auriculares un martes y el miércoles los tenía en casa. El empaque, un lujo.' },
    { name: 'Martín G.', city: 'Rosario', text: 'Me equivoqué de talle con las zapatillas y el cambio fue facilísimo. Así da gusto comprar.' },
    { name: 'Sofía R.', city: 'Córdoba', text: 'Atención impecable por WhatsApp. Me ayudaron a elegir el reloj para regalar.' },
    { name: 'Joaquín P.', city: 'La Plata', text: 'Precios honestos de verdad. Comparé con otros lados y acá estaba mejor.' },
    { name: 'Valentina M.', city: 'Mendoza', text: 'Llegó perfecto y con el ticket en el mail al toque. Ya hice la segunda compra.' },
  ],

  faq: [
    {
      q: '¿Cuánto tarda el envío?',
      a: 'Despachamos en 24 h hábiles. Según tu zona, llega entre 24 y 72 h hábiles. Te avisamos por mail cuando sale.',
    },
    {
      q: '¿Por qué tengo que crear una cuenta para comprar?',
      a: 'Para que tu compra quede protegida: verificamos tu email con un código, te mandamos el ticket y podés seguir el estado del pedido desde "Mi cuenta". No usamos contraseñas.',
    },
    {
      q: '¿Qué medios de pago aceptan?',
      a: 'Transferencia bancaria, tarjetas de crédito y débito (3 cuotas sin interés) y efectivo al retirar.',
    },
    {
      q: '¿Puedo cambiar un producto?',
      a: 'Sí, tenés 30 días desde que lo recibís. Escribinos por WhatsApp con tu número de ticket y coordinamos.',
    },
    {
      q: '¿Puedo retirar en persona?',
      a: 'Claro. Elegí "Retiro en el local" al finalizar la compra y pasá cuando te avisemos que está listo.',
    },
  ],

  /** Firma del desarrollador en el pie de página (podés dejarlo vacío) */
  credit: { label: 'Sitio hecho por Tu Estudio', url: '#' },
};

export const ORDER_STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
