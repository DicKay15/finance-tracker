import { useState } from 'react'
import './App.css'

// Format currency in Indian format
const formatINR = (amount) => {
  const absAmount = Math.abs(amount)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(absAmount).replace('₹', '₹')
}

// Sample Data
const initialTransactions = [
  { id: 1, name: 'Eggs', category: 'Food & Dining', account: 'SBI', amount: -60, date: '2026-01-14', type: 'expense' },
  { id: 2, name: 'Income', category: 'Income', account: 'Cash', amount: 2000, date: '2026-01-14', type: 'income' },
  { id: 3, name: 'Om Sai Chinese', category: 'Food & Dining', account: 'SBI', amount: -100, date: '2026-01-13', type: 'expense' },
  { id: 4, name: 'Valet Parking', category: 'Transportation', account: 'SBI', amount: -50, date: '2026-01-13', type: 'expense' },
  { id: 5, name: 'Zepto', category: 'Healthcare & Medical', account: 'SBI', amount: -598, date: '2026-01-13', type: 'expense' },
  { id: 6, name: 'TIMEZONE ENTERTAINMENT PVT...', category: 'Entertainment', account: 'SBI', amount: -2000, date: '2026-01-13', type: 'expense' },
  { id: 7, name: 'Mohib Medical Store', category: 'Healthcare & Medical', account: 'SBI', amount: -530, date: '2026-01-13', type: 'expense' },
  { id: 8, name: 'Starbucks', category: 'Food & Dining', account: 'SBI', amount: -200, date: '2026-01-13', type: 'expense' },
  { id: 9, name: 'SHREE VRUNDAVANVIHARI STORE', category: 'Groceries', account: 'SBI', amount: -110, date: '2026-01-10', type: 'expense' },
  { id: 10, name: 'Spice Franky Nation', category: 'Food & Dining', account: 'PNB Visa', amount: -302.93, date: '2026-01-10', type: 'expense' },
  { id: 11, name: 'Salary', category: 'Income', account: 'SBI', amount: 120744.14, date: '2026-01-01', type: 'income' },
]

const recurringPayments = [
  { id: 1, name: 'Birla MF', frequency: 'Monthly', renewDate: '22 jan', amount: 5000 },
  { id: 2, name: 'ICICI Prudential MF', frequency: 'Monthly', renewDate: '22 jan', amount: 2500 },
  { id: 3, name: 'Mirae MF', frequency: 'Monthly', renewDate: '22 jan', amount: 2500 },
  { id: 4, name: 'Claude Pro', frequency: 'Monthly', renewDate: '23 jan', amount: 1999 },
  { id: 5, name: 'ChatGPT Plus', frequency: 'Monthly', renewDate: '24 jan', amount: 1999 },
  { id: 6, name: 'Apple One', frequency: 'Monthly', renewDate: '6 feb', amount: 195 },
]

const budgets = [
  { id: 1, name: 'Food & Dining', spent: 5870.12, budget: 8000 },
  { id: 2, name: 'Transportation', spent: 2753.07, budget: 3000 },
  { id: 3, name: 'Entertainment', spent: 2000, budget: 2000 },
  { id: 4, name: 'Healthcare', spent: 2294, budget: 3000 },
]

const categories = [
  'Food & Dining', 'Transportation', 'Healthcare & Medical', 'Entertainment',
  'Subscriptions', 'Groceries', 'Shopping', 'Bills & Utilities', 'Income'
]

const accounts = ['SBI', 'PNB Visa', 'Cash', 'HDFC']

// Icons
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
    <rect x="7" y="14" width="3" height="3"/>
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
)

const LedgerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 6h16M4 10h16M4 14h10M4 18h6"/>
  </svg>
)

const ReviewIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 0 20"/>
    <path d="M12 12L12 6"/>
  </svg>
)

const RecurringIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M7 8h10M7 12h10M7 16h10"/>
  </svg>
)

const BudgetsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
)

