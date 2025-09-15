import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Import after mocking
import { supabase } from '@/lib/supabase';
import { GET } from '../route';

describe('GET /api/admin/invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and all invoices data on successful request', async () => {
    // Mock admin user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
        },
      },
      error: null,
    });

    // Mock invoices query
    const mockSelect = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'invoice-1',
          project_id: 'project-1',
          projects: [{ name: 'My Awesome Website', client_id: 'client-1' }],
          clients: [{ name: 'John Doe', email: 'john@example.com' }],
          status: 'pending',
          total_amount: 1500,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'invoice-2',
          project_id: 'project-2',
          projects: [{ name: 'Another Project', client_id: 'client-2' }],
          clients: [{ name: 'Jane Smith', email: 'jane@example.com' }],
          status: 'paid',
          total_amount: 2500,
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
        },
      ],
      error: null,
      count: 2,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      range: mockRange,
    });

    // Create request
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/admin/invoices'), {
      headers: req.headers as HeadersInit,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Invoices retrieved successfully');
    expect(data.invoices).toHaveLength(2);
    expect(data.invoices[0]).toMatchObject({
      projectName: 'My Awesome Website',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      amount: 1500,
      status: 'pending',
    });
  });

  it('should return 200 and empty array when no invoices exist', async () => {
    // Mock admin user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
        },
      },
      error: null,
    });

    // Mock empty invoices query
    const mockSelect = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      range: mockRange,
    });

    // Create request
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/admin/invoices'), {
      headers: req.headers as HeadersInit,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('No invoices found');
    expect(data.invoices).toEqual([]);
  });

  it('should return 401 if user is not authenticated', async () => {
    // Create request without authorization header
    const { req } = createMocks({
      method: 'GET',
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/admin/invoices'), {
      headers: req.headers as HeadersInit,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Authentication required');
  });

  it('should return 403 if user is not an admin', async () => {
    // Mock non-admin user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-id',
          email: 'user@example.com',
        },
      },
      error: null,
    });

    // Create request
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/admin/invoices'), {
      headers: req.headers as HeadersInit,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Admin access required');
  });

  it('should support pagination with limit and offset parameters', async () => {
    // Mock admin user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
        },
      },
      error: null,
    });

    // Mock invoices query with pagination
    const mockSelect = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'invoice-1',
          project_id: 'project-1',
          projects: [{ name: 'My Awesome Website', client_id: 'client-1' }],
          clients: [{ name: 'John Doe', email: 'john@example.com' }],
          status: 'pending',
          total_amount: 1500,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
      error: null,
      count: 5,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      range: mockRange,
    });

    // Create request with pagination parameters
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
      query: {
        limit: '1',
        offset: '0',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/admin/invoices?limit=1&offset=0'), {
      headers: req.headers as HeadersInit,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.invoices).toHaveLength(1);
    expect(data.pagination).toEqual({
      total: 5,
      limit: 1,
      offset: 0,
      hasNextPage: true,
    });
  });

  it('should support filtering by status', async () => {
    // Mock admin user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
        },
      },
      error: null,
    });

    // Mock invoices query with status filter
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'invoice-1',
          project_id: 'project-1',
          projects: [{ name: 'My Awesome Website', client_id: 'client-1' }],
          clients: [{ name: 'John Doe', email: 'john@example.com' }],
          status: 'pending',
          total_amount: 1500,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
      error: null,
      count: 1,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      range: mockRange,
    });

    // Create request with status filter
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
      query: {
        status: 'pending',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/admin/invoices?status=pending'), {
      headers: req.headers as HeadersInit,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.invoices).toHaveLength(1);
    expect(data.invoices[0].status).toBe('pending');
    expect(mockEq).toHaveBeenCalledWith('status', 'pending');
  });

  it('should support filtering by client', async () => {
    // Mock admin user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
        },
      },
      error: null,
    });

    // Mock invoices query with client filter
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'invoice-1',
          project_id: 'project-1',
          projects: [{ name: 'My Awesome Website', client_id: 'client-1' }],
          clients: [{ name: 'John Doe', email: 'john@example.com' }],
          status: 'pending',
          total_amount: 1500,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
      error: null,
      count: 1,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      range: mockRange,
    });

    // Create request with client filter
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
      query: {
        clientId: 'client-1',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/admin/invoices?clientId=client-1'), {
      headers: req.headers as HeadersInit,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.invoices).toHaveLength(1);
    expect(mockEq).toHaveBeenCalledWith('projects.client_id', 'client-1');
  });

  it('should return 500 on server error', async () => {
    // Mock admin user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
        },
      },
      error: null,
    });

    // Mock server error
    const mockSelect = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
      count: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      range: mockRange,
    });

    // Create request
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/admin/invoices'), {
      headers: req.headers as HeadersInit,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('An error occurred while retrieving invoices');
  });
});