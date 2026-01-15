import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { transactionsDB, recurringDB, budgetsDB } from './lib/supabase'
import './App.css'

// ============ UTILITIES ============
const formatINR = (amount, showSign = false) => {
  const absAmount = Math.abs(amount)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(absAmount)
  if (showSign && amount > 0) return '+' + formatted
  if (showSign && amount < 0) return '-' + formatted
  return formatted
}

const getCategoryEmoji = (category) => {
  const emojis = {
    'Food & Dining': '🍽️',
    'Transportation': '🚗',
    'Healthcare & Medical': '💊',
    'Entertainment': '🎬',
    'Subscriptions': '📱',
    'Groceries': '🛒',
    'Shopping': '🛍️',
    'Bills & Utilities': '💡',
    'Income': '💰',
    'Investments': '📈',
    'Sports & Fitness': '🏃'
  }
  return emojis[category] || '💳'
}

const CATEGORY_COLORS = {
  'Food & Dining': '#E8B94A',
  'Transportation': '#4A90D9',
  'Healthcare & Medical': '#7C5CBF',
  'Entertainment': '#E85A8A',
  'Subscriptions': '#5AC8E8',
  'Groceries': '#4CAF7A',
  'Shopping': '#F06292',
  'Bills & Utilities': '#FF7043'
}

// ============ SAMPLE DATA ============
const initialTransactions = [
  { id: 1, name: 'Eggs', category: 'Food & Dining', account: 'SBI', amount: -60, date: '2026-01-14', type: 'expense' },
  { id: 2, name: 'Pocket Money', category: 'Income', account: 'Cash', amount: 2000, date: '2026-01-14', type: 'income' },
  { id: 3, name: 'Om Sai Chinese', category: 'Food & Dining', account: 'SBI', amount: -100, date: '2026-01-13', type: 'expense' },
  { id: 4, name: 'Valet Parking', category: 'Transportation', account: 'SBI', amount: -50, date: '2026-01-13', type: 'expense' },
  { id: 5, name: 'Zepto', category: 'Healthcare & Medical', account: 'SBI', amount: -598, date: '2026-01-13', type: 'expense' },
  { id: 6, name: 'Timezone Entertainment', category: 'Entertainment', account: 'SBI', amount: -2000, date: '2026-01-13', type: 'expense' },
  { id: 7, name: 'Mohib Medical Store', category: 'Healthcare & Medical', account: 'SBI', amount: -530, date: '2026-01-13', type: 'expense' },
  { id: 8, name: 'Starbucks', category: 'Food & Dining', account: 'SBI', amount: -200, date: '2026-01-12', type: 'expense' },
  { id: 9, name: 'Shree Vrundavanvihari', category: 'Groceries', account: 'SBI', amount: -110, date: '2026-01-10', type: 'expense' },
  { id: 10, name: 'Spice Franky Nation', category: 'Food & Dining', account: 'PNB Visa', amount: -302.93, date: '2026-01-10', type: 'expense' },
  { id: 11, name: 'Chemist', category: 'Healthcare & Medical', account: 'SBI', amount: -766, date: '2026-01-10', type: 'expense' },
  { id: 12, name: 'Pickleball', category: 'Sports & Fitness', account: 'SBI', amount: -420, date: '2026-01-10', type: 'expense' },
  { id: 13, name: 'Dinner - Nanking', category: 'Food & Dining', account: 'SBI', amount: -327.05, date: '2026-01-06', type: 'expense' },
  { id: 14, name: 'Rapido', category: 'Transportation', account: 'SBI', amount: -43, date: '2026-01-06', type: 'expense' },
  { id: 15, name: 'Netflix', category: 'Subscriptions', account: 'SBI', amount: -199, date: '2026-01-05', type: 'expense' },
  { id: 16, name: 'Uber', category: 'Transportation', account: 'SBI', amount: -250, date: '2026-01-04', type: 'expense' },
  { id: 17, name: 'Salary', category: 'Income', account: 'SBI', amount: 120744.14, date: '2026-01-01', type: 'income' },
]

