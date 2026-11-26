import nodemailer from 'nodemailer';
import { store } from '../../config/store.config.js';

let transporter = null;

/** resend | smtp | console (sin configurar: el mail se imprime en la terminal) */
export function mailMode() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER) return 'smtp';
  return 'console';
}

function fromAddress() {
  return process.env.MAIL_FROM || `${store.name} <onboarding@resend.dev>`;
}

export async function sendMail({ to, subject, html, text }) {
  const mode = mailMode();

  if (mode === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddress(), to: [to], subject, html, text }),
    });
    if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
    return { mode };
  }

  if (mode === 'smtp') {
    if (!transporter) {
      const port = Number(process.env.SMTP_PORT || 587);
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    await transporter.sendMail({ from: fromAddress(), to, subject, html, text });
    return { mode };
  }

  console.log(
    `\n┌─ ✉  MAIL (modo prueba, no se envió) ───────────────\n│ Para:   ${to}\n│ Asunto: ${subject}\n│\n${String(text)
      .split('\n')
      .map((l) => `│ ${l}`)
      .join('\n')}\n└────────────────────────────────────────────────────\n`
  );
  return { mode };
}
