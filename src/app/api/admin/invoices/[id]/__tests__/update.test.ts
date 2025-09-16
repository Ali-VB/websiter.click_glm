import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PUT } from '../route';

// --- A single, robust mock setup ---
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }),
}));

const supabase = createClient();
const fromMock = supabase.from as jest.Mock;
const singleMock = (supabase.from('').select('').eq('','').single as jest.Mock);
// ---

function createNextRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options);
}

describe('PUT /api/admin/invoices/:id', () => {

  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    jest.clearAllMocks();
  });

  it('should return 200 and updated invoice data on successful update', async () => {
    const invoiceId = 'invoice-123';
    const requestBody = { status: 'approved', amount: 1800 };
    const request = createNextRequest(`http://localhost:3000/api/admin/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token', 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const existingInvoice = { id: invoiceId, project_id: 'proj-1', client_id: 'client-1' };
    const updatedInvoice = { ...existingInvoice, ...requestBody };
    const projectData = { name: 'My Awesome Website' };
    const clientData = { name: 'John Doe', email: 'john@example.com' };

    // Configure the mock chain for the 4 database calls
    singleMock
      .mockResolvedValueOnce({ data: existingInvoice, error: null }) // 1. Fetch invoice
      .mockResolvedValueOnce({ data: updatedInvoice, error: null })  // 2. Update invoice
      .mockResolvedValueOnce({ data: projectData, error: null })   // 3. Fetch project
      .mockResolvedValueOnce({ data: clientData, error: null });    // 4. Fetch client

    const params = { id: invoiceId };
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.invoice.status).toBe('approved');
  });

  it('should return 404 if invoice does not exist', async () => {
    const invoiceId = 'non-existent-invoice';
    const request = createNextRequest(`http://localhost:3000/api/admin/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });

    // Mock the first database call to return null
    singleMock.mockResolvedValueOnce({ data: null, error: null });

    const params = { id: invoiceId };
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Invoice not found');
  });

  it('should return 500 on server error', async () => {
    const invoiceId = 'invoice-123';
    const request = createNextRequest(`http://localhost:3000/api/admin/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });

    // Mock the first database call to throw an error
    singleMock.mockRejectedValueOnce(new Error('Database connection failed'));

    const params = { id: invoiceId };
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('An error occurred while updating the invoice');
  });

  // Other tests from the original file can be added here in the same pattern
  it('should return 401 if user is not authenticated', async () => {
    const invoiceId = 'invoice-123';
    const request = createNextRequest(`http://localhost:3000/api/admin/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }, // No Auth header
      body: JSON.stringify({ status: 'approved' }),
    });

    const params = { id: invoiceId };
    const response = await PUT(request, { params });
    expect(response.status).toBe(401);
  });

  it('should return 403 if user is not an admin', async () => {
    const invoiceId = 'invoice-123';
    const request = createNextRequest(`http://localhost:3000/api/admin/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer user-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });

    const params = { id: invoiceId };
    const response = await PUT(request, { params });
    expect(response.status).toBe(403);
  });
});
