import { POST } from '../signup/route';
import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Mock the Supabase client
jest.mock('@/lib/supabase');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase = supabase as any;

describe('POST /api/auth/signup with role', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

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

    // Set up the mock implementation for this test
    mockSupabase.auth = {
      signUp: jest.fn().mockResolvedValue({
        data: {
          user: mockAuthUser,
        },
        error: null,
      }),
    };
    
    // Create a mock query builder for checking if user exists
    const mockExistsSelect = jest.fn().mockReturnThis();
    const mockExistsEq = jest.fn().mockReturnThis();
    const mockExistsSingle = jest.fn().mockResolvedValue({
      data: null, // No existing user
      error: null,
    });
    
    // Create a mock query builder for inserting user
    const mockInsertSelect = jest.fn().mockReturnThis();
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: mockClient,
      error: null,
    });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: mockInsertSingle,
      }),
    });
    
    // Mock the from method to return different mocks based on the call
    mockSupabase.from = jest.fn()
      .mockReturnValueOnce({
        select: mockExistsSelect,
        eq: mockExistsEq,
        single: mockExistsSingle,
      })
      .mockReturnValueOnce({
        insert: mockInsert,
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

    // Set up the mock implementation for this test
    mockSupabase.auth = {
      signUp: jest.fn().mockResolvedValue({
        data: {
          user: mockAuthUser,
        },
        error: null,
      }),
    };
    
    // Create a mock query builder for checking if user exists
    const mockExistsSelect = jest.fn().mockReturnThis();
    const mockExistsEq = jest.fn().mockReturnThis();
    const mockExistsSingle = jest.fn().mockResolvedValue({
      data: null, // No existing user
      error: null,
    });
    
    // Create a mock query builder for inserting user
    const mockInsertSelect = jest.fn().mockReturnThis();
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: mockClient,
      error: null,
    });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: mockInsertSingle,
      }),
    });
    
    // Mock the from method to return different mocks based on the call
    mockSupabase.from = jest.fn()
      .mockReturnValueOnce({
        select: mockExistsSelect,
        eq: mockExistsEq,
        single: mockExistsSingle,
      })
      .mockReturnValueOnce({
        insert: mockInsert,
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

    // Set up the mock implementation for this test
    mockSupabase.auth = {
      signUp: jest.fn().mockResolvedValue({
        data: {
          user: mockAuthUser,
        },
        error: null,
      }),
    };
    
    // Create a mock query builder for checking if user exists
    const mockExistsSelect = jest.fn().mockReturnThis();
    const mockExistsEq = jest.fn().mockReturnThis();
    const mockExistsSingle = jest.fn().mockResolvedValue({
      data: null, // No existing user
      error: null,
    });
    
    // Create a mock query builder for inserting user
    const mockInsertSelect = jest.fn().mockReturnThis();
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: mockClient,
      error: null,
    });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: mockInsertSingle,
      }),
    });
    
    // Mock the from method to return different mocks based on the call
    mockSupabase.from = jest.fn()
      .mockReturnValueOnce({
        select: mockExistsSelect,
        eq: mockExistsEq,
        single: mockExistsSingle,
      })
      .mockReturnValueOnce({
        insert: mockInsert,
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