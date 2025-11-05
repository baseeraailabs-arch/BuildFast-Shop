import { supabase } from '@lib/supabase'

/**
 * Product Service
 * Handles all product-related database operations
 */

/**
 * Fetch all products with optional filtering
 * @param {Object} options - Query options
 * @param {string} options.category - Filter by category
 * @param {number} options.limit - Limit number of results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Object>} Products data and error
 */
export const getProducts = async ({ category, limit = 12, offset = 0 } = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query

    if (error) throw error

    return { data, error: null, count }
  } catch (error) {
    console.error('Error fetching products:', error)
    return { data: null, error }
  }
}

/**
 * Fetch a single product by ID
 * @param {string} productId - The product ID
 * @returns {Promise<Object>} Product data and error
 */
export const getProductById = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      `)
      .eq('id', productId)
      .single()

    if (error) throw error

    // Sort images by display_order
    if (data?.product_images) {
      data.product_images.sort((a, b) => a.display_order - b.display_order)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching product:', error)
    return { data: null, error }
  }
}

/**
 * Search products by name
 * @param {string} searchTerm - The search term
 * @param {number} limit - Limit number of results
 * @returns {Promise<Object>} Products data and error
 */
export const searchProducts = async (searchTerm, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      `)
      .ilike('name', `%${searchTerm}%`)
      .limit(limit)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error searching products:', error)
    return { data: null, error }
  }
}

/**
 * Get all unique product categories
 * @returns {Promise<Object>} Categories data and error
 */
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)

    if (error) throw error

    // Extract unique categories
    const categories = [...new Set(data.map(item => item.category))]

    return { data: categories, error: null }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: null, error }
  }
}

/**
 * Create a new product (admin only)
 * @param {Object} productData - The product data
 * @param {Array<string>} imageUrls - Array of image URLs
 * @returns {Promise<Object>} Created product data and error
 */
export const createProduct = async (productData, imageUrls = []) => {
  try {
    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (productError) throw productError

    // Insert images if provided
    if (imageUrls.length > 0) {
      const images = imageUrls.map((url, index) => ({
        product_id: product.id,
        image_url: url,
        is_primary: index === 0,
        display_order: index,
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(images)

      if (imagesError) throw imagesError
    }

    return { data: product, error: null }
  } catch (error) {
    console.error('Error creating product:', error)
    return { data: null, error }
  }
}

/**
 * Update a product (admin only)
 * @param {string} productId - The product ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} Updated product data and error
 */
export const updateProduct = async (productId, updates) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating product:', error)
    return { data: null, error }
  }
}

/**
 * Delete a product (admin only)
 * @param {string} productId - The product ID
 * @returns {Promise<Object>} Error object
 */
export const deleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { error }
  }
}

/**
 * Update product stock quantity
 * @param {string} productId - The product ID
 * @param {number} quantity - The new stock quantity
 * @returns {Promise<Object>} Updated product data and error
 */
export const updateStock = async (productId, quantity) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ stock_quantity: quantity })
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating stock:', error)
    return { data: null, error }
  }
}

/**
 * Add an image to a product
 * @param {string} productId - The product ID
 * @param {string} imageUrl - The image URL
 * @param {boolean} isPrimary - Whether this should be the primary image
 * @returns {Promise<Object>} Created image data and error
 */
export const addProductImage = async (productId, imageUrl, isPrimary = false) => {
  try {
    // Get current max display_order for this product
    const { data: existingImages } = await supabase
      .from('product_images')
      .select('display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = existingImages?.[0]?.display_order + 1 || 0

    // If setting as primary, unset other primary images
    if (isPrimary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)
    }

    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: imageUrl,
        is_primary: isPrimary,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error adding product image:', error)
    return { data: null, error }
  }
}

/**
 * Delete a product image
 * @param {string} imageId - The image ID
 * @returns {Promise<Object>} Error object
 */
export const deleteProductImage = async (imageId) => {
  try {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting product image:', error)
    return { error }
  }
}
