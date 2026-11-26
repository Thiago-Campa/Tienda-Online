import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { one } from './db.js';
import { HttpError, ah, isProd } from './http.js';

const COOKIE = 'sid';
const SESSION_DAYS = 30;

export const USER_COLS = 'id, email, name, phone, role, created_at';

function secretString() {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 16) return s;
  if (isProd) throw new Error('Falta JWT_SECRET (mínimo 16 caracteres) en las variables de entorno.');
  return 'dev-secret-solo-para-desarrollo-local';
}

const secretKey = () => new TextEncoder().encode(secretString());

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
});

export async function createSession(res, user) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
  res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, cookieOptions());
}

async function readSessionUserId(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

/** Carga el usuario logueado desde la base (o null). Se cachea en req.user. */
export async function loadUser(req) {
  if (req.user !== undefined) return req.user;
  const id = await readSessionUserId(req);
  req.user = id ? await one(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [id]) : null;
  return req.user;
}

export const requireAuth = ah(async (req, _res, next) => {
  const user = await loadUser(req);
  if (!user) throw new HttpError(401, 'Tenés que iniciar sesión para continuar.');
  next();
});

export const requireAdmin = ah(async (req, _res, next) => {
  const user = await loadUser(req);
  if (!user) throw new HttpError(401, 'Tenés que iniciar sesión para continuar.');
  if (user.role !== 'admin') throw new HttpError(403, 'No tenés permisos de administrador.');
  next();
});

/* ── Códigos de verificación ───────────────────────────────── */

export function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashCode(email, code) {
  return crypto.createHmac('sha256', secretString()).update(`${email}:${code}`).digest('hex');
}

export function sameHash(a, b) {
  const ba = Buffer.from(String(a), 'hex');
  const bb = Buffer.from(String(b), 'hex');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function isAdminEmail(email) {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email);
}
