-- Add new columns to jobs table
alter table jobs 
  add column if not exists package_details jsonb,
  add column if not exists addons jsonb default '[]'::jsonb,
  add column if not exists vehicle_year int,
  add column if not exists vehicle_make text,
  add column if not exists vehicle_model text,
  add column if not exists vehicle_color text,
  add column if not exists vehicle_size text,
  add column if not exists vehicle_condition text default 'normal',
  add column if not exists vehicle_photo_url text,
  add column if not exists estimated_duration int default 120; -- minutes

-- Enhance services table
alter table services
  add column if not exists description text,
  add column if not exists whats_included jsonb default '[]'::jsonb,
  add column if not exists estimated_duration int default 120,
  add column if not exists is_popular boolean default false;

-- Create service_addons table
create table if not exists service_addons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  icon text default '⭐',
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- RLS for addons
alter table service_addons enable row level security;

create policy "Public can view active addons"
  on service_addons for select
  using (is_active = true);

create policy "Business owners can manage addons"
  on service_addons for all
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- Index
create index if not exists service_addons_business_id_idx on service_addons(business_id);
