-- Job Checklist + Inventory Management
-- Inventory Items Table (checklist-linked schema)
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  category text not null, -- 'product', 'tool', 'supply'
  unit text not null, -- 'oz', 'bottle', 'piece', etc
  current_stock decimal not null default 0,
  minimum_stock decimal not null default 0,
  unit_cost decimal, -- Cost per unit
  supplier text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Checklist Templates (per service type)
create table if not exists checklist_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  service_name text not null, -- 'Full Detail', 'Quick Wash', etc
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Checklist Template Items
create table if not exists checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references checklist_templates(id) on delete cascade not null,
  item_type text not null, -- 'product', 'tool', 'task'
  inventory_item_id uuid references inventory_items(id) on delete set null,
  item_name text not null,
  estimated_quantity decimal, -- Expected usage amount
  is_required boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

-- Job Checklists (instance per job)
create table if not exists job_checklists (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade not null,
  status text default 'pending', -- 'pending', 'in_progress', 'completed'
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Job Checklist Items (checked off items)
create table if not exists job_checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid references job_checklists(id) on delete cascade not null,
  template_item_id uuid references checklist_template_items(id) on delete set null,
  inventory_item_id uuid references inventory_items(id) on delete set null,
  item_name text not null,
  item_type text not null,
  estimated_quantity decimal,
  actual_quantity decimal, -- What was actually used
  is_checked boolean default false,
  checked_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now()
);

-- Inventory Usage History
create table if not exists inventory_usage (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  inventory_item_id uuid references inventory_items(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete set null,
  quantity_used decimal not null,
  cost decimal, -- Cost of usage
  usage_date timestamp with time zone default now(),
  notes text
);

-- Indexes
create index if not exists inventory_items_business_id_idx on inventory_items(business_id);
create index if not exists inventory_items_category_idx on inventory_items(category);
create index if not exists checklist_templates_business_id_idx on checklist_templates(business_id);
create index if not exists job_checklists_job_id_idx on job_checklists(job_id);
create index if not exists inventory_usage_business_id_idx on inventory_usage(business_id);
create index if not exists inventory_usage_item_id_idx on inventory_usage(inventory_item_id);

-- RLS Policies
alter table inventory_items enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_template_items enable row level security;
alter table job_checklists enable row level security;
alter table job_checklist_items enable row level security;
alter table inventory_usage enable row level security;

-- Inventory Items Policies
create policy "Users can view own inventory"
  on inventory_items for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can manage own inventory"
  on inventory_items for all
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- Checklist Templates Policies
create policy "Users can view own templates"
  on checklist_templates for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can manage own templates"
  on checklist_templates for all
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- Template Items Policies
create policy "Users can view template items"
  on checklist_template_items for select
  using (template_id in (
    select id from checklist_templates
    where business_id in (select id from businesses where owner_id = auth.uid())
  ));

create policy "Users can manage template items"
  on checklist_template_items for all
  using (template_id in (
    select id from checklist_templates
    where business_id in (select id from businesses where owner_id = auth.uid())
  ));

-- Job Checklists Policies
create policy "Users can view job checklists"
  on job_checklists for select
  using (job_id in (
    select id from jobs
    where business_id in (select id from businesses where owner_id = auth.uid())
  ));

create policy "Users can manage job checklists"
  on job_checklists for all
  using (job_id in (
    select id from jobs
    where business_id in (select id from businesses where owner_id = auth.uid())
  ));

-- Job Checklist Items Policies
create policy "Users can view checklist items"
  on job_checklist_items for select
  using (checklist_id in (
    select id from job_checklists
    where job_id in (
      select id from jobs
      where business_id in (select id from businesses where owner_id = auth.uid())
    )
  ));

create policy "Users can manage checklist items"
  on job_checklist_items for all
  using (checklist_id in (
    select id from job_checklists
    where job_id in (
      select id from jobs
      where business_id in (select id from businesses where owner_id = auth.uid())
    )
  ));

-- Inventory Usage Policies
create policy "Users can view inventory usage"
  on inventory_usage for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can track inventory usage"
  on inventory_usage for insert
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- Generic updated_at trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at (only on tables that have updated_at)
create trigger update_inventory_items_updated_at
  before update on inventory_items
  for each row execute function set_updated_at();

create trigger update_checklist_templates_updated_at
  before update on checklist_templates
  for each row execute function set_updated_at();
