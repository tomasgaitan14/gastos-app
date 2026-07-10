export function getCurrentInstallment(startDate: string): number {
  const [sy, sm] = startDate.split('-').map(Number)
  const now = new Date()
  const diff = (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm) + 1
  return Math.max(1, diff)
}
