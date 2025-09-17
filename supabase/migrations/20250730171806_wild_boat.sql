/*
  # Fix Authentication and RLS Policy Issues

  1. Security Policies
    - Remove problematic RLS policies that cause infinite recursion
    - Create simple, safe policies for the users table
    - Ensure policies don't reference themselves

  2. User Management
    - Set up proper RLS for all tables
    - Create safe access patterns
*/

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with safe policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple, safe policies that don't cause recursion
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure other tables have proper RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all authenticated users" ON resources
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON resources
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON reservations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON maintenance_tasks
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);