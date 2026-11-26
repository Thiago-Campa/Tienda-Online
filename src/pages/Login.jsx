import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { img } from '../lib/format.js';
import { useAsync, useTitle } from '../lib/hooks.js';
import { IconArrow, IconArrowLeft, IconCheck, IconMail } from '../components/Icons.jsx';

const LENGTH = 6;
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);

/** 6 casilleros para el código: avanza solo, acepta pegar y se envía al completarse. */
function CodeInput({ onComplete, disabled, invalid, resetKey }) {
  const [vals, setVals] = useState(() => Array(LENGTH).fill(''));
  const refs = useRef([]);

  useEffect(() => {
    setVals(Array(LENGTH).fill(''));
    setTimeout(() => refs.current[0]?.focus(), 30);
  }, [resetKey]);

  const fill = (start, digits) => {
    const next = vals.slice();
    let j = start;
    for (const d of digits) {
      if (j >= LENGTH) break;
      next[j++] = d;
    }
    setVals(next);
    refs.current[Math.min(j, LENGTH - 1)]?.focus();
    if (next.every(Boolean)) onComplete(next.join(''));
  };

  const onChange = (i, e) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      const next = vals.slice();
      next[i] = '';
      setVals(next);
      return;
    }
    // Si el casillero ya tenía un número, nos quedamos con el recién tipeado.
    if (vals[i] && digits.length === 2) digits = digits.replace(vals[i], '') || digits[1];
    fill(i, digits.slice(0, LENGTH));
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !vals[i] && i > 0) {
      e.preventDefault();
      const next = vals.slice();
      next[i - 1] = '';
      setVals(next);
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const onPaste = (i, e) => {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
    if (!digits) return;
    e.preventDefault();
    fill(i, digits);
  };

  return (
    <div className={`otp ${invalid ? 'is-invalid' : ''}`} role="group" aria-label="Código de 6 dígitos">
      {vals.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={v}
          onChange={(e) => onChange(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Dígito ${i + 1}`}
          disabled={disabled}
          className={v ? 'is-filled' : ''}
        />
      ))}
    </div>
  );
}

export default function Login() {
  useTitle('Ingresar');
  const { user, requestCode, verify, updateProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [profile, setProfile] = useState({ name: '', phone: '' });

  const showcase = useAsync(() => api('/api/products?featured=1&limit=4').then((d) => d.products), [], []);

  // Si ya hay sesión: completar perfil o salir de acá.
  useEffect(() => {
    if (!user) return;
    if (!user.name) {
      setStep('profile');
      setProfile((p) => ({ ...p, phone: user.phone || '' }));
    } else {
      navigate(next || (user.role === 'admin' ? '/admin' : '/'), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (e) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await requestCode(email.trim());
      setDevCode(r.devCode || '');
      setStep('code');
      setCooldown(45);
      setResetKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const checkCode = async (code) => {
    setError('');
    setBusy(true);
    try {
      const u = await verify(email.trim(), code);
      toast(u.name ? `¡Hola de nuevo, ${u.name.split(' ')[0]}!` : '¡Email verificado!', { type: 'success' });
    } catch (err) {
      setError(err.message);
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await updateProfile(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__art" aria-hidden="true">
        <div className="auth__art-grid">
          {showcase.data.slice(0, 4).map((p, i) => (
            <img key={p.id} src={img(p.image_url, 500)} alt="" style={{ '--i': i }} />
          ))}
        </div>
        <div className="auth__art-copy">
          <p className="eyebrow eyebrow--light">{store.name}</p>
          <p className="auth__art-title">
            Comprá en <em>segundos</em>, sin contraseñas.
          </p>
          <ul>
            <li>
              <IconCheck size={18} /> Te mandamos un código a tu email
            </li>
            <li>
              <IconCheck size={18} /> Ticket digital en cada compra
            </li>
            <li>
              <IconCheck size={18} /> Seguí tus pedidos desde tu cuenta
            </li>
          </ul>
        </div>
      </aside>

      <section className="auth__panel">
        <div className="auth__box">
          <div className="auth__steps" aria-hidden="true">
            {['email', 'code', 'profile'].map((s, i) => (
              <span key={s} className={['email', 'code', 'profile'].indexOf(step) >= i ? 'is-on' : ''} />
            ))}
          </div>

          {step === 'email' && (
            <form onSubmit={sendCode} className="auth__form" key="email">
              <p className="eyebrow">Paso 1 de 2</p>
              <h1>Ingresá o creá tu cuenta</h1>
              <p className="muted">
                {next === '/checkout'
                  ? 'Para finalizar la compra necesitamos verificar tu email.'
                  : 'Escribí tu email y te enviamos un código de 6 dígitos.'}
              </p>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
                {busy ? <span className="spinner spinner--sm" /> : <IconMail size={18} />}
                {busy ? 'Enviando…' : 'Enviarme el código'}
              </button>
              <p className="tiny">Al continuar aceptás recibir emails sobre tus compras. No compartimos tus datos.</p>
            </form>
          )}

          {step === 'code' && (
            <div className="auth__form" key="code">
              <button type="button" className="btn btn--link btn--sm auth__back" onClick={() => setStep('email')}>
                <IconArrowLeft size={16} /> Cambiar email
              </button>
              <p className="eyebrow">Paso 2 de 2</p>
              <h1>Revisá tu correo</h1>
              <p className="muted">
                Enviamos un código a <b>{email}</b>. Si no lo ves, mirá en spam o promociones.
              </p>

              {devCode && (
                <p className="dev-code">
                  <b>Modo desarrollo:</b> no hay proveedor de mail configurado. Tu código es <code>{devCode}</code>
                </p>
              )}

              <CodeInput key={resetKey} onComplete={checkCode} disabled={busy} invalid={Boolean(error)} resetKey={resetKey} />
              {error && <p className="form-error">{error}</p>}
              {busy && <p className="muted center">Verificando…</p>}

              <p className="auth__resend">
                ¿No te llegó?{' '}
                <button type="button" className="btn btn--link btn--sm" disabled={cooldown > 0 || busy} onClick={sendCode}>
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
                </button>
              </p>
            </div>
          )}

          {step === 'profile' && (
            <form onSubmit={saveProfile} className="auth__form" key="profile">
              <p className="eyebrow">Último paso</p>
              <h1>¿Cómo te llamás?</h1>
              <p className="muted">Lo usamos para tus pedidos y tickets.</p>
              <label className="field">
                <span>Nombre y apellido</span>
                <input
                  required
                  autoFocus
                  autoComplete="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Ej: Lucía Fernández"
                />
              </label>
              <label className="field">
                <span>
                  Teléfono <small>(opcional)</small>
                </span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Ej: 11 5555-5555"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
                {busy ? 'Guardando…' : 'Continuar'} <IconArrow size={18} />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