const recurringPayments = [
  { id: 1, name: 'Birla MF', frequency: 'Monthly', renewDate: '2026-01-22', amount: 5000, icon: '📈' },
  { id: 2, name: 'ICICI Prudential MF', frequency: 'Monthly', renewDate: '2026-01-22', amount: 2500, icon: '📊' },
  { id: 3, name: 'Mirae MF', frequency: 'Monthly', renewDate: '2026-01-22', amount: 2500, icon: '💹' },
  { id: 4, name: 'Claude Pro', frequency: 'Monthly', renewDate: '2026-01-23', amount: 1999, icon: '🤖' },
  { id: 5, name: 'ChatGPT Plus', frequency: 'Monthly', renewDate: '2026-01-24', amount: 1999, icon: '💬' },
  { id: 6, name: 'Apple One', frequency: 'Monthly', renewDate: '2026-02-06', amount: 195, icon: '🍎' },
  { id: 7, name: 'Netflix', frequency: 'Monthly', renewDate: '2026-02-05', amount: 199, icon: '🎬' },
  { id: 8, name: 'Spotify', frequency: 'Monthly', renewDate: '2026-02-10', amount: 119, icon: '🎵' },
]

const budgets = [
  { id: 1, name: 'Food & Dining', spent: 989.98, budget: 8000, icon: '🍽️' },
  { id: 2, name: 'Transportation', spent: 343, budget: 3000, icon: '🚗' },
  { id: 3, name: 'Entertainment', spent: 2000, budget: 2000, icon: '🎬' },
  { id: 4, name: 'Healthcare', spent: 1894, budget: 3000, icon: '💊' },
  { id: 5, name: 'Subscriptions', spent: 199, budget: 500, icon: '📱' },
  { id: 6, name: 'Groceries', spent: 110, budget: 2000, icon: '🛒' },
]

const categories = [
  'Food & Dining', 'Transportation', 'Healthcare & Medical', 'Entertainment',
  'Subscriptions', 'Groceries', 'Shopping', 'Bills & Utilities', 'Income', 'Investments'
]

const accounts = ['SBI', 'PNB Visa', 'Cash', 'HDFC']

// ============ ICONS ============
const Icons = {
  Menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  PieChart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>,
  Repeat: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17,1 21,5 17,9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7,23 3,19 7,15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
  Target: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  TrendUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  TrendDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/></svg>,
  ArrowUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>,
  ArrowDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Lightbulb: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.9V17a1 1 0 001 1h6a1 1 0 001-1v-2.1A7 7 0 0012 2z"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  DollarSign: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  CreditCard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
}

