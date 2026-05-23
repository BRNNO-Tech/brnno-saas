/**
 * Central pricing – single source of truth for plans and add-ons.
 * Update here; Stripe price IDs stay in .env and subscription-addons/definitions.
 */

// ─── Main plans (public/marketing) ─────────────────────────────────────────
export const PLANS = {
  basic: {
    name: 'Basic',
    monthly: 89.99,
    yearly: 899.99,
    monthlyPerMonth: 74.99, // effective when billed yearly
  },
  pro: {
    name: 'Pro',
    monthly: 169.99,
    yearly: 1699.99,
    monthlyPerMonth: 141.66,
  },
  fleet: {
    name: 'Fleet',
    monthly: 299.99,
    yearly: 2999.99,
    monthlyPerMonth: 249.99,
  },
  // Billing/signup (what we actually charge)
  free: { monthly: 0 },
  proBilling: { monthly: 100 }, // Pro plan charge when Stripe connected
} as const

// ─── Subscription add-ons (modules) ─────────────────────────────────────────
export const ADDONS = {
  leads: {
    name: 'Leads',
    monthly: 25,
    yearly: 252,
    description: 'Lead management, inbox, and messaging.',
  },
  leadsAi: {
    name: 'Leads + AI',
    monthly: 35, // Leads $25 + AI $10
    yearly: 348,
    description: 'Leads with AI-powered responses and Twilio number.',
  },
  aiAutoLead: {
    name: 'AI Auto Lead',
    monthly: 10, // add-on on top of Leads
    yearly: 96,
    setupFee: 20,
    description: 'Add AI to Leads: Twilio number, AI responses, A2P.',
  },
  mileageTracker: {
    name: 'Mileage Tracker',
    monthly: 9.99,
    yearly: 99.99,
  },
  aiPhotoAnalysis: {
    name: 'AI Photo Analysis',
    monthly: 19.99,
    yearly: 199.99,
  },
  // Market Suite / other (for landing and add-ons pages)
  smsMessaging: { monthly: 29 },
  whiteLabel: { monthly: 99 },
  customDomain: { monthly: 19 },
  aiPowerPack: { monthlyMin: 99, monthlyMax: 149 },
} as const

// ─── Dashboard subscription page modules (align with ADDONS where same product) ─
export const MODULE_PRICES = {
  leadRecovery: { monthly: 25, annual: 21, founders: 40, aiAddOn: 10, annualAiAddOn: 8 },
  invoices: { monthly: 15, annual: 12, founders: 34 },
  quickQuote: { monthly: 15, annual: 12, founders: 27 },
  photos: { monthly: 15, annual: 12, founders: 23 },
  mileage: { monthly: 30, annual: 25, founders: 20 },
  inventory: { monthly: 10, annual: 8, founders: 13 },
  teamManagement: { monthly: 50, annual: 42, founders: 34 },
  aiAssistant: { monthly: 15, annual: 12, founders: 17 },
  marketing: { monthly: 25, annual: 21, founders: 25 },
} as const

// ─── Helpers ────────────────────────────────────────────────────────────────
export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

export function leadsAiMonthly(): number {
  return ADDONS.leadsAi.monthly
}

export function leadsMonthly(): number {
  return ADDONS.leads.monthly
}

export function aiAddOnMonthly(): number {
  return ADDONS.aiAutoLead.monthly
}

export function setupFee(): number {
  return ADDONS.aiAutoLead.setupFee
}
