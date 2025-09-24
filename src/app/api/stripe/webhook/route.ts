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
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object)
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

async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    console.log('Processing charge refunded event:', charge.id)

    // Get the payment intent ID from the charge
    const paymentIntentId = charge.payment_intent as string

    if (!paymentIntentId) {
      console.error('Payment intent ID not found in charge')
      return
    }

    // Find the invoice associated with this payment intent
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        projects (
          id,
          client_id,
          status
        )
      `)
      .eq('payment_intent_id', paymentIntentId)
      .single()

    if (invoiceError || !invoice) {
      console.error('Error finding invoice for payment intent:', paymentIntentId, invoiceError)
      return
    }

    // Calculate refund amount
    const refundAmount = Math.abs(charge.amount_refunded || charge.amount)

    // Update invoice refund status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        refund_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    if (updateError) {
      console.error('Error updating invoice refund status:', updateError)
      return
    }

    // Find and update the associated refund record
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .select('*')
      .eq('invoice_id', invoice.id)
      .eq('status', 'pending')
      .single()

    if (!refundError && refund) {
      // Update refund record
      await supabase
        .from('refunds')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          stripe_refund_id: charge.refunds?.data[0]?.id || null,
          notes: `Refund processed via Stripe. Refund amount: ${refundAmount / 100} ${charge.currency.toUpperCase()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', refund.id)
    } else {
      // Create a new refund record if one doesn't exist
      await supabase
        .from('refunds')
        .insert({
          invoice_id: invoice.id,
          project_id: invoice.projects.id,
          amount: refundAmount,
          reason: 'Automatic refund via Stripe',
          status: 'completed',
          stripe_refund_id: charge.refunds?.data[0]?.id || null,
          processed_at: new Date().toISOString(),
          notes: `Automatic refund processed via Stripe. Refund amount: ${refundAmount / 100} ${charge.currency.toUpperCase()}`,
        })
    }

    // Update project payment status if fully refunded
    if (charge.amount_refunded === charge.amount) {
      await supabase
        .from('projects')
        .update({
          payment_status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.projects.id)

      // Update payment workflow
      await supabase
        .from('payment_workflow')
        .update({
          payment_status: 'refunded',
          workflow_step: 'cancelled',
          notes: 'Payment fully refunded, project cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', invoice.projects.id)
    }

    console.log(`Charge ${charge.id} refunded successfully. Invoice ${invoice.id} updated.`)
  } catch (error) {
    console.error('Error in handleChargeRefunded:', error)
    // Don't throw error for refund processing to avoid webhook retries
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
    let paymentIntentId = null;
    
    try {
      if (session.payment_intent) {
        paymentIntentId = session.payment_intent as string;
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
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

    // First, get the invoice details to understand the project context
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        projects (
          id,
          status,
          client_id
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      console.error('Error fetching invoice details:', invoiceError)
      throw new Error('Failed to fetch invoice details')
    }

    // Update the invoice status to 'paid' and include tax information
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        tax_amount: taxAmount,
        tax_details: taxDetails,
        payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice status:', updateError)
      throw new Error('Failed to update invoice status')
    }

    // Update project payment status and workflow
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.projects.id)

    if (projectError) {
      console.error('Error updating project payment status:', projectError)
      throw new Error('Failed to update project payment status')
    }

    // Create or update payment workflow record
    const { error: workflowError } = await supabase
      .from('payment_workflow')
      .upsert({
        project_id: invoice.projects.id,
        invoice_id: invoiceId,
        payment_status: 'confirmed',
        workflow_step: 'payment_confirmed',
        payment_confirmed_at: new Date().toISOString(),
        notes: 'Payment confirmed via Stripe checkout',
        updated_at: new Date().toISOString(),
      })

    if (workflowError) {
      console.error('Error updating payment workflow:', workflowError)
      throw new Error('Failed to update payment workflow')
    }

    // If project was pending and invoice triggers project start, update project status
    if (invoice.projects.status === 'pending' && invoice.triggers_project_start) {
      const { error: statusError } = await supabase
        .from('projects')
        .update({
          status: 'in_progress',
          development_start_date: new Date().toISOString(),
        })
        .eq('id', invoice.projects.id)

      if (statusError) {
        console.error('Error updating project status to in_progress:', statusError)
        throw new Error('Failed to update project status')
      }

      // Update payment workflow to reflect development start
      await supabase
        .from('payment_workflow')
        .update({
          workflow_step: 'development_started',
          development_started_at: new Date().toISOString(),
          notes: 'Project development started after payment confirmation',
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', invoice.projects.id)
    }

    console.log(`Invoice ${invoiceId} marked as paid with tax amount: ${taxAmount}`)
    console.log(`Project ${invoice.projects.id} payment confirmed and workflow updated`)
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
    throw error
  }
}
