import { useState } from 'react';
import { store } from '../../config/store.config.js';
import { installment, money } from '../lib/format.js';
import { IconInfo } from './Icons.jsx';

export const EMPTY_CARD = { number: '', name: '', expiry: '', cvv: '', installments: '1' };

/** Marca de la tarjeta según el comienzo del número (solo decorativo). */
function brandOf(digits) {
  if (/^4/.test(digits)) return 'VISA';
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(digits)) return 'MASTERCARD';
  if (/^3[47]/.test(digits)) return 'AMEX';
  return '';
}

const formatNumber = (raw) =>
  raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const formatExpiry = (raw) => {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Valida el formulario de prueba. Devuelve { campo: mensaje }. */
export function validateCard(card) {
  const e = {};
  const digits = card.number.replace(/\D/g, '');
  if (digits.length < 15) e.number = 'Ingresá el número de la tarjeta.';
  if (card.name.trim().length < 2) e.name = 'Ingresá el nombre como figura en la tarjeta.';
  const m = card.expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!m || +m[1] < 1 || +m[1] > 12) {
    e.expiry = 'Ingresá el vencimiento (MM/AA).';
  } else {
    const now = new Date();
    const yy = now.getFullYear() % 100;
    if (+m[2] < yy || (+m[2] === yy && +m[1] < now.getMonth() + 1)) e.expiry = 'La tarjeta está vencida.';
  }
  if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = 'Código de 3 o 4 dígitos.';
  return e;
}

/**
 * Formulario de tarjeta de PRUEBA: no cobra nada y los datos quedan solo en esta pantalla
 * (el componente padre los mantiene aparte del pedido, así que nunca se envían al servidor).
 */
export default function CardForm({ value, onChange, errors = {}, total = 0 }) {
  const [flipped, setFlipped] = useState(false);
  const digits = value.number.replace(/\D/g, '');
  const brand = brandOf(digits);
  const shown = (value.number + ' ' + '•••• •••• •••• ••••'.slice(value.number.length)).trim().slice(0, 19);

  const set = (key, fmt) => (e) => onChange({ ...value, [key]: fmt ? fmt(e.target.value) : e.target.value });

  const input = (key, label, props, fmt) => (
    <label className={`field ${errors[key] ? 'has-error' : ''}`}>
      <span>{label}</span>
      <input
        value={value[key]}
        onChange={set(key, fmt)}
        aria-invalid={errors[key] ? 'true' : 'false'}
        spellCheck={false}
        {...props}
      />
      {errors[key] && <small className="field__error">{errors[key]}</small>}
    </label>
  );

  return (
    <div className="cardform">
      <p className="cardform__notice">
        <IconInfo size={18} />
        <span>
          <b>Modo demostración.</b> No se realiza ningún cobro: los datos de la tarjeta no se guardan ni se envían. Podés
          usar números de prueba.
        </span>
      </p>

      <div className="cardform__layout">
        <div className={`cardprev ${flipped ? 'is-flipped' : ''}`} aria-hidden="true">
          <div className="cardprev__inner">
            <div className="cardprev__face cardprev__front">
              <div className="cardprev__top">
                <span className="cardprev__chip" />
                <b>{brand || store.name}</b>
              </div>
              <div className="cardprev__number">{shown}</div>
              <div className="cardprev__bottom">
                <span>
                  <small>Titular</small>
                  {value.name.trim() || 'NOMBRE APELLIDO'}
                </span>
                <span>
                  <small>Vence</small>
                  {value.expiry || 'MM/AA'}
                </span>
              </div>
            </div>
            <div className="cardprev__face cardprev__back">
              <span className="cardprev__stripe" />
              <div className="cardprev__cvv">
                <small>CVV</small>
                <b>{value.cvv ? value.cvv.replace(/./g, '•') : '•••'}</b>
              </div>
            </div>
          </div>
        </div>

        <div className="cardform__fields">
          {input('number', 'Número de tarjeta', {
            inputMode: 'numeric',
            autoComplete: 'cc-number',
            placeholder: '1234 5678 9012 3456',
            onFocus: () => setFlipped(false),
          }, formatNumber)}
          {input('name', 'Nombre del titular', {
            autoComplete: 'cc-name',
            placeholder: 'Como figura en la tarjeta',
            onFocus: () => setFlipped(false),
          }, (v) => v.toUpperCase().slice(0, 40))}
          <div className="form-grid">
            {input('expiry', 'Vencimiento', {
              inputMode: 'numeric',
              autoComplete: 'cc-exp',
              placeholder: 'MM/AA',
              onFocus: () => setFlipped(false),
            }, formatExpiry)}
            {input('cvv', 'Código de seguridad', {
              inputMode: 'numeric',
              autoComplete: 'cc-csc',
              placeholder: '123',
              onFocus: () => setFlipped(true),
              onBlur: () => setFlipped(false),
            }, (v) => v.replace(/\D/g, '').slice(0, 4))}
          </div>
          <label className="field">
            <span>Cuotas</span>
            <select value={value.installments} onChange={set('installments')}>
              <option value="1">1 pago de {money(total)}</option>
              {store.installments > 1 && (
                <option value={String(store.installments)}>
                  {store.installments} cuotas sin interés de {installment(total)}
                </option>
              )}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
