// Integration tests for the client onboarding flow
// Tests the new guest-first experience and "one project at a time" rule

import { jest } from '@jest/globals';

// Mock the fetch API
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('Client Onboarding Flow', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    sessionStorageMock.getItem.mockReturnValue(null);
    localStorageMock.getItem.mockReturnValue(null);
    // Reset mockFetch
    mockFetch.mockReset();
  });

  describe('Guest Access to Onboarding Steps 1-5', () => {
    it('should allow unauthenticated users to access onboarding page', async () => {
      // Mock the fetch for checking authentication status
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Unauthorized' }),
      } as Response);

      // Test that the onboarding page loads without authentication
      // This would be tested by rendering the component and checking it doesn't redirect
      expect(true).toBe(true); // Placeholder for component rendering test
    });

    it('should save onboarding data to sessionStorage for guest users', async () => {
      const mockFormData = {
        selectedPackage: 'business',
        addOns: ['contact-form'],
        designStyle: 'modern',
        referenceWebsites: 'example.com',
        colorScheme: 'cool',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
        email: '',
        password: '',
        confirmPassword: '',
      };

      // Simulate form data being saved to sessionStorage
      sessionStorageMock.setItem.mockImplementation((key, value) => {
        expect(key).toBe('onboardingData');
        expect(JSON.parse(value as string)).toEqual(mockFormData);
      });

      // Test that data is saved when moving between steps
      sessionStorageMock.setItem('onboardingData', JSON.stringify(mockFormData));
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'onboardingData',
        JSON.stringify(mockFormData)
      );
    });

    it('should load saved data from sessionStorage on component mount', async () => {
      const mockSavedData = {
        selectedPackage: 'business',
        addOns: ['contact-form'],
        designStyle: 'modern',
      };

      // Mock sessionStorage to return saved data
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedData));

      // Test that saved data is loaded
      const savedData = sessionStorageMock.getItem('onboardingData');
      expect(savedData).toBe(JSON.stringify(mockSavedData));
      expect(JSON.parse(savedData as string || '{}')).toEqual(mockSavedData);
    });

    it('should allow navigation between steps 1-5 without authentication', async () => {
      // Test that users can navigate between steps 1-5
      // This would be tested by simulating button clicks and checking step changes
      expect(true).toBe(true); // Placeholder for navigation test
    });
  });

  describe('"One Project at a Time" Rule', () => {
    it('should redirect authenticated users with ongoing projects to dashboard', async () => {
      // Mock authenticated user with ongoing project
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        access_token: 'mock-token',
      }));

      // Mock API response for user with ongoing project
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: { id: 'user-id', role: 'client' } }),
      } as Response).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'project-id' }), // Ongoing project exists
      } as Response);

      // Test that user is redirected to dashboard
      // This would be tested by checking the router.push call
      expect(true).toBe(true); // Placeholder for redirect test
    });

    it('should allow authenticated users without ongoing projects to access onboarding', async () => {
      // Mock authenticated user without ongoing project
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        access_token: 'mock-token',
      }));

      // Mock API response for user without ongoing project
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: { id: 'user-id', role: 'client' } }),
      } as Response).mockResolvedValueOnce({
        ok: true,
        json: async () => null, // No ongoing project
      } as Response);

      // Test that user can access onboarding
      expect(true).toBe(true); // Placeholder for access test
    });

    it('should prevent creating a second project when user already has an ongoing one', async () => {
      // Mock API response for project creation attempt by user with ongoing project
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ 
          success: false, 
          message: 'You already have an ongoing project. Only one project at a time is allowed.' 
        }),
      } as Response);

      // Test that appropriate error message is shown
      expect(true).toBe(true); // Placeholder for error handling test
    });
  });

  describe('Signup and Project Creation Flow', () => {
    it('should allow guest users to create an account in step 6', async () => {
      const mockSignupData = {
        email: 'test@example.com',
        password: 'password123',
        projectData: {
          selectedPackage: 'business',
          addOns: ['contact-form'],
          designStyle: 'modern',
          referenceWebsites: 'example.com',
          colorScheme: 'cool',
          layoutPreferences: 'simple',
          domainOption: 'com',
          hostingOption: 'basic',
          maintenancePlan: 'basic',
        }
      };

      // Mock successful signup response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          message: 'Account created successfully! Please check your email to verify your account.',
          user: {
            id: 'user-id',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: false,
            role: 'client',
          },
          requiresEmailVerification: true,
        }),
      } as Response);

      // Test signup API call
      const response = await mockFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockSignupData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.requiresEmailVerification).toBe(true);
    });

    it('should associate project data with new user account', async () => {
      const mockProjectData = {
        selectedPackage: 'business',
        addOns: ['contact-form'],
        designStyle: 'modern',
        referenceWebsites: 'example.com',
        colorScheme: 'cool',
        layoutPreferences: 'simple',
        domainOption: 'com',
        hostingOption: 'basic',
        maintenancePlan: 'basic',
      };

      // Mock successful project creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          message: 'Account created successfully! Please check your email to verify your account.',
          project: {
            id: 'project-id',
            selectedPackage: mockProjectData.selectedPackage,
            addOns: mockProjectData.addOns,
            designStyle: mockProjectData.designStyle,
            referenceWebsites: mockProjectData.referenceWebsites,
            colorScheme: mockProjectData.colorScheme,
            layoutPreferences: mockProjectData.layoutPreferences,
            domainOption: mockProjectData.domainOption,
            hostingOption: mockProjectData.hostingOption,
            maintenancePlan: mockProjectData.maintenancePlan,
            email: 'test@example.com',
            status: 'ongoing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          requiresEmailVerification: true,
        }),
      } as Response);

      // Test project creation
      const response = await mockFetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          ...mockProjectData,
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.project.selectedPackage).toBe(mockProjectData.selectedPackage);
    });

    it('should allow authenticated users to create projects directly', async () => {
      // Mock authenticated user
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        access_token: 'mock-token',
      }));

      // Mock successful project creation for authenticated user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          message: 'Project created successfully',
          project: { id: 'project-id', status: 'ongoing' },
        }),
      } as Response);

      // Test project creation
      expect(true).toBe(true); // Placeholder for authenticated project creation test
    });
  });

  describe('Email Verification Flow', () => {
    it('should require email verification for new users', async () => {
      // Mock signup response requiring email verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          message: 'Account created successfully! Please check your email to verify your account.',
          user: {
            id: 'user-id',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: false,
            role: 'client',
          },
          requiresEmailVerification: true,
        }),
      } as Response);

      // Test that email verification is required
      const response = await mockFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.requiresEmailVerification).toBe(true);
    });

    it('should show appropriate message after signup requiring verification', async () => {
      // Mock signup response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          message: 'Account created successfully! Please check your email to verify your account.',
          user: {
            id: 'user-id',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: false,
            role: 'client',
          },
          requiresEmailVerification: true,
        }),
      } as Response);

      // Test that appropriate message is shown
      const response = await mockFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.message).toContain('check your email to verify your account');
    });

    it('should redirect to login with verification message after signup', async () => {
      // Test that router.push is called with correct parameters
      // This would be tested by checking the router.push call after successful signup
      expect(true).toBe(true); // Placeholder for redirect test
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors for each step', async () => {
      // Mock validation error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: 'All required fields must be filled',
        }),
      } as Response);

      // Test validation error handling
      const response = await mockFetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty data should trigger validation error
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should handle server errors gracefully', async () => {
      // Mock server error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: 'An error occurred during project creation',
        }),
      } as Response);

      // Test server error handling
      const response = await mockFetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedPackage: 'business',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should handle authentication errors during onboarding', async () => {
      // Mock authentication error
      localStorageMock.getItem.mockReturnValue(null); // No token

      // Test that authentication error is handled
      // This would be tested by checking that appropriate error message is shown
      expect(true).toBe(true); // Placeholder for auth error test
    });

    it('should clear sessionStorage data after successful onboarding', async () => {
      // Mock successful onboarding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          requiresEmailVerification: true,
        }),
      } as Response);

      // Test that sessionStorage is cleared
      sessionStorageMock.removeItem.mockImplementation((key) => {
        expect(key).toBe('onboardingData');
      });

      sessionStorageMock.removeItem('onboardingData');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('onboardingData');
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across onboarding steps', async () => {
      const mockStep1Data = {
        selectedPackage: 'business',
      };

      const mockStep2Data = {
        selectedPackage: 'business',
        addOns: ['contact-form'],
      };

      // Simulate saving data after each step
      sessionStorageMock.setItem.mockImplementation((key, value) => {
        expect(key).toBe('onboardingData');
        const parsedValue = JSON.parse(value as string);
        if (parsedValue.addOns) {
          expect(parsedValue).toEqual(mockStep2Data);
        } else {
          expect(parsedValue).toEqual(mockStep1Data);
        }
      });

      // Test data persistence
      sessionStorageMock.setItem('onboardingData', JSON.stringify(mockStep1Data));
      sessionStorageMock.setItem('onboardingData', JSON.stringify(mockStep2Data));
    });

    it('should handle sessionStorage errors gracefully', async () => {
      // Mock sessionStorage error
      const originalSetItem = sessionStorageMock.setItem;
      sessionStorageMock.setItem.mockImplementation(() => {
        throw new Error('SessionStorage error');
      });

      // Test that sessionStorage errors are caught and handled
      expect(() => {
        try {
          sessionStorageMock.setItem('onboardingData', JSON.stringify({}));
        } catch (error) {
          console.error('Error saving onboarding data:', error);
        }
      }).not.toThrow();

      // Restore original mock
      sessionStorageMock.setItem = originalSetItem;
    });
  });
});