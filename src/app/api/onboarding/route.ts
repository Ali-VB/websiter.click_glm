import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Valid business types based on the test
const VALID_BUSINESS_TYPES = [
  'restaurant',
  'retail',
  'service',
  'professional',
  'nonprofit',
  'other'
];

// Valid features based on the test
const VALID_FEATURES = [
  'menu',
  'gallery',
  'contact form',
  'booking',
  'ecommerce',
  'blog',
  'map',
  'reviews'
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
      projectName,
      projectDescription,
      businessType,
      targetAudience,
      features,
      colorScheme,
      logoUrl,
      additionalNotes
    } = body;

    // Validate required fields
    if (!projectName || !projectDescription || !businessType) {
      return NextResponse.json(
        { success: false, message: 'Project name, description, and business type are required' },
        { status: 400 }
      );
    }

    // Validate business type
    if (!VALID_BUSINESS_TYPES.includes(businessType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid business type' },
        { status: 400 }
      );
    }

    // Validate features if provided
    if (features && Array.isArray(features)) {
      const invalidFeatures = features.filter(feature => !VALID_FEATURES.includes(feature));
      if (invalidFeatures.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid feature(s) in features array' },
          { status: 400 }
        );
      }
    }

    // Create project in Supabase
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          client_id: user.id,
          status: 'pending',
          website_type: businessType,
          design_preferences: {
            colorScheme,
            logoUrl
          },
          add_ons: {
            features,
            targetAudience,
            additionalNotes
          }
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
        name: projectName,
        description: projectDescription,
        businessType,
        targetAudience,
        features,
        colorScheme,
        logoUrl,
        additionalNotes,
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