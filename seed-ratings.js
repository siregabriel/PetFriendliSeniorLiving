// seed-ratings.js — inserts sample approved ratings for visual testing
// Run with: node seed-ratings.js

const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://qwpefrianruybrqysbfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cGVmcmlhbnJ1eWJycXlzYmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE5NTY0OSwiZXhwIjoyMDg0NzcxNjQ5fQ.MwwdAOak9UvYIO3PJthTQNuHc1OKpqRnDc9plBtTzMk'
);

// Fake user UUIDs for seed data (not real auth users — will bypass FK if RLS is off via service role)
const fakeUsers = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
];

const ratings = [
  // Tribute at Black Hill (id: 21) — 4 reviews
  { comunidad_id: 21, user_id: fakeUsers[0], stars: 5, review: 'Absolutely love this place! The staff is incredibly welcoming and my dog Biscuit has made so many friends here. The walking trails are perfect for our morning routine.', status: 'approved' },
  { comunidad_id: 21, user_id: fakeUsers[1], stars: 4, review: 'Great community overall. The pet-friendly amenities are top notch. Only minor issue is parking can get tight on weekends.', status: 'approved' },
  { comunidad_id: 21, user_id: fakeUsers[2], stars: 5, review: 'Moved here 6 months ago with my cat Luna and we couldn\'t be happier. Clean, safe, and the neighbors are wonderful.', status: 'approved' },
  { comunidad_id: 21, user_id: fakeUsers[3], stars: 4, review: 'Very good experience. The pet washing station is a great touch. Would recommend to any senior with a furry companion.', status: 'approved' },

  // Tribute at The Glen (id: 13) — 3 reviews
  { comunidad_id: 13, user_id: fakeUsers[0], stars: 5, review: 'The Glen is a hidden gem. My parrot Mango is welcome everywhere and the staff always greets him by name!', status: 'approved' },
  { comunidad_id: 13, user_id: fakeUsers[1], stars: 3, review: 'Decent place but the pet policy could be clearer. Had some confusion about which areas dogs are allowed. Staff was helpful resolving it.', status: 'approved' },
  { comunidad_id: 13, user_id: fakeUsers[4], stars: 4, review: 'Lovely grounds and very pet-forward culture. My two cats settled in immediately.', status: 'approved' },

  // Kelley Place (id: 11) — 2 reviews
  { comunidad_id: 11, user_id: fakeUsers[2], stars: 5, review: 'Best decision I ever made. The community events include pets and it feels like a real family here.', status: 'approved' },
  { comunidad_id: 11, user_id: fakeUsers[3], stars: 4, review: 'Solid choice for pet owners. The outdoor spaces are well maintained and my golden retriever loves the yard.', status: 'approved' },

  // The Oscar At Georgetown (id: 14) — 1 review
  { comunidad_id: 14, user_id: fakeUsers[0], stars: 3, review: 'Nice location and modern facilities. The pet deposit was higher than expected but the community itself is pleasant.', status: 'approved' },

  // Oakview Park (id: 15) — pending (to test moderation queue)
  { comunidad_id: 15, user_id: fakeUsers[1], stars: 5, review: 'Just submitted this — pending review. Oakview is fantastic, highly recommend!', status: 'pending' },
  { comunidad_id: 15, user_id: fakeUsers[2], stars: 2, review: 'Had some issues with noise from neighboring units. The pet policy is good but management response time is slow.', status: 'pending' },
];

async function seed() {
  console.log('Seeding ratings...');

  // Delete existing seed data first (by fake user IDs)
  const { error: delError } = await sb
    .from('valoraciones')
    .delete()
    .in('user_id', fakeUsers);

  if (delError) {
    console.warn('Delete warning (table may not exist yet):', delError.message);
  }

  const { data, error } = await sb.from('valoraciones').insert(ratings).select('id, comunidad_id, stars, status');

  if (error) {
    console.error('Insert error:', error.message);
    console.error('Hint:', error.hint || error.details || '');
    process.exit(1);
  }

  console.log(`✓ Inserted ${data.length} ratings:`);
  data.forEach(r => console.log(`  comunidad ${r.comunidad_id} — ${r.stars}★ [${r.status}]`));
  console.log('\nDone! Refresh the app to see ratings on community cards and detail pages.');
}

seed();
