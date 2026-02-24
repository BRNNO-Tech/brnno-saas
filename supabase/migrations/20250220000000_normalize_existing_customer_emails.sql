-- Normalize existing client and lead emails (trim + lowercase) so
-- "My Bookings" lookup (get_customer_ids_by_normalized_email) finds them.
-- Run once; safe to re-run (idempotent).

-- Clients: normalize email where we have one
update clients
set email = lower(trim(email))
where email is not null
  and email <> lower(trim(email));

-- Leads: normalize email where we have one
update leads
set email = lower(trim(email))
where email is not null
  and email <> lower(trim(email));

-- Optional: log how many were updated (for verification)
-- Uncomment and run separately if you want to see counts:
-- select
--   (select count(*) from clients where email is not null) as clients_with_email,
--   (select count(*) from leads where email is not null) as leads_with_email;
