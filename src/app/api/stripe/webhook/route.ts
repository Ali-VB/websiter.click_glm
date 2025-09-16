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

    // Get the payment intent to retrieve tax information
    let taxAmount = 0;
    let taxDetails = {};
    
    try {
      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        
        // Extract tax information from the payment intent if available
        if (paymentIntent.latest_charge) {
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
          
          // Calculate tax amount from the charge if tax details are available
          if (charge.balance_transaction) {
            const balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction as string);
            
            // Extract fee details to calculate tax
            if (balanceTransaction.fee_details) {
              const taxFeeDetail = balanceTransaction.fee_details.find(detail => detail.type === 'tax');
              if (taxFeeDetail) {
                taxAmount = Math.abs(taxFeeDetail.amount);
                
                // Create tax details object
                taxDetails = {
                  paymentIntentId: paymentIntent.id,
                  chargeId: charge.id,
                  balanceTransactionId: balanceTransaction.id,
                  taxAmount,
                  currency: balanceTransaction.currency,
                };
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error retrieving tax information from Stripe:', error);
      // Continue with default tax values if retrieval fails
    }

    console.log('Updating invoice with:', { taxAmount, taxDetails });

    // Update the invoice status to 'paid' and include tax information in the database
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        tax_amount: taxAmount,
        tax_details: taxDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    if (error) {
      console.error('Error updating invoice status:', error)
      throw new Error('Failed to update invoice status')
    }

    console.log(`Invoice ${invoiceId} marked as paid with tax amount: ${taxAmount}`)
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
    throw error
  }
}