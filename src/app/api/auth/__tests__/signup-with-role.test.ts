import { POST } from '../signup/route';
import { createServerClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}));

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

describe('POST /api/auth/signup with role', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock Supabase client
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
      },
      from: jest.fn(),
    };

    mockCreateServerClient.mockReturnValue(mockSupabase);

    // Create a mock request
    mockRequest = {
      json: jest.fn(),
    } as unknown as NextRequest;
  });

  it('should include client role in response when signup is successful with email verification', async () => {
    // Arrange
    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    const mockAuthUser = {
      id: 'user-id',
      email: 'test@example.com',
      email_confirmed_at: null, // Email not confirmed
    };

    const mockClient = {
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      email_verified: false,
      role: 'client',
    };

    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: mockAuthUser,
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockClient,
        error: null,
      }),
    });

    // Act
    const response = await POST(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.user).toEqual({
      id: mockClient.id,
      email: mockClient.email,
      name: mockClient.name,
      emailVerified: mockClient.email_verified,
      role: mockClient.role,
    });
    expect(responseData.user.role).toBe('client');
    expect(responseData.requiresEmailVerification).toBe(true);
  });

  it('should include client role in response when signup is successful without email verification', async () => {
    // Arrange
    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    const mockAuthUser = {
      id: 'user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(), // Email confirmed
    };

    const mockClient = {
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      email_verified: true,
      role: 'client',
    };

    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: mockAuthUser,
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockClient,
        error: null,
      }),
    });

    // Act
    const response = await POST(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.user).toEqual({
      id: mockClient.id,
      email: mockClient.email,
      name: mockClient.name,
      emailVerified: mockClient.email_verified,
      role: mockClient.role,
    });
    expect(responseData.user.role).toBe('client');
    expect(responseData.requiresEmailVerification).toBe(false);
  });

  it('should set role to client by default when creating user', async () => {
    // Arrange
    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    const mockAuthUser = {
      id: 'user-id',
      email: 'test@example.com',
      email_confirmed_at: null,
    };

    const mockClient = {
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      email_verified: false,
      role: 'client',
    };

    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: mockAuthUser,
      },
      error: null,
    });

    const mockInsert = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: mockClient,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      single: mockSingle,
    });

    // Act
    await POST(mockRequest);

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    expect(mockInsert).toHaveBeenCalledWith([
      {
        id: mockAuthUser.id,
        name: requestBody.name,
        email: requestBody.email,
        email_verified: false,
        role: 'client', // Default role
      },
    ]);
  });
});