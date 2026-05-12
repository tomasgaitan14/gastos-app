-- ============================================================
-- gastos app — Schema completo (enfoque admin único)
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Miembros del grupo (solo nombre y salario, sin cuentas individuales)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  salary DECIMAL(12, 2),
  salary_currency TEXT CHECK (salary_currency IN ('ARS', 'USD')) DEFAULT 'ARS' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tipo de cambio (cache)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(12, 4) NOT NULL,
  source TEXT DEFAULT 'dolarapi-cripto' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(from_currency, to_currency)
);

-- Gastos (paid_by referencia members.id)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT CHECK (currency IN ('ARS', 'USD')) DEFAULT 'ARS' NOT NULL,
  paid_by UUID REFERENCES public.members(id) ON DELETE RESTRICT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Splits por gasto (user_id referencia members.id)
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  percentage DECIMAL(8, 4) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  is_excluded BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(expense_id, user_id)
);

-- Pagos de deudas (from/to referencian members.id)
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES public.members(id) ON DELETE RESTRICT NOT NULL,
  to_user_id UUID REFERENCES public.members(id) ON DELETE RESTRICT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT CHECK (currency IN ('ARS', 'USD')) DEFAULT 'ARS' NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- Row Level Security (solo usuarios autenticados pueden acceder)
-- ============================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_all" ON public.members;
CREATE POLICY "members_all" ON public.members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "exchange_rates_all" ON public.exchange_rates;
CREATE POLICY "exchange_rates_all" ON public.exchange_rates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "expenses_all" ON public.expenses;
CREATE POLICY "expenses_all" ON public.expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "splits_all" ON public.expense_splits;
CREATE POLICY "splits_all" ON public.expense_splits
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "settlements_all" ON public.settlements;
CREATE POLICY "settlements_all" ON public.settlements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
