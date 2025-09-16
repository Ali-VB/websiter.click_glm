import { POST } from '../login/route';
import { createServerClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}));

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

describe('POST /api/auth/login with role', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock Supabase client
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
      },
      from: jest.fn(),
    };

    mockCreateServerClient.mockReturnValue(mockSupabase);

    // Create a mock request
    mockRequest = {
      json: jest.fn(),
    } as unknown as NextRequest;
  });

  it('should include role in response when login is successful', async () => {
    // Arrange
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
    };

    const mockSession = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
    };

    const mockClient = {
      name: 'Test User',
      email_verified: true,
      role: 'client',
    };

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: mockSession,
      },
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
    const response = await POST(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      name: mockClient.name,
      emailVerified: mockClient.email_verified,
      role: mockClient.role,
    });
    expect(responseData.session).toEqual({
      access_token: mockSession.access_token,
      refresh_token: mockSession.refresh_token,
      expires_in: mockSession.expires_in,
    });
  });

  it('should include admin role in response when admin user logs in', async () => {
    // Arrange
    const requestBody = {
      email: 'admin@example.com',
      password: 'password123',
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    const mockUser = {
      id: 'admin-id',
      email: 'admin@example.com',
    };

    const mockSession = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
    };

    const mockClient = {
      name: 'Admin User',
      email_verified: true,
      role: 'admin',
    };

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: mockSession,
      },
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
    const response = await POST(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      name: mockClient.name,
      emailVerified: mockClient.email_verified,
      role: mockClient.role,
    });
    expect(responseData.user.role).toBe('admin');
  });
});