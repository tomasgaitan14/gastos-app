import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

interface TopBarProps {
  title: string
  back?: boolean
  right?: ReactNode
}

export function TopBar({ title, back = false, right }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-10 bg-zinc-50/90 backdrop-blur-md border-b border-zinc-200/60 px-4 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-base font-semibold text-zinc-900 truncate">{title}</h1>
      </div>
      {right && <div className="shrink-0 ml-2">{right}</div>}
    </header>
  )
}
