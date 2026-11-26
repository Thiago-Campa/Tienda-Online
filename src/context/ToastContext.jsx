import { createContext, useCallback, useContext, useState } from 'react';
import { IconAlert, IconCheck, IconInfo } from '../components/Icons.jsx';

const ToastCtx = createContext(() => {});

const ICONS = { success: IconCheck, error: IconAlert, warning: IconAlert, info: IconInfo };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, { type = 'info', duration = 3600 } = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((list) => [...list.slice(-2), { id, message, type, leaving: false }]);
    setTimeout(() => setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t))), duration);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), duration + 350);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || IconInfo;
          return (
            <div key={t.id} className={`toast toast--${t.type} ${t.leaving ? 'is-leaving' : ''}`}>
              <Icon />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
