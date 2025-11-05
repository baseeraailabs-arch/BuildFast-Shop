# Supabase Customers Table Setup Guide

## Overview

This creates a secure customer profile system that:
- ✅ Stores customer information (email, name, phone)
- ✅ Automatically creates profiles when users sign up
- ✅ Ensures customers can ONLY see their own data
- ✅ Prevents customers from viewing other users' information
- ✅ Tracks account creation date
- ✅ Unique email addresses (no duplicates)
- 🔒 Fully secured with Row Level Security (RLS)

## Step 1: Run the SQL Migration

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/mwhwzlhdradksiqikrte/sql/new
   ```

2. **Copy the migration file:**
   - Open: `supabase-migrations/03_create_customers_table.sql`
   - Copy all contents

3. **Paste and run:**
   - Paste into SQL Editor
   - Click "Run" or press Cmd+Enter

4. **Verify success:**
   - Check Table Editor for `customers` table

## What Was Created

### Customers Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Links to auth.users (same as authentication ID) |
| `email` | TEXT | Email address (unique, required) |
| `full_name` | TEXT | Customer's full name |
| `phone` | TEXT | Phone number (optional) |
| `created_at` | TIMESTAMP | When account was created |
| `updated_at` | TIMESTAMP | When last updated (auto-updated) |

### Security Features (RLS Policies)

**🔒 Users can ONLY:**
- View their own profile
- Update their own profile
- Delete their own profile

**🚫 Users CANNOT:**
- View other customers' profiles
- Edit other customers' profiles
- Access any other user's data

### Automatic Features

**1. Auto-Create Profile on Signup**
```sql
-- When someone signs up, their customer profile is automatically created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**2. Auto-Update Timestamps**
- `updated_at` automatically updates when profile is modified

**3. Customer Statistics Function**
- Get total orders, total spent, last order date, etc.

## How Supabase Auth Works

Supabase has two user-related tables:

1. **auth.users** (Built-in)
   - Handles authentication (login/signup)
   - Stores email, password hash, etc.
   - Managed by Supabase Auth

2. **customers** (Your custom table)
   - Extends auth.users with profile info
   - Stores additional customer data
   - Links via `id` field

```
┌──────────────┐         ┌──────────────┐
│  auth.users  │         │  customers   │
├──────────────┤         ├──────────────┤
│ id (UUID)    │◄────────│ id (UUID)    │
│ email        │         │ email        │
│ password     │         │ full_name    │
│ created_at   │         │ phone        │
└──────────────┘         │ created_at   │
                         └──────────────┘
```

## How to Use in Your React App

### Example 1: Display User Profile

```javascript
import { useCustomer } from '@features/auth/hooks/useCustomer'
import LoadingSpinner from '@components/common/LoadingSpinner'
import Card from '@components/ui/Card'

function ProfilePage() {
  const { customer, loading, error } = useCustomer()

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error loading profile</div>

  return (
    <Card>
      <h1>My Profile</h1>
      <p><strong>Name:</strong> {customer.full_name}</p>
      <p><strong>Email:</strong> {customer.email}</p>
      <p><strong>Phone:</strong> {customer.phone || 'Not provided'}</p>
      <p><strong>Member since:</strong> {new Date(customer.created_at).toLocaleDateString()}</p>
    </Card>
  )
}
```

### Example 2: Edit Profile Form

```javascript
import { useState } from 'react'
import { useCustomer, useUpdateProfile } from '@features/auth/hooks/useCustomer'
import Input from '@components/ui/Input'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

function EditProfilePage() {
  const { customer, refetch } = useCustomer()
  const { updateProfile, loading } = useUpdateProfile()

  const [fullName, setFullName] = useState(customer?.full_name || '')
  const [phone, setPhone] = useState(customer?.phone || '')

  const handleSubmit = async (e) => {
    e.preventDefault()

    const result = await updateProfile({
      full_name: fullName,
      phone: phone,
    })

    if (result.error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated successfully!')
      refetch()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Edit Profile</h1>

      <Input
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="John Doe"
      />

      <Input
        label="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="(555) 123-4567"
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
```

### Example 3: Account Dashboard with Stats

```javascript
import { useCustomer, useCustomerStats } from '@features/auth/hooks/useCustomer'
import { useRecentOrders } from '@features/orders/hooks/useOrders'
import Card from '@components/ui/Card'

function AccountDashboard() {
  const { customer } = useCustomer()
  const { stats } = useCustomerStats()
  const { recentOrders } = useRecentOrders(3)

  return (
    <div>
      <h1>Welcome back, {customer?.full_name}!</h1>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Orders</h3>
          <p className="text-3xl">{stats?.total_orders || 0}</p>
        </Card>

        <Card>
          <h3>Total Spent</h3>
          <p className="text-3xl">${stats?.total_spent?.toFixed(2) || '0.00'}</p>
        </Card>

        <Card>
          <h3>Member Since</h3>
          <p>{new Date(stats?.member_since).getFullYear()}</p>
        </Card>
      </div>

      {/* Recent Orders */}
      <h2>Recent Orders</h2>
      {recentOrders.map(order => (
        <Card key={order.id}>
          <p>Order #{order.id.slice(0, 8)}</p>
          <p>${order.total_amount}</p>
          <p>{order.status}</p>
        </Card>
      ))}
    </div>
  )
}
```

