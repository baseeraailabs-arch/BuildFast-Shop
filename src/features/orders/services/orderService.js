import { supabase } from '@lib/supabase'

/**
 * Order Service
 * Handles all order-related database operations
 */

/**
 * Create a new order from cart items
 * @param {Object} orderData - Order information
 * @param {string} orderData.shippingAddress - Full shipping address
 * @param {Array} cartItems - Array of cart items with {product_id, quantity, price}
 * @returns {Promise<Object>} Created order data and error
 */
export const createOrder = async (orderData, cartItems) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User must be authenticated to create an order')
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    )

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address: orderData.shippingAddress,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id || item.id,
      quantity: item.quantity,
      price_at_time: item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Fetch the complete order with items
    return await getOrderById(order.id)
  } catch (error) {
    console.error('Error creating order:', error)
    return { data: null, error }
  }
}

/**
 * Get all orders for the current user
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status
 * @param {number} options.limit - Limit number of results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Object>} Orders data and error
 */
export const getUserOrders = async ({ status, limit = 10, offset = 0 } = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User must be authenticated')
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price_at_time,
          products (
            id,
            name,
            product_images (
              image_url,
              is_primary
            )
          )
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) throw error

    return { data, error: null, count }
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return { data: null, error }
  }
}

/**
 * Get a single order by ID
 * @param {string} orderId - The order ID
 * @returns {Promise<Object>} Order data and error
 */
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price_at_time,
          products (
            id,
            name,
            description,
            category,
            product_images (
              image_url,
              is_primary
            )
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { data: null, error }
  }
}

/**
 * Update order status
 * @param {string} orderId - The order ID
 * @param {string} newStatus - New status (pending, processing, shipped, delivered, cancelled)
 * @returns {Promise<Object>} Updated order data and error
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { data: null, error }
  }
}

/**
 * Cancel an order
 * @param {string} orderId - The order ID
 * @returns {Promise<Object>} Updated order data and error
 */
export const cancelOrder = async (orderId) => {
  try {
    // Only allow cancelling pending or processing orders
    const { data: order } = await getOrderById(orderId)

    if (!order) {
      throw new Error('Order not found')
    }

    if (!['pending', 'processing'].includes(order.status)) {
      throw new Error('Only pending or processing orders can be cancelled')
    }

    return await updateOrderStatus(orderId, 'cancelled')
  } catch (error) {
    console.error('Error cancelling order:', error)
    return { data: null, error }
  }
}

/**
 * Get order statistics for the current user
 * @returns {Promise<Object>} Order statistics and error
 */
export const getOrderStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User must be authenticated')
    }

    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount')
      .eq('customer_id', user.id)

    if (error) throw error

    const stats = {
      totalOrders: data.length,
      totalSpent: data.reduce((sum, order) => sum + parseFloat(order.total_amount), 0),
      ordersByStatus: {
        pending: data.filter(o => o.status === 'pending').length,
        processing: data.filter(o => o.status === 'processing').length,
        shipped: data.filter(o => o.status === 'shipped').length,
        delivered: data.filter(o => o.status === 'delivered').length,
        cancelled: data.filter(o => o.status === 'cancelled').length,
      }
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error fetching order stats:', error)
    return { data: null, error }
  }
}

/**
 * Get recent orders for the current user
 * @param {number} limit - Number of orders to fetch
 * @returns {Promise<Object>} Recent orders data and error
 */
export const getRecentOrders = async (limit = 5) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User must be authenticated')
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        order_items (
          quantity
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return { data: null, error }
  }
}

/**
 * Check if user can cancel an order
 * @param {Object} order - The order object
 * @returns {boolean} Whether the order can be cancelled
 */
export const canCancelOrder = (order) => {
  return ['pending', 'processing'].includes(order?.status)
}

/**
 * Get order status display info
 * @param {string} status - Order status
 * @returns {Object} Display information for the status
 */
export const getOrderStatusInfo = (status) => {
  const statusInfo = {
    pending: {
      label: 'Pending',
      color: 'warning',
      description: 'Your order is being processed',
    },
    processing: {
      label: 'Processing',
      color: 'info',
      description: 'Your order is being prepared for shipment',
    },
    shipped: {
      label: 'Shipped',
      color: 'primary',
      description: 'Your order has been shipped',
    },
    delivered: {
      label: 'Delivered',
      color: 'success',
      description: 'Your order has been delivered',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'danger',
      description: 'This order has been cancelled',
    },
  }

  return statusInfo[status] || {
    label: status,
    color: 'default',
    description: '',
  }
}
