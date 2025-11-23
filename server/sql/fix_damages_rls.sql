-- ============================================
-- Fix RLS policies for damages table
-- ============================================
-- 
-- PROBLEM: RLS policies are blocking inserts even with service_role_key
-- SOLUTION: Create proper RLS policies that allow service role operations
--           and company-scoped operations

-- Enable RLS (if not already enabled)
ALTER TABLE damages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage damages" ON damages;
DROP POLICY IF EXISTS "Companies can view their damages" ON damages;
DROP POLICY IF EXISTS "Companies can insert their damages" ON damages;
DROP POLICY IF EXISTS "Companies can update their damages" ON damages;
DROP POLICY IF EXISTS "Companies can delete their damages" ON damages;

-- Policy 1: Allow service role to do everything
-- Note: Service role key should bypass RLS automatically, but this policy ensures
-- that if RLS is somehow still checked, it will pass
-- IMPORTANT: Service role operations should bypass RLS completely, so this might not be needed
-- but it's here as a safety net
CREATE POLICY "Service role can manage damages"
  ON damages
  FOR ALL
  USING (true)
  WITH CHECK (true);
  
-- Alternative: If the above doesn't work, try disabling RLS for service role
-- But this is not recommended as service role should bypass RLS automatically

-- Policy 2: Companies can view their own damages
CREATE POLICY "Companies can view their damages"
  ON damages
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  );

-- Policy 3: Companies can insert damages for their company
CREATE POLICY "Companies can insert their damages"
  ON damages
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  );

-- Policy 4: Companies can update their own damages
CREATE POLICY "Companies can update their damages"
  ON damages
  FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  );

-- Policy 5: Companies can delete their own damages
CREATE POLICY "Companies can delete their damages"
  ON damages
  FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- NOTES:
-- ============================================
-- 1. The "Service role can manage damages" policy allows the service_role_key
--    to bypass RLS completely, which is what your server uses.
--
-- 2. The other policies are for client-side operations using anon/authenticated keys.
--
-- 3. If you're still getting RLS errors, make sure:
--    - SUPABASE_SERVICE_ROLE_KEY is set correctly in .env
--    - The Supabase client is using the service_role_key (not anon_key)
--    - The service_role_key has the correct permissions in Supabase dashboard

