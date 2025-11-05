# BuildFast Shop

A modern, fully-featured e-commerce platform built with React, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Authentication)
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast
- **Date Formatting**: date-fns
- **Utilities**: clsx for conditional classes

## Project Structure

```
src/
├── assets/              # Static files (images, icons, fonts)
├── components/
│   ├── ui/             # Reusable UI components (Button, Card, Input, Modal, Badge)
│   ├── layout/         # Layout components (Header, Footer, Navbar)
│   └── common/         # Shared components (LoadingSpinner, ErrorBoundary, ProtectedRoute)
├── features/           # Feature-based modules
│   ├── auth/          # Authentication (components, hooks, store)
│   ├── cart/          # Shopping cart (components, hooks, store)
│   ├── checkout/      # Checkout process
│   ├── orders/        # Order management
│   └── products/      # Product catalog
├── pages/             # Page components
├── lib/               # Third-party integrations (Supabase client)
├── hooks/             # Custom React hooks
├── utils/             # Helper functions (formatters, validators, constants)
├── styles/            # Global styles
├── routes.jsx         # Route configuration
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- A Supabase account and project

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these values in your Supabase project settings:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key

3. **Set up Supabase database:**

   Create the following tables in your Supabase database:

   ```sql
   -- Products table
   CREATE TABLE products (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     description TEXT,
     price DECIMAL(10,2) NOT NULL,
     image_url TEXT,
     category TEXT,
     stock_quantity INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Customers table
   CREATE TABLE customers (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     full_name TEXT,
     email TEXT UNIQUE NOT NULL,
     phone TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Orders table
   CREATE TABLE orders (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     customer_id UUID REFERENCES customers(id),
     total_amount DECIMAL(10,2) NOT NULL,
     status TEXT DEFAULT 'pending',
     shipping_address JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Order items table
   CREATE TABLE order_items (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
     product_id UUID REFERENCES products(id),
     quantity INTEGER NOT NULL,
     price_at_time DECIMAL(10,2) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Create indexes
   CREATE INDEX idx_products_category ON products(category);
   CREATE INDEX idx_orders_customer_id ON orders(customer_id);
   CREATE INDEX idx_order_items_order_id ON order_items(order_id);
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features Scaffolded

### UI Components
- **Button** - Multiple variants (primary, secondary, outline, danger) and sizes
- **Card** - Reusable card component with hover effects
- **Input** - Form input with label and error handling
- **Modal** - Accessible modal dialog
- **Badge** - Status and category badges

### Layout Components
- **Header** - Sticky header with navigation
- **Navbar** - Responsive navigation bar
- **Footer** - Footer with links and branding

### Pages (Ready to Build)
- Home Page
- Products Page
- Product Detail Page
- Shopping Cart Page
- Checkout Page
- Account Page
- Order History Page
- 404 Not Found Page

### State Management
- **Auth Store** (Zustand) - User authentication and session management
- **Cart Store** (Zustand) - Shopping cart with persistent storage

### Utility Functions
- **Formatters** - Currency, date, phone number formatting
- **Validators** - Email, phone, password, credit card validation
- **Constants** - Application-wide constants

### Custom Hooks
- `useLocalStorage` - Persist state to localStorage
- `useDebounce` - Debounce values (useful for search)
- `useMediaQuery` - Responsive design helpers

### Features
- Path aliases configured (@components, @features, @pages, etc.)
- Error boundary for graceful error handling
- Loading states with spinner component
- Protected routes for authenticated pages
- Toast notifications configured
- Lazy loading for code splitting
- Supabase integration ready

## Next Steps

Now that your project is scaffolded, you can start building:

1. **Create product listings** - Build out the ProductsPage with data from Supabase
2. **Implement authentication** - Add login/signup forms using the auth store
3. **Build shopping cart functionality** - Connect UI to the cart store
4. **Create checkout flow** - Implement payment processing
5. **Add product management** - Admin interface for managing products
6. **Implement order tracking** - Build order history and status updates

## Supabase Configuration

The Supabase client is initialized in `src/lib/supabase.js` with the following features:
- Auto token refresh
- Persistent sessions
- Session detection from URL

Don't forget to:
- Set up Row Level Security (RLS) policies in Supabase
- Configure authentication providers if needed
- Add storage buckets for product images

## Path Aliases

The following path aliases are configured in `vite.config.js`:

- `@/` - src/
- `@components/` - src/components/
- `@features/` - src/features/
- `@pages/` - src/pages/
- `@utils/` - src/utils/
- `@hooks/` - src/hooks/
- `@lib/` - src/lib/
- `@assets/` - src/assets/

## License

MIT

## Support

For issues and questions, please check the documentation or create an issue in the repository.
