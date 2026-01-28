-- Create demo bookings table for sales call scheduling
create table if not exists demo_bookings (
  id uuid primary key default gen_random_uuid(),
  scheduled_date timestamp with time zone not null,
  scheduled_time text not null,
  name text not null,
  email text not null,
  phone text,
  business_name text,
  notes text,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no-show')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists demo_bookings_email_idx on demo_bookings(email);
create index if not exists demo_bookings_scheduled_date_idx on demo_bookings(scheduled_date);
create index if not exists demo_bookings_status_idx on demo_bookings(status);

-- Add RLS policies (public can insert bookings, admin can view all)
alter table demo_bookings enable row level security;

-- Allow anyone to create a booking (public booking form)
create policy "Anyone can create demo bookings"
  on demo_bookings
  for insert
  with check (true);

-- Only authenticated users can view bookings (for admin dashboard)
create policy "Authenticated users can view demo bookings"
  on demo_bookings
  for select
  using (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
create or replace function update_demo_bookings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_demo_bookings_updated_at
  before update on demo_bookings
  for each row
  execute function update_demo_bookings_updated_at();

-- Add comment for documentation
comment on table demo_bookings is 'Stores demo call bookings from the public landing page';
