import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
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

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return generic error message for security
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('clients')
      .select('name, email_verified')
      .eq('id', data.user?.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { success: false, message: 'An error occurred during login' },
        { status: 500 }
      );
    }

    // Check if email is verified
    if (!userData.email_verified && !data.user?.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          requiresEmailVerification: true
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: userData.name,
        emailVerified: userData.email_verified,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_in: data.session?.expires_in,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}