import { NextRequest } from 'next/server'
import { POST } from '../route'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

// Mock the libraries
jest.mock('@/lib/stripe')
jest.mock('@/lib/supabase')

// Mock types
const mockStripe = stripe as jest.Mocked<typeof stripe>
const mockSupabase = supabase as jest.Mocked<typeof supabase>

// Define types for Stripe objects
interface MockPaymentIntent {
  id: string;
  latest_charge: string;
}

interface MockCharge {
  id: string;
  balance_transaction: string;
}

interface MockBalanceTransaction {
  id: string;
  currency: string;
  fee_details: Array<{
    type: string;
    amount: number;
  }>;
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks()
  })

  it('should handle checkout.session.completed event successfully', async () => {
    // Arrange
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          payment_intent: 'pi_test_123',
          amount_total: 150000,
          currency: 'usd',
          customer_email: 'john@example.com',
          metadata: {
            invoiceId: 'invoice-123',
          },
        },
      },
    }

    const mockHeaders = {
      'stripe-signature': 'test-signature',
    }

    const requestBody = JSON.stringify(mockEvent)
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: mockHeaders,
      body: requestBody,
    })

    // Mock the webhook constructEvent method
    mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent as unknown)

    // Mock the Stripe API calls
    const mockPaymentIntent: MockPaymentIntent = {
      id: 'pi_test_123',
      latest_charge: 'ch_test_123',
    }
    
    const mockCharge: MockCharge = {
      id: 'ch_test_123',
      balance_transaction: 'txn_test_123',
    }
    
    const mockBalanceTransaction: MockBalanceTransaction = {
      id: 'txn_test_123',
      currency: 'cad',
      fee_details: [
        {
          type: 'tax',
          amount: 19500, // $195.00 in cents
        }
      ],
    }
    
    mockStripe.paymentIntents.retrieve = jest.fn().mockResolvedValue(mockPaymentIntent as unknown as Stripe.PaymentIntent)
    mockStripe.charges.retrieve = jest.fn().mockResolvedValue(mockCharge as unknown as Stripe.Charge)
    mockStripe.balanceTransactions.retrieve = jest.fn().mockResolvedValue(mockBalanceTransaction as unknown as Stripe.BalanceTransaction)

    // Mock the Supabase update method
    const mockEq = jest.fn().mockResolvedValue({ error: null })
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from = jest.fn().mockReturnValue({
      update: mockUpdate,
    })

    // Act
    const response = await POST(request)
    const responseData = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(responseData).toEqual({
      success: true,
      message: 'Webhook processed successfully',
    })
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      requestBody,
      'test-signature',
      expect.any(String)
    )
    expect(mockSupabase.from).toHaveBeenCalledWith('invoices')
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'paid',
      tax_amount: 19500,
      tax_details: {
        paymentIntentId: 'pi_test_123',
        chargeId: 'ch_test_123',
        balanceTransactionId: 'txn_test_123',
        taxAmount: 19500,
        currency: 'cad',
      },
      updated_at: expect.any(String),
    })
    expect(mockEq).toHaveBeenCalledWith('id', 'invoice-123')
  })

  it('should return 400 if Stripe signature is missing', async () => {
    // Arrange
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            invoiceId: 'invoice-123',
          },
        },
      },
    }

    const requestBody = JSON.stringify(mockEvent)
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {}, // Missing stripe-signature
      body: requestBody,
    })

    // Act
    const response = await POST(request)
    const responseData = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      success: false,
      message: 'Stripe signature is required',
    })
    expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled()
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('should return 400 if Stripe signature is invalid', async () => {
    // Arrange
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            invoiceId: 'invoice-123',
          },
        },
      },
    }

    const mockHeaders = {
      'stripe-signature': 'invalid-signature',
    }

    const requestBody = JSON.stringify(mockEvent)
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: mockHeaders,
      body: requestBody,
    })

    // Mock the webhook constructEvent method to throw an error
    mockStripe.webhooks.constructEvent = jest.fn().mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    // Act
    const response = await POST(request)
    const responseData = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      success: false,
      message: 'Invalid Stripe signature',
    })
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      requestBody,
      'invalid-signature',
      expect.any(String)
    )
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('should return 400 if event type is not supported', async () => {
    // Arrange
    const mockEvent = {
      type: 'unsupported.event',
      data: {
        object: {
          id: 'test_123',
        },
      },
    }

    const mockHeaders = {
      'stripe-signature': 'test-signature',
    }

    const requestBody = JSON.stringify(mockEvent)
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: mockHeaders,
      body: requestBody,
    })

    // Mock the webhook constructEvent method
    mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent as unknown)

    // Act
    const response = await POST(request)
    const responseData = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      success: false,
      message: 'Unsupported event type',
    })
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      requestBody,
      'test-signature',
      expect.any(String)
    )
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('should return 500 if updating the invoice fails', async () => {
    // Arrange
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            invoiceId: 'invoice-123',
          },
        },
      },
    }

    const mockHeaders = {
      'stripe-signature': 'test-signature',
    }

    const requestBody = JSON.stringify(mockEvent)
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: mockHeaders,
      body: requestBody,
    })

    // Mock the webhook constructEvent method
    mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent as unknown)

    // Mock the Stripe API calls
    const mockPaymentIntent: MockPaymentIntent = {
      id: 'pi_test_123',
      latest_charge: 'ch_test_123',
    }
    
    const mockCharge: MockCharge = {
      id: 'ch_test_123',
      balance_transaction: 'txn_test_123',
    }
    
    const mockBalanceTransaction: MockBalanceTransaction = {
      id: 'txn_test_123',
      currency: 'cad',
      fee_details: [
        {
          type: 'tax',
          amount: 19500, // $195.00 in cents
        }
      ],
    }
    
    mockStripe.paymentIntents.retrieve = jest.fn().mockResolvedValue(mockPaymentIntent as unknown as Stripe.PaymentIntent)
    mockStripe.charges.retrieve = jest.fn().mockResolvedValue(mockCharge as unknown as Stripe.Charge)
    mockStripe.balanceTransactions.retrieve = jest.fn().mockResolvedValue(mockBalanceTransaction as unknown as Stripe.BalanceTransaction)

    // Mock the Supabase update method to return an error
    const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Database error' } })
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from = jest.fn().mockReturnValue({
      update: mockUpdate,
    })

    // Act
    const response = await POST(request)
    const responseData = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(responseData).toEqual({
      success: false,
      message: 'An error occurred while processing the webhook',
    })
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      requestBody,
      'test-signature',
      expect.any(String)
    )
    expect(mockSupabase.from).toHaveBeenCalledWith('invoices')
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'paid',
      tax_amount: 0,
      tax_details: {},
      updated_at: expect.any(String),
    })
    expect(mockEq).toHaveBeenCalledWith('id', 'invoice-123')
  })

  it('should return 500 if invoice ID is missing in metadata', async () => {
    // Arrange
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {}, // Missing invoiceId
        },
      },
    }

    const mockHeaders = {
      'stripe-signature': 'test-signature',
    }

    const requestBody = JSON.stringify(mockEvent)
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: mockHeaders,
      body: requestBody,
    })

    // Mock the webhook constructEvent method
    mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent as unknown)

    // Act
    const response = await POST(request)
    const responseData = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(responseData).toEqual({
      success: false,
      message: 'An error occurred while processing the webhook',
    })
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      requestBody,
      'test-signature',
      expect.any(String)
    )
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })
})