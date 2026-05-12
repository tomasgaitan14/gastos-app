import { type SelectHTMLAttributes } from 'react'
import { CaretDown } from '@phosphor-icons/react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <div className={[
        'relative flex items-center h-11 bg-zinc-50 border rounded-xl transition-colors',
        error ? 'border-rose-400' : 'border-zinc-200 focus-within:border-emerald-500',
        'focus-within:bg-white',
      ].join(' ')}>
        <select
          id={selectId}
          className={[
            'w-full h-full px-3 pr-8 bg-transparent text-zinc-900 text-sm outline-none appearance-none cursor-pointer',
            className,
          ].join(' ')}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <CaretDown size={14} className="absolute right-3 text-zinc-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
