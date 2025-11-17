-- ============================================
-- Fix for infinite recursion in staff RLS policy
-- ============================================
-- 
-- PROBLEM: The original policy causes infinite recursion because it tries to
-- SELECT from staff table to check permissions, which triggers the same policy again.
--
-- SOLUTION: Use a SECURITY DEFINER function that bypasses RLS, or use
-- a different approach that doesn't query the same table.

-- ============================================
-- SOLUTION 1: Using SECURITY DEFINER function (RECOMMENDED)
-- ============================================

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Staff can view same company" ON staff;

-- Create a SECURITY DEFINER function that bypasses RLS to get the user's company_id
CREATE OR REPLACE FUNCTION get_staff_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_company_id UUID;
BEGIN
  -- This query bypasses RLS because the function is SECURITY DEFINER
  SELECT company_id INTO user_company_id
  FROM staff
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_company_id;
END;
$$;

-- Now create the policy using the function (which bypasses RLS)
CREATE POLICY "Staff can view same company"
  ON staff FOR SELECT
  USING (
    company_id = get_staff_company_id()
  );

-- ============================================
-- SOLUTION 2: Allow company admins to view their staff
-- ============================================
-- This allows company users (from companies table) to view all staff in their company
-- This doesn't cause recursion because it queries the companies table, not staff

CREATE POLICY "Company admins can view their staff"
  ON staff FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- SOLUTION 3: Allow staff to view their own record
-- ============================================
-- This is always safe and doesn't cause recursion

CREATE POLICY "Staff can view own record"
  ON staff FOR SELECT
  USING (auth_user_id = auth.uid());

-- ============================================
-- NOTES:
-- ============================================
-- 1. Service role operations (using service_role_key) automatically bypass RLS,
--    so your server-side code will work without issues.
--
-- 2. The SECURITY DEFINER function runs with the privileges of the function owner
--    (usually the database superuser), so it can read from staff table without
--    triggering RLS policies.
--
-- 3. If you want to combine all three policies, you can use OR:
--    USING (
--      auth_user_id = auth.uid() OR
--      company_id = get_staff_company_id() OR
--      company_id IN (SELECT id FROM companies WHERE auth_user_id = auth.uid())
--    )

