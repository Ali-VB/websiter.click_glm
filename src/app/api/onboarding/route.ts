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
  console.log("DEBUG: Onboarding API called");
  
  try {
    const body = await request.json();
    console.log("DEBUG: Request body received:", body);
    
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .single();

    let userId;
    let isNewUser = false;

    if (existingUser) {
      // User exists, check if they already have a pending project
      const { data: ongoingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', existingUser.id)
        .eq('status', 'pending')
        .single();

      if (ongoingProject) {
        return NextResponse.json(
          { success: false, message: 'You already have a pending project. Only one project at a time is allowed.' },
          { status: 409 }
        );
      }
      
      userId = existingUser.id;
    } else {
      // Create new user in Supabase Auth with email confirmation
      console.log("DEBUG: Attempting to create user with email:", email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login`,
          data: {
            name: email.split('@')[0],
          }
        }
      });

      console.log("DEBUG: Auth response - authData:", authData);
      console.log("DEBUG: Auth response - authError:", authError);

      if (authError) {
        console.error("DEBUG: Auth error details:", authError);
        return NextResponse.json(
          { success: false, message: `Auth error: ${authError.message}` },
          { status: 500 }
        );
      }

      if (!authData.user) {
        return NextResponse.json(
          { success: false, message: 'Failed to create user account' },
          { status: 500 }
        );
      }

      // Create user profile in clients table
      const { data: userData, error: userError } = await supabase
        .from('clients')
        .insert([
          {
            id: authData.user.id,
            name: email.split('@')[0],
            email,
            email_verified: false, // Initially set to false until email is verified
            role: 'client', // Default role for new users
          },
        ])
        .select()
        .single();

      if (userError) {
        return NextResponse.json(
          { success: false, message: 'An error occurred during user profile creation' },
          { status: 500 }
        );
      }

      userId = userData.id;
      isNewUser = true;
    }

    // Create project in Supabase with new 4-stage status system
    console.log("DEBUG: Creating project with userId:", userId);
    const projectDataToInsert = {
      client_id: userId,
      name: `Project ${selectedPackage}`, // Add required name field
      status: 'pending', // Using new 4-stage system: pending, in_progress, review, completed
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
    };
    
    console.log("DEBUG: Project data to insert:", projectDataToInsert);
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([projectDataToInsert])
      .select()
      .single();

    console.log("DEBUG: Project creation response - projectData:", projectData);
    console.log("DEBUG: Project creation response - projectError:", projectError);

    if (projectError) {
      console.error('Project creation error details:', projectError);
      return NextResponse.json(
        { success: false, message: `Project creation error: ${projectError.message}` },
        { status: 500 }
      );
    }

    // Return the created project data
    return NextResponse.json({
      success: true,
      message: isNewUser
        ? 'Account created successfully! Please check your email to verify your account.'
        : 'Project created successfully',
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
      requiresEmailVerification: isNewUser,
    }, { status: 201 });
    } catch (error) {
    console.error('DEBUG: Onboarding API error details:', error);
    console.error('DEBUG: Error type:', typeof error);
    console.error('DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // More specific error handling
    if (error instanceof Error) {
      console.error('DEBUG: Error message:', error.message);
      console.error('DEBUG: Error name:', error.name);
      
      // Check for specific Supabase errors
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, message: 'Email already registered' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Invalid login')) {
        return NextResponse.json(
          { success: false, message: 'Invalid authentication credentials' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('network')) {
        return NextResponse.json(
          { success: false, message: 'Network connection error. Please try again.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, message: `An error occurred during project creation: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
