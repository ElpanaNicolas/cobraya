// ─────────────────────────────────────────────────────────────
// Definición de planes y límites de Cobraya
// ─────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    maxClients:   10,
    maxInvoices:  50,
    label:        'Gratis',
    price:        0,
  },
  pro: {
    maxClients:   Infinity,
    maxInvoices:  Infinity,
    label:        'Pro',
    price:        1490,      // UYU/mes
    priceFmt:     '$1.490 UYU/mes',
  },
}

export function getLimits(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

export function isPro(plan) {
  return plan === 'pro'
}

// Retorna null si está bien, o un objeto { resource, current, max } si está al límite
export function checkLimit(plan, resource, currentCount) {
  const limits = getLimits(plan)
  const max = limits[resource]
  if (currentCount >= max) return { resource, current: currentCount, max }
  return null
}

// URL del checkout de suscripción Pro en MercadoPago
// Configurar en .env.local → VITE_MP_SUBSCRIPTION_URL
export const MP_SUBSCRIPTION_URL =
  import.meta.env.VITE_MP_SUBSCRIPTION_URL ?? ''
