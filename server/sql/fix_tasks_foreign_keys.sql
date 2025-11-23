-- ============================================
-- Fix foreign key constraints for tasks table
-- ============================================
-- 
-- PROBLEM: The tasks table has foreign keys referencing users(id),
-- but the actual table is staff. We need to fix the foreign key constraints.
--
-- SOLUTION: Drop the old foreign keys and create new ones pointing to staff table

-- Drop existing foreign key constraints if they exist
ALTER TABLE tasks 
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey,
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

-- Update assigned_to to reference staff table instead of users
-- Note: This assumes assigned_to should reference staff.id
-- If your schema is different, adjust accordingly
ALTER TABLE tasks
  ADD CONSTRAINT tasks_assigned_to_fkey 
  FOREIGN KEY (assigned_to) 
  REFERENCES staff(id) 
  ON DELETE SET NULL;

-- For created_by, we have two options:
-- Option 1: Reference staff table (if the creator is a staff member)
-- Option 2: Reference companies.auth_user_id (if the creator is the company admin)
-- Option 3: Keep it as UUID and don't enforce foreign key (most flexible)

-- Option 3 (Recommended): Don't enforce foreign key for created_by
-- This allows flexibility since created_by can be either staff or company auth_user_id
-- Just ensure it's a valid UUID in your application logic

-- If you want to enforce it, uncomment one of these:

-- Option 1: Reference staff
-- ALTER TABLE tasks
--   ADD CONSTRAINT tasks_created_by_fkey 
--   FOREIGN KEY (created_by) 
--   REFERENCES staff(id) 
--   ON DELETE SET NULL;

-- Option 2: Reference companies.auth_user_id (requires creating a unique constraint first)
-- ALTER TABLE companies ADD CONSTRAINT companies_auth_user_id_unique UNIQUE (auth_user_id);
-- ALTER TABLE tasks
--   ADD CONSTRAINT tasks_created_by_fkey 
--   FOREIGN KEY (created_by) 
--   REFERENCES companies(auth_user_id) 
--   ON DELETE SET NULL;

-- ============================================
-- Enable RLS for tasks table
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can view their tasks" ON tasks;
DROP POLICY IF EXISTS "Companies can create tasks" ON tasks;
DROP POLICY IF EXISTS "Companies can update their tasks" ON tasks;
DROP POLICY IF EXISTS "Companies can delete their tasks" ON tasks;

-- Policy: Companies can view their own tasks
CREATE POLICY "Companies can view their tasks"
  ON tasks FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Companies can create tasks
CREATE POLICY "Companies can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Companies can update their own tasks
CREATE POLICY "Companies can update their tasks"
  ON tasks FOR UPDATE
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

-- Policy: Companies can delete their own tasks
CREATE POLICY "Companies can delete their tasks"
  ON tasks FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE auth_user_id = auth.uid()
    )
  );

