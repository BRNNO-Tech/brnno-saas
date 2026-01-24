-- Diagnostic script to check phone number issues in leads table
-- Run this in Supabase SQL Editor to see the extent of the problem

-- 1. Count how many leads have the same phone number
SELECT 
  phone,
  COUNT(*) as lead_count,
  MIN(created_at) as earliest_lead,
  MAX(created_at) as latest_lead
FROM leads
WHERE phone IS NOT NULL
GROUP BY phone
ORDER BY lead_count DESC
LIMIT 20;

-- 2. Check if there are any leads with different phone numbers
SELECT 
  COUNT(DISTINCT phone) as unique_phone_numbers,
  COUNT(*) as total_leads_with_phone,
  COUNT(*) - COUNT(DISTINCT phone) as leads_with_duplicate_phones
FROM leads
WHERE phone IS NOT NULL;

-- 3. Show leads that might have been affected (same phone, different names/emails)
SELECT 
  id,
  name,
  email,
  phone,
  created_at,
  source
FROM leads
WHERE phone IS NOT NULL
ORDER BY phone, created_at DESC
LIMIT 50;

-- 4. Check if there's a pattern (e.g., all leads from a certain time period)
SELECT 
  DATE(created_at) as date_created,
  phone,
  COUNT(*) as count
FROM leads
WHERE phone IS NOT NULL
GROUP BY DATE(created_at), phone
ORDER BY date_created DESC, count DESC;
