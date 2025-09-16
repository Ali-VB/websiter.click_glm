import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    // Get the signature from the headers
    const signature = request.headers.get('stripe-signature') as string

    // If there's no signature, return a 400 error
    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Stripe signature is required' },
        { status: 400 }
      )
    }

    // Get the raw body for signature verification
    const body = await request.text()

    // Verify the signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { success: false, message: 'Invalid Stripe signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
        return NextResponse.json(
          { success: false, message: 'Unsupported event type' },
          { status: 400 }
        )
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json(
      { success: true, message: 'Webhook processed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing the webhook' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    // Extract the invoice ID from the session metadata
    const invoiceId = session.metadata?.invoiceId

    if (!invoiceId) {
      console.error('Invoice ID not found in session metadata')
      throw new Error('Invoice ID not found in session metadata')
    }

    // Update the invoice status to 'paid' in the database
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)

    if (error) {
      console.error('Error updating invoice status:', error)
      throw new Error('Failed to update invoice status')
    }

    console.log(`Invoice ${invoiceId} marked as paid`)
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
    throw error
  }
}