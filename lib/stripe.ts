import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const PLANS = {
  monthly: {
    name: 'Monthly',
    price: 9.99,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_mock',
    interval: 'month' as const,
    features: [
      'Monthly lottery entries',
      'Score tracking (last 5)',
      'Charity contributions',
      'Winner dashboard',
    ],
  },
  yearly: {
    name: 'Yearly',
    price: 99.99,
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_mock',
    interval: 'year' as const,
    features: [
      'All Monthly features',
      '2 months free',
      'Priority support',
      'Exclusive draws',
    ],
  },
}
