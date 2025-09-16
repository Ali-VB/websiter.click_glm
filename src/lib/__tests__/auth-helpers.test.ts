import {
  getCurrentUser,
  requireAdminUser,
  requireAuthenticatedUser,
  getUserFromToken,
  requireAdminFromToken
} from '../auth-helpers';
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}));

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

describe('Auth Helpers', () => {
  let mockRequest: NextRequest;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock request
    mockRequest = {
      nextUrl: {
        pathname: '/api/admin/invoices',
        origin: 'http://localhost:3000',
      },
      headers: new Headers(),
      url: 'http://localhost:3000/api/admin/invoices',
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

  // Helper function to create a mock request with headers
  function createMockRequest(headers: Record<string, string> = {}): NextRequest {
    return {
      nextUrl: {
        pathname: '/api/admin/invoices',
        origin: 'http://localhost:3000',
      },
      headers: new Headers(headers),
      url: 'http://localhost:3000/api/admin/invoices',
    } as unknown as NextRequest;
  }

  describe('getCurrentUser', () => {
    it('should return null when user headers are missing', () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const user = getCurrentUser(request);

      // Assert
      expect(user).toBeNull();
    });

    it('should return user object when headers are present', () => {
      // Arrange
      const request = createMockRequest({
        'x-user-id': 'user-id',
        'x-user-email': 'user@example.com',
        'x-user-role': 'client',
      });

      // Act
      const user = getCurrentUser(request);

      // Assert
      expect(user).toEqual({
        id: 'user-id',
        email: 'user@example.com',
        role: 'client',
      });
    });
  });

  describe('requireAdminUser', () => {
    it('should return unauthorized response when user is not authenticated', () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = requireAdminUser(request);

      // Assert
      expect(response).toEqual(
        NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      );
    });

    it('should return insufficient permissions response when user is not admin', () => {
      // Arrange
      const request = createMockRequest({
        'x-user-id': 'user-id',
        'x-user-email': 'user@example.com',
        'x-user-role': 'client',
      });

      // Act
      const response = requireAdminUser(request);

      // Assert
      expect(response).toEqual(
        NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      );
    });

    it('should return null when user is admin', () => {
      // Arrange
      const request = createMockRequest({
        'x-user-id': 'admin-id',
        'x-user-email': 'admin@example.com',
        'x-user-role': 'admin',
      });

      // Act
      const response = requireAdminUser(request);

      // Assert
      expect(response).toBeNull();
    });
  });

  describe('requireAuthenticatedUser', () => {
    it('should return unauthorized response when user is not authenticated', () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = requireAuthenticatedUser(request);

      // Assert
      expect(response).toEqual(
        NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      );
    });

    it('should return null when user is authenticated', () => {
      // Arrange
      const request = createMockRequest({
        'x-user-id': 'user-id',
        'x-user-email': 'user@example.com',
        'x-user-role': 'client',
      });

      // Act
      const response = requireAuthenticatedUser(request);

      // Assert
      expect(response).toBeNull();
    });
  });

  describe('getUserFromToken', () => {
    it('should return null when authorization header is missing', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const user = await getUserFromToken(request);

      // Assert
      expect(user).toBeNull();
    });

    it('should return null when authorization header is invalid', async () => {
      // Arrange
      const request = createMockRequest({
        'authorization': 'InvalidToken',
      });

      // Act
      const user = await getUserFromToken(request);

      // Assert
      expect(user).toBeNull();
    });

    it('should return null when token is invalid', async () => {
      // Arrange
      const request = createMockRequest({
        'authorization': 'Bearer invalid-token',
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      // Act
      const user = await getUserFromToken(request);

      // Assert
      expect(user).toBeNull();
    });

    it('should return null when client record does not exist', async () => {
      // Arrange
      const request = createMockRequest({
        'authorization': 'Bearer valid-token',
      });

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
      const user = await getUserFromToken(request);

      // Assert
      expect(user).toBeNull();
    });

    it('should return user object when token is valid', async () => {
      // Arrange
      const request = createMockRequest({
        'authorization': 'Bearer valid-token',
      });

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
      const user = await getUserFromToken(request);

      // Assert
      expect(user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockClient.role,
      });
    });
  });

  describe('requireAdminFromToken', () => {
    it('should return unauthorized response when token is invalid', async () => {
      // Arrange
      const request = createMockRequest({
        'authorization': 'Bearer invalid-token',
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      // Act
      const response = await requireAdminFromToken(request);

      // Assert
      expect(response).toEqual(
        NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      );
    });

    it('should return insufficient permissions response when user is not admin', async () => {
      // Arrange
      const request = createMockRequest({
        'authorization': 'Bearer valid-token',
      });

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
      const response = await requireAdminFromToken(request);

      // Assert
      expect(response).toEqual(
        NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      );
    });

    it('should return null when user is admin', async () => {
      // Arrange
      const request = createMockRequest({
        'authorization': 'Bearer valid-token',
      });

      const mockUser = {
        id: 'admin-id',
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
      const response = await requireAdminFromToken(request);

      // Assert
      expect(response).toBeNull();
    });
  });
});