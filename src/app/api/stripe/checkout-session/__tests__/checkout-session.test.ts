import { NextRequest } from 'next/server';
import { POST } from '../route';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

// Mock the libraries
jest.mock('@/lib/stripe');
jest.mock('@/lib/supabase');

const mockedStripe = stripe as jest.Mocked<typeof stripe>;
const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

function createNextRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/stripe/checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer valid-user-token',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/stripe/checkout-session', () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return 200 and checkout session data on successful creation', async () => {
    const invoiceId = 'inv-123';
    const request = createNextRequest({ invoiceId });

    // 1. Mock Auth
    (mockedSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-abc' } },
      error: null,
    });

    // 2. Mock Invoice Fetch
    const mockInvoice = {
      id: invoiceId,
      status: 'approved',
      line_items: [{ price: 'price_123', quantity: 1 }],
      projects: { client_id: 'user-abc' },
    };
    const fromInvoiceMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockInvoice, error: null }),
    };

    // 3. Mock Client Fetch
    const mockClient = { email: 'test@example.com' };
    const fromClientMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockClient, error: null }),
    };

    (mockedSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'invoices') return fromInvoiceMock;
      if (tableName === 'clients') return fromClientMock;
    });

    // 4. Mock Stripe Session Creation
    const mockStripeSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' };
    mockedStripe.checkout.sessions.create.mockResolvedValue(mockStripeSession as any);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session.id).toBe(mockStripeSession.id);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
        customer_email: mockClient.email,
        metadata: { invoiceId },
    }));
  });

  it('should return 404 if invoice not found', async () => {
    const invoiceId = 'inv-not-found';
    const request = createNextRequest({ invoiceId });

    (mockedSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-abc' } },
      error: null,
    });

    // Mock Invoice Fetch to return null
    const fromInvoiceMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    (mockedSupabase.from as jest.Mock).mockReturnValue(fromInvoiceMock);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Invoice not found');
  });

  it('should return 400 if invoice is already paid', async () => {
    const invoiceId = 'inv-paid';
    const request = createNextRequest({ invoiceId });

    (mockedSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-abc' } },
        error: null,
    });

    const mockInvoice = { id: invoiceId, status: 'paid', projects: { client_id: 'user-abc' } };
    const fromInvoiceMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInvoice, error: null }),
    };
    (mockedSupabase.from as jest.Mock).mockReturnValue(fromInvoiceMock);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('This invoice has already been paid');
  });

  it('should return 500 on stripe error', async () => {
    const invoiceId = 'inv-123';
    const request = createNextRequest({ invoiceId });

    (mockedSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-abc' } },
        error: null,
    });

    const mockInvoice = { id: invoiceId, status: 'approved', projects: { client_id: 'user-abc' } };
    const fromInvoiceMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInvoice, error: null }),
    };
    const fromClientMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null }),
    };
    (mockedSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
        if (tableName === 'invoices') return fromInvoiceMock;
        if (tableName === 'clients') return fromClientMock;
    });

    // Mock Stripe to throw an error
    mockedStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe API error'));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('An error occurred while creating the checkout session');
  });
});
