import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { store } from '../../../config/store.config.js';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { img, money } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Img, Spinner } from '../../components/ui.jsx';
import { IconArrowUpRight, IconClose, IconEdit, IconImage, IconPlus, IconSearch, IconStar, IconTrash } from '../../components/Icons.jsx';
import { Card, Modal } from './AdminLayout.jsx';

const EMPTY = {
  name: '',
  category_id: '',
  price: '',
  compare_at_price: '',
  stock: '',
  image_url: '',
  badge: '',
  description: '',
  featured: false,
  active: true,
};

function ProductForm({ initial, categories, onCancel, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...initial,
    category_id: initial?.category_id ?? '',
    compare_at_price: initial?.compare_at_price ?? '',
    image_url: initial?.image_url ?? '',
    badge: initial?.badge ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, category_id: form.category_id || null };
      const { product } = initial?.id
        ? await api(`/api/admin/products/${initial.id}`, { method: 'PUT', body })
        : await api('/api/admin/products', { method: 'POST', body });
      toast(initial?.id ? 'Producto actualizado' : 'Producto creado', { type: 'success' });
      onSaved(product);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const price = Number(form.price) || 0;
  const compare = Number(form.compare_at_price) || 0;
  const off = compare > price && price > 0 ? Math.round((1 - price / compare) * 100) : 0;

  return (
    <form className="pform" onSubmit={submit} id="product-form">
      <div className="pform__media">
        <div className="pform__preview">
          {form.image_url ? (
            <Img src={img(form.image_url, 500)} alt="Vista previa" />
          ) : (
            <span className="pform__noimg">
              <IconImage size={34} />
              Pegá la URL de una imagen
            </span>
          )}
        </div>
        <label className="field">
          <span>URL de la imagen</span>
          <input value={form.image_url} onChange={set('image_url')} placeholder="https://…" inputMode="url" />
          <small>Tip: subí la foto a tu hosting, Cloudinary o Imgur y pegá el link.</small>
        </label>
      </div>

      <div className="pform__fields">
        <label className="field">
          <span>Nombre *</span>
          <input value={form.name} onChange={set('name')} required autoFocus placeholder="Ej: Auriculares Studio" />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Categoría</span>
            <select value={form.category_id} onChange={set('category_id')}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Etiqueta</span>
            <input value={form.badge} onChange={set('badge')} list="badge-suggestions" placeholder="Nuevo, Oferta…" maxLength={30} />
            <datalist id="badge-suggestions">
              <option value="Nuevo" />
              <option value="Oferta" />
              <option value="Top ventas" />
              <option value="Edición limitada" />
            </datalist>
          </label>
        </div>
        <div className="form-grid form-grid--3">
          <label className="field">
            <span>Precio *</span>
            <input type="number" min="0" step="1" value={form.price} onChange={set('price')} required placeholder="0" />
          </label>
          <label className="field">
            <span>
              Precio anterior <small>{off ? `(-${off}%)` : '(opcional)'}</small>
            </span>
            <input type="number" min="0" step="1" value={form.compare_at_price} onChange={set('compare_at_price')} placeholder="Tachado" />
          </label>
          <label className="field">
            <span>Stock *</span>
            <input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} required placeholder="0" />
          </label>
        </div>
        <label className="field">
          <span>Descripción</span>
          <textarea rows={4} value={form.description} onChange={set('description')} placeholder="Materiales, medidas, qué incluye…" />
        </label>
        <div className="pform__checks">
          <label className="check">
            <input type="checkbox" checked={form.featured} onChange={set('featured')} />
            <span>Destacado en el inicio</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={form.active} onChange={set('active')} />
            <span>Visible en la tienda</span>
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="pform__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Guardando…' : initial?.id ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </form>
  );
}

function StockInput({ product, onSave }) {
  const [value, setValue] = useState(String(product.stock));
  useEffect(() => setValue(String(product.stock)), [product.stock]);
  const commit = () => {
    const n = Number.parseInt(value, 10);
    if (!Number.isInteger(n) || n < 0) {
      setValue(String(product.stock));
      return;
    }
    if (n !== product.stock) onSave(product, { stock: n });
  };
  const tone = product.stock === 0 ? 'is-out' : product.stock <= store.lowStock ? 'is-low' : '';
  return (
    <input
      className={`stock-input ${tone}`}
      type="number"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      aria-label={`Stock de ${product.name}`}
    />
  );
}

function Categories({ categories, onChange }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api('/api/admin/categories', { method: 'POST', body: { name } });
      setName('');
      toast('Categoría creada', { type: 'success' });
      onChange();
    } catch (err) {
      toast(err.message, { type: 'error' });
    }
  };
  const remove = async (c) => {
    if (!window.confirm(`¿Borrar la categoría "${c.name}"? Sus productos quedan "Sin categoría".`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
      onChange();
    } catch (err) {
      toast(err.message, { type: 'error' });
    }
  };
  return (
    <Card title="Categorías">
      <div className="cat-chips">
        {categories.map((c) => (
          <span key={c.id} className="cat-chip">
            {c.name}
            <small>{c.product_count}</small>
            <button type="button" onClick={() => remove(c)} aria-label={`Borrar ${c.name}`}>
              <IconClose size={14} />
            </button>
          </span>
        ))}
      </div>
      <form className="inline-form" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría" aria-label="Nombre de la nueva categoría" maxLength={60} />
        <button type="submit" className="btn btn--primary btn--sm">
          <IconPlus size={16} /> Agregar
        </button>
      </form>
    </Card>
  );
}