// Group transactions by date
const groupByDate = (transactions) => {
  const groups = {}
  transactions.forEach(t => {
    const date = new Date(t.date)
    const key = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return groups
}

// Calculate category totals
const getCategoryTotals = (transactions) => {
  const totals = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!totals[t.category]) totals[t.category] = 0
    totals[t.category] += Math.abs(t.amount)
  })
  return Object.entries(totals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}

function App() {
  const [activeTab, setActiveTab] = useState('ledger')
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showModal, setShowModal] = useState(false)
  const [swipedId, setSwipedId] = useState(null)

  // Modal state
  const [entryType, setEntryType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('')
  const [account, setAccount] = useState('SBI')

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))
  const netFlow = totalIncome - totalExpense
  const groupedTransactions = groupByDate(transactions)
  const categoryTotals = getCategoryTotals(transactions)

  const handleDelete = (id) => {
    setTransactions(transactions.filter(t => t.id !== id))
    setSwipedId(null)
  }

  const handleSave = () => {
    if (!amount || !merchant) return
    const newTransaction = {
      id: Date.now(),
      name: merchant,
      category: category || 'Food & Dining',
      account,
      amount: entryType === 'expense' ? -parseFloat(amount) : parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      type: entryType
    }
    setTransactions([newTransaction, ...transactions])
    setShowModal(false)
    resetForm()
  }

  const resetForm = () => {
    setAmount('')
    setMerchant('')
    setCategory('')
    setEntryType('expense')
  }

  const fillAISuggestion = () => {
    setMerchant('Starbucks')
    setAmount('500')
    setCategory('Food & Dining')
    setEntryType('expense')
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <button className="header-btn">
          <CalendarIcon />
        </button>
        <h1 className="header-title">January 2026</h1>
        <button
          className="header-btn add-btn"
          onClick={() => activeTab === 'review' ? null : setShowModal(true)}
        >
          {activeTab === 'review' ? <SettingsIcon /> : <PlusIcon />}
        </button>
      </header>

      {/* Screens */}
      {activeTab === 'ledger' && (
        <>
          {/* Summary Card */}
          <div className="summary-card">
            <div className="summary-label">Net Flow</div>
            <div className={`summary-amount ${netFlow >= 0 ? 'positive' : 'negative'}`}>
              {netFlow >= 0 ? '+' : '-'}{formatINR(netFlow)}
            </div>
            <div className="summary-row">
              <div className="summary-item">
                <div className="summary-item-label">Income</div>
                <div className="summary-item-value income">{formatINR(totalIncome)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">Spent</div>
                <div className="summary-item-value spent">{formatINR(totalExpense)}</div>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="transaction-list">
            {Object.entries(groupedTransactions).map(([date, items]) => (
              <div key={date} className="date-group">
                <div className="date-header">{date}</div>
                {items.map(transaction => (
                  <div key={transaction.id} className="transaction-wrapper">
                    <div className="delete-action" onClick={() => handleDelete(transaction.id)}>
                      <TrashIcon /> Delete
                    </div>
                    <div
                      className={`transaction-swipeable ${swipedId === transaction.id ? 'swiped' : ''}`}
                      onClick={() => setSwipedId(swipedId === transaction.id ? null : transaction.id)}
                    >
                      <div className="transaction-item">
                        <div className="transaction-content">
                          <div className="transaction-name">{transaction.name}</div>
                          <div className="transaction-meta">
                            {transaction.category} · {transaction.account}
                          </div>
                        </div>
                        <div className={`transaction-amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatINR(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'review' && (
        <div className="review-section">
          <h2 className="section-title">This month so far</h2>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">↙ received</div>
              <div className="stat-value positive">+{formatINR(totalIncome)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">spent</div>
              <div className="stat-value negative">-{formatINR(totalExpense)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">net</div>
              <div className="stat-value net">+{formatINR(netFlow)}</div>
            </div>
          </div>

          {/* Daily Spending Chart */}
          <div className="chart-container">
            <div className="chart-header">
              <span className="chart-title">Daily spending</span>
              <span className="chart-total">{formatINR(totalExpense)}</span>
            </div>
            <div className="daily-avg">{formatINR(totalExpense / 15)}/day avg</div>
            <div className="bar-chart">
              {[20, 35, 15, 85, 45, 25, 30, 55, 40, 60, 25, 35, 100, 45, 30].map((height, i) => (
                <div
                  key={i}
                  className={`bar ${i === 12 ? 'highlight' : ''}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="chart-labels">
              <span>1</span>
              <span>15</span>
              <span>31</span>
            </div>
          </div>

          {/* Category Breakdown */}
          <h3 className="section-title">By category</h3>
          <div className="category-list">
            {categoryTotals.map(cat => (
              <div key={cat.name} className="category-item">
                <div className="category-icon">◆</div>
                <div className="category-info">
                  <div className="category-name">{cat.name}</div>
                  <div className="category-bar">
                    <div
                      className="category-bar-fill"
                      style={{ width: `${(cat.amount / totalExpense) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="category-values">
                  <div className="category-amount">{formatINR(cat.amount)}</div>
                  <div className="category-percent">{Math.round((cat.amount / totalExpense) * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'recurring' && (
        <div className="recurring-list">
          {recurringPayments.map(payment => (
            <div key={payment.id} className="recurring-card">
              <div className="recurring-row">
                <div>
                  <div className="recurring-name">{payment.name}</div>
                  <div className="recurring-meta">
                    {payment.frequency}<br/>
                    renews {payment.renewDate}
                  </div>
                </div>
                <div className="recurring-amount">{formatINR(payment.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'budgets' && (
        <div className="budgets-grid">
          {budgets.map(budget => {
            const percent = (budget.spent / budget.budget) * 100
            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-header">
                  <div className="budget-name">{budget.name}</div>
                  <div className="budget-amounts">
                    <div className="budget-spent">{formatINR(budget.spent)}</div>
                    <div className="budget-total">of {formatINR(budget.budget)}</div>
                  </div>
                </div>
                <div className="budget-progress">
                  <div
                    className={`budget-progress-fill ${percent > 100 ? 'over' : ''}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <LedgerIcon />
          <span>Ledger</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          <ReviewIcon />
          <span>Review</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'recurring' ? 'active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          <RecurringIcon />
          <span>Recurring</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'budgets' ? 'active' : ''}`}
          onClick={() => setActiveTab('budgets')}
        >
          <BudgetsIcon />
          <span>Budgets</span>
        </button>
      </nav>

      {/* Add Entry Modal */}
      {showModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <button className="modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <span className="modal-title">Add entry</span>
              <button
                className={`modal-save ${amount && merchant ? 'active' : ''}`}
                onClick={handleSave}
              >
                Save
              </button>
            </div>

            {/* AI Suggestion */}
            <div className="ai-suggestion" onClick={fillAISuggestion}>
              <span className="ai-icon">✦</span>
              <span className="ai-text">₹500 at Starbucks yesterday</span>
            </div>

            <div className="divider">or enter manually</div>

            {/* Amount Display */}
            <div className="amount-input-container">
              <div className={`amount-display ${amount ? 'has-value' : ''}`}>
                {entryType === 'expense' ? '-' : '+'}₹{amount || '0'}
              </div>
            </div>

            {/* Type Toggle */}
            <div className="type-toggle">
              <button
                className={`type-btn ${entryType === 'expense' ? 'active' : ''}`}
                onClick={() => setEntryType('expense')}
              >
                Expense
              </button>
              <button
                className={`type-btn ${entryType === 'income' ? 'active' : ''}`}
                onClick={() => setEntryType('income')}
              >
                Income
              </button>
            </div>

            {/* Form Fields */}
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
              <label className="form-label">Merchant</label>
              <input
                type="text"
                className="form-input"
                placeholder="Who or what"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account</label>
              <select
                className="form-select"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              >
                {accounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
