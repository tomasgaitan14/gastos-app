CREATE TABLE IF NOT EXISTS public.personal_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT CHECK (currency IN ('ARS', 'USD')) DEFAULT 'ARS' NOT NULL,
  category TEXT NOT NULL DEFAULT 'otros',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
  recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_personal_expenses" ON public.personal_expenses;
CREATE POLICY "authenticated_all_personal_expenses"
  ON public.personal_expenses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
