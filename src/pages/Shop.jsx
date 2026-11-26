import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync, useTitle } from '../lib/hooks.js';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import { IconClose, IconSearch } from '../components/Icons.jsx';

const SORTS = [
  { id: 'relevancia', label: 'Destacados' },
  { id: 'mas-vendidos', label: 'Más vendidos' },
  { id: 'nuevos', label: 'Novedades' },
  { id: 'precio-asc', label: 'Menor precio' },
  { id: 'precio-desc', label: 'Mayor precio' },
];

const PRICES = [
  { id: '', label: 'Cualquier precio' },
  { id: 'hasta-50', label: 'Hasta $50.000', max: 50000 },
  { id: '50-100', label: '$50.000 a $100.000', min: 50000, max: 100000 },
  { id: '100-mas', label: 'Más de $100.000', min: 100000 },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('categoria') || '';
  const q = params.get('q') || '';
  const sort = params.get('orden') || 'relevancia';
  const price = params.get('precio') || '';
  const inStock = params.get('stock') === '1';
  const offers = params.get('ofertas') === '1';

  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const update = (patch) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      },
      { replace: true }
    );

  // Búsqueda con espera de 350 ms para no consultar en cada tecla.
  useEffect(() => {
    if (search === q) return undefined;
    const t = setTimeout(() => update({ q: search.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const categories = useAsync(() => api('/api/categories').then((d) => d.categories), [], []);

  const apiQuery = useMemo(() => {
    const s = new URLSearchParams();
    if (category) s.set('category', category);
    if (q) s.set('q', q);
    if (sort) s.set('sort', sort);
    if (inStock) s.set('stock', '1');
    if (offers) s.set('ofertas', '1');
    const range = PRICES.find((p) => p.id === price);
    if (range?.min) s.set('min', String(range.min));
    if (range?.max) s.set('max', String(range.max));
    s.set('limit', '100');
    return s.toString();
  }, [category, q, sort, inStock, offers, price]);

  const products = useAsync(() => api(`/api/products?${apiQuery}`).then((d) => d.products), [apiQuery], []);

  const activeCat = categories.data.find((c) => c.slug === category);
  const title = offers ? 'Ofertas' : activeCat ? activeCat.name : q ? `“${q}”` : 'Catálogo';
  useTitle(offers ? 'Ofertas' : activeCat?.name || 'Tienda');

  const hasFilters = category || q || inStock || offers || price;

  return (
    <div className="shop container">
      <header className="shop__head">
        <div>
          <p className="eyebrow">{q ? 'Resultados de búsqueda' : 'Tienda'}</p>
          <h1 className="shop__title">
            {title}
            <em>({products.loading && !products.data.length ? '…' : products.data.length})</em>
          </h1>
        </div>
        <label className="search-field">
          <IconSearch size={19} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en la tienda"
            aria-label="Buscar en la tienda"
          />
        </label>
      </header>

      <div className="chips" role="tablist" aria-label="Categorías">
        <button type="button" role="tab" aria-selected={!category} className={`chip ${!category ? 'is-active' : ''}`} onClick={() => update({ categoria: '' })}>
          Todo
        </button>
        {categories.data
          .filter((c) => c.product_count > 0)
          .map((c) => (
            <button
              type="button"
              role="tab"
              aria-selected={category === c.slug}
              key={c.id}
              className={`chip ${category === c.slug ? 'is-active' : ''}`}
              onClick={() => update({ categoria: category === c.slug ? '' : c.slug })}
            >
              {c.name}
              <small>{c.product_count}</small>
            </button>
          ))}
      </div>

      <div className="toolbar">
        <div className="toolbar__filters">
          <button type="button" className={`toggle ${offers ? 'is-on' : ''}`} onClick={() => update({ ofertas: offers ? '' : '1' })} aria-pressed={offers}>
            <span className="toggle__dot" /> En oferta
          </button>
          <button type="button" className={`toggle ${inStock ? 'is-on' : ''}`} onClick={() => update({ stock: inStock ? '' : '1' })} aria-pressed={inStock}>
            <span className="toggle__dot" /> Con stock
          </button>
          <label className="select">
            <span className="sr-only">Precio</span>
            <select value={price} onChange={(e) => update({ precio: e.target.value })}>
              {PRICES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {hasFilters && (
            <button type="button" className="btn btn--link btn--sm" onClick={() => setParams({}, { replace: true })}>
              <IconClose size={16} /> Limpiar filtros
            </button>
          )}
        </div>
        <label className="select select--sort">
          <span>Ordenar por</span>
          <select value={sort} onChange={(e) => update({ orden: e.target.value === 'relevancia' ? '' : e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {products.error ? (
        <div className="empty">
          <h3>No pudimos cargar los productos</h3>
          <p>{products.error.message}</p>
          <button type="button" className="btn btn--primary" onClick={products.reload}>
            Reintentar
          </button>
        </div>
      ) : products.loading && !products.data.length ? (
        <div className="grid-products">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.data.length === 0 ? (
        <div className="empty">
          <h3>No encontramos productos</h3>
          <p>Probá con otra búsqueda o sacá algún filtro.</p>
          <button type="button" className="btn btn--primary" onClick={() => setParams({}, { replace: true })}>
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <div className={`grid-products ${products.loading ? 'is-refreshing' : ''}`}>
          {products.data.map((p, i) => (
            <div className="grid-products__item" key={p.id} style={{ '--i': Math.min(i, 12) }}>
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
