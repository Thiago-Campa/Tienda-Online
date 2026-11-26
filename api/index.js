// Punto de entrada para Vercel: toda la API vive en una sola función serverless.
// vercel.json redirige /api/* acá y Express resuelve la ruta.
import app from '../server/app.js';

export default app;
