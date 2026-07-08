import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TenantLayout } from '@/components/layout/TenantLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Expenses } from '@/pages/Expenses'
import { NewExpense } from '@/pages/NewExpense'
import { ExpenseDetail } from '@/pages/ExpenseDetail'
import { Balance } from '@/pages/Balance'
import { Settings } from '@/pages/Settings'
import { EditExpense } from '@/pages/EditExpense'
import { NewPersonalExpense } from '@/pages/NewPersonalExpense'
import { PersonalExpenseDetail } from '@/pages/PersonalExpenseDetail'
import { EditPersonalExpense } from '@/pages/EditPersonalExpense'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

const LAST_TENANT_KEY = 'lastTenant'

function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    const last = localStorage.getItem(LAST_TENANT_KEY)
    if (last) navigate(`/t/${last}/dashboard`, { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Gastos App</h1>
        <p className="text-sm text-zinc-400">Usá el link que te compartieron para acceder.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/t/:tenantId" element={<TenantLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expenses/new" element={<NewExpense />} />
            <Route path="expenses/:id" element={<ExpenseDetail />} />
            <Route path="expenses/:id/edit" element={<EditExpense />} />
            <Route path="personal/new" element={<NewPersonalExpense />} />
            <Route path="personal/:id" element={<PersonalExpenseDetail />} />
            <Route path="personal/:id/edit" element={<EditPersonalExpense />} />
            <Route path="balance" element={<Balance />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
