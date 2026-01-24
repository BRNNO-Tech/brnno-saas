-- Create team_members table
create table team_members (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references businesses(id) on delete cascade not null,
  user_id uuid references auth.users(id), -- Optional link to auth user if they have a login
  name text not null,
  email text not null,
  phone text,
  role text default 'worker' check (role in ('admin', 'manager', 'worker')),
  skills text[],
  hourly_rate numeric,
  commission_rate numeric,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job_assignments table
create table job_assignments (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  team_member_id uuid references team_members(id) on delete cascade not null,
  assigned_by uuid references team_members(id),
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'assigned' check (status in ('assigned', 'in_progress', 'completed')),
  unique(job_id, team_member_id)
);

-- Enable RLS
alter table team_members enable row level security;
alter table job_assignments enable row level security;

-- Policies for team_members
create policy "Users can view team members of their business"
  on team_members for select
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
    or
    id in (
      select id from team_members where user_id = auth.uid()
    )
  );

create policy "Business owners can manage team members"
  on team_members for all
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Policies for job_assignments
create policy "Users can view job assignments of their business"
  on job_assignments for select
  using (
    job_id in (
      select id from jobs where business_id in (
        select id from businesses where owner_id = auth.uid()
      )
    )
    or
    team_member_id in (
      select id from team_members where user_id = auth.uid()
    )
  );

create policy "Business owners can manage job assignments"
  on job_assignments for all
  using (
    job_id in (
      select id from jobs where business_id in (
        select id from businesses where owner_id = auth.uid()
      )
    )
  );
