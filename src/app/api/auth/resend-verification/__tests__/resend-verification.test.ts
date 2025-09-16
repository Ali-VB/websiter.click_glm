import { NextRequest } from 'next/server';
import { POST } from '../route';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resend: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Email is required');
  });

  it('should return 400 if email format is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email format');
  });

  it('should return success message if user does not exist (security)', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'User not found' },
    });

    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('If your email is registered, you will receive a verification link.');
  });

  it('should return success message if email is already verified', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: '123', email_verified: true },
      error: null,
    });

    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Your email is already verified.');
  });

  it('should resend verification email successfully', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: '123', email_verified: false },
      error: null,
    });

    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);
    (supabase.auth.resend as jest.Mock).mockResolvedValue({ error: null });

    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Verification email sent successfully. Please check your inbox.');
    expect(supabase.auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'test@example.com',
      options: {
        emailRedirectTo: 'http://localhost:3000/login',
      },
    });
  });

  it('should return 500 if resend fails', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: '123', email_verified: false },
      error: null,
    });

    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);
    (supabase.auth.resend as jest.Mock).mockResolvedValue({ 
      error: { message: 'Failed to resend' } 
    });

    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Failed to resend verification email');
  });
});