// Servidor de la API para desarrollo local (npm run dev).
// En producción, Vercel usa api/index.js en su lugar.
import 'dotenv/config';
import app from './app.js';
import { mailMode } from './lib/mailer.js';

const port = Number(process.env.API_PORT || 3001);

app.listen(port, () => {
  console.log(`\n  API lista en http://localhost:${port}`);
  if (!process.env.DATABASE_URL) {
    console.log('  ⚠  Falta DATABASE_URL en .env (cadena de conexión de Neon).');
  }
  if (mailMode() === 'console') {
    console.log('  ✉  Sin proveedor de mail: los códigos y tickets se muestran acá en la terminal.');
  }
  if (!process.env.ADMIN_EMAILS) {
    console.log('  ⚠  Falta ADMIN_EMAILS en .env: nadie va a poder entrar al panel /admin.');
  }
  console.log('');
});
