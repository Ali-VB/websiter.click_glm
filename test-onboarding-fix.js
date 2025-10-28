// Test script to verify the onboarding fix
// This tests that the onboarding route now works with status: 'pending'

const testOnboarding = async () => {
  try {
    console.log('🧪 Testing onboarding route with new status system...');
    
    // Test data that would normally come from the onboarding form
    // Using the exact format expected by the onboarding route
    const testData = {
      name: 'Test Project - Status Fix',
      description: 'Testing the status constraint fix',
      type: 'business',
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      status: 'pending', // This should now work!
      requirements: {
        basePackage: 'business',
        addons: ['contact_form'],
        designStyle: 'modern',
        colorScheme: 'blue',
        layoutPreference: 'clean',
        domain: 'test.com',
        hosting: 'basic',
        maintenance: 'standard'
      },
      // Add the additional fields expected by the onboarding route
      design_preferences: {
        colorScheme: 'blue',
        designStyle: 'modern',
        layoutPreference: 'clean'
      },
      add_ons: {
        contact_form: true
      },
      domain_info: {
        domain: 'test.com',
        hosting: 'basic'
      },
      maintenance_plan: 'standard'
    };

    console.log('📤 Sending test request to onboarding API...');
    
    const response = await fetch('http://localhost:3001/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Onboarding route works correctly');
      console.log('📊 Response:', result);
      console.log('🎯 Project created with status:', result.data?.status);
    } else {
      const error = await response.text();
      console.log('❌ FAILED! Onboarding route returned error');
      console.log('📄 Error details:', error);
    }
  } catch (error) {
    console.log('💥 ERROR! Failed to test onboarding route');
    console.log('🔍 Error details:', error.message);
  }
};

// Run the test
testOnboarding();
