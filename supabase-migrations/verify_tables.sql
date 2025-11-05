-- Run this to verify your tables were created successfully

-- Check if products table exists
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('products', 'product_images')
ORDER BY table_name, ordinal_position;

-- Count products (should be 0 if you haven't added any yet)
SELECT COUNT(*) as total_products FROM products;

-- Count product images
SELECT COUNT(*) as total_images FROM product_images;
