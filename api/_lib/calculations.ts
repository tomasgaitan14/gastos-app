import type { Member, SplitPreview } from '../../src/types/index.js'

export function calculateSplits(
  amount: number,
  members: Member[],
  excludedMemberIds: string[],
  exchangeRate: number,
): SplitPreview[] {
  const included = members.filter(m => !excludedMemberIds.includes(m.id) && m.salary !== null)
  const excluded = members.filter(m => excludedMemberIds.includes(m.id))

  if (included.length === 0) return []

  const withSalaryArs = included.map(m => ({
    ...m,
    salaryArs: m.salary_currency === 'USD' ? (m.salary! * exchangeRate) : m.salary!,
  }))

  const totalSalary = withSalaryArs.reduce((sum, m) => sum + m.salaryArs, 0)

  if (totalSalary === 0) {
    const equalPct = 100 / included.length
    const equalAmount = amount / included.length
    return [
      ...included.map(m => ({ member_id: m.id, member: m, percentage: equalPct, amount: equalAmount, is_excluded: false })),
      ...excluded.map(m => ({ member_id: m.id, member: m, percentage: 0, amount: 0, is_excluded: true })),
    ]
  }

  return [
    ...withSalaryArs.map(m => {
      const percentage = (m.salaryArs / totalSalary) * 100
      return { member_id: m.id, member: m, percentage, amount: (percentage / 100) * amount, is_excluded: false }
    }),
    ...excluded.map(m => ({ member_id: m.id, member: m, percentage: 0, amount: 0, is_excluded: true })),
  ]
}
