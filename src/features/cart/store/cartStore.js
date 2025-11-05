import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Add item to cart
      addItem: (product, quantity = 1) => {
        const items = get().items
        const existingItem = items.find(item => item.id === product.id)

        if (existingItem) {
          // Update quantity if item already exists
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          })
        } else {
          // Add new item
          set({
            items: [...items, { ...product, quantity }]
          })
        }
      },

      // Remove item from cart
      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.id !== productId)
        })
      },

      // Update item quantity
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set({
          items: get().items.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        })
      },

      // Clear cart
      clearCart: () => {
        set({ items: [] })
      },

      // Get cart total
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + (item.price * item.quantity),
          0
        )
      },

      // Get cart item count
      getItemCount: () => {
        return get().items.reduce(
          (count, item) => count + item.quantity,
          0
        )
      },

      // Check if product is in cart
      isInCart: (productId) => {
        return get().items.some(item => item.id === productId)
      },

      // Get specific cart item
      getItem: (productId) => {
        return get().items.find(item => item.id === productId)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

export default useCartStore
