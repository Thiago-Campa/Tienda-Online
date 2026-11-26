import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync, useTitle } from '../lib/hooks.js';
import { img, money, shortDate, ticketCode } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Img, StatusPill } from '../components/ui.jsx';
import { IconArrow, IconBag, IconChart, IconLogout } from '../components/Icons.jsx';

export default function Account() {
  useTitle('Mi cuenta');
  const { user, logout, updateProfile, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('pedidos');
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const orders = useAsync(() => api('/api/orders').then((d) => d.orders), [], []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile);
      toast('Datos guardados', { type: 'success' });
    } catch (err) {
      toast(err.message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await logout();
    toast('Cerraste sesión. ¡Hasta pronto!');
    navigate('/');
  };

  const spent = orders.data.filter((o) => o.status !== 'cancelado').reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="account container">
      <header className="account__head">
        <div className="account__hello">
          <span className="avatar avatar--lg">{(user.name || user.email)[0].toUpperCase()}</span>
          <div>
            <p className="eyebrow">Mi cuenta</p>
            <h1>Hola{user.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
            <p className="muted">{user.email}</p>
          </div>
        </div>
        <div className="account__actions">
          {isAdmin && (
            <Link to="/admin" className="btn btn--accent">
              <IconChart size={18} /> Panel de administración
            </Link>
          )}
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            <IconLogout size={18} /> Cerrar sesión
          </button>
        </div>
      </header>

      <div className="account__stats">
        <div>
          <b>{orders.data.length}</b>
          <span>pedidos</span>
        </div>
        <div>
          <b>{money(spent)}</b>
          <span>en compras</span>
        </div>
        <div>
          <b>{orders.data[0] ? shortDate(orders.data[0].created_at) : '—'}</b>
          <span>última compra</span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'pedidos'} className={tab === 'pedidos' ? 'is-active' : ''} onClick={() => setTab('pedidos')}>
          Mis pedidos
        </button>
        <button type="button" role="tab" aria-selected={tab === 'datos'} className={tab === 'datos' ? 'is-active' : ''} onClick={() => setTab('datos')}>
          Mis datos
        </button>
      </div>

      {tab === 'pedidos' ? (
        orders.loading && !orders.data.length ? (
          <div className="order-list">
            {[0, 1, 2].map((i) => (
              <div key={i} className="order-row skeleton" style={{ height: 92 }} />
            ))}
          </div>
        ) : orders.data.length === 0 ? (
          <div className="empty">
            <div className="drawer__empty-icon">
              <IconBag size={30} />
            </div>
            <h3>Todavía no hiciste compras</h3>
            <p>Cuando compres, vas a ver tus tickets acá.</p>
            <Link to="/tienda" className="btn btn--primary">
              Ir a la tienda <IconArrow size={18} />
            </Link>
          </div>
        ) : (
          <ul className="order-list">
            {orders.data.map((o) => (
              <li key={o.code}>
                <Link to={`/ticket/${o.code}`} className="order-row">
                  <span className="order-row__imgs">
                    {o.images.slice(0, 3).map((src, i) => (
                      <Img key={i} src={img(src, 120)} alt="" />
                    ))}
                  </span>
                  <span className="order-row__main">
                    <b>{ticketCode(o.code)}</b>
                    <small>
                      {shortDate(o.created_at)} · {o.items} producto{o.items === 1 ? '' : 's'}
                    </small>
                  </span>
                  <StatusPill status={o.status} />
                  <b className="order-row__total">{money(o.total)}</b>
                  <IconArrow size={18} className="order-row__arrow" />
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <form className="panel account__form" onSubmit={save}>
          <label className="field">
            <span>Nombre y apellido</span>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required autoComplete="name" />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} autoComplete="tel" />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={user.email} disabled />
            <small className="muted">Es tu forma de ingresar: no se puede cambiar.</small>
          </label>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </div>
  );
}
