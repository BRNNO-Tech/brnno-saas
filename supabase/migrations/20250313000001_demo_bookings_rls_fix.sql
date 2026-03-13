-- Run this if you get "policy already exists" on demo_bookings.
-- Drops existing policies then recreates them.

drop policy if exists "Anyone can create demo bookings" on demo_bookings;
drop policy if exists "Authenticated users can view demo bookings" on demo_bookings;

create policy "Anyone can create demo bookings"
  on demo_bookings for insert with check (true);

create policy "Authenticated users can view demo bookings"
  on demo_bookings for select using (auth.role() = 'authenticated');
