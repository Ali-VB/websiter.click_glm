import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { POST } from '../signup/route';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
jest.mock('@/lib/supabase');

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should return 201 and user data on successful signup', async () => {
    // Create a mock NextRequest
    const request = {
      json: () => Promise.resolve({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    } as unknown as NextRequest;

    // Mock successful auth signup with email confirmation required
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-id-123',
          email: 'test@example.com',
          email_confirmed_at: null, // Email not confirmed yet
        }
      },
      error: null,
    });

    // Mock no existing user
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    // Mock successful user creation
    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-id-123',
              name: 'Test User',
              email: 'test@example.com',
              email_verified: false,
            },
          }),
        }),
      }),
    });

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: false,
      },
      requiresEmailVerification: true,
    });
  });

  it('should return 400 if required fields are missing', async () => {
    // Create a mock NextRequest
    const request = {
      json: () => Promise.resolve({
        name: 'Test User',
        // Missing email and password
      }),
    } as unknown as NextRequest;

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: 'Name, email, and password are required',
    });
  });

  it('should return 400 if email is invalid', async () => {
    // Create a mock NextRequest
    const request = {
      json: () => Promise.resolve({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      }),
    } as unknown as NextRequest;

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: 'Invalid email format',
    });
  });

  it('should return 400 if password is too short', async () => {
    // Create a mock NextRequest
    const request = {
      json: () => Promise.resolve({
        name: 'Test User',
        email: 'test@example.com',
        password: '123', // Too short
      }),
    } as unknown as NextRequest;

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: 'Password must be at least 8 characters',
    });
  });

  it('should return 409 if email already exists', async () => {
    // Create a mock NextRequest
    const request = {
      json: () => Promise.resolve({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      }),
    } as unknown as NextRequest;

    // Mock existing user
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValue({
            data: { id: 'existing-user-id' },
          }),
        }),
      }),
    });

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data).toEqual({
      success: false,
      message: 'Email already registered',
    });
  });

  it('should return 500 on server error', async () => {
    // Create a mock NextRequest
    const request = {
      json: () => Promise.resolve({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    } as unknown as NextRequest;

    // Mock auth error
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({
      success: false,
      message: 'An error occurred during signup',
    });
  });
});