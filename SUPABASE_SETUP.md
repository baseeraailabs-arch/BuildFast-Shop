# Supabase Products Table Setup Guide

## Step 1: Run the SQL Migration

1. **Open your Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your BuildFast Shop project (ref: `mwhwzlhdradksiqikrte`)

2. **Navigate to the SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the migration:**
   - Open the file: `supabase-migrations/01_create_products_table.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the migration:**
   - Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
   - You should see a success message

## Step 2: (Optional) Create a Storage Bucket for Product Images

If you want to upload images directly to Supabase Storage instead of using external URLs:

1. **Navigate to Storage:**
   - Click "Storage" in the left sidebar
   - Click "Create a new bucket"

2. **Configure the bucket:**
   - Name: `product-images`
   - Public bucket: Yes (so images are publicly accessible)
   - Click "Create bucket"

3. **Set up storage policies:**
   ```sql
   -- Allow public read access
   CREATE POLICY "Public can view product images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'product-images');

   -- Allow authenticated users to upload images
   CREATE POLICY "Authenticated users can upload product images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'product-images');
   ```

## Step 3: Verify the Tables

1. **Check the tables:**
   - Click "Table Editor" in the left sidebar
   - You should see two new tables:
     - `products`
     - `product_images`

2. **Inspect the schema:**
   - Click on each table to view its columns
   - Verify all fields are created correctly

## Step 4: Add Sample Data (Optional)

Uncomment the sample data section at the bottom of the migration file to add test products, or add your own products:

```sql
INSERT INTO products (name, description, price, stock_quantity, category) VALUES
  ('Sample Product', 'This is a test product', 29.99, 100, 'Electronics');
```

## What Was Created

### Products Table
- **id**: Auto-generated unique identifier (UUID)
- **name**: Product name (required)
- **description**: Product description
- **price**: Price in USD (must be >= 0)
- **stock_quantity**: Number in stock (must be >= 0)
- **category**: Product category
- **created_at**: Automatically set when product is added
- **updated_at**: Automatically updated when product is modified

### Product Images Table
- **id**: Auto-generated unique identifier (UUID)
- **product_id**: Links to the product
- **image_url**: URL or path to the image
- **is_primary**: Whether this is the main product image
- **display_order**: Order for displaying multiple images
- **created_at**: Automatically set when image is added

### Security Features
- **Row Level Security (RLS)** enabled on both tables
- **Public read access** for viewing products
- **Authenticated user access** for creating/updating products
- **Automatic deletion** of images when a product is deleted

### Performance Optimizations
- **Indexes** on frequently queried columns (category, created_at)
- **Full-text search** capability on product names
- **Auto-updating timestamps** for tracking changes

## How to Use in Your React App

### Example 1: Fetch all products
```javascript
import { useProducts } from '@features/products/hooks/useProducts'

function ProductsPage() {
  const { products, loading, error } = useProducts()

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### Example 2: Fetch products by category
```javascript
const { products, loading } = useProducts({ category: 'Electronics' })
```

### Example 3: Fetch a single product
```javascript
import { useProduct } from '@features/products/hooks/useProducts'

function ProductDetailPage() {
  const { id } = useParams()
  const { product, loading } = useProduct(id)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>${product.price}</p>

      {/* Display product images */}
      {product.product_images?.map(img => (
        <img key={img.id} src={img.image_url} alt={product.name} />
      ))}
    </div>
  )
}
```

### Example 4: Search products
```javascript
import { useProductSearch } from '@features/products/hooks/useProducts'

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('')
  const { results, loading } = useProductSearch(searchTerm)

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />
      {loading && <LoadingSpinner />}
      {results.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## Next Steps

1. ✅ Run the SQL migration in Supabase
2. ✅ Verify the tables are created
3. 📝 Add some sample products for testing
4. 🎨 Build product listing UI using the `useProducts` hook
5. 🖼️ Set up image upload functionality (optional)
6. 🔒 Customize RLS policies for admin users (optional)

## Troubleshooting

### Error: "relation already exists"
- The tables are already created. You can safely ignore this error.

### Error: "permission denied"
- Make sure you're running the SQL as a project admin
- Check your RLS policies

### Products not showing up
- Verify the RLS policies are correctly set
- Check if products exist in the table
- Check browser console for errors

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check the `productService.js` file for all available functions
