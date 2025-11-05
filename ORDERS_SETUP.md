# Supabase Orders Table Setup Guide

## Quick Overview

This creates a complete order management system with:
- ✅ Orders table (links to customer accounts)
- ✅ Order items table (tracks products in each order)
- ✅ Automatic order total calculation
- ✅ Order status tracking (pending → processing → shipped → delivered)
- ✅ Historical price preservation
- ✅ Automatic timestamps
- ✅ User privacy (customers can only see their own orders)

## Step 1: Run the SQL Migration

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/mwhwzlhdradksiqikrte/sql/new
   ```

2. **Copy the migration file:**
   - Open: `supabase-migrations/02_create_orders_table.sql`
   - Copy all contents

3. **Paste and run:**
   - Paste into SQL Editor
   - Click "Run" or press Cmd+Enter

4. **Verify success:**
   - You should see a green success message
   - Check Table Editor for `orders` and `order_items` tables

## What Was Created

### Orders Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated unique identifier |
| `customer_id` | UUID | Links to auth.users (who placed the order) |
| `total_amount` | DECIMAL | Total order amount in USD |
| `status` | TEXT | Order status (pending/processing/shipped/delivered/cancelled) |
| `shipping_address` | TEXT | Full shipping address |
| `created_at` | TIMESTAMP | When order was placed |
| `updated_at` | TIMESTAMP | When order was last updated (auto-updated) |

### Order Items Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated unique identifier |
| `order_id` | UUID | Links to orders table |
| `product_id` | UUID | Links to products table |
| `quantity` | INTEGER | Number of items ordered |
| `price_at_time` | DECIMAL | Product price when ordered (preserves history) |
| `created_at` | TIMESTAMP | When item was added |

### Special Features

**1. Automatic Order Total Calculation**
- When order items are added/updated/deleted, the order total updates automatically
- No need to manually calculate totals

**2. Historical Price Tracking**
- `price_at_time` preserves the price when the order was placed
- Even if product prices change later, order history is accurate

**3. Order Status Workflow**
```
pending → processing → shipped → delivered
              ↓
          cancelled
```

**4. Security (Row Level Security)**
- Users can only view and manage their own orders
- Admin access can be added later if needed

## How to Use in Your React App

### Example 1: Display User's Order History

```javascript
import { useOrders } from '@features/orders/hooks/useOrders'
import { formatCurrency, formatDate } from '@utils/formatters'

function OrderHistoryPage() {
  const { orders, loading, error } = useOrders()

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>My Orders</h1>
      {orders.map(order => (
        <Card key={order.id}>
          <h3>Order #{order.id.slice(0, 8)}</h3>
          <Badge variant={getStatusColor(order.status)}>
            {order.status}
          </Badge>
          <p>Total: {formatCurrency(order.total_amount)}</p>
          <p>Date: {formatDate(order.created_at)}</p>
          <p>Items: {order.order_items.length}</p>
        </Card>
      ))}
    </div>
  )
}
```

### Example 2: Create Order from Cart

```javascript
import { useCreateOrder } from '@features/orders/hooks/useOrders'
import useCartStore from '@features/cart/store/cartStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function CheckoutPage() {
  const { createOrder, loading } = useCreateOrder()
  const { items: cartItems, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')

  const handleCheckout = async (e) => {
    e.preventDefault()

    if (!address.trim()) {
      toast.error('Please enter a shipping address')
      return
    }

    // Create order from cart items
    const result = await createOrder(
      { shippingAddress: address },
      cartItems
    )

    if (result.error) {
      toast.error('Failed to place order')
    } else {
      toast.success('Order placed successfully!')
      clearCart()
      navigate(`/orders/${result.data.id}`)
    }
  }

  return (
    <form onSubmit={handleCheckout}>
      <h1>Checkout</h1>

      {/* Cart Summary */}
      <div>
        {cartItems.map(item => (
          <div key={item.id}>
            {item.name} × {item.quantity} = ${item.price * item.quantity}
          </div>
        ))}
      </div>

      {/* Shipping Address */}
      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter full shipping address..."
        required
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'Placing Order...' : 'Place Order'}
      </Button>
    </form>
  )
}
```

### Example 3: View Single Order Details

```javascript
import { useOrder } from '@features/orders/hooks/useOrders'
import { useParams } from 'react-router-dom'

