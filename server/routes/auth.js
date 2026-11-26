import { Router } from 'express';
import { query, one } from '../lib/db.js';
import { HttpError, ah, clean, EMAIL_RE, isProd } from '../lib/http.js';
import {
  USER_COLS,
  clearSession,
  createSession,
  generateCode,
  hashCode,
  isAdminEmail,
  loadUser,
  requireAuth,
  sameHash,
} from '../lib/auth.js';
import { sendMail, mailMode } from '../lib/mailer.js';
import { codeEmail } from '../lib/emails.js';

const router = Router();
const MAX_ATTEMPTS = 5;

const readEmail = (body) => clean(body?.email, 160).toLowerCase();

/** Paso 1: el usuario escribe su email y le mandamos un código de 6 dígitos. */
router.post(
  '/request-code',
  ah(async (req, res) => {
    const email = readEmail(req.body);
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Ingresá un email válido.');

    const recent = await one(
      `SELECT COUNT(*) FILTER (WHERE created_at > now() - interval '1 hour')::int AS last_hour,
              COALESCE(MAX(created_at) > now() - interval '40 seconds', false) AS too_soon
         FROM verification_codes WHERE email = $1`,
      [email]
    );
    if (recent?.too_soon) throw new HttpError(429, 'Esperá unos segundos antes de pedir otro código.');
    if ((recent?.last_hour ?? 0) >= 6) throw new HttpError(429, 'Pediste muchos códigos. Probá de nuevo en un rato.');

    const code = generateCode();
    await query(`UPDATE verification_codes SET used_at = now() WHERE email = $1 AND used_at IS NULL`, [email]);
    const row = await one(
      `INSERT INTO verification_codes (email, code_hash, expires_at)
       VALUES ($1, $2, now() + interval '10 minutes') RETURNING id`,
      [email, hashCode(email, code)]
    );

    try {
      await sendMail({ to: email, ...codeEmail({ code }) });
    } catch (err) {
      console.error('No se pudo enviar el código:', err);
      await query(`DELETE FROM verification_codes WHERE id = $1`, [row.id]);
      throw new HttpError(502, 'No pudimos enviarte el email. Revisá la dirección o probá en un rato.');
    }

    const payload = { ok: true };
    // En desarrollo, sin proveedor de mail configurado, devolvemos el código para poder probar.
    if (!isProd && mailMode() === 'console') payload.devCode = code;
    res.json(payload);
  })
);

/** Paso 2: verifica el código, crea la cuenta si no existe y abre la sesión. */
router.post(
  '/verify',
  ah(async (req, res) => {
    const email = readEmail(req.body);
    const code = clean(String(req.body?.code ?? ''), 12).replace(/\D/g, '');
    if (!EMAIL_RE.test(email) || code.length !== 6) throw new HttpError(400, 'El código tiene 6 números.');

    const row = await one(
      `SELECT id, code_hash, attempts, expires_at < now() AS expired
         FROM verification_codes
        WHERE email = $1 AND used_at IS NULL
        ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    if (!row || row.expired) throw new HttpError(400, 'El código venció. Pedí uno nuevo.');
    if (row.attempts >= MAX_ATTEMPTS) throw new HttpError(429, 'Demasiados intentos. Pedí un código nuevo.');

    if (!sameHash(row.code_hash, hashCode(email, code))) {
      await query(`UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
      const left = MAX_ATTEMPTS - row.attempts - 1;
      throw new HttpError(
        400,
        left > 0 ? `Código incorrecto. Te queda${left === 1 ? '' : 'n'} ${left} intento${left === 1 ? '' : 's'}.` : 'Código incorrecto. Pedí uno nuevo.'
      );
    }

    await query(`UPDATE verification_codes SET used_at = now() WHERE id = $1`, [row.id]);

    const adminRole = isAdminEmail(email) ? 'admin' : null;
    const user = await one(
      `INSERT INTO users (email, role, last_login_at)
       VALUES ($1, COALESCE($2::text, 'customer'), now())
       ON CONFLICT (email) DO UPDATE
         SET last_login_at = now(),
             role = COALESCE($2::text, users.role)
       RETURNING ${USER_COLS}`,
      [email, adminRole]
    );

    await createSession(res, user);
    res.json({ user });
  })
);

router.get(
  '/me',
  ah(async (req, res) => {
    res.json({ user: await loadUser(req) });
  })
);

router.patch(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const name = clean(req.body?.name, 80);
    const phone = clean(req.body?.phone, 40);
    if (name.length < 2) throw new HttpError(400, 'Ingresá tu nombre.');
    const user = await one(
      `UPDATE users SET name = $2, phone = NULLIF($3, '') WHERE id = $1 RETURNING ${USER_COLS}`,
      [req.user.id, name, phone]
    );
    res.json({ user });
  })
);

router.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
