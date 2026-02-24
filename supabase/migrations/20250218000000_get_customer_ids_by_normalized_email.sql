-- Customer dashboard: find client/lead IDs by email with trim + lower so
-- "  You@Email.com  " matches when the customer types "you@email.com".
create or replace function get_customer_ids_by_normalized_email(
  p_business_id uuid,
  p_email text
)
returns table(source text, id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select 'client', c.id
  from clients c
  where c.business_id = p_business_id
    and lower(trim(c.email)) = lower(trim(nullif(p_email, '')))
  union all
  select 'lead', l.id
  from leads l
  where l.business_id = p_business_id
    and lower(trim(l.email)) = lower(trim(nullif(p_email, '')));
$$;

comment on function get_customer_ids_by_normalized_email(uuid, text) is
  'Used by customer My Bookings dashboard to match email ignoring spaces and case';
