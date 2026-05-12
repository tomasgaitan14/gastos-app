import type { Member, ExpenseWithSplits, Settlement, SplitPreview, MemberBalance, DebtSummary } from '@/types'

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

export function calculateBalances(
  expenses: ExpenseWithSplits[],
  settlements: Settlement[],
  exchangeRate: number,
  membersMap: Record<string, Member>,
): { memberBalances: MemberBalance[]; debts: DebtSummary[] } {
  const balances: Record<string, number> = {}

  const toArs = (amount: number, currency: string) =>
    currency === 'USD' ? amount * exchangeRate : amount

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (split.is_excluded) continue
      if (!balances[expense.paid_by]) balances[expense.paid_by] = 0
      if (!balances[split.user_id]) balances[split.user_id] = 0
      if (split.user_id === expense.paid_by) continue
      const amountArs = toArs(split.amount, expense.currency)
      balances[split.user_id] -= amountArs
      balances[expense.paid_by] += amountArs
    }
  }

  for (const settlement of settlements) {
    if (!balances[settlement.from_user_id]) balances[settlement.from_user_id] = 0
    if (!balances[settlement.to_user_id]) balances[settlement.to_user_id] = 0
    const amountArs = toArs(settlement.amount, settlement.currency)
    balances[settlement.from_user_id] += amountArs
    balances[settlement.to_user_id] -= amountArs
  }

  const memberBalances: MemberBalance[] = Object.entries(balances)
    .filter(([id]) => membersMap[id])
    .map(([id, net_ars]) => ({ member_id: id, member: membersMap[id], net_ars }))

  const debts = simplifyDebts(memberBalances)
  return { memberBalances, debts }
}

function simplifyDebts(balances: MemberBalance[]): DebtSummary[] {
  const debts: DebtSummary[] = []
  const credit = balances.filter(b => b.net_ars > 0.01).sort((a, b) => b.net_ars - a.net_ars).map(b => ({ ...b, remaining: b.net_ars }))
  const debt = balances.filter(b => b.net_ars < -0.01).sort((a, b) => a.net_ars - b.net_ars).map(b => ({ ...b, remaining: Math.abs(b.net_ars) }))

  let i = 0, j = 0
  while (i < credit.length && j < debt.length) {
    const transfer = Math.min(credit[i].remaining, debt[j].remaining)
    if (transfer > 0.01) {
      debts.push({
        from_member_id: debt[j].member_id,
        from_member: debt[j].member,
        to_member_id: credit[i].member_id,
        to_member: credit[i].member,
        amount_ars: transfer,
      })
    }
    credit[i].remaining -= transfer
    debt[j].remaining -= transfer
    if (credit[i].remaining < 0.01) i++
    if (debt[j].remaining < 0.01) j++
  }
  return debts
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function arsToUsd(amountArs: number, exchangeRate: number): number {
  if (exchangeRate === 0) return 0
  return amountArs / exchangeRate
}
