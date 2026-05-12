import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Mode = 'login' | 'register'

export function Login() {
  const { user, signIn, signUp, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!email.trim() || !email.includes('@')) errs.email = 'Email inválido'
    if (password.length < 6) errs.password = 'Mínimo 6 caracteres'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setErrors({})
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      const translated =
        msg.includes('Invalid login credentials') ? 'Email o contraseña incorrectos' :
        msg.includes('User already registered') ? 'Este email ya tiene una cuenta' :
        msg.includes('Password should be') ? 'La contraseña debe tener al menos 6 caracteres' :
        msg
      setErrors({ general: translated })
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    setEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-zinc-50">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(5,150,105,0.12) 0%, transparent 60%)' }}
      />
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <span className="text-white text-xl font-bold tracking-tight">$</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">gastos app</h1>
        </motion.div>

        <div className="w-full max-w-xs flex bg-zinc-100 rounded-xl p-1">
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={['flex-1 py-2 rounded-lg text-sm font-medium transition-colors', mode === m ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'].join(' ')}
            >
              {m === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className="w-full max-w-xs flex flex-col gap-3"
          >
            <Input label="Email" type="email" placeholder="hola@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
            <Input label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} error={errors.password} hint={mode === 'register' ? 'Mínimo 6 caracteres' : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {errors.general && <p className="text-sm text-rose-600 text-center">{errors.general}</p>}
            <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
              {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </Button>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  )
}
