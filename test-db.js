// Quick test to check database connection and data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDatabase() {
  console.log('Testing Supabase connection...\n');
  
  // Test 1: Check all communities
  const { data: allComunidades, error: allError } = await supabase
    .from('comunidades')
    .select('*');
  
  if (allError) {
    console.error('❌ Error fetching communities:', allError);
    return;
  }
  
  console.log(`✅ Total communities in database: ${allComunidades?.length || 0}`);
  
  if (allComunidades && allComunidades.length > 0) {
    console.log('\nCommunities found:');
    allComunidades.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.nombre}`);
      console.log(`   - City: ${c.ciudad}`);
      console.log(`   - Approved: ${c.aprobado}`);
      console.log(`   - Featured: ${c.destacada}`);
      console.log(`   - ID: ${c.id}`);
    });
  } else {
    console.log('\n⚠️  No communities found in the database!');
    console.log('This means no communities have been created yet.');
  }
  
  // Test 2: Check approved communities
  const { data: approvedComunidades } = await supabase
    .from('comunidades')
    .select('*')
    .eq('aprobado', true);
  
  console.log(`\n✅ Approved communities: ${approvedComunidades?.length || 0}`);
}

testDatabase();
