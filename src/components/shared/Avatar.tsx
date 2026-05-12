interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function getColorClass(name: string): string {
  const colors = [
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
    'bg-cyan-100 text-cyan-700',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function Avatar({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={['rounded-full object-cover shrink-0', sizeClasses[size], className].join(' ')}
      />
    )
  }

  return (
    <div className={[
      'rounded-full flex items-center justify-center font-semibold shrink-0',
      sizeClasses[size],
      getColorClass(name),
      className,
    ].join(' ')}>
      {getInitials(name)}
    </div>
  )
}
