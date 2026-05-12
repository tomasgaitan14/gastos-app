import { NavLink, useNavigate } from 'react-router-dom'
import { House, Receipt, Scales, Gear, Plus } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur-md border-t border-zinc-200/60 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        <NavItem to="/dashboard" icon={<House size={22} weight="fill" />} label="Inicio" />
        <NavItem to="/expenses" icon={<Receipt size={22} weight="fill" />} label="Gastos" />

        {/* FAB central */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => navigate('/expenses/new')}
          className="w-14 h-14 -mt-5 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/30"
        >
          <Plus size={26} weight="bold" />
        </motion.button>

        <NavItem to="/balance" icon={<Scales size={22} weight="fill" />} label="Balance" />
        <NavItem to="/settings" icon={<Gear size={22} weight="fill" />} label="Ajustes" />
      </div>
    </nav>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => [
        'flex flex-col items-center gap-0.5 w-14 py-1 rounded-xl transition-colors',
        isActive ? 'text-emerald-600' : 'text-zinc-400',
      ].join(' ')}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}
