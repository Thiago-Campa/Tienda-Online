import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import Loader from './components/Loader.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import { RequireAuth, Spinner } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Login from './pages/Login.jsx';
import Checkout from './pages/Checkout.jsx';
import Ticket from './pages/Ticket.jsx';
import ReturnPage from './pages/Return.jsx';
import Account from './pages/Account.jsx';
import NotFound from './pages/NotFound.jsx';

// El panel se descarga solo cuando entra un administrador.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers.jsx'));
const AdminReturns = lazy(() => import('./pages/admin/Returns.jsx'));

function StoreLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="main" className="page" key={pathname}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}

function Shell() {
  const { loading } = useAuth();
  const [fontsReady, setFontsReady] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let alive = true;
    const done = () => alive && setFontsReady(true);
    (document.fonts?.ready || Promise.resolve()).then(done, done);
    const fallback = setTimeout(done, 3500);
    return () => {
      alive = false;
      clearTimeout(fallback);
    };
  }, []);

  const finish = useCallback(() => setBooted(true), []);

  return (
    <>
      {!booted && <Loader ready={fontsReady && !loading} onDone={finish} />}
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="tienda" element={<Shop />} />
          <Route path="producto/:slug" element={<Product />} />
          <Route path="ingresar" element={<Login />} />
          <Route
            path="checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="mi-cuenta"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="ticket/:code"
            element={
              <RequireAuth>
                <Ticket />
              </RequireAuth>
            }
          />
          <Route
            path="devolucion/:code"
            element={
              <RequireAuth>
                <ReturnPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="admin"
          element={
            <RequireAuth admin>
              <Suspense fallback={<Spinner />}>
                <AdminLayout />
              </Suspense>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="productos" element={<AdminProducts />} />
          <Route path="clientes" element={<AdminCustomers />} />
          <Route path="devoluciones" element={<AdminReturns />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Shell />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
