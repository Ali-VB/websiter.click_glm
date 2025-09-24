import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { invoiceId, amount, reason } = body

    // Validate required fields
    if (!invoiceId || !amount || !reason) {
      return NextResponse.json(
        { success: false, message: 'Invoice ID, amount, and reason are required' },
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
          client_id,
          status,
          created_at
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

    // Check if the invoice is paid (only paid invoices can be refunded)
    if (invoice.status !== 'paid') {
      return NextResponse.json(
        { success: false, message: 'Only paid invoices can be refunded' },
        { status: 400 }
      )
    }

    // Check if there's already a pending refund for this invoice
    const { data: existingRefund } = await supabase
      .from('refunds')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('status', 'pending')
      .single()

    if (existingRefund) {
      return NextResponse.json(
        { success: false, message: 'A refund request is already pending for this invoice' },
        { status: 400 }
      )
    }

    // Calculate refund eligibility based on project status
    const projectStatus = invoice.projects.status
    let refundEligibility = 'full'
    let maxRefundAmount = invoice.total_amount

    // Business rules for refund eligibility:
    // - Full refund if project is still pending
    // - Partial refund if project is in progress
    // - No refund if project is completed
    if (projectStatus === 'in_progress') {
      refundEligibility = 'partial'
      maxRefundAmount = Math.floor(invoice.total_amount * 0.5) // 50% max refund
    } else if (projectStatus === 'completed') {
      refundEligibility = 'none'
      maxRefundAmount = 0
    }

    // Check if requested amount is eligible
    if (amount > maxRefundAmount) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Refund amount exceeds eligible amount. Maximum refund: ${maxRefundAmount / 100} CAD`,
          maxRefundAmount,
          refundEligibility
        },
        { status: 400 }
      )
    }

    // Convert amount to cents if it's in dollars
    const refundAmountInCents = typeof amount === 'number' && amount < 1000 ? amount * 100 : amount

    // Create refund record in database
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        invoice_id: invoiceId,
        project_id: invoice.project_id,
        amount: refundAmountInCents,
        reason: reason,
        status: 'pending',
        processed_by: user.id
      })
      .select()
      .single()

    if (refundError || !refund) {
      console.error('Error creating refund record:', refundError)
      return NextResponse.json(
        { success: false, message: 'Failed to create refund request' },
        { status: 500 }
      )
    }

    // Update invoice refund status
    await supabase
      .from('invoices')
      .update({ 
        refund_status: 'pending',
        refund_eligibility: refundEligibility
      })
      .eq('id', invoiceId)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Refund request created successfully',
      refund: {
        id: refund.id,
        amount: refundAmountInCents,
        reason: refund.reason,
        status: refund.status,
        refundEligibility,
        maxRefundAmount
      }
    })

  } catch (error) {
    console.error('Error creating refund:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating refund request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'processing', 'completed', 'cancelled'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabase
      .from('refunds')
      .select(`
        *,
        invoices (
          total_amount,
          currency,
          created_at
        ),
        projects (
          name,
          status
        )
      `, { count: 'exact' })
      .eq('invoices.projects.client_id', user.id)

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute the query
    const { data, error, count } = await query

    if (error) {
      console.error('Refunds fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'An error occurred while retrieving refunds' },
        { status: 500 }
      )
    }

    // Define the refund data type
    interface RefundData {
      id: string;
      invoice_id: string;
      project_id: string;
      amount: number;
      reason: string;
      status: string;
      processed_at?: string;
      created_at: string;
      updated_at: string;
      invoices: {
        total_amount: number;
        currency: string;
        created_at: string;
      };
      projects: {
        name: string;
        status: string;
      };
    }

    // Transform the data to match the expected format
    const refunds = data?.map((refund: RefundData) => ({
      id: refund.id,
      invoiceId: refund.invoice_id,
      projectId: refund.project_id,
      amount: refund.amount,
      reason: refund.reason,
      status: refund.status,
      processedAt: refund.processed_at,
      createdAt: refund.created_at,
      updatedAt: refund.updated_at,
      invoice: {
        totalAmount: refund.invoices.total_amount,
        currency: refund.invoices.currency,
        createdAt: refund.invoices.created_at
      },
      project: {
        name: refund.projects.name,
        status: refund.projects.status
      }
    })) || []

    // Prepare the response
    const response: {
      success: boolean;
      message: string;
      refunds: Array<{
        id: string;
        invoiceId: string;
        projectId: string;
        amount: number;
        reason: string;
        status: string;
        processedAt?: string;
        createdAt: string;
        updatedAt: string;
        invoice: {
          totalAmount: number;
          currency: string;
          createdAt: string;
        };
        project: {
          name: string;
          status: string;
        };
      }>;
      pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasNextPage: boolean;
      };
    } = {
      success: true,
      message: refunds.length > 0 ? 'Refunds retrieved successfully' : 'No refunds found',
      refunds,
    }

    // Add pagination metadata if pagination parameters were provided
    if (searchParams.has('limit') || searchParams.has('offset')) {
      response.pagination = {
        total: count || 0,
        limit,
        offset,
        hasNextPage: (count || 0) > offset + limit,
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Refunds API error:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving refunds' },
      { status: 500 }
    )
  }
}
