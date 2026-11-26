# Tienda online — plantilla lista para vender

Tienda completa con **React + Node (Express) + Neon (PostgreSQL)**, pensada para publicarse en **Vercel**.
Se adapta a cualquier rubro cambiando un solo archivo de configuración.

## Qué incluye

**Tienda**
- Pantalla de carga animada (letras de la marca + contador + telón de dos colores).
- Modo claro / oscuro con transición circular desde el botón (se recuerda la elección).
- 100 % responsive (celular, tablet, escritorio), con menú móvil a pantalla completa.
- Inicio con hero con parallax, cinta animada, categorías con vista previa que sigue al mouse,
  destacados, promo con cuenta regresiva, beneficios, opiniones, preguntas frecuentes y newsletter.
- Catálogo con búsqueda, filtros (categoría, ofertas, con stock, precio) y orden.
- Página de producto con zoom, stock en vivo ("¡quedan 3!"), cuotas y relacionados.
- Carrito lateral con barra de "te faltan $X para envío gratis".

**Compra**
- Para comprar **hay que iniciar sesión** con **código de verificación** de 6 dígitos enviado al email
  (sin contraseñas). La cuenta se crea sola la primera vez.
- Checkout: datos, envío o retiro, medio de pago (transferencia, tarjeta, efectivo).
- El stock se valida y se descuenta **en la base de datos de forma atómica** (no se puede vender de más).
- **Ticket digital** con número, QR, código de barras e instrucciones de pago, imprimible / PDF.
- **Mail con el ticket** a la casilla con la que se registró el cliente.
- "Mi cuenta" con historial de pedidos y estado de cada uno.

**Panel de administración (`/admin`)**
- Ingresos, pedidos, ticket promedio y clientes nuevos del mes, con comparación contra el mes anterior.
- Gráfico de ventas por mes (ingresos o pedidos), con tabla de datos.
- Productos más vendidos, ventas por categoría, días de la semana con más pedidos (filtrable por período).
- Alertas de stock con reposición rápida, valor del inventario, suscriptores.
- Pedidos: filtros por estado, búsqueda, detalle, cambio de estado (el cliente recibe un mail),
  cancelación que devuelve el stock, contacto por WhatsApp/email y **exportar a CSV (Excel)**.
- Productos: alta, edición, stock editable en la tabla, destacar, ocultar, eliminar y categorías.
- Clientes: ranking por gasto, tasa de recompra, contacto directo.

---

## 1. Correrlo en tu PC

Necesitás **Node.js 20 o superior**.

```bash
npm install
```

```bash
cp .env.example .env
```
(en Windows: copiá el archivo `.env.example` y renombralo a `.env`)

Completá `.env` (ver la sección 2 para la base de datos). Después:

```bash
npm run db:setup
```

```bash
npm run dev
```

Abrí <http://localhost:5173>. La API corre en el puerto 3001 y Vite la redirige sola.

> **Sin configurar el mail**, el código de verificación aparece **en la pantalla de ingreso** y en la
> terminal. Así podés probar todo sin cuenta de email. En producción esto se desactiva.

Para entrar al panel: poné tu email en `ADMIN_EMAILS` dentro de `.env`, ingresá con ese email y andá a `/admin`.

## 2. Base de datos en Neon

1. Creá una cuenta en <https://neon.tech> y un proyecto nuevo (región São Paulo si el público es de Argentina).
2. En el dashboard tocá **Connect**, elegí la conexión **pooled** y copiá la URL.
3. Pegala en `.env` como `DATABASE_URL=...`.
4. Corré `npm run db:setup` → crea las tablas, carga el catálogo de ejemplo y 12 meses de ventas demo.

Alternativa sin consola: abrí el **SQL Editor** de Neon y pegá, en orden, `db/schema.sql`, `db/seed.sql` y `db/demo.sql`.

