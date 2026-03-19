create table if not exists senior_living_pages (
  id text primary key,  -- 'independent-living', 'assisted-living', 'memory-care'
  hero_image text,
  title text,
  subtitle text,
  section1_title text,
  section1_body text,
  section2_title text,
  section2_body text,
  section3_title text,
  section3_bullets text[],
  updated_at timestamptz default now()
);

-- Seed default content
insert into senior_living_pages (id, hero_image, title, subtitle, section1_title, section1_body, section2_title, section2_body, section3_title, section3_bullets) values
(
  'independent-living',
  'https://images.pexels.com/photos/6131006/pexels-photo-6131006.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Independent Living',
  'Pet-Friendly Options',
  'What is Independent Living?',
  'Independent living communities are designed for active seniors who can live on their own but want the convenience of community amenities, social activities, and maintenance-free living.',
  'Pets in Independent Living',
  'Many independent living communities warmly welcome pets. Dogs, cats, and small animals are commonly allowed. Having a pet reduces loneliness, encourages physical activity, and provides emotional comfort.',
  'What to Look For',
  ARRAY['Pet-friendly outdoor spaces and walking paths','On-site or nearby veterinary services','Pet care assistance if needed','Community pet events and social activities','Clear pet policies with reasonable fees']
),
(
  'assisted-living',
  'https://images.pexels.com/photos/7203956/pexels-photo-7203956.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Assisted Living',
  'Pet-Friendly Options',
  'What is Assisted Living?',
  'Assisted living communities provide personalized support for seniors who need help with daily activities while still maintaining as much independence as possible.',
  'Pets in Assisted Living',
  'Pets play a vital therapeutic role in assisted living. Animal companionship reduces anxiety, lowers blood pressure, and improves overall mood. Many communities offer concierge pet care services.',
  'What to Look For',
  ARRAY['Pet care assistance included or available','Safe outdoor areas for pets','Staff trained in pet-assisted therapy','Flexible pet policies for various needs','Nearby veterinary and grooming services']
),
(
  'memory-care',
  'https://images.pexels.com/photos/6816861/pexels-photo-6816861.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Memory Care',
  'Pet-Friendly Options',
  'What is Memory Care?',
  'Memory care communities are specialized residential settings designed for individuals living with Alzheimer''s disease, dementia, or other forms of memory loss.',
  'Pets in Memory Care',
  'Animal-assisted therapy has shown remarkable benefits for memory care residents. Interacting with pets can trigger positive memories, reduce agitation, and provide a calming presence.',
  'What to Look For',
  ARRAY['Animal-assisted therapy programs','Resident or therapy pets on-site','Staff support for pet care','Secure outdoor spaces for pet interaction','Compassionate pet transition planning']
)
on conflict (id) do nothing;

-- RLS: public can read, only admin/moderator can update
alter table senior_living_pages enable row level security;
create policy "public read" on senior_living_pages for select using (true);
create policy "admin write" on senior_living_pages for all using (
  exists (
    select 1 from perfiles where id = auth.uid() and rol in ('admin','moderator','super_admin')
  )
);
