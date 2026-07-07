export function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 text-center">
      <h1 className="text-2xl font-bold text-zinc-900">Gastos App</h1>
      <p className="text-sm text-zinc-400">Accedé con tu link personal</p>
      <code className="text-xs text-zinc-300 bg-zinc-100 px-3 py-1.5 rounded-lg">
        /t/tu-tenant-id
      </code>
    </div>
  )
}
