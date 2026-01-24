-- Fix RLS for invoices table
-- This script ensures business owners can access their invoices
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (idempotent)

-- ============================================
-- 1. Enable RLS on invoices table
-- ============================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Drop existing policies (if any) to start fresh
-- ============================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all existing policies on invoices
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON invoices';
    END LOOP;
END $$;

-- ============================================
-- 3. Create RLS policies for INVOICES table
-- ============================================

-- Business owners can view their invoices
CREATE POLICY "Business owners can view their invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owners can insert invoices
CREATE POLICY "Business owners can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owners can update their invoices
CREATE POLICY "Business owners can update their invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owners can delete their invoices
CREATE POLICY "Business owners can delete their invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 4. Also fix invoice_items table (related table)
-- ============================================
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on invoice_items
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoice_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON invoice_items';
    END LOOP;
END $$;

-- Business owners can view invoice items for their invoices
CREATE POLICY "Business owners can view invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Business owners can insert invoice items
CREATE POLICY "Business owners can insert invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Business owners can update invoice items
CREATE POLICY "Business owners can update invoice items"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Business owners can delete invoice items
CREATE POLICY "Business owners can delete invoice items"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- 5. Verification queries
-- ============================================
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('invoices', 'invoice_items')
ORDER BY tablename;

-- Check policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('invoices', 'invoice_items')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ RLS setup complete for invoices and invoice_items tables!' as status;
