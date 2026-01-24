# Fixing Phone Number Data Issue

## Problem
A script was run that updated all leads to have the same phone number (likely a test number like `+18015551234`).

## Diagnosis
Run `diagnose_phone_numbers.sql` first to see:
- How many leads are affected
- If any leads still have unique phone numbers
- The pattern of when this happened

## Recovery Options

### Option 1: If you have a backup
1. Restore from a Supabase backup taken before the script was run
2. This is the cleanest solution if available

### Option 2: If you have source data elsewhere
If phone numbers are stored in:
- Email service (Mailchimp, etc.)
- CRM export
- Another database
- Logs/analytics

You can create a mapping table and update leads:

```sql
-- Example: Create a mapping table
CREATE TABLE IF NOT EXISTS lead_phone_restore (
  lead_id UUID,
  correct_phone TEXT,
  source TEXT -- where you got this data from
);

-- Insert your mapping data
-- INSERT INTO lead_phone_restore (lead_id, correct_phone, source) VALUES ...

-- Update leads with correct phone numbers
UPDATE leads l
SET phone = r.correct_phone
FROM lead_phone_restore r
WHERE l.id = r.lead_id
AND r.correct_phone IS NOT NULL;
```

### Option 3: If phone numbers are in email or other fields
Check if phone numbers might be stored in:
- `notes` field
- `email` field (unlikely but possible)
- Other custom fields

```sql
-- Search notes for phone-like patterns
SELECT id, name, email, phone, notes
FROM leads
WHERE notes ~ '\+?[0-9]{10,}' -- regex for phone-like patterns
LIMIT 50;
```

### Option 4: If data is truly lost
Unfortunately, if there's no backup and no other source:
- You'll need to manually update leads as you contact them
- Or mark affected leads and ask customers to re-enter their phone numbers

## Prevention
1. **Always backup before running UPDATE scripts**
2. **Test UPDATE scripts on a single record first**
3. **Use transactions with ROLLBACK capability**
4. **Add WHERE clauses to limit scope**

## Example Safe Update Pattern
```sql
BEGIN;

-- First, see what will be affected
SELECT id, name, phone 
FROM leads 
WHERE phone = 'old_value'
LIMIT 10;

-- If that looks right, update ONE record first
UPDATE leads 
SET phone = 'new_value'
WHERE id = 'single-lead-id-here';

-- Check the result
SELECT id, name, phone 
FROM leads 
WHERE id = 'single-lead-id-here';

-- If good, update the rest
-- UPDATE leads SET phone = 'new_value' WHERE phone = 'old_value';

-- If anything looks wrong:
-- ROLLBACK;

-- If everything looks good:
-- COMMIT;
```
