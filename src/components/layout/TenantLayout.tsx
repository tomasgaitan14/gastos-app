import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function TenantLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
