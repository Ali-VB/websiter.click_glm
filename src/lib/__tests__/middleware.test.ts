import { requireAuth, requireRole, createAuthMiddleware, adminAuth, userAuth } from '../middleware';
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}));

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

describe('Middleware', () => {
  let mockRequest: NextRequest;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock request
    mockRequest = {
      nextUrl: {
        pathname: '/admin/dashboard',
        origin: 'http://localhost:3000',
      },
      headers: new Headers(),
      url: 'http://localhost:3000/admin/dashboard',
    } as unknown as NextRequest;

    // Create a mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockCreateServerClient.mockReturnValue(mockSupabase);
  });

  describe('requireAuth', () => {
    it('should return unauthorized error when user is not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const result = await requireAuth(mockRequest);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return unauthorized error when there is an auth error', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      // Act
      const result = await requireAuth(mockRequest);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return user not found error when client record does not exist', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Client not found' },
        }),
      });

      // Act
      const result = await requireAuth(mockRequest);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'User not found',
      });
    });

    it('should return success with user data when authenticated', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
      };

      const mockClient = {
        role: 'client',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockClient,
          error: null,
        }),
      });

      // Act
      const result = await requireAuth(mockRequest);

      // Assert
      expect(result).toEqual({
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockClient.role,
        },
      });
    });
  });

  describe('requireRole', () => {
    it('should return insufficient permissions error when user does not have required role', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
      };

      const mockClient = {
        role: 'client',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockClient,
          error: null,
        }),
      });

      // Act
      const result = await requireRole(mockRequest, 'admin');

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should return success when user has required role', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'admin@example.com',
      };

      const mockClient = {
        role: 'admin',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockClient,
          error: null,
        }),
      });

      // Act
      const result = await requireRole(mockRequest, 'admin');

      // Assert
      expect(result).toEqual({
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockClient.role,
        },
      });
    });
  });

  describe('createAuthMiddleware', () => {
    it('should redirect to login for UI routes when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const middleware = createAuthMiddleware();

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.headers.get('location')).toBe('/login?redirectTo=/admin/dashboard');
    });

    it('should return unauthorized error for API routes when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const apiRequest = {
        ...mockRequest,
        nextUrl: {
          ...mockRequest.nextUrl,
          pathname: '/api/admin/invoices',
        },
      } as NextRequest;

      const middleware = createAuthMiddleware();

      // Act
      const response = await middleware(apiRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(401);
    });

    it('should add user info to headers for API routes when authenticated', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
      };

      const mockClient = {
        role: 'client',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockClient,
          error: null,
        }),
      });

      const apiRequest = {
        ...mockRequest,
        nextUrl: {
          ...mockRequest.nextUrl,
          pathname: '/api/admin/invoices',
        },
        headers: new Headers(),
      } as NextRequest;

      const middleware = createAuthMiddleware();

      // Act
      const response = await middleware(apiRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      if (response) {
        const requestHeaders = response.headers.get('x-user-id');
        expect(requestHeaders).toBe(mockUser.id);
      }
    });
  });
});