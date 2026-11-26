import express from 'express';
import cookieParser from 'cookie-parser';
import { isProd } from './lib/http.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');

  // Protección CSRF simple: las escrituras tienen que venir desde el mismo sitio.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
    let originHost = '';
    try {
      originHost = new URL(req.headers.origin).host;
    } catch {
      /* origin inválido */
    }
    const hosts = [req.headers.host, req.headers['x-forwarded-host']].filter(Boolean).map(String);
    if (!hosts.some((h) => h.split(',')[0].trim() === originHost)) {
      return res.status(403).json({ error: 'Origen no permitido.' });
    }
  }
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', catalogRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
  if (status >= 500) console.error(err);
  const message =
    status < 500 ? err.message : isProd ? 'Ocurrió un error en el servidor. Probá de nuevo.' : `Error del servidor: ${err.message}`;
  res.status(status).json({ error: message, ...(err.extra || {}) });
});

export default app;
