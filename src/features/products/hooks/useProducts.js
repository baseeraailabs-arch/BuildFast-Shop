import { useState, useEffect } from 'react'
import {
  getProducts,
  getProductById,
  searchProducts,
  getCategories,
} from '../services/productService'

/**
 * Custom hook to fetch and manage products list
 * @param {Object} options - Query options
 * @param {string} options.category - Filter by category
 * @param {number} options.limit - Items per page
 * @param {number} options.page - Current page
 * @returns {Object} Products data, loading state, and error
 */
export const useProducts = ({ category, limit = 12, page = 1 } = {}) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      const offset = (page - 1) * limit
      const result = await getProducts({ category, limit, offset })

      if (result.error) {
        setError(result.error)
      } else {
        setProducts(result.data || [])
        setTotalCount(result.count || 0)
      }

      setLoading(false)
    }

    fetchProducts()
  }, [category, limit, page])

  const refetch = async () => {
    setLoading(true)
    const offset = (page - 1) * limit
    const result = await getProducts({ category, limit, offset })

    if (result.error) {
      setError(result.error)
    } else {
      setProducts(result.data || [])
      setTotalCount(result.count || 0)
    }
    setLoading(false)
  }

  return {
    products,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    refetch,
  }
}

/**
 * Custom hook to fetch a single product
 * @param {string} productId - The product ID
 * @returns {Object} Product data, loading state, and error
 */
export const useProduct = (productId) => {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    const fetchProduct = async () => {
      setLoading(true)
      setError(null)

      const result = await getProductById(productId)

      if (result.error) {
        setError(result.error)
      } else {
        setProduct(result.data)
      }

      setLoading(false)
    }

    fetchProduct()
  }, [productId])

  const refetch = async () => {
    if (!productId) return

    setLoading(true)
    const result = await getProductById(productId)

    if (result.error) {
      setError(result.error)
    } else {
      setProduct(result.data)
    }
    setLoading(false)
  }

  return {
    product,
    loading,
    error,
    refetch,
  }
}

/**
 * Custom hook for product search with debouncing
 * @param {string} searchTerm - The search term
 * @param {number} debounceDelay - Debounce delay in ms
 * @returns {Object} Search results, loading state, and error
 */
export const useProductSearch = (searchTerm, debounceDelay = 300) => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    const timer = setTimeout(async () => {
      const result = await searchProducts(searchTerm)

      if (result.error) {
        setError(result.error)
      } else {
        setResults(result.data || [])
      }

      setLoading(false)
    }, debounceDelay)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceDelay])

  return {
    results,
    loading,
    error,
  }
}

/**
 * Custom hook to fetch product categories
 * @returns {Object} Categories data, loading state, and error
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      setError(null)

      const result = await getCategories()

      if (result.error) {
        setError(result.error)
      } else {
        setCategories(result.data || [])
      }

      setLoading(false)
    }

    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
  }
}
