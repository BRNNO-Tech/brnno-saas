-- Create addon_subscriptions table
create table if not exists addon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  addon_id text not null,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text default 'active' check (status in ('active', 'canceled', 'past_due', 'incomplete')),
  price decimal(10,2),
  started_at timestamp with time zone default now(),
  canceled_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists addon_subscriptions_business_id_idx on addon_subscriptions(business_id);
create index if not exists addon_subscriptions_addon_id_idx on addon_subscriptions(addon_id);
create index if not exists addon_subscriptions_stripe_subscription_id_idx on addon_subscriptions(stripe_subscription_id);

-- Add RLS policies
alter table addon_subscriptions enable row level security;

-- Users can view their own addon subscriptions
create policy "Users can view own addon subscriptions"
  on addon_subscriptions
  for select
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Only the system (service role) can insert/update/delete
create policy "Service role can manage addon subscriptions"
  on addon_subscriptions
  for all
  using (auth.role() = 'service_role');

-- Add updated_at trigger
create or replace function update_addon_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_addon_subscriptions_updated_at
  before update on addon_subscriptions
  for each row
  execute function update_addon_subscriptions_updated_at();
