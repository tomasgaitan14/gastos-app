import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { BottomNav } from '@/components/layout/BottomNav'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Expenses } from '@/pages/Expenses'
import { NewExpense } from '@/pages/NewExpense'
import { ExpenseDetail } from '@/pages/ExpenseDetail'
import { Balance } from '@/pages/Balance'
import { Settings } from '@/pages/Settings'
import { EditExpense } from '@/pages/EditExpense'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function AppLayout() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/expenses/new" element={<ProtectedRoute><NewExpense /></ProtectedRoute>} />
        <Route path="/expenses/:id" element={<ProtectedRoute><ExpenseDetail /></ProtectedRoute>} />
        <Route path="/expenses/:id/edit" element={<ProtectedRoute><EditExpense /></ProtectedRoute>} />
        <Route path="/balance" element={<ProtectedRoute><Balance /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <BottomNavGuard />
    </>
  )
}

function BottomNavGuard() {
  const { pathname } = useLocation()
  if (pathname === '/login') return null
  return <BottomNav />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