// ============ MAIN APP ============
function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [transactions, setTransactions] = useState(initialTransactions)
  const [recurring, setRecurring] = useState(recurringPayments)
  const [budgetData, setBudgetData] = useState(budgets)
  const [showModal, setShowModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [entryType, setEntryType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('')
  const [account, setAccount] = useState('SBI')
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Check if Supabase is configured
  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY

  // Fetch data from database
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [transactionsData, recurringData, budgetsData] = await Promise.all([
        transactionsDB.getAll(),
        recurringDB.getAll(),
        budgetsDB.getAll()
      ])

      // Transform database data to match our format
      const transformedTransactions = transactionsData.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        account: t.account,
        amount: parseFloat(t.amount),
        date: t.date,
        type: t.type
      }))

      const transformedRecurring = recurringData.map(r => ({
        id: r.id,
        name: r.name,
        frequency: r.frequency,
        renewDate: r.renew_date,
        amount: parseFloat(r.amount),
        icon: r.icon
      }))

      setTransactions(transformedTransactions.length > 0 ? transformedTransactions : initialTransactions)
      setRecurring(transformedRecurring.length > 0 ? transformedRecurring : recurringPayments)
      if (budgetsData.length > 0) setBudgetData(budgetsData)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data. Using offline mode.')
    } finally {
      setLoading(false)
    }
  }, [isSupabaseConfigured])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed values
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))
    return { income, expense, net: income - expense }
  }, [transactions])

  const groupedTransactions = useMemo(() => {
    const groups = {}
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
    sorted.forEach(t => {
      const date = format(parseISO(t.date), 'EEE, MMM d')
      if (!groups[date]) groups[date] = []
      groups[date].push(t)
    })
    return groups
  }, [transactions])

  const categoryTotals = useMemo(() => {
    const totals = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      if (!totals[t.category]) totals[t.category] = 0
      totals[t.category] += Math.abs(t.amount)
    })
    return Object.entries(totals)
      .map(([name, amount]) => ({ name, amount, color: CATEGORY_COLORS[name] || '#9CA3AF' }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions])

  const dailySpending = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(new Date('2026-01-01')),
      end: new Date('2026-01-15')
    })
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayExpenses = transactions
        .filter(t => t.date === dateStr && t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      return {
        date: format(day, 'd'),
        fullDate: format(day, 'MMM d'),
        amount: dayExpenses
      }
    })
  }, [transactions])

  const monthlyTrend = useMemo(() => {
    return [
      { month: 'Oct', income: 95000, expense: 42000 },
      { month: 'Nov', income: 98000, expense: 55000 },
      { month: 'Dec', income: 115000, expense: 78000 },
      { month: 'Jan', income: totals.income, expense: totals.expense },
    ]
  }, [totals])

  // Handlers
  const handleDelete = async (id) => {
    if (isSupabaseConfigured) {
      try {
        await transactionsDB.delete(id)
      } catch (err) {
        console.error('Error deleting:', err)
      }
    }
    setTransactions(transactions.filter(t => t.id !== id))
  }

  const handleSave = async () => {
    if (!amount || !merchant) return

    setSaving(true)
    const newTransaction = {
      name: merchant,
      category: category || 'Food & Dining',
      account,
      amount: entryType === 'expense' ? -parseFloat(amount) : parseFloat(amount),
      date: transactionDate,
      type: entryType
    }

    try {
      if (isSupabaseConfigured) {
        const saved = await transactionsDB.add(newTransaction)
        setTransactions([{ ...saved, amount: parseFloat(saved.amount) }, ...transactions])
      } else {
        setTransactions([{ id: Date.now(), ...newTransaction }, ...transactions])
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      console.error('Error saving:', err)
      setError('Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setAmount('')
    setMerchant('')
    setCategory('')
    setEntryType('expense')
    setTransactionDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: 'none'
        }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color, fontSize: 14 }}>
              {p.name}: {formatINR(p.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Page titles
  const pageTitles = {
    dashboard: { title: 'Dashboard', subtitle: 'Welcome back, Dhrumil' },
    transactions: { title: 'Transactions', subtitle: 'January 2026' },
    analytics: { title: 'Analytics', subtitle: 'Spending insights' },
    recurring: { title: 'Recurring', subtitle: 'Subscriptions & bills' },
    budgets: { title: 'Budgets', subtitle: 'Track your limits' },
  }

  // Loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">₹</div>
          <div className="loading-text">Loading your finances...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Error Toast */}
      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {/* Supabase Status Banner */}
      {!isSupabaseConfigured && (
        <div className="offline-banner">
          Demo Mode - Set up Supabase for persistent storage
        </div>
      )}

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">₹</div>
            <span className="logo-text">FinanceTracker</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Overview</div>
            <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false) }}>
              <Icons.Home />
              <span>Dashboard</span>
            </button>
            <button className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => { setActiveTab('transactions'); setSidebarOpen(false) }}>
              <Icons.List />
              <span>Transactions</span>
            </button>
            <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setSidebarOpen(false) }}>
              <Icons.PieChart />
              <span>Analytics</span>
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Manage</div>
            <button className={`nav-item ${activeTab === 'recurring' ? 'active' : ''}`} onClick={() => { setActiveTab('recurring'); setSidebarOpen(false) }}>
              <Icons.Repeat />
              <span>Recurring</span>
            </button>
            <button className={`nav-item ${activeTab === 'budgets' ? 'active' : ''}`} onClick={() => { setActiveTab('budgets'); setSidebarOpen(false) }}>
              <Icons.Target />
              <span>Budgets</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">DK</div>
            <div className="user-info">
              <div className="user-name">Dhrumil Kherde</div>
              <div className="user-email">dhrumil@n1.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Icons.Menu />
            </button>
            <div>
              <h1 className="header-title">{pageTitles[activeTab]?.title}</h1>
              <p className="header-subtitle">{pageTitles[activeTab]?.subtitle}</p>
            </div>
          </div>
          <div className="header-right">
            <button className="header-btn">
              <Icons.Search />
            </button>
            <button className="header-btn">
              <Icons.Bell />
            </button>
            <button className="header-btn add-btn" onClick={() => setShowModal(true)}>
              <Icons.Plus />
              <span>Add Entry</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <AnimatePresence mode="wait">
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="dashboard-grid">
                  {/* Net Flow Card */}
                  <div className="grid-col-8">
                    <div className="summary-card-large">
                      <div className="summary-label-large">Net Flow</div>
                      <div className="summary-amount-large">
                        {totals.net >= 0 ? '+' : ''}{formatINR(totals.net)}
                      </div>
                      <div className="summary-stats">
                        <div className="summary-stat">
                          <span className="summary-stat-label">Income</span>
                          <span className="summary-stat-value income">{formatINR(totals.income)}</span>
                        </div>
                        <div className="summary-stat">
                          <span className="summary-stat-label">Spent</span>
                          <span className="summary-stat-value expense">{formatINR(totals.expense)}</span>
                        </div>
                        <div className="summary-stat">
                          <span className="summary-stat-label">Savings Rate</span>
                          <span className="summary-stat-value">{Math.round((totals.net / totals.income) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid-col-4">
                    <div className="card stat-card">
                      <div className="stat-card-icon positive">
                        <Icons.TrendUp />
                      </div>
                      <div className="stat-card-label">vs Last Month</div>
                      <div className="stat-card-value">+12.5%</div>
                      <div className="stat-card-change positive">
                        <Icons.ArrowUp /> ₹8,240 more saved
                      </div>
                    </div>
                  </div>

                  {/* Monthly Trend Chart */}
                  <div className="grid-col-8">
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">Monthly Trend</div>
                          <div className="card-subtitle">Income vs Expenses</div>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyTrend}>
                              <defs>
                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#C44536" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#C44536" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" />
                              <XAxis dataKey="month" stroke="#9A9A9A" fontSize={12} />
                              <YAxis stroke="#9A9A9A" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="income" stroke="#2D6A4F" strokeWidth={2} fill="url(#incomeGradient)" name="Income" />
                              <Area type="monotone" dataKey="expense" stroke="#C44536" strokeWidth={2} fill="url(#expenseGradient)" name="Expenses" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="chart-legend">
                          <div className="chart-legend-item">
                            <div className="chart-legend-dot" style={{ background: '#2D6A4F' }} />
                            <span>Income</span>
                          </div>
                          <div className="chart-legend-item">
                            <div className="chart-legend-dot" style={{ background: '#C44536' }} />
                            <span>Expenses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="grid-col-4">
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title">By Category</div>
                        <button className="card-action">View All</button>
                      </div>
                      <div className="card-body">
                        <div className="donut-chart-container">
                          <div className="donut-chart">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={categoryTotals.slice(0, 5)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={80}
                                  paddingAngle={2}
                                  dataKey="amount"
                                >
                                  {categoryTotals.slice(0, 5).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center">
                              <div className="donut-center-value">{formatINR(totals.expense)}</div>
                              <div className="donut-center-label">Total Spent</div>
                            </div>
                          </div>
                        </div>
                        <div className="donut-legend" style={{ marginTop: 16 }}>
                          {categoryTotals.slice(0, 4).map((cat, i) => (
                            <div key={i} className="donut-legend-item">
                              <div className="donut-legend-color" style={{ background: cat.color }} />
                              <div className="donut-legend-info">
                                <div className="donut-legend-name">{cat.name}</div>
                                <div className="donut-legend-value">{formatINR(cat.amount)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="grid-col-7">
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title">Recent Transactions</div>
                        <button className="card-action" onClick={() => setActiveTab('transactions')}>View All →</button>
                      </div>
                      <div className="card-body no-padding">
                        <div className="transaction-list">
                          {Object.entries(groupedTransactions).slice(0, 2).map(([date, items]) => (
                            <div key={date} className="transaction-group">
                              <div className="transaction-date">{date}</div>
                              {items.slice(0, 3).map(t => (
                                <div key={t.id} className="transaction-item">
                                  <div className="transaction-icon">{getCategoryEmoji(t.category)}</div>
                                  <div className="transaction-info">
                                    <div className="transaction-name">{t.name}</div>
                                    <div className="transaction-meta">
                                      <span className="transaction-category">{t.category}</span>
                                      <span>•</span>
                                      <span>{t.account}</span>
                                    </div>
                                  </div>
                                  <div className={`transaction-amount ${t.type}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Bills */}
                  <div className="grid-col-5">
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title">Upcoming Bills</div>
                        <button className="card-action" onClick={() => setActiveTab('recurring')}>See All →</button>
                      </div>
                      <div className="card-body no-padding">
                        <div className="recurring-list">
                          {recurring.slice(0, 4).map(p => (
                            <div key={p.id} className="recurring-item">
                              <div className="recurring-icon">{p.icon}</div>
                              <div className="recurring-info">
                                <div className="recurring-name">{p.name}</div>
                                <div className="recurring-details">Due {format(parseISO(p.renewDate), 'MMM d')}</div>
                              </div>
                              <div className="recurring-amount">
                                <div className="recurring-price">{formatINR(p.amount)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TRANSACTIONS */}
            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="dashboard-grid">
                  <div className="grid-col-12">
                    <div className="card">
                      <div className="card-body no-padding">
                        <div className="transaction-list">
                          {Object.entries(groupedTransactions).map(([date, items]) => (
                            <div key={date} className="transaction-group">
                              <div className="transaction-date">{date}</div>
                              {items.map(t => (
                                <div key={t.id} className="transaction-item">
                                  <div className="transaction-icon">{getCategoryEmoji(t.category)}</div>
                                  <div className="transaction-info">
                                    <div className="transaction-name">{t.name}</div>
                                    <div className="transaction-meta">
                                      <span className="transaction-category">{t.category}</span>
                                      <span>•</span>
                                      <span>{t.account}</span>
                                    </div>
                                  </div>
                                  <div className={`transaction-amount ${t.type}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                                  </div>
                                  <div className="transaction-actions">
                                    <button className="transaction-action-btn">
                                      <Icons.Edit />
                                    </button>
                                    <button className="transaction-action-btn delete" onClick={() => handleDelete(t.id)}>
                                      <Icons.Trash />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ANALYTICS */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="dashboard-grid">
                  {/* Insight Card */}
                  <div className="grid-col-12">
                    <div className="insight-card">
                      <div className="insight-icon">
                        <Icons.Lightbulb />
                      </div>
                      <div className="insight-content">
                        <div className="insight-title">Spending Insight</div>
                        <div className="insight-text">
                          You've spent 37% of your budget on Food & Dining this month. Consider cooking at home more to save ₹2,000+
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Spending */}
                  <div className="grid-col-8">
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">Daily Spending</div>
                          <div className="card-subtitle">January 1-15, 2026</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: '#9A9A9A' }}>Daily Average</div>
                          <div style={{ fontSize: 18, fontWeight: 600 }}>{formatINR(totals.expense / 15)}</div>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailySpending}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" vertical={false} />
                              <XAxis dataKey="date" stroke="#9A9A9A" fontSize={12} />
                              <YAxis stroke="#9A9A9A" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="amount" fill="#C4A35A" radius={[4, 4, 0, 0]} name="Spent" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown Full */}
                  <div className="grid-col-4">
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title">Spending by Category</div>
                      </div>
                      <div className="card-body">
                        <div className="category-list">
                          {categoryTotals.map((cat, i) => (
                            <div key={i} className="category-item">
                              <div className="category-icon" style={{ background: `${cat.color}20`, color: cat.color }}>
                                {getCategoryEmoji(cat.name)}
                              </div>
                              <div className="category-info">
                                <div className="category-header">
                                  <span className="category-name">{cat.name}</span>
                                  <span className="category-amount">{formatINR(cat.amount)}</span>
                                </div>
                                <div className="category-bar">
                                  <div
                                    className="category-bar-fill"
                                    style={{
                                      width: `${(cat.amount / totals.expense) * 100}%`,
                                      background: cat.color
                                    }}
                                  />
                                </div>
                                <div className="category-percent">{Math.round((cat.amount / totals.expense) * 100)}% of total</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RECURRING */}
            {activeTab === 'recurring' && (
              <motion.div
                key="recurring"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="dashboard-grid">
                  {/* Stats */}
                  <div className="grid-col-4">
                    <div className="card stat-card">
                      <div className="stat-card-icon gold">
                        <Icons.Repeat />
                      </div>
                      <div className="stat-card-label">Monthly Total</div>
                      <div className="stat-card-value">{formatINR(recurring.reduce((s, p) => s + p.amount, 0))}</div>
                    </div>
                  </div>
                  <div className="grid-col-4">
                    <div className="card stat-card">
                      <div className="stat-card-icon positive">
                        <Icons.Calendar />
                      </div>
                      <div className="stat-card-label">Due This Week</div>
                      <div className="stat-card-value">{formatINR(14998)}</div>
                    </div>
                  </div>
                  <div className="grid-col-4">
                    <div className="card stat-card">
                      <div className="stat-card-icon negative">
                        <Icons.CreditCard />
                      </div>
                      <div className="stat-card-label">Active Subscriptions</div>
                      <div className="stat-card-value">{recurring.length}</div>
                    </div>
                  </div>

                  {/* List */}
                  <div className="grid-col-12">
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title">All Recurring Payments</div>
                      </div>
                      <div className="card-body no-padding">
                        <div className="recurring-list">
                          {recurring.map(p => (
                            <div key={p.id} className="recurring-item">
                              <div className="recurring-icon">{p.icon}</div>
                              <div className="recurring-info">
                                <div className="recurring-name">{p.name}</div>
                                <div className="recurring-details">{p.frequency} • Next: {format(parseISO(p.renewDate), 'MMM d, yyyy')}</div>
                              </div>
                              <div className="recurring-amount">
                                <div className="recurring-price">{formatINR(p.amount)}</div>
                                <span className="recurring-status upcoming">Upcoming</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* BUDGETS */}
            {activeTab === 'budgets' && (
              <motion.div
                key="budgets"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="dashboard-grid">
                  <div className="grid-col-12">
                    <div className="budget-grid">
                      {budgetData.map(b => {
                        const percent = (b.spent / b.budget) * 100
                        const remaining = b.budget - b.spent
                        const status = percent < 70 ? 'safe' : percent < 100 ? 'warning' : 'danger'
                        return (
                          <div key={b.id} className="budget-card">
                            <div className="budget-header">
                              <div className="budget-icon">{b.icon}</div>
                              <div className="budget-amounts">
                                <div className="budget-spent">{formatINR(b.spent)}</div>
                                <div className="budget-total">of {formatINR(b.budget)}</div>
                              </div>
                            </div>
                            <div className="budget-name">{b.name}</div>
                            <div className="budget-progress">
                              <div
                                className={`budget-progress-fill ${status}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                            <div className={`budget-remaining ${remaining < 0 ? 'over' : ''}`}>
                              {remaining >= 0
                                ? `${formatINR(remaining)} remaining`
                                : `${formatINR(Math.abs(remaining))} over budget`
                              }
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          <button className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Icons.Home />
            <span>Home</span>
          </button>
          <button className={`bottom-nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <Icons.List />
            <span>Ledger</span>
          </button>
          <button className={`bottom-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <Icons.PieChart />
            <span>Review</span>
          </button>
          <button className={`bottom-nav-item ${activeTab === 'recurring' ? 'active' : ''}`} onClick={() => setActiveTab('recurring')}>
            <Icons.Repeat />
            <span>Recurring</span>
          </button>
          <button className={`bottom-nav-item ${activeTab === 'budgets' ? 'active' : ''}`} onClick={() => setActiveTab('budgets')}>
            <Icons.Target />
            <span>Budgets</span>
          </button>
        </div>
      </nav>

      {/* Mobile FAB */}
      <button className="fab" onClick={() => setShowModal(true)}>
        <Icons.Plus />
      </button>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header">
                <h2 className="modal-title">Add Transaction</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <Icons.X />
                </button>
              </div>
              <div className="modal-body">
                {/* AI Suggestion */}
                <div className="ai-suggestion" onClick={() => {
                  setMerchant('Starbucks')
                  setAmount('500')
                  setCategory('Food & Dining')
                  setEntryType('expense')
                }}>
                  <div className="ai-icon">✦</div>
                  <div className="ai-content">
                    <div className="ai-label">AI Suggestion</div>
                    <div className="ai-text">₹500 at Starbucks yesterday</div>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="amount-input-large">
                  <div className={`amount-display ${amount ? 'has-value' : ''}`}>
                    {entryType === 'expense' ? '-' : '+'}₹{amount || '0'}
                  </div>
                </div>

                {/* Type Toggle */}
                <div className="type-toggle">
                  <button className={`type-btn ${entryType === 'expense' ? 'active' : ''}`} onClick={() => setEntryType('expense')}>
                    Expense
                  </button>
                  <button className={`type-btn ${entryType === 'income' ? 'active' : ''}`} onClick={() => setEntryType('income')}>
                    Income
                  </button>
                </div>

                {/* Form */}
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Merchant / Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Where did you spend?"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Account</label>
                  <select className="form-select" value={account} onChange={(e) => setAccount(e.target.value)}>
                    {accounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-full" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-full" onClick={handleSave} disabled={!amount || !merchant || saving}>
                  {saving ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
