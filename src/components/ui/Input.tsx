import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <div className={[
          'flex items-center gap-2 h-11 px-3 bg-zinc-50 border rounded-xl transition-colors',
          error ? 'border-rose-400 focus-within:border-rose-500' : 'border-zinc-200 focus-within:border-emerald-500',
          'focus-within:bg-white',
        ].join(' ')}>
          {prefix && <span className="text-zinc-400 shrink-0">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={[
              'flex-1 bg-transparent text-zinc-900 placeholder-zinc-400 text-sm outline-none min-w-0',
              className,
            ].join(' ')}
            {...props}
          />
          {suffix && <span className="text-zinc-400 shrink-0">{suffix}</span>}
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
