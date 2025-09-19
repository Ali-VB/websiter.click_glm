import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function createAdminUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    console.error('Please make sure .env.local file exists and contains:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const adminEmail = 'admin@websiter.click';
  const adminPassword = 'admin123'; // This should be changed after first login

  try {
    // Create the admin user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Skip email verification for admin
      user_metadata: {
        role: 'admin',
        name: 'Admin User'
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('IMPORTANT: Change the password after first login!');
    
    // Now insert into the clients table
    const { error: insertError } = await supabase
      .from('clients')
      .upsert({
        id: data.user.id,
        name: 'Admin User',
        email: adminEmail,
        role: 'admin'
      });

    if (insertError) {
      console.error('Error inserting admin user into clients table:', insertError);
      return;
    }

    console.log('Admin user added to clients table successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();
