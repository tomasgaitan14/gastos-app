import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdateSalary } from '@/hooks/useMembers'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/shared/Avatar'
import type { Currency } from '@/types'

export function Onboarding() {
  const { user, member, refreshMember } = useAuth()
  const navigate = useNavigate()
  const updateSalary = useUpdateSalary()

  const [salary, setSalary] = useState('')
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [error, setError] = useState('')

  const name = member?.display_name ?? user?.email ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const salaryNum = parseFloat(salary)
    if (!salary || isNaN(salaryNum) || salaryNum <= 0) {
      setError('Ingresá un salario válido mayor a 0')
      return
    }
    setError('')

    await updateSalary.mutateAsync({ userId: user!.id, salary: salaryNum, salaryCurrency: currency })
    await refreshMember()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-dvh flex flex-col bg-zinc-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-8"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar name={name} avatarUrl={member?.avatar_url} size="lg" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Hola, {name.split(' ')[0]}
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              Para calcular cuánto aporta cada uno,<br />necesito saber tu salario.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Salario neto mensual"
                type="number"
                min="1"
                step="any"
                placeholder="85000"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                error={error}
              />
            </div>
            <div className="w-24 mt-auto">
              <Select
                options={[
                  { value: 'ARS', label: 'ARS' },
                  { value: 'USD', label: 'USD' },
                ]}
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
              />
            </div>
          </div>

          <p className="text-xs text-zinc-400 text-center px-4">
            Usamos tu salario solo para calcular el porcentaje justo de cada gasto. Podés cambiarlo cuando quieras.
          </p>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={updateSalary.isPending}
          >
            Empezar
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
