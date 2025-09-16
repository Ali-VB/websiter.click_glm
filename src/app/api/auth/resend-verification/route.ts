import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
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

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('clients')
      .select('id, email_verified')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      // Don't reveal if the email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If your email is registered, you will receive a verification link.',
      });
    }

    // Check if email is already verified
    if (userData.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Your email is already verified.',
      });
    }

    // Resend verification email using Supabase Auth
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login`,
      }
    });

    if (resendError) {
      console.error('Resend verification error:', resendError);
      return NextResponse.json(
        { success: false, message: 'Failed to resend verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resending verification email' },
      { status: 500 }
    );
  }
}