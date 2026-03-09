/** Returns effective interval days for a client; null if no interval. */
export function getIntervalDays(
  interval: string | null | undefined,
  customDays: number | null | undefined
): number | null {
  if (!interval || interval === '') return null
  switch (interval) {
    case 'weekly':
      return 7
    case 'biweekly':
      return 14
    case 'monthly':
      return 30
    case 'custom': {
      const n = customDays != null ? Number(customDays) : null
      return n != null && Number.isInteger(n) && n >= 1 && n <= 365 ? n : null
    }
    default:
      return null
  }
}
