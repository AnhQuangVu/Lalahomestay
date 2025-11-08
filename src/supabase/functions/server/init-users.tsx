/**
 * Initial User Setup for LaLa House System
 * 
 * Run this once to create demo accounts:
 * - admin@lalahouse.vn / admin123 (Admin role)
 * - staff@lalahouse.vn / staff123 (Staff role)
 * 
 * These accounts are for demonstration purposes only.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

export async function initializeUsers() {
  const results = {
    admin: { created: false, error: null as any },
    staff: { created: false, error: null as any }
  };

  try {
    // Create Admin account
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@lalahouse.vn',
      password: 'admin123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Admin LaLa House',
        role: 'admin'
      }
    });

    if (adminError) {
      console.error('Error creating admin:', adminError);
      results.admin.error = adminError.message;
      // If user already exists, that's okay
      if (adminError.message.includes('already') || adminError.status === 422) {
        results.admin.created = true;
        results.admin.error = 'Already exists (OK)';
      }
    } else {
      console.log('Admin account created successfully:', adminData.user?.email);
      results.admin.created = true;
    }

    // Create Staff account
    const { data: staffData, error: staffError } = await supabase.auth.admin.createUser({
      email: 'staff@lalahouse.vn',
      password: 'staff123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Nhân viên lễ tân',
        role: 'staff'
      }
    });

    if (staffError) {
      console.error('Error creating staff:', staffError);
      results.staff.error = staffError.message;
      // If user already exists, that's okay
      if (staffError.message.includes('already') || staffError.status === 422) {
        results.staff.created = true;
        results.staff.error = 'Already exists (OK)';
      }
    } else {
      console.log('Staff account created successfully:', staffData.user?.email);
      results.staff.created = true;
    }

    return {
      success: true,
      message: `Users initialized successfully. Admin: ${results.admin.created ? '✅' : '❌'}, Staff: ${results.staff.created ? '✅' : '❌'}`,
      details: results
    };
  } catch (error) {
    console.error('Error initializing users:', error);
    return {
      success: false,
      error: error.message,
      details: results
    };
  }
}

// Note: This should be called once during setup
// You can add an endpoint in index.tsx to call this function if needed
