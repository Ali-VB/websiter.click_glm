import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Valid package options from the onboarding wizard
const VALID_PACKAGES = [
  'business',
  'portfolio',
  'landing',
  'booking',
  'ecommerce',
  'custom'
];

// Valid add-on options from the onboarding wizard
const VALID_ADD_ONS = [
  'contact-form',
  'photo-gallery',
  'booking-advanced',
  'ecommerce-expansion',
  'multilingual',
  'blog-addon',
  'custom-ui',
  'seo-starter',
  'analytics',
  'social-integration'
];

// Valid design styles from the onboarding wizard
const VALID_DESIGN_STYLES = [
  'modern',
  'minimal',
  'classic',
  'corporate',
  'creative'
];

// Valid color schemes from the onboarding wizard
const VALID_COLOR_SCHEMES = [
  'warm',
  'cool',
  'neutral',
  'vibrant',
  'minimal'
];

// Valid layout preferences from the onboarding wizard
const VALID_LAYOUT_PREFERENCES = [
  'simple',
  'multi-section',
  'grid-based'
];

// Valid domain options from the onboarding wizard
const VALID_DOMAIN_OPTIONS = [
  'none',
  'com',
  'ca'
];

// Valid hosting options from the onboarding wizard
const VALID_HOSTING_OPTIONS = [
  'basic',
  'ecommerce',
  'custom'
];

// Valid maintenance plans from the onboarding wizard
const VALID_MAINTENANCE_PLANS = [
  'basic',
  'growth'
];

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      selectedPackage,
      addOns,
      designStyle,
      referenceWebsites,
      colorScheme,
      layoutPreferences,
      domainOption,
      hostingOption,
      maintenancePlan,
      email,
      password
    } = body;

    // Validate required fields
    if (!selectedPackage || !designStyle || !layoutPreferences ||
        !domainOption || !hostingOption || !maintenancePlan ||
        !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Validate package
    if (!VALID_PACKAGES.includes(selectedPackage)) {
      return NextResponse.json(
        { success: false, message: 'Invalid package selection' },
        { status: 400 }
      );
    }

    // Validate add-ons if provided
    if (addOns && Array.isArray(addOns)) {
      const invalidAddOns = addOns.filter(addOn => !VALID_ADD_ONS.includes(addOn));
      if (invalidAddOns.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid add-on(s) in selection' },
          { status: 400 }
        );
      }
    }

    // Validate design style
    if (!VALID_DESIGN_STYLES.includes(designStyle)) {
      return NextResponse.json(
        { success: false, message: 'Invalid design style' },
        { status: 400 }
      );
    }

    // Validate color scheme if provided
    if (colorScheme && !VALID_COLOR_SCHEMES.includes(colorScheme)) {
      return NextResponse.json(
        { success: false, message: 'Invalid color scheme' },
        { status: 400 }
      );
    }

    // Validate layout preferences
    if (!VALID_LAYOUT_PREFERENCES.includes(layoutPreferences)) {
      return NextResponse.json(
        { success: false, message: 'Invalid layout preference' },
        { status: 400 }
      );
    }

    // Validate domain option
    if (!VALID_DOMAIN_OPTIONS.includes(domainOption)) {
      return NextResponse.json(
        { success: false, message: 'Invalid domain option' },
        { status: 400 }
      );
    }

    // Validate hosting option
    if (!VALID_HOSTING_OPTIONS.includes(hostingOption)) {
      return NextResponse.json(
        { success: false, message: 'Invalid hosting option' },
        { status: 400 }
      );
    }

    // Validate maintenance plan
    if (!VALID_MAINTENANCE_PLANS.includes(maintenancePlan)) {
      return NextResponse.json(
        { success: false, message: 'Invalid maintenance plan' },
        { status: 400 }
      );
    }

    // Create or update client record
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .upsert({
        id: user.id,
        email: email,
        name: email.split('@')[0], // Use part of email as name for now
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (clientError) {
      console.error('Client creation error:', clientError);
      return NextResponse.json(
        { success: false, message: 'An error occurred during client creation' },
        { status: 500 }
      );
    }

    // Create project in Supabase
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          client_id: user.id,
          status: 'pending',
          website_type: selectedPackage,
          design_preferences: {
            designStyle,
            referenceWebsites,
            colorScheme,
            layoutPreferences
          },
          add_ons: addOns || [],
          domain_info: {
            domainOption,
            hostingOption
          },
          maintenance_plan: maintenancePlan
        },
      ])
      .select()
      .single();

    if (projectError) {
      console.error('Project creation error:', projectError);
      return NextResponse.json(
        { success: false, message: 'An error occurred during project creation' },
        { status: 500 }
      );
    }

    // Return the created project data
    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project: {
        id: projectData.id,
        selectedPackage,
        addOns: addOns || [],
        designStyle,
        referenceWebsites,
        colorScheme,
        layoutPreferences,
        domainOption,
        hostingOption,
        maintenancePlan,
        email,
        status: projectData.status,
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at || projectData.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during project creation' },
      { status: 500 }
    );
  }
}