import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '@features/auth/store/authStore'
import LoadingSpinner from './LoadingSpinner'

/**
 * ProtectedRoute Component
 *
 * Wraps pages that require authentication. If a user is not logged in:
 * 1. Shows a "Please log in to continue" message
 * 2. Redirects them to the login page
 * 3. Saves the page they were trying to visit
 * 4. After successful login, redirects them back to that page
 *
 * Usage: See src/routes.jsx for examples
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Show toast message when redirecting to login
    if (!loading && !user) {
      toast.error('Please log in to continue')
    }
  }, [loading, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
