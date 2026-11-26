import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const CartCtx = createContext(null);
const KEY = 'cart:v1';

function readStored() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v.filter((i) => i && i.id && i.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* sin almacenamiento */
    }
  }, [items]);

  // Mantiene el carrito sincronizado entre pestañas.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setItems(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /** Agrega un producto respetando el stock. Devuelve { ok, reason?, limited? }. */
  const add = useCallback((product, qty = 1, { openDrawer = true } = {}) => {
    const stock = Number(product.stock ?? 0);
    if (stock <= 0) return { ok: false, reason: 'stock' };
    const current = itemsRef.current.find((i) => i.id === product.id)?.qty || 0;
    const nextQty = Math.min(stock, current + qty);
    if (nextQty === current) return { ok: false, reason: 'max' };

    setItems((prev) => {
      const exists = prev.some((i) => i.id === product.id);
      const data = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        stock,
        category_name: product.category_name,
        qty: nextQty,
      };
      return exists ? prev.map((i) => (i.id === product.id ? data : i)) : [...prev, data];
    });
    setBump((b) => b + 1);
    if (openDrawer) setOpen(true);
    return { ok: true, limited: nextQty < current + qty };
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(Number(qty) || 1, i.stock || 1)) } : i))
    );
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  /** Trae precio y stock actualizados del servidor. Devuelve avisos para mostrar. */
  const refresh = useCallback(async () => {
    const current = itemsRef.current;
    if (!current.length) return [];
    const { products } = await api(`/api/products?ids=${current.map((i) => i.id).join(',')}`);
    const byId = new Map(products.map((p) => [p.id, p]));
    const notes = [];
    const next = [];
    for (const item of current) {
      const p = byId.get(item.id);
      if (!p || p.stock <= 0) {
        notes.push(`"${item.name}" se quedó sin stock y lo sacamos del carrito.`);
        continue;
      }
      const qty = Math.min(item.qty, p.stock);
      if (qty < item.qty) notes.push(`Solo quedan ${p.stock} de "${p.name}".`);
      if (Number(p.price) !== Number(item.price)) notes.push(`Actualizamos el precio de "${p.name}".`);
      next.push({ ...item, name: p.name, price: Number(p.price), stock: p.stock, image_url: p.image_url, slug: p.slug, qty });
    }
    setItems(next);
    return notes;
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = items.reduce((acc, i) => acc + i.qty * i.price, 0);
    return {
      items,
      count,
      subtotal,
      open,
      bump,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      add,
      setQty,
      remove,
      clear,
      refresh,
    };
  }, [items, open, bump, add, setQty, remove, clear, refresh]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
