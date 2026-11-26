// Ejecuta los archivos SQL de /db contra la base de Neon configurada en .env
//   npm run db:setup        → estructura + catálogo + ventas demo
//   npm run db:schema       → solo estructura (para un cliente real)
//   npm run db:demo         → agrega ventas demo
//   npm run db:clear-demo   → borra los datos demo
//   npm run db:reset -- --si → BORRA TODO y vuelve a crear con demo
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const TASKS = {
  setup: ['schema.sql', 'seed.sql', 'demo.sql'],
  schema: ['schema.sql'],
  seed: ['seed.sql'],
  demo: ['demo.sql'],
  'clear-demo': ['clear-demo.sql'],
  reset: ['reset.sql', 'schema.sql', 'seed.sql', 'demo.sql'],
};

const task = process.argv[2] || 'setup';
const files = TASKS[task];

if (!files) {
  console.error(`Tarea desconocida "${task}". Opciones: ${Object.keys(TASKS).join(', ')}`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en el archivo .env (copiá .env.example y pegá la cadena de Neon).');
  process.exit(1);
}
if (task === 'reset' && !process.argv.includes('--si')) {
  console.error('db:reset borra TODOS los datos. Si estás seguro, corré:  npm run db:reset -- --si');
  process.exit(1);
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  client.on('notice', (n) => console.log(`  ℹ ${n.message}`));
  for (const file of files) {
    const sql = await readFile(path.join(dir, file), 'utf8');
    process.stdout.write(`→ ${file} … `);
    await client.query(sql);
    console.log('ok');
  }
  console.log('\nListo ✔');
} catch (err) {
  console.error('\nError:', err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
