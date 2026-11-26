import { neon } from '@neondatabase/serverless';

let sql = null;

function client() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'Falta DATABASE_URL. Copiá .env.example a .env y pegá la cadena de conexión de tu base en Neon.'
      );
    }
    sql = neon(url);
  }
  return sql;
}

/**
 * Ejecuta una consulta parametrizada ($1, $2…) y devuelve las filas.
 * Usa el driver HTTP de Neon: ideal para funciones serverless de Vercel.
 */
export async function query(text, params = []) {
  const db = client();
  if (typeof db.query === 'function') return db.query(text, params);
  return db(text, params); // compatibilidad con versiones viejas del driver
}

/** Igual que query() pero devuelve solo la primera fila (o null). */
export async function one(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}
