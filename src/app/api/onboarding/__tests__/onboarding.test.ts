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

    // Mock client creation/update
    (supabase.from as jest.Mock).mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-id-123',
              email: 'test@example.com',
              name: 'test',
              created_at: '2023-01-01T00:00:00.000Z'
            },
            error: null,
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'project-id-456',
              client_id: 'user-id-123',
              status: 'pending',
              website_type: 'business',
              design_preferences: {
                designStyle: 'modern',
                referenceWebsites: 'example.com',
                colorScheme: 'cool',
                layoutPreferences: 'simple'
              },
              add_ons: ['contact-form', 'photo-gallery'],
              domain_info: {
                domainOption: 'com',
                hostingOption: 'basic'
              },
              maintenance_plan: 'basic',
              created_at: '2023-01-01T00:00:00.000Z',
              updated_at: '2023-01-01T00:00:00.000Z',
            },
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
        selectedPackage: 'business',
        addOns: ['contact-form', 'photo-gallery'],
        designStyle: 'modern',
        referenceWebsites: 'example.com',
        colorScheme: 'cool',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: 'test@example.com',
        password: 'password123'
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
      selectedPackage: 'business',
      addOns: ['contact-form', 'photo-gallery'],
      designStyle: 'modern',
      referenceWebsites: 'example.com',
      colorScheme: 'cool',
      layoutPreferences: 'simple',
      domainOption: 'com',
      hostingOption: 'basic',
      maintenancePlan: 'basic',
      email: 'test@example.com',
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
        selectedPackage: 'business',
        // Missing other required fields
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('All required fields must be filled');
  });

  it('should return 400 if selectedPackage is invalid', async () => {
    // Mock authentication for this test
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Create a mock request with invalid package
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        selectedPackage: 'invalid-package', // Invalid package
        addOns: ['contact-form'],
        designStyle: 'modern',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: 'test@example.com',
        password: 'password123'
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid package selection');
  });

  it('should return 400 if addOns array contains invalid values', async () => {
    // Mock authentication for this test
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id-123' } },
      error: null,
    });

    // Create a mock request with invalid add-ons
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        selectedPackage: 'business',
        addOns: ['contact-form', 'invalid-addon'], // Invalid add-on
        designStyle: 'modern',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: 'test@example.com',
        password: 'password123'
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid add-on(s) in selection');
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
        selectedPackage: 'business',
        designStyle: 'modern',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: 'test@example.com',
        password: 'password123'
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
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-id-123',
              email: 'test@example.com',
              name: 'test',
              created_at: '2023-01-01T00:00:00.000Z'
            },
            error: null,
          }),
        }),
      }),
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
        selectedPackage: 'business',
        designStyle: 'modern',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: 'test@example.com',
        password: 'password123'
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