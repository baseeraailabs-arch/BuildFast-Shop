import { supabase } from '@lib/supabase'

/**
 * Customer Service
 * Handles customer profile operations
 */

/**
 * Get the current user's customer profile
 * @returns {Promise<Object>} Customer data and error
 */
export const getCurrentCustomer = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching customer profile:', error)
    return { data: null, error }
  }
}

/**
 * Update the current user's customer profile
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated customer data and error
 */
export const updateCustomerProfile = async (updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Don't allow updating id or email through this function
    const { id, created_at, ...safeUpdates } = updates

    const { data, error } = await supabase
      .from('customers')
      .update(safeUpdates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating customer profile:', error)
    return { data: null, error }
  }
}

/**
 * Get customer statistics (orders, spending, etc.)
 * @returns {Promise<Object>} Customer stats and error
 */
export const getCustomerStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .rpc('get_customer_stats', { customer_uuid: user.id })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return { data: null, error }
  }
}

/**
 * Check if customer profile exists
 * @returns {Promise<Object>} Exists boolean and error
 */
export const checkProfileExists = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: false, error: null }
    }

    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      throw error
    }

    return { data: !!data, error: null }
  } catch (error) {
    console.error('Error checking profile existence:', error)
    return { data: false, error }
  }
}

/**
 * Create customer profile (usually done automatically on signup)
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created customer data and error
 */
export const createCustomerProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        id: user.id,
        email: user.email,
        ...profileData,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating customer profile:', error)
    return { data: null, error }
  }
}

/**
 * Delete customer account (deletes auth user and profile)
 * @returns {Promise<Object>} Error object
 */
export const deleteCustomerAccount = async () => {
  try {
    // This will cascade delete the customer profile due to ON DELETE CASCADE
    const { error } = await supabase.auth.admin.deleteUser()

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting customer account:', error)
    return { error }
  }
}

/**
 * Update customer email
 * @param {string} newEmail - New email address
 * @returns {Promise<Object>} Result and error
 */
export const updateCustomerEmail = async (newEmail) => {
  try {
    // Update in auth.users
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (authError) throw authError

    // Update in customers table
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('customers')
      .update({ email: newEmail })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return { data: { auth: authData, customer: data }, error: null }
  } catch (error) {
    console.error('Error updating customer email:', error)
    return { data: null, error }
  }
}

/**
 * Validate customer profile data
 * @param {Object} profileData - Profile data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateProfileData = (profileData) => {
  const errors = []

  if (profileData.full_name && profileData.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters')
  }

  if (profileData.phone) {
    // Basic phone validation
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
    if (!phoneRegex.test(profileData.phone)) {
      errors.push('Invalid phone number format')
    }
  }

  if (profileData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(profileData.email)) {
      errors.push('Invalid email format')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
