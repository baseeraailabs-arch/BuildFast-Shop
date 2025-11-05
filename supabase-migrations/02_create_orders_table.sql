-- ============================================
-- BuildFast Shop - Orders Table Migration
-- ============================================
-- This creates tables to store customer orders and order items
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ============================================
-- 1. Create orders table
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create order_items table
-- ============================================
-- This table stores individual products in each order
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10,2) NOT NULL CHECK (price_at_time >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- 4. Create trigger for auto-updating updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Add table and column comments
-- ============================================
COMMENT ON TABLE orders IS 'Stores all customer orders';
COMMENT ON COLUMN orders.id IS 'Unique identifier for the order (auto-generated UUID)';
COMMENT ON COLUMN orders.customer_id IS 'References the user who placed the order (from auth.users)';
COMMENT ON COLUMN orders.total_amount IS 'Total order amount in USD';
COMMENT ON COLUMN orders.status IS 'Current order status: pending, processing, shipped, delivered, or cancelled';
COMMENT ON COLUMN orders.shipping_address IS 'Full shipping address for the order';
COMMENT ON COLUMN orders.created_at IS 'Timestamp when order was placed';
COMMENT ON COLUMN orders.updated_at IS 'Timestamp when order was last updated (auto-updated)';

COMMENT ON TABLE order_items IS 'Stores individual line items for each order';
COMMENT ON COLUMN order_items.order_id IS 'References the parent order';
COMMENT ON COLUMN order_items.product_id IS 'References the product in this order item';
COMMENT ON COLUMN order_items.quantity IS 'Number of units ordered';
COMMENT ON COLUMN order_items.price_at_time IS 'Product price at the time of order (preserves historical price)';

-- ============================================
-- 6. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Create RLS Policies
-- ============================================

-- Users can only view their own orders
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Users can update their own orders (e.g., cancel)
CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Users can view order items for their orders
CREATE POLICY "Users can view their own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Users can create order items for their orders
CREATE POLICY "Users can create order items for their orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- ============================================
-- 8. Create helper function to calculate order total
-- ============================================
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT COALESCE(SUM(quantity * price_at_time), 0)
  FROM order_items
  WHERE order_id = order_uuid;
$$ LANGUAGE sql STABLE;

-- ============================================
-- 9. Create function to validate order total
-- ============================================
-- This trigger ensures the order total matches the sum of order items
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total DECIMAL(10,2);
BEGIN
  calculated_total := calculate_order_total(NEW.order_id);

  -- Get the order's total_amount
  IF (SELECT total_amount FROM orders WHERE id = NEW.order_id) != calculated_total THEN
    -- Update the order total to match
    UPDATE orders SET total_amount = calculated_total WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update order total when items change
DROP TRIGGER IF EXISTS update_order_total_on_items ON order_items;
CREATE TRIGGER update_order_total_on_items
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_total();

-- ============================================
-- 10. Create view for order summaries
-- ============================================
CREATE OR REPLACE VIEW order_summaries AS
SELECT
  o.id,
  o.customer_id,
  o.total_amount,
  o.status,
  o.shipping_address,
  o.created_at,
  o.updated_at,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_id, o.total_amount, o.status, o.shipping_address, o.created_at, o.updated_at;

COMMENT ON VIEW order_summaries IS 'Convenient view showing orders with item counts';

-- ============================================
-- 11. Insert sample orders (optional)
-- ============================================
-- Uncomment to add sample data for testing
-- Note: You need to have actual user IDs from auth.users to test this

/*
-- Example: Create a sample order
-- Replace 'YOUR_USER_ID' with an actual UUID from auth.users
INSERT INTO orders (customer_id, total_amount, status, shipping_address) VALUES
  ('YOUR_USER_ID', 149.97, 'pending', '123 Main St, Apt 4B, New York, NY 10001, USA');

-- Add items to the order
INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
SELECT
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
  id,
  2,
  price
FROM products
WHERE name = 'Wireless Headphones'
LIMIT 1;
*/

-- ============================================
-- Migration Complete!
-- ============================================
-- Your orders table is now ready to use.
--
-- Features:
-- ✅ Orders table with customer link
-- ✅ Order items table for products in each order
-- ✅ Automatic order total calculation
-- ✅ Order status tracking
-- ✅ Shipping address storage
-- ✅ Automatic timestamps
-- ✅ Row-level security (users can only see their orders)
-- ✅ Historical price preservation (price_at_time)
--
-- Next steps:
-- 1. Create functions to place orders in your app
-- 2. Set up order confirmation emails (optional)
-- 3. Create admin views to manage all orders (optional)
