import { requireAuth, requireRole, createAuthMiddleware, adminAuth, userAuth, hasOngoingProject, onboardingAccessControl } from '../middleware';
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => ({ json: body, status: init?.status || 200 })),
    redirect: jest.fn().mockImplementation((url) => ({ redirect: url, headers: new Headers({ location: url }) })),
    next: jest.fn().mockImplementation(() => ({ next: true })),
  },
}));

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;
const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

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
      expect(mockNextResponse.redirect).toHaveBeenCalledWith(new URL('/login?redirectTo=%2Fadmin%2Fdashboard', 'http://localhost:3000'));
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
      expect(mockNextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
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
      expect(mockNextResponse.next).toHaveBeenCalled();
    });
  });

  describe('hasOngoingProject', () => {
    it('should return true when user has an ongoing project', async () => {
      // Arrange
      const userId = 'user-id';
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'project-id' },
          error: null,
        }),
      });

      // Act
      const result = await hasOngoingProject(userId);

      // Assert
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    });

    it('should return false when user does not have an ongoing project', async () => {
      // Arrange
      const userId = 'user-id';
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      // Act
      const result = await hasOngoingProject(userId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('onboardingAccessControl', () => {
    it('should redirect authenticated users with ongoing projects to dashboard', async () => {
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

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockClient,
              error: null,
            }),
          };
        } else if (table === 'projects') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'project-id' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
        };
      });

      const onboardingRequest = {
        ...mockRequest,
        nextUrl: {
          ...mockRequest.nextUrl,
          pathname: '/onboarding',
        },
        url: 'http://localhost:3000/onboarding',
      } as NextRequest;

      // Act
      const response = await onboardingAccessControl(onboardingRequest);

      // Assert
      expect(mockNextResponse.redirect).toHaveBeenCalledWith(new URL('/dashboard', 'http://localhost:3000'));
    });

    it('should allow access for authenticated users without ongoing projects', async () => {
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

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockClient,
              error: null,
            }),
          };
        } else if (table === 'projects') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
        };
      });

      const onboardingRequest = {
        ...mockRequest,
        nextUrl: {
          ...mockRequest.nextUrl,
          pathname: '/onboarding',
        },
        url: 'http://localhost:3000/onboarding',
      } as NextRequest;

      // Act
      const response = await onboardingAccessControl(onboardingRequest);

      // Assert
      expect(mockNextResponse.next).toHaveBeenCalled();
    });

    it('should allow access for unauthenticated users', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const onboardingRequest = {
        ...mockRequest,
        nextUrl: {
          ...mockRequest.nextUrl,
          pathname: '/onboarding',
        },
        url: 'http://localhost:3000/onboarding',
      } as NextRequest;

      // Act
      const response = await onboardingAccessControl(onboardingRequest);

      // Assert
      expect(mockNextResponse.next).toHaveBeenCalled();
    });
  });
});