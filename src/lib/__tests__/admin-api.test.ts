import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServerClient } from '@/lib/supabase';

// Mock the environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock NextRequest and NextResponse
const mockRequest = (method: string = 'GET', body?: any) => {
  const request = {
    method,
    headers: new Map([
      ['authorization', 'Bearer test-token']
    ]),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    nextUrl: new URL('http://localhost:3000/api/admin/stats')
  } as any;
  
  return request;
};

const mockResponse = () => {
  const response = {
    status: 200,
    json: (data: any) => Promise.resolve(data),
    text: (data: string) => Promise.resolve(data)
  } as any;
  
  return response;
};

describe('Admin API Routes', () => {
  let supabase: any;
  
  beforeEach(() => {
    supabase = createServerClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/stats', () => {
    it('should return dashboard statistics', async () => {
      // Mock the Supabase client methods
      const mockCount = jest.fn().mockResolvedValue({ count: 10, data: null, error: null });
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
      
      supabase.from = jest.fn().mockReturnValue({
        select: mockSelect,
        count: mockCount,
        order: mockOrder,
        limit: mockLimit
      });

      // Import and test the route handler
      const { GET } = await import('@/app/api/admin/stats/route');
      const request = mockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.stats.totalClients).toBeGreaterThanOrEqual(0);
      expect(data.stats.activeProjects).toBeGreaterThanOrEqual(0);
      expect(data.stats.pendingInvoices).toBeGreaterThanOrEqual(0);
      expect(data.stats.openSupportTickets).toBeGreaterThanOrEqual(0);
    });

    it('should handle authentication errors', async () => {
      const { GET } = await import('@/app/api/admin/stats/route');
      const request = mockRequest('GET');
      request.headers.delete('authorization');
      
      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/clients', () => {
    it('should return clients and contact submissions', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            projects: [],
            notes: []
          }
        ],
        error: null
      });

      supabase.from = jest.fn().mockReturnValue({
        select: mockSelect,
        order: jest.fn().mockReturnThis()
      });

      const { GET } = await import('@/app/api/admin/clients/route');
      const request = mockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.clients).toBeDefined();
      expect(data.contactSubmissions).toBeDefined();
    });
  });

  describe('GET /api/admin/projects', () => {
    it('should return projects', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'Test Project',
            description: 'Test Description',
            status: 'in_progress',
            type: 'business',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            requirements: {
              basePackage: 'Business Website',
              addons: [],
              designStyle: 'Modern',
              colorScheme: 'Blue',
              layoutPreference: 'Multi-section',
              domain: 'test.com',
              hosting: 'Basic',
              maintenance: 'Basic'
            },
            clients: {
              name: 'John Doe',
              email: 'john@example.com'
            }
          }
        ],
        error: null
      });

      supabase.from = jest.fn().mockReturnValue({
        select: mockSelect,
        order: jest.fn().mockReturnThis()
      });

      const { GET } = await import('@/app/api/admin/projects/route');
      const request = mockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.projects).toBeDefined();
      expect(data.projects.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/contacts', () => {
    it('should return contact submissions and team members', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'Jane Doe',
            email: 'jane@example.com',
            message: 'Test message',
            status: 'new',
            source: 'contact_form',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        ],
        error: null
      });

      supabase.from = jest.fn().mockReturnValue({
        select: mockSelect,
        order: jest.fn().mockReturnThis()
      });

      const { GET } = await import('@/app/api/admin/contacts/route');
      const request = mockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.submissions).toBeDefined();
      expect(data.teamMembers).toBeDefined();
    });
  });
});
