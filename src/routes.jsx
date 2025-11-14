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
const SignupPage = lazy(() => import('@pages/SignupPage'))
const LoginPage = lazy(() => import('@pages/LoginPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))

/**
 * Application routes configuration
 *
 * HOW TO PROTECT A ROUTE:
 * To make a page require login, wrap its element with <ProtectedRoute>:
 *
 * Example:
 * {
 *   path: '/checkout',
 *   element: (
 *     <ProtectedRoute>
 *       <CheckoutPage />
 *     </ProtectedRoute>
 *   ),
 *   protected: true,
 * }
 *
 * What happens:
 * - If user is NOT logged in: They'll be redirected to /login with a message "Please log in to continue"
 * - After login: They'll be automatically redirected back to the page they were trying to visit
 * - If user IS logged in: The page loads normally
 *
 * Currently, NO pages are protected. Add protection as needed.
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
    element: <CheckoutPage />,
    protected: false,
  },
  {
    path: '/account',
    element: <AccountPage />,
    protected: false,
  },
  {
    path: '/orders',
    element: <OrderHistoryPage />,
    protected: false,
  },
  {
    path: '/signup',
    element: <SignupPage />,
    protected: false,
  },
  {
    path: '/login',
    element: <LoginPage />,
    protected: false,
  },
  {
    path: '*',
    element: <NotFoundPage />,
    protected: false,
  },
]
