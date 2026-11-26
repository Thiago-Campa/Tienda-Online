import { Link } from 'react-router-dom';
import { store } from '../../config/store.config.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { discountPct, img, installment, money } from '../lib/format.js';
import { Img } from './ui.jsx';
import { IconPlus } from './Icons.jsx';

export default function ProductCard({ product, index = 0 }) {
  const { add } = useCart();
  const toast = useToast();
  const off = discountPct(product.price, product.compare_at_price);
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= store.lowStock;

  const onAdd = () => {
    const r = add(product);
    if (!r.ok) toast(r.reason === 'stock' ? 'Sin stock por ahora.' : `Ya tenés todo el stock disponible (${product.stock}).`, { type: 'warning' });
  };

  return (
    <article className={`pcard ${soldOut ? 'is-soldout' : ''}`} style={{ '--i': index }}>
      <div className="pcard__mediawrap">
        <Link to={`/producto/${product.slug}`} className="pcard__media" aria-label={product.name}>
          <Img src={img(product.image_url, 640)} alt="" />
          <div className="pcard__badges">
            {off > 0 && <span className="badge badge--accent">-{off}%</span>}
            {product.badge && !(off > 0 && product.badge === 'Oferta') && <span className="badge">{product.badge}</span>}
          </div>
          {soldOut && <span className="pcard__soldout">Sin stock</span>}
        </Link>

        {!soldOut && (
          <button type="button" className="pcard__add" onClick={onAdd} aria-label={`Agregar ${product.name} al carrito`}>
            <IconPlus size={18} />
            <span>Agregar al carrito</span>
          </button>
        )}
      </div>

      <div className="pcard__info">
        <span className="pcard__cat">{product.category_name || 'General'}</span>
        <h3 className="pcard__name">
          <Link to={`/producto/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="pcard__price">
          <b>{money(product.price)}</b>
          {off > 0 && <s>{money(product.compare_at_price)}</s>}
        </div>
        <p className="pcard__meta">
          {low ? (
            <span className="pcard__low">¡Últimas {product.stock} unidades!</span>
          ) : (
            <span>
              {store.installments} cuotas de {installment(product.price)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="pcard pcard--skeleton" aria-hidden="true">
      <div className="pcard__mediawrap skeleton" style={{ aspectRatio: '4 / 5' }} />
      <div className="pcard__info">
        <span className="skeleton skeleton--text" style={{ width: '30%' }} />
        <span className="skeleton skeleton--text" style={{ width: '80%' }} />
        <span className="skeleton skeleton--text" style={{ width: '45%' }} />
      </div>
    </div>
  );
}
