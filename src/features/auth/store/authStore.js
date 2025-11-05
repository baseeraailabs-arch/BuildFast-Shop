import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@lib/supabase'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,

      // Initialize auth state
      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          set({ session, user: session?.user || null, loading: false })

          // Listen for auth changes
          supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user || null })
          })
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ loading: false })
        }
      },

      // Sign up with email and password
      signUp: async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata }
        })

        if (error) throw error
        return data
      },

      // Sign in with email and password
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        set({ session: data.session, user: data.user })
        return data
      },

      // Sign out
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        set({ session: null, user: null })
      },

      // Update user profile
      updateProfile: async (updates) => {
        const { data, error } = await supabase.auth.updateUser({
          data: updates
        })

        if (error) throw error
        set({ user: data.user })
        return data
      },

      // Reset password
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
)

export default useAuthStore
