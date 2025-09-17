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
      // User exists, check if they already have an ongoing project
      const { data: ongoingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', existingUser.id)
        .eq('status', 'ongoing')
        .single();

      if (ongoingProject) {
        return NextResponse.json(
          { success: false, message: 'You already have an ongoing project. Only one project at a time is allowed.' },
          { status: 409 }
        );
      }
      
      userId = existingUser.id;
    } else {
      // Create new user in Supabase Auth with email confirmation
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

      if (authError) {
        return NextResponse.json(
          { success: false, message: 'An error occurred during signup' },
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

    // Create project in Supabase with "ongoing" status
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          client_id: userId,
          status: 'ongoing', // Changed from 'pending' to 'ongoing'
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
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during project creation' },
      { status: 500 }
    );
  }
}