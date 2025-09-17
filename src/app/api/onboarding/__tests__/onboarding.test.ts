import { NextRequest } from 'next/server';
import { POST } from '../route';

// Create mock functions for the Supabase query chain
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockInsert = jest.fn();
const mockUpsert = jest.fn();

// Create a mock query builder that can handle chained calls
const createMockQueryBuilder = () => ({
  select: mockSelect.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  single: mockSingle,
  insert: mockInsert.mockReturnThis(),
  upsert: mockUpsert.mockReturnThis(),
});

// Mock the supabase module before importing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(() => createMockQueryBuilder()),
  },
}));

import { supabase } from '@/lib/supabase';

describe('POST /api/onboarding', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should return 201 and project data on successful onboarding for new user', async () => {
    // Mock no existing user
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Mock user signup
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: 'new-user-id-123' } },
      error: null,
    });

    // Mock client creation
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-user-id-123',
        name: 'test',
        email: 'test@example.com',
        email_verified: false,
        role: 'client',
      },
      error: null,
    });

    // Mock project creation
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'project-id-456',
        client_id: 'new-user-id-123',
        status: 'ongoing',
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
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    expect(data.message).toBe('Account created successfully! Please check your email to verify your account.');
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
      status: 'ongoing',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    });
    expect(data.requiresEmailVerification).toBe(true);
  });

  it('should return 201 and project data on successful onboarding for existing user without ongoing project', async () => {
    // Mock existing user
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'existing-user-id-123',
      },
      error: null,
    });

    // Mock no ongoing project
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Mock project creation
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'project-id-456',
        client_id: 'existing-user-id-123',
        status: 'ongoing',
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
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        email: 'existing@example.com',
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
      email: 'existing@example.com',
      status: 'ongoing',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    });
    expect(data.requiresEmailVerification).toBe(false);
  });

  it('should return 409 if user already has an ongoing project', async () => {
    // Mock existing user
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'existing-user-id-123',
      },
      error: null,
    });

    // Mock existing ongoing project
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'ongoing-project-id-456',
      },
      error: null,
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedPackage: 'business',
        designStyle: 'modern',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: 'existing@example.com',
        password: 'password123'
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toBe('You already have an ongoing project. Only one project at a time is allowed.');
  });

  it('should return 400 if required fields are missing', async () => {
    // Create a mock request with missing required fields
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    // Create a mock request with invalid package
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

  it('should return 400 if email format is invalid', async () => {
    // Create a mock request with invalid email
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedPackage: 'business',
        designStyle: 'modern',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: 'invalid-email', // Invalid email
        password: 'password123'
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email format');
  });

  it('should return 400 if password is too short', async () => {
    // Create a mock request with short password
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedPackage: 'business',
        designStyle: 'modern',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: 'test@example.com',
        password: 'short' // Too short password
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Password must be at least 8 characters');
  });

  it('should return 400 if addOns array contains invalid values', async () => {
    // Create a mock request with invalid add-ons
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

  it('should return 500 on server error during user creation', async () => {
    // Mock no existing user
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Mock user signup error
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Signup error' },
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    expect(data.message).toBe('An error occurred during signup');
  });

  it('should return 500 on server error during project creation', async () => {
    // Mock no existing user
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Mock user signup
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: 'new-user-id-123' } },
      error: null,
    });

    // Mock client creation
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-user-id-123',
        name: 'test',
        email: 'test@example.com',
        email_verified: false,
        role: 'client',
      },
      error: null,
    });

    // Mock project creation error
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Project creation error' },
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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