function OrderDetailsPage() {
  const { id } = useParams()
  const { order, loading, error } = useOrder(id)

  if (loading) return <LoadingSpinner />
  if (error) return <div>Order not found</div>

  return (
    <div>
      <h1>Order Details</h1>

      <Card>
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total:</strong> ${order.total_amount}</p>
        <p><strong>Ordered:</strong> {formatDate(order.created_at)}</p>
        <p><strong>Shipping Address:</strong></p>
        <p>{order.shipping_address}</p>
      </Card>

      <h2>Order Items</h2>
      {order.order_items.map(item => (
        <Card key={item.id}>
          <img
            src={item.products.product_images[0]?.image_url}
            alt={item.products.name}
          />
          <h3>{item.products.name}</h3>
          <p>Quantity: {item.quantity}</p>
          <p>Price: ${item.price_at_time}</p>
          <p>Subtotal: ${item.quantity * item.price_at_time}</p>
        </Card>
      ))}
    </div>
  )
}
```

### Example 4: Cancel an Order

```javascript
import { useCancelOrder } from '@features/orders/hooks/useOrders'
import toast from 'react-hot-toast'

function OrderCard({ order, onUpdate }) {
  const { cancelOrder, loading } = useCancelOrder()

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    const result = await cancelOrder(order.id)

    if (result.error) {
      toast.error('Failed to cancel order')
    } else {
      toast.success('Order cancelled successfully')
      onUpdate() // Refresh the orders list
    }
  }

  const canCancel = ['pending', 'processing'].includes(order.status)

  return (
    <Card>
      <h3>Order #{order.id.slice(0, 8)}</h3>
      <Badge>{order.status}</Badge>
      <p>${order.total_amount}</p>

      {canCancel && (
        <Button
          variant="danger"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? 'Cancelling...' : 'Cancel Order'}
        </Button>
      )}
    </Card>
  )
}
```

### Example 5: Order Statistics Dashboard

```javascript
import { useOrderStats } from '@features/orders/hooks/useOrders'

function AccountDashboard() {
  const { stats, loading } = useOrderStats()

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1>My Account Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3>Total Orders</h3>
          <p className="text-3xl">{stats.totalOrders}</p>
        </Card>

        <Card>
          <h3>Total Spent</h3>
          <p className="text-3xl">${stats.totalSpent.toFixed(2)}</p>
        </Card>

        <Card>
          <h3>Pending Orders</h3>
          <p className="text-3xl">{stats.ordersByStatus.pending}</p>
        </Card>

        <Card>
          <h3>Delivered Orders</h3>
          <p className="text-3xl">{stats.ordersByStatus.delivered}</p>
        </Card>
      </div>
    </div>
  )
}
```

## Available Service Functions

All located in `src/features/orders/services/orderService.js`:

- `createOrder(orderData, cartItems)` - Create new order
- `getUserOrders({ status, limit, offset })` - Get user's orders
- `getOrderById(orderId)` - Get single order details
- `updateOrderStatus(orderId, newStatus)` - Update order status
- `cancelOrder(orderId)` - Cancel an order
- `getOrderStats()` - Get order statistics
- `getRecentOrders(limit)` - Get recent orders
- `canCancelOrder(order)` - Check if order can be cancelled
- `getOrderStatusInfo(status)` - Get status display info

## Available React Hooks

All located in `src/features/orders/hooks/useOrders.js`:

- `useOrders({ status, limit, page })` - Fetch user's orders
- `useOrder(orderId)` - Fetch single order
- `useCreateOrder()` - Create order hook
- `useCancelOrder()` - Cancel order hook
- `useOrderStats()` - Get order statistics
- `useRecentOrders(limit)` - Get recent orders

## Order Status Flow

**Typical workflow:**
1. **pending** - Order just placed, payment processing
2. **processing** - Payment confirmed, preparing shipment
3. **shipped** - Order shipped to customer
4. **delivered** - Order received by customer
5. **cancelled** - Order cancelled (only from pending/processing)

## Testing Your Setup

Run this SQL to verify everything works:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('orders', 'order_items');

-- View order counts
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM order_items;
```

## Integration with Cart

Your cart store at `src/features/cart/store/cartStore.js` already has:
- `items` - Array of cart items
- `getTotal()` - Calculate total
- `clearCart()` - Empty cart after order

Perfect for creating orders!

## Next Steps

1. ✅ Run the SQL migration
2. ✅ Verify tables are created
3. 📝 Build checkout page using `useCreateOrder`
4. 📝 Build order history page using `useOrders`
5. 📝 Build order details page using `useOrder`
6. 🔔 Add email notifications (optional)
7. 👨‍💼 Add admin order management (optional)

## Troubleshooting

**Error: "User must be authenticated"**
- User needs to be logged in to create/view orders
- Check your auth state with the auth store

**Order total doesn't match items**
- The trigger automatically recalculates totals
- Don't worry, it's self-correcting

**Can't see orders**
- RLS policies ensure users only see their own orders
- This is a security feature

## Need Help?

Check the service functions and hooks for complete examples of how to use the orders system!
