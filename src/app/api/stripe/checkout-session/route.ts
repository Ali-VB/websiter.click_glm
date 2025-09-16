import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { fromCents } from '@/lib/tax'

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { invoiceId } = body

    // Validate that invoiceId is provided
    if (!invoiceId) {
      return NextResponse.json(
        { success: false, message: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the invoice from the database
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        projects (
          client_id
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if the invoice belongs to the authenticated user
    if (invoice.projects.client_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to access this invoice' },
        { status: 403 }
      )
    }

    // Check if the invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'This invoice has already been paid' },
        { status: 400 }
      )
    }

    // Check if the invoice is approved
    if (invoice.status !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'This invoice has not been approved yet' },
        { status: 400 }
      )
    }

    // Get the client's email
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('email')
      .eq('id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, message: 'Client not found' },
        { status: 404 }
      )
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: invoice.line_items,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/dashboard?payment_success=true`,
      cancel_url: `${request.headers.get('origin')}/dashboard?payment_canceled=true`,
      customer_email: client.email,
      metadata: {
        invoiceId: invoice.id,
      },
      // Add tax information to the session
      tax_id_collection: {
        enabled: true,
      },
    })

    // Return the session data
    return NextResponse.json({
      success: true,
      message: 'Checkout session created successfully',
      session: {
        id: session.id,
        url: session.url,
        subtotal: fromCents(invoice.total_amount - (invoice.tax_amount || 0)),
        taxAmount: fromCents(invoice.tax_amount || 0),
        amount_total: session.amount_total,
        currency: session.currency,
        payment_intent: session.payment_intent,
        customer_email: session.customer_email,
        metadata: session.metadata,
      },
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the checkout session' },
      { status: 500 }
    )
  }
}