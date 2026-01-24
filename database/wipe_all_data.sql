-- Wipe All Data Script - DATA RESET ONLY (OPTIMIZED)
-- ⚠️ WARNING: This will delete ALL DATA from jobs, leads, services, and related tables
-- ✅ SAFE: This script ONLY deletes data - NO TABLES are deleted or dropped
-- ✅ All table structures, schemas, and migrations remain intact
-- Run this in your Supabase SQL Editor to start fresh with empty tables

BEGIN;

-- Disable triggers temporarily to avoid constraint issues
SET session_replication_role = 'replica';

-- Optimized: Get all existing tables in one query, then truncate
DO $$
DECLARE
    tbl_name TEXT;
    tables_to_wipe TEXT[] := ARRAY[
        -- Child/dependent tables first (order matters for foreign keys)
        'sequence_step_executions',
        'sequence_enrollments',
        'sequence_steps',
        'sequences',
        'script_usages',
        'scripts',
        'lead_interactions',
        'job_photos',
        'job_assignments',
        'time_blocks',
        'client_assets',
        'service_addons',
        'assignment_rules',
        'business_ai_addons',
        'invoice_items',
        'invoices',
        'quotes',
        -- Main operational tables
        'jobs',
        'leads',
        'services',
        'clients',
        'team_members',
        'signup_leads'
    ];
    existing_tables TEXT[];
BEGIN
    -- Get all existing tables in one query (more efficient)
    SELECT ARRAY_AGG(table_name::TEXT)
    INTO existing_tables
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_name = ANY(tables_to_wipe);
    
    -- Truncate all existing tables at once (faster than loop)
    IF existing_tables IS NOT NULL AND array_length(existing_tables, 1) > 0 THEN
        EXECUTE 'TRUNCATE TABLE ' || array_to_string(
            ARRAY(SELECT quote_ident(t) FROM unnest(existing_tables) t),
            ', '
        ) || ' CASCADE';
        RAISE NOTICE 'Truncated % tables: %', array_length(existing_tables, 1), array_to_string(existing_tables, ', ');
    END IF;
    
    -- Handle any tables that might need DELETE instead (e.g., RLS issues)
    FOREACH tbl_name IN ARRAY tables_to_wipe
    LOOP
        IF existing_tables IS NULL OR NOT (tbl_name = ANY(existing_tables)) THEN
            RAISE NOTICE 'Table does not exist, skipping: %', tbl_name;
        END IF;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    -- Fallback: If bulk truncate fails, try individual deletes
    RAISE NOTICE 'Bulk truncate failed, falling back to individual deletes: %', SQLERRM;
    FOREACH tbl_name IN ARRAY tables_to_wipe
    LOOP
        BEGIN
            EXECUTE 'DELETE FROM ' || quote_ident(tbl_name);
            RAISE NOTICE 'Deleted from: %', tbl_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipped % (may not exist or has constraints): %', tbl_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Users table (special handling - only delete if it exists and is not auth.users)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_name = 'users'
    ) THEN
        DELETE FROM users WHERE id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Cleaned public.users table (preserved auth.users)';
    ELSE
        RAISE NOTICE 'public.users table does not exist, skipping';
    END IF;
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================
-- Verification: Show remaining row counts (optimized single query)
-- ============================================
DO $$
DECLARE
    result RECORD;
    total_rows INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION: Checking remaining rows';
    RAISE NOTICE '========================================';
    
    -- Single optimized query to check all tables at once
    FOR result IN
        SELECT 
            t.table_name,
            COALESCE(c.reltuples::BIGINT, 0) as estimated_rows
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        WHERE t.table_schema = 'public'
        AND t.table_name IN (
            'jobs', 'leads', 'services', 'clients', 'team_members',
            'sequences', 'scripts', 'job_assignments', 'signup_leads',
            'sequence_step_executions', 'sequence_enrollments', 'sequence_steps',
            'script_usages', 'lead_interactions', 'job_photos',
            'time_blocks', 'client_assets', 'service_addons',
            'assignment_rules', 'business_ai_addons',
            'invoice_items', 'invoices', 'quotes'
        )
        ORDER BY t.table_name
    LOOP
        IF result.estimated_rows > 0 THEN
            RAISE NOTICE '⚠️  % may have ~% rows (estimated)', result.table_name, result.estimated_rows;
            total_rows := total_rows + result.estimated_rows;
        ELSE
            RAISE NOTICE '✅ % is empty', result.table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    IF total_rows = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All tables appear to be empty!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Some tables may still have data!';
        RAISE NOTICE 'Run the verification query below for exact counts.';
    END IF;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================
-- Final verification query (run this separately if needed)
-- ============================================
SELECT 
    'jobs' as table_name, COUNT(*) as remaining_rows FROM jobs
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'sequences', COUNT(*) FROM sequences
UNION ALL
SELECT 'scripts', COUNT(*) FROM scripts
UNION ALL
SELECT 'job_assignments', COUNT(*) FROM job_assignments
UNION ALL
SELECT 'signup_leads', COUNT(*) FROM signup_leads
ORDER BY remaining_rows DESC;

-- ============================================
-- Note: This script does NOT delete:
-- - businesses table (structure preserved)
-- - auth.users (authentication users preserved)
-- - Table structures (only data is deleted)
-- ============================================
