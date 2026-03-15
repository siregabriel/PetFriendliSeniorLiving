// Simple password reset - just provide email and new password as arguments
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    console.log('Usage: node reset-password-simple.js <email> <new-password>');
    console.log('\nExample: node reset-password-simple.js admin@example.com MyNewPass123');
    console.log('\nAvailable users:');
    
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    users.forEach(user => {
      console.log(`  - ${user.email}`);
    });
    return;
  }
  
  if (newPassword.length < 6) {
    console.log('❌ Password must be at least 6 characters');
    return;
  }
  
  console.log(`Resetting password for: ${email}`);
  
  // Find user by email
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log(`❌ User not found: ${email}`);
    console.log('\nAvailable users:');
    users.forEach(u => console.log(`  - ${u.email}`));
    return;
  }
  
  // Update password
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Password updated successfully!');
    console.log(`\nLogin credentials:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);
  }
}

resetPassword();
