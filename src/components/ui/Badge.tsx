import { type ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-zinc-100 text-zinc-600',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-rose-50 text-rose-700',
  warning: 'bg-amber-50 text-amber-700',
  neutral: 'bg-blue-50 text-blue-700',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      variantClasses[variant],
      className,
    ].join(' ')}>
      {children}
    </span>
  )
}
