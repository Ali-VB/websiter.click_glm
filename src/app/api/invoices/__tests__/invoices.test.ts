import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          range: jest.fn(() => ({
            count: jest.fn().mockReturnThis(),
          })),
        })),
      })),
    })),
  },
}));

describe('GET /api/invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and invoices data on successful request', async () => {
    // Mock authentication
    // Use the mocked supabase instance
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Mock invoices data
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'invoice-id-1',
                project_id: 'project-id-1',
                projects: [{ name: 'My Awesome Website' }],
                total_amount: 1500,
                status: 'pending',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
              },
              {
                id: 'invoice-id-2',
                project_id: 'project-id-2',
                projects: [{ name: 'Another Project' }],
                total_amount: 2500,
                status: 'paid',
                created_at: '2023-01-02T00:00:00Z',
                updated_at: '2023-01-02T00:00:00Z',
              },
            ],
            error: null,
            count: 2,
          }),
        }),
      }),
    });

    // Create a mock request with authorization header
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Invoices retrieved successfully');
    expect(data.invoices).toHaveLength(2);
    expect(data.invoices[0]).toMatchObject({
      projectName: 'My Awesome Website',
      amount: 1500,
      status: 'pending',
    });
    expect(data.invoices[1]).toMatchObject({
      projectName: 'Another Project',
      amount: 2500,
      status: 'paid',
    });
  });

  it('should return 200 and empty array when user has no invoices', async () => {
    // Mock authentication
    // Use the mocked supabase instance
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Mock empty invoices data
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      }),
    });

    // Create a mock request with authorization header
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('No invoices found');
    expect(data.invoices).toEqual([]);
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock authentication failure
    // Use the mocked supabase instance
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    // Create a mock request with invalid authorization header
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Authentication required');
  });

  it('should return 401 if no authorization header is provided', async () => {
    // Create a mock request without authorization header
    const { req } = createMocks({
      method: 'GET',
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Authentication required');
  });

  it('should support pagination with limit and offset parameters', async () => {
    // Mock authentication
    // Use the mocked supabase instance
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Mock invoices data with pagination
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'invoice-id-1',
                project_id: 'project-id-1',
                projects: [{ name: 'My Awesome Website' }],
                total_amount: 1500,
                status: 'pending',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
              },
            ],
            error: null,
            count: 3,
          }),
        }),
      }),
    });

    // Create a mock request with pagination parameters
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

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices?limit=1&offset=0'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Invoices retrieved successfully');
    expect(data.invoices).toHaveLength(1);
    expect(data.pagination).toEqual({
      total: 3,
      limit: 1,
      offset: 0,
      hasNextPage: true,
    });
  });

  it('should support filtering by status', async () => {
    // Mock authentication
    // Use the mocked supabase instance
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Mock filtered invoices data
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn((column, value) => {
          if (column === 'projects.client_id') {
            return {
              eq: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'invoice-id-1',
                      project_id: 'project-id-1',
                      projects: [{ name: 'My Awesome Website' }],
                      total_amount: 1500,
                      status: 'pending',
                      created_at: '2023-01-01T00:00:00Z',
                      updated_at: '2023-01-01T00:00:00Z',
                    },
                  ],
                  error: null,
                  count: 1,
                }),
              }),
            };
          }
          return {
            range: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'invoice-id-1',
                  project_id: 'project-id-1',
                  projects: [{ name: 'My Awesome Website' }],
                  total_amount: 1500,
                  status: 'pending',
                  created_at: '2023-01-01T00:00:00Z',
                  updated_at: '2023-01-01T00:00:00Z',
                },
              ],
              error: null,
              count: 1,
            }),
          };
        }),
      }),
    });

    // Create a mock request with status filter
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
      query: {
        status: 'pending',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices?status=pending'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Invoices retrieved successfully');
    expect(data.invoices).toHaveLength(1);
    expect(data.invoices[0].status).toBe('pending');
  });

  it('should return 500 on server error', async () => {
    // Mock authentication
    // Use the mocked supabase instance
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Mock database error
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          range: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      }),
    });

    // Create a mock request with authorization header
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('An error occurred while retrieving invoices');
  });

  it('should return 400 for invalid limit parameter', async () => {
    // Mock authentication
    // Use the mocked supabase instance
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Create a mock request with invalid limit parameter
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
      query: {
        limit: 'invalid',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices?limit=invalid'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Limit must be between 1 and 100');
  });

  it('should return 400 for invalid offset parameter', async () => {
    // Mock authentication
    // Use the mocked supabase instance
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Create a mock request with invalid offset parameter
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
      query: {
        offset: 'invalid',
      },
    });

    const request = new NextRequest(new URL('http://localhost:3000/api/invoices?offset=invalid'), {
      headers: req.headers,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Offset must be a positive number');
  });
});