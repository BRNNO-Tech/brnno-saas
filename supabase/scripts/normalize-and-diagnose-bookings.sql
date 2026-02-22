-- =============================================================================
-- 1. NORMALIZE emails (trim + lowercase) so My Bookings lookup finds customers
-- =============================================================================

-- Clients
UPDATE clients
SET email = lower(trim(email))
WHERE email IS NOT NULL
  AND (email <> lower(trim(email)) OR trim(email) <> email);

-- Leads  
UPDATE leads
SET email = lower(trim(email))
WHERE email IS NOT NULL
  AND (email <> lower(trim(email)) OR trim(email) <> email);

-- Show what we have after normalize
SELECT 'clients_with_email' AS label, count(*) AS cnt FROM clients WHERE email IS NOT NULL
UNION ALL
SELECT 'leads_with_email', count(*) FROM leads WHERE email IS NOT NULL;


-- =============================================================================
-- 2. DIAGNOSTIC: Replace YOUR_EMAIL and YOUR_BUSINESS_ID below, then run.
--    You get one row: clients_found, leads_found, jobs_by_client, jobs_by_lead.
-- =============================================================================

SELECT
  (SELECT count(*) FROM clients c
   WHERE c.business_id = 'YOUR_BUSINESS_ID'::uuid
     AND lower(trim(c.email)) = lower(trim('YOUR_EMAIL@example.com'))) AS clients_found,
  (SELECT count(*) FROM leads l
   WHERE l.business_id = 'YOUR_BUSINESS_ID'::uuid
     AND lower(trim(l.email)) = lower(trim('YOUR_EMAIL@example.com'))) AS leads_found,
  (SELECT count(*) FROM jobs j
   WHERE j.business_id = 'YOUR_BUSINESS_ID'::uuid
     AND j.client_id IN (
       SELECT id FROM clients WHERE business_id = 'YOUR_BUSINESS_ID'::uuid
         AND lower(trim(email)) = lower(trim('YOUR_EMAIL@example.com')))) AS jobs_by_client,
  (SELECT count(*) FROM jobs j
   WHERE j.business_id = 'YOUR_BUSINESS_ID'::uuid
     AND j.lead_id IN (
       SELECT id FROM leads WHERE business_id = 'YOUR_BUSINESS_ID'::uuid
         AND lower(trim(email)) = lower(trim('YOUR_EMAIL@example.com')))) AS jobs_by_lead;


-- =============================================================================
-- 3. List recent jobs and their client/lead emails (replace YOUR_BUSINESS_ID)
-- =============================================================================

SELECT j.id, j.created_at, j.service_type, j.client_id, j.lead_id,
       c.email AS client_email,
       l.email AS lead_email
FROM jobs j
LEFT JOIN clients c ON c.id = j.client_id
LEFT JOIN leads l ON l.id = j.lead_id
WHERE j.business_id = 'YOUR_BUSINESS_ID'::uuid
ORDER BY j.created_at DESC
LIMIT 20;
