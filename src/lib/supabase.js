import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations for transactions
export const transactionsDB = {
  // Get all transactions
  async getAll() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error
    return data
  },

  // Add a new transaction
  async add(transaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a transaction
  async update(id, updates) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a transaction
  async delete(id) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}

// Database operations for recurring payments
export const recurringDB = {
  async getAll() {
    const { data, error } = await supabase
      .from('recurring_payments')
      .select('*')
      .order('renew_date', { ascending: true })

    if (error) throw error
    return data
  },

  async add(payment) {
    const { data, error } = await supabase
      .from('recurring_payments')
      .insert([payment])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('recurring_payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('recurring_payments')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}

// Database operations for budgets
export const budgetsDB = {
  async getAll() {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
