// Test RLS policies - simulating what the browser does
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Using anon key like the browser
);

async function testRLS() {
  console.log('Testing RLS policies with ANON key (like browser)...\n');
  
  // Test 1: Try to fetch all communities (what the homepage does)
  console.log('Test 1: Fetching all communities (no filter)');
  const { data: allData, error: allError } = await supabase
    .from('comunidades')
    .select('*')
    .order('destacada', { ascending: false });
  
  if (allError) {
    console.error('❌ Error:', allError.message);
    console.error('   Code:', allError.code);
    console.error('   Details:', allError.details);
    console.error('   Hint:', allError.hint);
  } else {
    console.log(`✅ Success! Fetched ${allData?.length || 0} communities`);
  }
  
  // Test 2: Try to fetch approved communities only
  console.log('\nTest 2: Fetching approved communities only');
  const { data: approvedData, error: approvedError } = await supabase
    .from('comunidades')
    .select('*')
    .eq('aprobado', true)
    .order('destacada', { ascending: false });
  
  if (approvedError) {
    console.error('❌ Error:', approvedError.message);
  } else {
    console.log(`✅ Success! Fetched ${approvedData?.length || 0} approved communities`);
  }
  
  console.log('\n--- DIAGNOSIS ---');
  if (allError || approvedError) {
    console.log('🔴 RLS POLICY ISSUE DETECTED!');
    console.log('The anon key cannot read from the comunidades table.');
    console.log('This is why communities are not showing on the website.');
    console.log('\nSOLUTION: You need to add RLS policies in Supabase dashboard.');
  } else {
    console.log('✅ RLS policies are working correctly.');
    console.log('The issue might be in the React component or browser console.');
  }
}

testRLS();
