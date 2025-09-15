import Stripe from 'stripe'

// These environment variables will be set up in the next step
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

// Initialize Stripe with the secret key (server-side only)
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
})

// Export the publishable key for client-side use
export const stripePublishableKey = publishableKey