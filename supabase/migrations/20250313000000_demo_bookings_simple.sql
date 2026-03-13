-- Simple demo_bookings table: id, name, email, message, created_at
-- (Matches admin Leads dashboard and /api/book-demo)
create table if not exists demo_bookings (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text,
  created_at  timestamptz default now()
);

create index if not exists demo_bookings_email_idx on demo_bookings(email);
create index if not exists demo_bookings_created_at_idx on demo_bookings(created_at desc);

alter table demo_bookings enable row level security;

drop policy if exists "Anyone can create demo bookings" on demo_bookings;
create policy "Anyone can create demo bookings"
  on demo_bookings for insert with check (true);

drop policy if exists "Authenticated users can view demo bookings" on demo_bookings;
create policy "Authenticated users can view demo bookings"
  on demo_bookings for select using (auth.role() = 'authenticated');

comment on table demo_bookings is 'Stores demo requests from the public landing page';
