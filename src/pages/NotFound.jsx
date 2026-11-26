import { Link } from 'react-router-dom';
import { useTitle } from '../lib/hooks.js';
import { IconArrow } from '../components/Icons.jsx';

export default function NotFound() {
  useTitle('Página no encontrada');
  return (
    <div className="container notfound">
      <p className="notfound__big" aria-hidden="true">
        4<em>0</em>4
      </p>
      <h1>Esta página se fue de compras.</h1>
      <p>El link puede estar roto o la página ya no existe.</p>
      <Link to="/tienda" className="btn btn--primary btn--lg">
        Ir a la tienda <IconArrow size={18} />
      </Link>
    </div>
  );
}
