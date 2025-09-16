import { POST } from '../login/route';
import { NextRequest } from 'next/server';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Import after mocking
import { supabase } from '@/lib/supabase';

// Create a mock NextRequest class for testing
class MockNextRequest {
  url: string;
  method: string;
  headers: Map<string, string>;
  _body: string;

  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Map();
    this._body = init?.body?.toString() || '';
    
    // Set headers
    if (init?.headers) {
      if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      } else if (typeof init.headers === 'object') {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, String(value));
        });
      }
    }
  }

  async json(): Promise<unknown> {
    return JSON.parse(this._body);
  }

  async text(): Promise<string> {
    return this._body;
  }
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and user data on successful login', async () => {
    // Mock successful authentication
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        user: { id: 'user-id-123', email: 'test@example.com' },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
        },
      },
      error: null,
    });

    // Mock successful user data retrieval
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: { name: 'Test User', email_verified: true },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    const req = new MockNextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req as unknown as NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Login successful');
    expect(data.user.id).toBe('user-id-123');
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.name).toBe('Test User');
    expect(data.user.emailVerified).toBe(true);
    expect(data.session.access_token).toBe('access-token');
    expect(data.session.refresh_token).toBe('refresh-token');
    expect(data.session.expires_in).toBe(3600);
  });

  it('should return 400 if required fields are missing', async () => {
    const requestBody = {
      email: 'test@example.com',
      // Missing password
    };

    const req = new MockNextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req as unknown as NextRequest);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Email and password are required');
  });

  it('should return 400 if email is invalid', async () => {
    const requestBody = {
      email: 'invalid-email',
      password: 'password123',
    };

    const req = new MockNextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req as unknown as NextRequest);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email format');
  });

  it('should return 401 if credentials are invalid', async () => {
    // Mock authentication failure
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    const requestBody = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    const req = new MockNextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req as unknown as NextRequest);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email or password');
  });

  it('should return 401 if user does not exist', async () => {
    // Mock authentication failure for non-existent user
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User not found' },
    });

    const requestBody = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    const req = new MockNextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req as unknown as NextRequest);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email or password');
  });

  it('should return 500 on server error', async () => {
    // Mock successful authentication
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        user: { id: 'user-id-123', email: 'test@example.com' },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
        },
      },
      error: null,
    });

    // Mock user data retrieval error
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    const req = new MockNextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req as unknown as NextRequest);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('An error occurred during login');
  });
});