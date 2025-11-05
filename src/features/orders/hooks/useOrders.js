import { useState, useEffect } from 'react'
import {
  getUserOrders,
  getOrderById,
  createOrder as createOrderService,
  cancelOrder as cancelOrderService,
  getOrderStats,
  getRecentOrders,
} from '../services/orderService'

/**
 * Custom hook to fetch user's orders
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status
 * @param {number} options.limit - Items per page
 * @param {number} options.page - Current page
 * @returns {Object} Orders data, loading state, and error
 */
export const useOrders = ({ status, limit = 10, page = 1 } = {}) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)

      const offset = (page - 1) * limit
      const result = await getUserOrders({ status, limit, offset })

      if (result.error) {
        setError(result.error)
      } else {
        setOrders(result.data || [])
        setTotalCount(result.count || 0)
      }

      setLoading(false)
    }

    fetchOrders()
  }, [status, limit, page])

  const refetch = async () => {
    setLoading(true)
    const offset = (page - 1) * limit
    const result = await getUserOrders({ status, limit, offset })

    if (result.error) {
      setError(result.error)
    } else {
      setOrders(result.data || [])
      setTotalCount(result.count || 0)
    }
    setLoading(false)
  }

  return {
    orders,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    refetch,
  }
}

/**
 * Custom hook to fetch a single order
 * @param {string} orderId - The order ID
 * @returns {Object} Order data, loading state, and error
 */
export const useOrder = (orderId) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      setLoading(true)
      setError(null)

      const result = await getOrderById(orderId)

      if (result.error) {
        setError(result.error)
      } else {
        setOrder(result.data)
      }

      setLoading(false)
    }

    fetchOrder()
  }, [orderId])

  const refetch = async () => {
    if (!orderId) return

    setLoading(true)
    const result = await getOrderById(orderId)

    if (result.error) {
      setError(result.error)
    } else {
      setOrder(result.data)
    }
    setLoading(false)
  }

  return {
    order,
    loading,
    error,
    refetch,
  }
}

/**
 * Custom hook for creating orders
 * @returns {Object} Create order function and state
 */
export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [createdOrder, setCreatedOrder] = useState(null)

  const createOrder = async (orderData, cartItems) => {
    setLoading(true)
    setError(null)

    const result = await createOrderService(orderData, cartItems)

    if (result.error) {
      setError(result.error)
      setCreatedOrder(null)
    } else {
      setCreatedOrder(result.data)
    }

    setLoading(false)
    return result
  }

  const reset = () => {
    setError(null)
    setCreatedOrder(null)
    setLoading(false)
  }

  return {
    createOrder,
    loading,
    error,
    createdOrder,
    reset,
  }
}

/**
 * Custom hook for cancelling orders
 * @returns {Object} Cancel order function and state
 */
export const useCancelOrder = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const cancelOrder = async (orderId) => {
    setLoading(true)
    setError(null)

    const result = await cancelOrderService(orderId)

    if (result.error) {
      setError(result.error)
    }

    setLoading(false)
    return result
  }

  return {
    cancelOrder,
    loading,
    error,
  }
}

/**
 * Custom hook to fetch order statistics
 * @returns {Object} Order stats, loading state, and error
 */
export const useOrderStats = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      const result = await getOrderStats()

      if (result.error) {
        setError(result.error)
      } else {
        setStats(result.data)
      }

      setLoading(false)
    }

    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
  }
}

/**
 * Custom hook to fetch recent orders
 * @param {number} limit - Number of orders to fetch
 * @returns {Object} Recent orders, loading state, and error
 */
export const useRecentOrders = (limit = 5) => {
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRecentOrders = async () => {
      setLoading(true)
      setError(null)

      const result = await getRecentOrders(limit)

      if (result.error) {
        setError(result.error)
      } else {
        setRecentOrders(result.data || [])
      }

      setLoading(false)
    }

    fetchRecentOrders()
  }, [limit])

  return {
    recentOrders,
    loading,
    error,
  }
}
