-- ============================================
-- FINANCE TRACKER DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  account VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- ============================================
-- RECURRING PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  frequency VARCHAR(50) NOT NULL DEFAULT 'Monthly',
  renew_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  icon VARCHAR(10) DEFAULT '💳',
  category VARCHAR(100),
  account VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_renew_date ON recurring_payments(renew_date);

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  icon VARCHAR(10) DEFAULT '💰',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTION: Update timestamp on record update
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_updated_at ON recurring_payments;
CREATE TRIGGER update_recurring_updated_at
  BEFORE UPDATE ON recurring_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anonymous users (for demo)
-- In production, you'd want proper user authentication
CREATE POLICY "Allow all for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for recurring_payments" ON recurring_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA: Initial budgets
-- ============================================
INSERT INTO budgets (name, budget, icon) VALUES
  ('Food & Dining', 8000, '🍽️'),
  ('Transportation', 3000, '🚗'),
  ('Entertainment', 2000, '🎬'),
  ('Healthcare & Medical', 3000, '💊'),
  ('Subscriptions', 500, '📱'),
  ('Groceries', 2000, '🛒'),
  ('Shopping', 5000, '🛍️'),
  ('Bills & Utilities', 3000, '💡')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DATA: Sample recurring payments
-- ============================================
INSERT INTO recurring_payments (name, frequency, renew_date, amount, icon) VALUES
  ('Birla MF', 'Monthly', '2026-01-22', 5000, '📈'),
  ('ICICI Prudential MF', 'Monthly', '2026-01-22', 2500, '📊'),
  ('Mirae MF', 'Monthly', '2026-01-22', 2500, '💹'),
  ('Claude Pro', 'Monthly', '2026-01-23', 1999, '🤖'),
  ('ChatGPT Plus', 'Monthly', '2026-01-24', 1999, '💬'),
  ('Apple One', 'Monthly', '2026-02-06', 195, '🍎'),
  ('Netflix', 'Monthly', '2026-02-05', 199, '🎬'),
  ('Spotify', 'Monthly', '2026-02-10', 119, '🎵')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Sample transactions
-- ============================================
INSERT INTO transactions (name, category, account, amount, date, type) VALUES
  ('Eggs', 'Food & Dining', 'SBI', -60, '2026-01-14', 'expense'),
  ('Pocket Money', 'Income', 'Cash', 2000, '2026-01-14', 'income'),
  ('Om Sai Chinese', 'Food & Dining', 'SBI', -100, '2026-01-13', 'expense'),
  ('Valet Parking', 'Transportation', 'SBI', -50, '2026-01-13', 'expense'),
  ('Zepto', 'Healthcare & Medical', 'SBI', -598, '2026-01-13', 'expense'),
  ('Timezone Entertainment', 'Entertainment', 'SBI', -2000, '2026-01-13', 'expense'),
  ('Mohib Medical Store', 'Healthcare & Medical', 'SBI', -530, '2026-01-13', 'expense'),
  ('Starbucks', 'Food & Dining', 'SBI', -200, '2026-01-12', 'expense'),
  ('Shree Vrundavanvihari', 'Groceries', 'SBI', -110, '2026-01-10', 'expense'),
  ('Spice Franky Nation', 'Food & Dining', 'PNB Visa', -302.93, '2026-01-10', 'expense'),
  ('Chemist', 'Healthcare & Medical', 'SBI', -766, '2026-01-10', 'expense'),
  ('Pickleball', 'Sports & Fitness', 'SBI', -420, '2026-01-10', 'expense'),
  ('Dinner - Nanking', 'Food & Dining', 'SBI', -327.05, '2026-01-06', 'expense'),
  ('Rapido', 'Transportation', 'SBI', -43, '2026-01-06', 'expense'),
  ('Netflix', 'Subscriptions', 'SBI', -199, '2026-01-05', 'expense'),
  ('Uber', 'Transportation', 'SBI', -250, '2026-01-04', 'expense'),
  ('Salary', 'Income', 'SBI', 120744.14, '2026-01-01', 'income')
ON CONFLICT DO NOTHING;
