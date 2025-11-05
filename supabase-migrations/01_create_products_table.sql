-- ============================================
-- BuildFast Shop - Products Table Migration
-- ============================================
-- This creates tables to store products and their images
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ============================================
-- 1. Create products table
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create product_images table
-- ============================================
-- This table stores multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- ============================================
-- 4. Create function to auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Create trigger for auto-updating updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Add table and column comments
-- ============================================
COMMENT ON TABLE products IS 'Stores all products available in BuildFast Shop';
COMMENT ON COLUMN products.id IS 'Unique identifier for the product (auto-generated UUID)';
COMMENT ON COLUMN products.name IS 'Product name';
COMMENT ON COLUMN products.description IS 'Detailed product description';
COMMENT ON COLUMN products.price IS 'Product price in USD (must be >= 0)';
COMMENT ON COLUMN products.stock_quantity IS 'Number of items currently in stock (must be >= 0)';
COMMENT ON COLUMN products.category IS 'Product category (e.g., Electronics, Clothing, Books)';
COMMENT ON COLUMN products.created_at IS 'Timestamp when product was added to the store';
COMMENT ON COLUMN products.updated_at IS 'Timestamp when product was last updated (auto-updated)';

COMMENT ON TABLE product_images IS 'Stores multiple images for each product';
COMMENT ON COLUMN product_images.product_id IS 'References the product this image belongs to';
COMMENT ON COLUMN product_images.image_url IS 'URL/path to the product image';
COMMENT ON COLUMN product_images.is_primary IS 'Indicates if this is the main/featured product image';
COMMENT ON COLUMN product_images.display_order IS 'Order in which images should be displayed (lower = first)';

-- ============================================
-- 7. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. Create RLS Policies
-- ============================================

-- Allow anyone to view products (public read access)
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to view product images (public read access)
CREATE POLICY "Anyone can view product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert products (you can restrict this further to admins)
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update products
CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete products
CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Only authenticated users can manage product images
CREATE POLICY "Authenticated users can insert product images"
  ON product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product images"
  ON product_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product images"
  ON product_images
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 9. Insert sample products (optional)
-- ============================================
-- Uncomment to add sample data for testing

/*
INSERT INTO products (name, description, price, stock_quantity, category) VALUES
  ('Wireless Headphones', 'High-quality Bluetooth headphones with noise cancellation', 89.99, 50, 'Electronics'),
  ('Cotton T-Shirt', 'Comfortable 100% cotton t-shirt available in multiple colors', 19.99, 200, 'Clothing'),
  ('JavaScript Programming Book', 'Learn modern JavaScript from beginner to expert', 39.99, 75, 'Books'),
  ('Yoga Mat', 'Premium non-slip yoga mat with carrying strap', 29.99, 100, 'Sports'),
  ('Smart Watch', 'Fitness tracker with heart rate monitor and GPS', 199.99, 30, 'Electronics');

-- Add sample images for first product (Wireless Headphones)
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://via.placeholder.com/400x400?text=Headphones+Front', true, 0
FROM products WHERE name = 'Wireless Headphones'
UNION ALL
SELECT id, 'https://via.placeholder.com/400x400?text=Headphones+Side', false, 1
FROM products WHERE name = 'Wireless Headphones'
UNION ALL
SELECT id, 'https://via.placeholder.com/400x400?text=Headphones+Case', false, 2
FROM products WHERE name = 'Wireless Headphones';
*/

-- ============================================
-- Migration Complete!
-- ============================================
-- Your products table is now ready to use.
--
-- Next steps:
-- 1. Create a storage bucket for product images in Supabase Storage
-- 2. Update your application code to use these tables
-- 3. Consider adding more fields as needed (SKU, brand, weight, etc.)
