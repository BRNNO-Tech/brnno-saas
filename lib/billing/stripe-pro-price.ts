/**
 * Resolve Stripe Price ID for new Pro subscriptions (with/without Connect, monthly/annual).
 * Grandfathered V1 prices are not used here — only webhook / legacy paths reference those.
 */
export function resolveNewProStripePriceId(opts: {
  useStripeConnect: boolean
  interval: 'monthly' | 'annual'
}): string | undefined {
  const annual = opts.interval === 'annual'
  if (opts.useStripeConnect) {
    return annual
      ? process.env.STRIPE_PRO_STRIPE_ANNUAL_PRICE_ID
      : process.env.STRIPE_PRO_STRIPE_PRICE_ID
  }
  return annual
    ? process.env.STRIPE_PRO_NO_STRIPE_ANNUAL_PRICE_ID
    : process.env.STRIPE_PRO_NO_STRIPE_PRICE_ID
}
