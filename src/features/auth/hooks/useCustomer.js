import { useState, useEffect } from 'react'
import {
  getCurrentCustomer,
  updateCustomerProfile as updateProfileService,
  getCustomerStats,
  checkProfileExists,
} from '../services/customerService'
import useAuthStore from '../store/authStore'

/**
 * Custom hook to fetch current customer profile
 * @returns {Object} Customer data, loading state, and error
 */
export const useCustomer = () => {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      setCustomer(null)
      setLoading(false)
      return
    }

    const fetchCustomer = async () => {
      setLoading(true)
      setError(null)

      const result = await getCurrentCustomer()

      if (result.error) {
        setError(result.error)
      } else {
        setCustomer(result.data)
      }

      setLoading(false)
    }

    fetchCustomer()
  }, [user])

  const refetch = async () => {
    if (!user) return

    setLoading(true)
    const result = await getCurrentCustomer()

    if (result.error) {
      setError(result.error)
    } else {
      setCustomer(result.data)
    }
    setLoading(false)
  }

  return {
    customer,
    loading,
    error,
    refetch,
  }
}

/**
 * Custom hook for updating customer profile
 * @returns {Object} Update function and state
 */
export const useUpdateProfile = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const updateProfile = async (updates) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateProfileService(updates)

    if (result.error) {
      setError(result.error)
      setSuccess(false)
    } else {
      setSuccess(true)
    }

    setLoading(false)
    return result
  }

  const reset = () => {
    setError(null)
    setSuccess(false)
    setLoading(false)
  }

  return {
    updateProfile,
    loading,
    error,
    success,
    reset,
  }
}

/**
 * Custom hook to fetch customer statistics
 * @returns {Object} Customer stats, loading state, and error
 */
export const useCustomerStats = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      setStats(null)
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      const result = await getCustomerStats()

      if (result.error) {
        setError(result.error)
      } else {
        setStats(result.data)
      }

      setLoading(false)
    }

    fetchStats()
  }, [user])

  return {
    stats,
    loading,
    error,
  }
}

/**
 * Custom hook to check if customer profile exists
 * @returns {Object} Profile existence status and loading state
 */
export const useProfileExists = () => {
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      setExists(false)
      setLoading(false)
      return
    }

    const check = async () => {
      setLoading(true)
      const result = await checkProfileExists()
      setExists(result.data)
      setLoading(false)
    }

    check()
  }, [user])

  return {
    exists,
    loading,
  }
}