### Example 4: Signup with Profile Creation

The profile is automatically created, but you can pass metadata during signup:

```javascript
import { useState } from 'react'
import useAuthStore from '@features/auth/store/authStore'
import Input from '@components/ui/Input'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

function SignupForm() {
  const { signUp } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()

    try {
      // The full_name is passed as metadata
      await signUp(email, password, {
        full_name: fullName
      })

      toast.success('Account created! Please check your email.')
      // The trigger automatically creates a customer profile!
    } catch (error) {
      toast.error('Signup failed: ' + error.message)
    }
  }

  return (
    <form onSubmit={handleSignup}>
      <h1>Create Account</h1>

      <Input
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit">Sign Up</Button>
    </form>
  )
}
```

## Available Service Functions

All located in `src/features/auth/services/customerService.js`:

- `getCurrentCustomer()` - Get logged-in user's profile
- `updateCustomerProfile(updates)` - Update profile
- `getCustomerStats()` - Get order stats
- `checkProfileExists()` - Check if profile exists
- `createCustomerProfile(data)` - Manually create profile
- `updateCustomerEmail(newEmail)` - Change email
- `validateProfileData(data)` - Validate profile data

## Available React Hooks

All located in `src/features/auth/hooks/useCustomer.js`:

- `useCustomer()` - Fetch current customer profile
- `useUpdateProfile()` - Update profile hook
- `useCustomerStats()` - Get customer statistics
- `useProfileExists()` - Check if profile exists

## Security Deep Dive

### Row Level Security (RLS)

RLS ensures customers can ONLY access their own data:

```sql
-- This policy means: user can only SELECT where their auth ID matches the row's ID
CREATE POLICY "Users can view their own profile"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

**What this means:**
- ✅ User A (ID: abc-123) can view their profile (ID: abc-123)
- ❌ User A (ID: abc-123) CANNOT view User B's profile (ID: def-456)
- ❌ Unauthenticated users CANNOT view any profiles

### Testing Security

Try this in Supabase SQL Editor:

```sql
-- This will ONLY show the logged-in user's profile, never anyone else's
SELECT * FROM customers;

-- Even if you try to force it, RLS prevents it:
SELECT * FROM customers WHERE email = 'someone-elses-email@example.com';
-- Returns empty, unless it's YOUR email!
```

## Common Operations

### Get Customer Profile
```javascript
const { customer } = useCustomer()
console.log(customer.full_name)
```

### Update Profile
```javascript
const { updateProfile } = useUpdateProfile()
await updateProfile({
  full_name: 'Jane Doe',
  phone: '555-1234'
})
```

### Get Statistics
```javascript
const { stats } = useCustomerStats()
console.log(`Total orders: ${stats.total_orders}`)
console.log(`Total spent: $${stats.total_spent}`)
```

## Integration with Orders

The customers table connects to orders:

```javascript
// In the orders table:
customer_id UUID REFERENCES auth.users(id)

// This means you can query a user's orders:
const { orders } = useOrders()
// Automatically filtered to show only the logged-in user's orders!
```

## Adding More Fields

Want to add more customer fields? Easy:

```sql
-- Add a field for customer preferences
ALTER TABLE customers ADD COLUMN preferences JSONB DEFAULT '{}';

-- Add a field for customer address
ALTER TABLE customers ADD COLUMN address TEXT;

-- Add a field for newsletter subscription
ALTER TABLE customers ADD COLUMN newsletter_subscribed BOOLEAN DEFAULT false;
```

## Troubleshooting

**Profile not created automatically?**
- Check if the trigger `on_auth_user_created` exists
- Verify the user exists in `auth.users`
- Run the backfill command in the migration

**Can't update profile?**
- Make sure user is authenticated
- Check RLS policies are enabled
- Verify `auth.uid()` matches the profile ID

**Email not unique error?**
- Email addresses must be unique
- Check if email is already registered

## Next Steps

1. ✅ Run the SQL migration
2. ✅ Verify customers table is created
3. 📝 Build profile page using `useCustomer`
4. 📝 Build edit profile form using `useUpdateProfile`
5. 📝 Add profile completion prompt for new users
6. 🎨 Add avatar/profile picture (optional)
7. 📧 Add email verification flow (optional)

## Testing Your Setup

```sql
-- Check if customers table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'customers';

-- View your own profile (when logged in)
SELECT * FROM customers;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'customers';
-- Should return: customers | true
```

Your customer data is now fully secured! 🔒
