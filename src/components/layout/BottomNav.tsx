import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { House, Receipt, Scales, Gear, Plus, Users, User, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

export function BottomNav() {
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleSelect(path: string) {
    setSheetOpen(false)
    navigate(path)
  }

  return (
    <>
      {/* Action sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-30 bg-black/30"
            />
            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="fixed bottom-20 inset-x-0 z-40 px-4 max-w-lg mx-auto"
            >
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-xl overflow-hidden">
                <button
                  onClick={() => handleSelect('/expenses/new')}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Users size={20} className="text-emerald-600" weight="fill" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-900">Gasto compartido</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Se divide entre los miembros</p>
                  </div>
                </button>
                <div className="border-t border-zinc-100" />
                <button
                  onClick={() => handleSelect('/personal/new')}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <User size={20} className="text-indigo-500" weight="fill" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-900">Gasto personal</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Solo de un miembro, no afecta el balance</p>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full mt-2 bg-white rounded-2xl border border-zinc-200/60 py-4 text-sm font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur-md border-t border-zinc-200/60 safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          <NavItem to="/dashboard" icon={<House size={22} weight="fill" />} label="Inicio" />
          <NavItem to="/expenses" icon={<Receipt size={22} weight="fill" />} label="Gastos" />

          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => setSheetOpen(p => !p)}
            className={['w-14 h-14 -mt-5 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors', sheetOpen ? 'bg-zinc-700 shadow-zinc-700/30' : 'bg-emerald-600 shadow-emerald-600/30'].join(' ')}
          >
            <motion.div animate={{ rotate: sheetOpen ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              {sheetOpen ? <X size={26} weight="bold" /> : <Plus size={26} weight="bold" />}
            </motion.div>
          </motion.button>

          <NavItem to="/balance" icon={<Scales size={22} weight="fill" />} label="Balance" />
          <NavItem to="/settings" icon={<Gear size={22} weight="fill" />} label="Ajustes" />
        </div>
      </nav>
    </>
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
