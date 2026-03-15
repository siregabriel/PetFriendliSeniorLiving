// Reset admin password using Supabase Admin API
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Using service role key for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function resetPassword() {
  console.log('=== Admin Password Reset Tool ===\n');
  
  // Step 1: List all users
  console.log('Fetching users...\n');
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error fetching users:', listError.message);
    rl.close();
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('❌ No users found in the database.');
    rl.close();
    return;
  }
  
  console.log('Found users:');
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
  });
  
  // Step 2: Ask which user to reset
  rl.question('\nEnter the number of the user to reset password: ', async (answer) => {
    const userIndex = parseInt(answer) - 1;
    
    if (userIndex < 0 || userIndex >= users.length) {
      console.log('❌ Invalid selection');
      rl.close();
      return;
    }
    
    const selectedUser = users[userIndex];
    console.log(`\nSelected: ${selectedUser.email}`);
    
    // Step 3: Ask for new password
    rl.question('Enter new password (min 6 characters): ', async (newPassword) => {
      if (newPassword.length < 6) {
        console.log('❌ Password must be at least 6 characters');
        rl.close();
        return;
      }
      
      // Step 4: Update password
      console.log('\nUpdating password...');
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        selectedUser.id,
        { password: newPassword }
      );
      
      if (error) {
        console.error('❌ Error updating password:', error.message);
      } else {
        console.log('✅ Password updated successfully!');
        console.log(`\nYou can now log in with:`);
        console.log(`Email: ${selectedUser.email}`);
        console.log(`Password: ${newPassword}`);
      }
      
      rl.close();
    });
  });
}

resetPassword();
