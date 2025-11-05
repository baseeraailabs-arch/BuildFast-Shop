-- ============================================
-- Example: How Orders and Order Items Work Together
-- ============================================
-- This shows how to create an order with multiple items

-- Step 1: Create an order
-- (Replace YOUR_USER_ID with actual user UUID from auth.users)
INSERT INTO orders (customer_id, total_amount, status, shipping_address)
VALUES (
  'YOUR_USER_ID',
  0,  -- Will be auto-calculated by trigger
  'pending',
  '123 Main Street, Apartment 4B, New York, NY 10001, USA'
)
RETURNING id;  -- Save this order_id

-- Step 2: Add items to the order
-- Let's say the customer bought:
-- - 2x Wireless Headphones at $89.99 each
-- - 1x Smart Watch at $199.99

INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
VALUES
  -- Item 1: Headphones
  (
    'ORDER_ID_FROM_STEP_1',
    (SELECT id FROM products WHERE name = 'Wireless Headphones' LIMIT 1),
    2,
    89.99
  ),
  -- Item 2: Smart Watch
  (
    'ORDER_ID_FROM_STEP_1',
    (SELECT id FROM products WHERE name = 'Smart Watch' LIMIT 1),
    1,
    199.99
  );

-- Step 3: Check the order total (should be automatically calculated)
-- 2 × $89.99 + 1 × $199.99 = $379.97
SELECT
  o.id,
  o.total_amount,  -- Should be $379.97
  o.status,
  COUNT(oi.id) as num_items,
  SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = 'ORDER_ID_FROM_STEP_1'
GROUP BY o.id, o.total_amount, o.status;

-- ============================================
-- Why price_at_time is Important
-- ============================================

-- Scenario: Product price changes AFTER order is placed

-- Today: Headphones cost $89.99
-- Customer orders 2 headphones → Saved as price_at_time = 89.99

-- Tomorrow: Headphones price increases to $109.99
UPDATE products SET price = 109.99 WHERE name = 'Wireless Headphones';

-- Customer's old order STILL shows $89.99 (historical price preserved!)
SELECT
  oi.quantity,
  oi.price_at_time,  -- Still $89.99 (what they actually paid)
  p.name,
  p.price  -- Now $109.99 (current price)
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = 'ORDER_ID_FROM_STEP_1';

-- ============================================
-- Viewing Complete Order Details
-- ============================================

-- This query shows everything about an order
SELECT
  o.id as order_id,
  o.status,
  o.total_amount,
  o.shipping_address,
  o.created_at,
  -- Order items details
  oi.quantity,
  oi.price_at_time,
  -- Product details
  p.name as product_name,
  p.category,
  -- Calculate subtotal for each item
  (oi.quantity * oi.price_at_time) as item_subtotal
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.id = 'ORDER_ID_FROM_STEP_1'
ORDER BY oi.created_at;
