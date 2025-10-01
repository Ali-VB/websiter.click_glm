import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function getAdminToken() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const adminEmail = 'admin@websiter.click';
  const adminPassword = 'admin123';

  try {
    // Sign in as admin user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      console.error('Error signing in admin user:', error);
      return;
    }

    console.log('Admin user signed in successfully!');
    console.log('Access Token:', data.session?.access_token);
    console.log('Refresh Token:', data.session?.refresh_token);
    console.log('User ID:', data.user?.id);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

getAdminToken();
