import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
  secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300',
  ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-5 text-base rounded-xl gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      whileTap={{ scale: 0.98, y: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={[
        'inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].join(' ')}
      disabled={isDisabled}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