export default function Products() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const products = useAsync(() => api('/api/admin/products').then((d) => d.products), [], []);
  const cats = useAsync(() => api('/api/categories').then((d) => d.categories), [], []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [view, setView] = useState('todos');
  const [editing, setEditing] = useState(null); // null | {} (nuevo) | producto

  useEffect(() => {
    if (params.get('nuevo') === '1') {
      setEditing({});
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.data.filter((p) => {
      if (term && !`${p.name} ${p.category_name || ''}`.toLowerCase().includes(term)) return false;
      if (cat && String(p.category_id) !== cat) return false;
      if (view === 'sin-stock' && p.stock > 0) return false;
      if (view === 'stock-bajo' && !(p.stock > 0 && p.stock <= store.lowStock)) return false;
      if (view === 'ocultos' && p.active) return false;
      return true;
    });
  }, [products.data, q, cat, view]);

  const counts = useMemo(
    () => ({
      todos: products.data.length,
      'stock-bajo': products.data.filter((p) => p.stock > 0 && p.stock <= store.lowStock).length,
      'sin-stock': products.data.filter((p) => p.stock === 0).length,
      ocultos: products.data.filter((p) => !p.active).length,
    }),
    [products.data]
  );

  const replace = (product) => products.setData((list) => list.map((p) => (p.id === product.id ? product : p)));

  const patch = async (product, body) => {
    try {
      const { product: updated } = await api(`/api/admin/products/${product.id}`, { method: 'PATCH', body });
      replace(updated);
      if ('stock' in body) toast(`Stock de "${product.name}": ${updated.stock}`, { type: 'success', duration: 2200 });
    } catch (err) {
      toast(err.message, { type: 'error' });
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Las ventas anteriores se conservan. Si solo querés ocultarlo, desactivá "Visible".`)) return;
    try {
      await api(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      products.setData((list) => list.filter((p) => p.id !== product.id));
      toast('Producto eliminado', { type: 'success' });
    } catch (err) {
      toast(err.message, { type: 'error' });
    }
  };

  const onSaved = (product) => {
    const exists = products.data.some((p) => p.id === product.id);
    products.setData((list) => (exists ? list.map((p) => (p.id === product.id ? product : p)) : [product, ...list]));
    setEditing(null);
    cats.reload();
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div className="status-tabs" role="tablist" aria-label="Filtrar productos">
          {[
            ['todos', 'Todos'],
            ['stock-bajo', 'Stock bajo'],
            ['sin-stock', 'Sin stock'],
            ['ocultos', 'Ocultos'],
          ].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={view === id} className={view === id ? 'is-active' : ''} onClick={() => setView(id)}>
              {label}
              <small>{counts[id]}</small>
            </button>
          ))}
        </div>
        <div className="admin-toolbar__right">
          <label className="search-field search-field--sm">
            <IconSearch size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto" />
          </label>
          <label className="select">
            <span className="sr-only">Categoría</span>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              {cats.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn--accent btn--sm" onClick={() => setEditing({})}>
            <IconPlus size={16} /> Nuevo producto
          </button>
        </div>
      </div>

      <div className="table-wrap">
        {products.loading && !products.data.length ? (
          <Spinner />
        ) : list.length === 0 ? (
          <div className="empty">
            <h3>No hay productos para mostrar</h3>
            <p>Cambiá los filtros o cargá uno nuevo.</p>
          </div>
        ) : (
          <table className="table table--products">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Precio</th>
                <th className="num">Stock</th>
                <th className="num">Vendidos</th>
                <th className="center">Destacado</th>
                <th className="center">Visible</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={p.active ? '' : 'is-muted'}>
                  <td>
                    <div className="prod-cell">
                      <Img src={img(p.image_url, 120)} alt="" className="prod-cell__img" />
                      <span>
                        <b>{p.name}</b>
                        <small>
                          {p.category_name || 'Sin categoría'}
                          {p.badge ? ` · ${p.badge}` : ''}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td className="num">
                    <b>{money(p.price)}</b>
                    {p.compare_at_price > p.price && <small className="strike">{money(p.compare_at_price)}</small>}
                  </td>
                  <td className="num">
                    <StockInput product={p} onSave={patch} />
                  </td>
                  <td className="num">{p.sold}</td>
                  <td className="center">
                    <button
                      type="button"
                      className={`star-btn ${p.featured ? 'is-on' : ''}`}
                      onClick={() => patch(p, { featured: !p.featured })}
                      aria-pressed={p.featured}
                      aria-label={p.featured ? 'Quitar de destacados' : 'Destacar'}
                    >
                      <IconStar size={18} filled={p.featured} />
                    </button>
                  </td>
                  <td className="center">
                    <button
                      type="button"
                      className={`switch ${p.active ? 'is-on' : ''}`}
                      onClick={() => patch(p, { active: !p.active })}
                      role="switch"
                      aria-checked={p.active}
                      aria-label={`Visible en la tienda: ${p.name}`}
                    >
                      <span />
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      {p.active && (
                        <Link to={`/producto/${p.slug}`} target="_blank" className="icon-btn icon-btn--sm" aria-label="Ver en la tienda" title="Ver en la tienda">
                          <IconArrowUpRight size={16} />
                        </Link>
                      )}
                      <button type="button" className="icon-btn icon-btn--sm" onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`} title="Editar">
                        <IconEdit size={16} />
                      </button>
                      <button type="button" className="icon-btn icon-btn--sm is-danger" onClick={() => remove(p)} aria-label={`Eliminar ${p.name}`} title="Eliminar">
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Categories categories={cats.data} onChange={cats.reload} />

      <Modal open={editing !== null} title={editing?.id ? 'Editar producto' : 'Nuevo producto'} onClose={() => setEditing(null)} wide>
        {editing !== null && (
          <ProductForm key={editing.id || 'new'} initial={editing} categories={cats.data} onCancel={() => setEditing(null)} onSaved={onSaved} />
        )}
      </Modal>
    </div>
  );
}
