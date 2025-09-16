import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
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

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user in Supabase Auth with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login`,
        data: {
          name,
        }
      }
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: 'An error occurred during signup' },
        { status: 500 }
      );
    }

    // Create user profile in clients table
    const { data: userData, error: userError } = await supabase
      .from('clients')
      .insert([
        {
          id: authData.user?.id,
          name,
          email,
          email_verified: false, // Initially set to false until email is verified
        },
      ])
      .select()
      .single();

    if (userError) {
      return NextResponse.json(
        { success: false, message: 'An error occurred during signup' },
        { status: 500 }
      );
    }

    // Check if email confirmation is required
    if (authData.user && !authData.user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          emailVerified: false,
        },
        requiresEmailVerification: true,
      }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        emailVerified: true,
      },
      requiresEmailVerification: false,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}