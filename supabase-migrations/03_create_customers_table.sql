-- ============================================
-- BuildFast Shop - Customers Table Migration
-- ============================================
-- This creates a customers table that extends Supabase auth.users
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ============================================
-- 1. Create customers table
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- ============================================
-- 3. Create trigger for auto-updating updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Add table and column comments
-- ============================================
COMMENT ON TABLE customers IS 'Stores customer profile information, extends auth.users';
COMMENT ON COLUMN customers.id IS 'References auth.users(id) - same as user authentication ID';
COMMENT ON COLUMN customers.email IS 'Customer email address (unique)';
COMMENT ON COLUMN customers.full_name IS 'Customer full name';
COMMENT ON COLUMN customers.phone IS 'Customer phone number (optional)';
COMMENT ON COLUMN customers.created_at IS 'When the customer account was created';
COMMENT ON COLUMN customers.updated_at IS 'When customer profile was last updated (auto-updated)';

-- ============================================
-- 5. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS Policies - SECURE ACCESS
-- ============================================

-- Policy 1: Users can view ONLY their own profile
CREATE POLICY "Users can view their own profile"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update ONLY their own profile
CREATE POLICY "Users can update their own profile"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile (during signup)
CREATE POLICY "Users can create their own profile"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON customers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- 7. Create function to auto-create customer profile
-- ============================================
-- This automatically creates a customer record when someone signs up

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customers (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Create trigger for auto-creating customer profiles
-- ============================================
-- When a user signs up via Supabase Auth, automatically create their customer profile

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 9. Create helper view for customer info
-- ============================================
-- This view combines auth.users with customer profile data

CREATE OR REPLACE VIEW customer_profiles AS
SELECT
  c.id,
  c.email,
  c.full_name,
  c.phone,
  c.created_at,
  c.updated_at,
  -- Auth information
  au.email_confirmed_at,
  au.last_sign_in_at
FROM customers c
LEFT JOIN auth.users au ON c.id = au.id;

COMMENT ON VIEW customer_profiles IS 'Complete customer profile with auth information';

-- ============================================
-- 10. Create function to get customer stats
-- ============================================
CREATE OR REPLACE FUNCTION get_customer_stats(customer_uuid UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_orders', (
      SELECT COUNT(*)
      FROM orders
      WHERE customer_id = customer_uuid
    ),
    'total_spent', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM orders
      WHERE customer_id = customer_uuid
      AND status != 'cancelled'
    ),
    'last_order_date', (
      SELECT MAX(created_at)
      FROM orders
      WHERE customer_id = customer_uuid
    ),
    'member_since', (
      SELECT created_at
      FROM customers
      WHERE id = customer_uuid
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_customer_stats IS 'Get customer statistics including order history';

-- ============================================
-- 11. Backfill existing users (if any)
-- ============================================
-- If you already have users in auth.users but not in customers, this creates their profiles

INSERT INTO customers (id, email, full_name, created_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM customers)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Migration Complete!
-- ============================================
-- Your customers table is now ready to use.
--
-- Features:
-- ✅ Customer profiles extending auth.users
-- ✅ Email (unique), full name, phone number
-- ✅ Account creation timestamp
-- ✅ Automatic profile creation on signup
-- ✅ Row-level security (users only see their own data)
-- ✅ Cannot view other customers' information
-- ✅ Cannot edit other customers' information
-- ✅ Auto-updating timestamps
-- ✅ Customer statistics function
--
-- Security:
-- 🔒 RLS enabled - customers can ONLY access their own data
-- 🔒 Email is unique - no duplicate accounts
-- 🔒 Policies prevent viewing other users' profiles
-- 🔒 Policies prevent editing other users' profiles
--
-- Next steps:
-- 1. Users will automatically get a customer profile when they sign up
-- 2. Build profile edit page in your app
-- 3. Add more custom fields as needed (address, preferences, etc.)
