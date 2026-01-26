-- Create smart notifications table for proactive alerts
create table if not exists smart_notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  type text not null, -- 'empty_priority_slot', 'customer_overdue', 'gap_opportunity'
  title text not null,
  message text not null,
  priority text default 'medium', -- 'low', 'medium', 'high'
  status text default 'active', -- 'active', 'dismissed', 'snoozed', 'acted'
  metadata jsonb, -- Store relevant data (job_id, customer_id, slot_time, etc.)
  snoozed_until timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists smart_notifications_business_id_idx on smart_notifications(business_id);
create index if not exists smart_notifications_status_idx on smart_notifications(status);
create index if not exists smart_notifications_type_idx on smart_notifications(type);
create index if not exists smart_notifications_created_at_idx on smart_notifications(created_at desc);

-- Enable RLS
alter table smart_notifications enable row level security;

-- RLS Policies
create policy "Users can view own notifications"
  on smart_notifications
  for select
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

create policy "Users can insert own notifications"
  on smart_notifications
  for insert
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

create policy "Users can update own notifications"
  on smart_notifications
  for update
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

create policy "Users can delete own notifications"
  on smart_notifications
  for delete
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Updated_at trigger
create or replace function update_smart_notifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_smart_notifications_updated_at
  before update on smart_notifications
  for each row
  execute function update_smart_notifications_updated_at();
