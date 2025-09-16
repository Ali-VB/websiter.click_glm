import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createServerClient } from '@/lib/supabase';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}));

describe('POST /api/contact', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue({
      data: [{ id: '123', name: 'John Doe', email: 'john@example.com', message: 'Test message' }],
      error: null,
    }),
  };

  beforeEach(() => {
    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    jest.clearAllMocks();
  });

  it('should successfully submit a contact form', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('Contact form submitted successfully');
    expect(data.data).toEqual([{ id: '123', name: 'John Doe', email: 'john@example.com', message: 'Test message' }]);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('contact_submissions');
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
      {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
        is_resolved: false,
      },
    ]);
  });

  it('should return an error if name is missing', async () => {
    const requestBody = {
      email: 'john@example.com',
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name, email, and message are required');
  });

  it('should return an error if email is missing', async () => {
    const requestBody = {
      name: 'John Doe',
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name, email, and message are required');
  });

  it('should return an error if message is missing', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name, email, and message are required');
  });

  it('should return an error if email is invalid', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'invalid-email',
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email address');
  });

  it('should return an error if database insertion fails', async () => {
    const mockSupabaseClientWithError = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClientWithError);

    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to submit contact form');
  });
});