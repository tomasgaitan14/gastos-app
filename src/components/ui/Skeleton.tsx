interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={['bg-zinc-200 rounded-lg animate-pulse', className].join(' ')} />
  )
}

export function ExpenseItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  )
}

export function BalanceSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-20 shrink-0" />
    </div>
  )
}
