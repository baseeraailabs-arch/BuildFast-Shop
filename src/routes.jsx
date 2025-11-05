import { lazy } from 'react'
import ProtectedRoute from '@components/common/ProtectedRoute'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@pages/HomePage'))
const ProductsPage = lazy(() => import('@pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@pages/ProductDetailPage'))
const CartPage = lazy(() => import('@pages/CartPage'))
const CheckoutPage = lazy(() => import('@pages/CheckoutPage'))
const AccountPage = lazy(() => import('@pages/AccountPage'))
const OrderHistoryPage = lazy(() => import('@pages/OrderHistoryPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))

/**
 * Application routes configuration
 *
 * Routes marked with protected: true require authentication
 */
export const routes = [
  {
    path: '/',
    element: <HomePage />,
    protected: false,
  },
  {
    path: '/products',
    element: <ProductsPage />,
    protected: false,
  },
  {
    path: '/products/:id',
    element: <ProductDetailPage />,
    protected: false,
  },
  {
    path: '/cart',
    element: <CartPage />,
    protected: false,
  },
  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        <CheckoutPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
  {
    path: '/account',
    element: (
      <ProtectedRoute>
        <AccountPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
  {
    path: '/orders',
    element: (
      <ProtectedRoute>
        <OrderHistoryPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
  {
    path: '*',
    element: <NotFoundPage />,
    protected: false,
  },
]
