import { Link } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { IconFacebook, IconGithub, IconInstagram, IconMail, IconPin, IconTiktok, IconWhatsapp, IconClock } from './Icons.jsx';

export default function Footer() {
  const year = new Date().getFullYear();
  const socials = [
    { href: store.social.instagram, label: 'Instagram', Icon: IconInstagram },
    { href: store.social.facebook, label: 'Facebook', Icon: IconFacebook },
    { href: store.social.tiktok, label: 'TikTok', Icon: IconTiktok },
  ].filter((s) => s.href);

  return (
    <footer className="footer" id="contacto">
      <div className="container footer__grid">
        <div className="footer__intro">
          <p className="footer__lead">
            ¿Dudas con tu compra? <em>Escribinos</em>, respondemos rápido.
          </p>
          <a className="btn btn--accent" href={`https://wa.me/${store.contact.whatsapp}`} target="_blank" rel="noreferrer">
            <IconWhatsapp size={18} /> Hablar por WhatsApp
          </a>
        </div>

        <div className="footer__col">
          <h4>Tienda</h4>
          <Link to="/tienda">Todos los productos</Link>
          <Link to="/tienda?ofertas=1">Ofertas</Link>
          <Link to="/tienda?orden=nuevos">Novedades</Link>
          <Link to="/tienda?orden=mas-vendidos">Más vendidos</Link>
        </div>

        <div className="footer__col">
          <h4>Mi cuenta</h4>
          <Link to="/ingresar">Ingresar</Link>
          <Link to="/mi-cuenta">Mis pedidos</Link>
          <Link to="/checkout">Finalizar compra</Link>
        </div>

        <div className="footer__col footer__contact">
          <h4>Contacto</h4>
          <a href={`mailto:${store.contact.email}`}>
            <IconMail size={17} /> {store.contact.email}
          </a>
          <span>
            <IconPin size={17} /> {store.contact.address}
          </span>
          <span>
            <IconClock size={17} /> {store.contact.hours}
          </span>
          <div className="footer__social">
            {socials.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="icon-btn">
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer__wordmark" aria-hidden="true" style={{ '--len': Math.max(store.name.length, 4) }}>
        <span>{store.name}</span>
      </div>

      <div className="container footer__bottom">
        <span>
          © {year} {store.name}. Todos los derechos reservados.
        </span>
        <span className="footer__pay">Transferencia · Tarjetas · Efectivo</span>
        {store.credit?.label && (
          <a className="footer__credit" href={store.credit.url} target="_blank" rel="noreferrer">
            {store.credit.url?.includes('github.com') && <IconGithub size={16} />}
            {store.credit.label}
          </a>
        )}
      </div>
    </footer>
  );
}