| Comando | Qué hace |
|---|---|
| `npm run db:setup` | Estructura + catálogo de ejemplo + ventas demo |
| `npm run db:schema` | Solo la estructura (para un cliente real, sin datos de prueba) |
| `npm run db:demo` | Agrega ventas demo |
| `npm run db:clear-demo` | Borra clientes y ventas demo (los `@example.com`) |
| `npm run db:reset -- --si` | ⚠ Borra TODO y vuelve a crear con demo |

## 3. Envío de emails

Completá **una** de estas opciones en `.env` (y en Vercel):

- **Resend** (recomendado): creá una cuenta en <https://resend.com>, verificá tu dominio y poné
  `RESEND_API_KEY` y `MAIL_FROM=Tu Tienda <hola@tudominio.com>`.
- **SMTP** (Gmail, Brevo, Zoho…): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
  Con Gmail usá una **contraseña de aplicación** (no tu contraseña normal) y `SMTP_HOST=smtp.gmail.com`.

Se envían: código de acceso, ticket de compra y avisos de cambio de estado (pagado, enviado, entregado, cancelado).

## 4. Publicar en Vercel

1. Subí el proyecto a un repositorio de GitHub.
2. En <https://vercel.com> → **Add New → Project** → importá el repo. Vercel detecta Vite solo.
3. En **Settings → Environment Variables** cargá: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAILS`,
   `SITE_URL` (ej. `https://tutienda.com`) y las del mail.
4. **Deploy**. Listo: la tienda y la API (`/api/*`) quedan en el mismo dominio.

> Tip: también podés conectar Neon desde **Vercel → Storage → Neon** y la variable `DATABASE_URL` se carga sola.

`JWT_SECRET` tiene que ser largo y aleatorio. Podés generar uno con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 5. Adaptarla a cada cliente

Casi todo está en **`config/store.config.js`**:

- `name`, `tagline`, `description` → marca y textos de la pestaña.
- `accent` → color de marca (todo el sitio se adapta, en modo claro y oscuro).
- `contact`, `social` → WhatsApp, email, dirección, redes.
- `shipping` → costo de envío, monto para envío gratis, dirección de retiro.
- `paymentMethods`, `bank` → medios de pago y datos para transferencias (salen en ticket y mail).
- `hero`, `stats`, `marquee`, `promo`, `benefits`, `testimonials`, `faq`, `announcements` → contenido del inicio.
- `credit` → tu firma en el pie de página.

Los productos y categorías se cargan desde el panel `/admin/productos` (las imágenes van por URL:
podés usar Cloudinary, Imgur, el hosting del cliente, etc.).

Para un cliente real: `npm run db:schema` (o `db:setup` y después `db:clear-demo`), borrá los productos
de ejemplo desde el panel y cargá los suyos.

## Estructura

```
api/index.js            → función serverless de Vercel (entrada de la API)
server/app.js           → Express: rutas y manejo de errores
server/routes/          → auth (código por mail), catálogo, pedidos, admin
server/lib/             → base de datos (Neon), sesiones (JWT en cookie httpOnly), mails
db/                     → SQL: estructura, catálogo, ventas demo
config/store.config.js  → configuración de la tienda (la usan front y back)
src/                    → React (páginas, componentes, contextos, estilos)
```

## Seguridad

- Sesión en cookie `httpOnly` + `SameSite=Lax` firmada con JWT; verificación de origen en escrituras.
- Códigos de acceso guardados como hash, con vencimiento (10 min), límite de intentos y de reenvíos.
- Precios y stock siempre se toman de la base (el navegador no puede cambiar el precio).
- El panel y sus APIs solo responden a usuarios con rol `admin` (definidos en `ADMIN_EMAILS`).

## Próximos pasos posibles

- Cobro online con Mercado Pago (Checkout Pro) para pasar los pedidos a "pagado" automáticamente.
- Subida de imágenes directa (Vercel Blob o Cloudinary).
- Cupones de descuento y varias fotos por producto.
