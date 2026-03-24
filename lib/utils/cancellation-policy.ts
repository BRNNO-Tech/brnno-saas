import type { CancellationPolicy } from '@/types/cancellation-policy'

export function evaluateCancellationFee(
  policy: CancellationPolicy,
  scheduledAt: string,
  cancelledAt: string
): number {
  if (!policy?.enabled) return 0

  const scheduledDate = new Date(scheduledAt)
  const cancelledDate = new Date(cancelledAt)
  if (Number.isNaN(scheduledDate.getTime()) || Number.isNaN(cancelledDate.getTime())) {
    return 0
  }

  const hoursUntilStart = (scheduledDate.getTime() - cancelledDate.getTime()) / (1000 * 60 * 60)

  const rules = Array.isArray(policy.rules)
    ? [...policy.rules].sort((a, b) => Number(a.hours_before || 0) - Number(b.hours_before || 0))
    : []

  if (rules.length === 0) return 0

  const matchedRule = rules.find((rule) => hoursUntilStart <= Number(rule.hours_before || 0))
  return Math.max(0, Number(matchedRule?.charge_amount || 0))
}
