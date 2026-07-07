import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BottomNav } from '@/components/layout/BottomNav'
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/new" element={<NewExpense />} />
          <Route path="/expenses/:id" element={<ExpenseDetail />} />
          <Route path="/expenses/:id/edit" element={<EditExpense />} />
          <Route path="/personal/new" element={<NewPersonalExpense />} />
          <Route path="/personal/:id" element={<PersonalExpenseDetail />} />
          <Route path="/personal/:id/edit" element={<EditPersonalExpense />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
