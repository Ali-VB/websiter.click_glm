import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock the supabase module before importing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase';

describe('POST /api/onboarding', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should return 201 and project data on successful onboarding', async () => {
    // Mock authentication
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Mock project creation
    const mockProjectData = {
      id: 'project-id-456',
      client_id: 'user-id-123',
      status: 'pending',
      website_type: 'restaurant',
      design_preferences: { colorScheme: 'warm', logoUrl: 'https://example.com/logo.png' },
      add_ons: {
        features: ['menu', 'gallery', 'contact form'],
        targetAudience: 'local customers',
        additionalNotes: 'Need mobile responsive design'
      },
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };

    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProjectData,
            error: null,
          }),
        }),
      }),
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectName: 'My Awesome Website',
        projectDescription: 'A website for my small business',
        businessType: 'restaurant',
        targetAudience: 'local customers',
        features: ['menu', 'gallery', 'contact form'],
        colorScheme: 'warm',
        logoUrl: 'https://example.com/logo.png',
        additionalNotes: 'Need mobile responsive design',
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Project created successfully');
    expect(data.project).toEqual({
      id: 'project-id-456',
      name: 'My Awesome Website',
      description: 'A website for my small business',
      businessType: 'restaurant',
      targetAudience: 'local customers',
      features: ['menu', 'gallery', 'contact form'],
      colorScheme: 'warm',
      logoUrl: 'https://example.com/logo.png',
      additionalNotes: 'Need mobile responsive design',
      status: 'pending',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    });
  });

  it('should return 400 if required fields are missing', async () => {
    // Mock authentication for this test
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Create a mock request with missing required fields
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectName: 'My Awesome Website',
        // Missing projectDescription and businessType
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Project name, description, and business type are required');
  });

  it('should return 400 if businessType is invalid', async () => {
    // Mock authentication for this test
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Create a mock request with invalid business type
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectName: 'My Awesome Website',
        projectDescription: 'A website for my small business',
        businessType: 'invalid-type', // Invalid type
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid business type');
  });

  it('should return 400 if features array contains invalid values', async () => {
    // Mock authentication for this test
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Create a mock request with invalid features
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectName: 'My Awesome Website',
        projectDescription: 'A website for my small business',
        businessType: 'restaurant',
        features: ['menu', 'invalid-feature'], // Invalid feature
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid feature(s) in features array');
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock authentication failure
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token',
      },
      body: JSON.stringify({
        projectName: 'My Awesome Website',
        projectDescription: 'A website for my small business',
        businessType: 'restaurant',
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Authentication required');
  });

  it('should return 500 on server error', async () => {
    // Mock authentication
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Mock database error
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        projectName: 'My Awesome Website',
        projectDescription: 'A website for my small business',
        businessType: 'restaurant',
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('An error occurred during project creation');
  });
});