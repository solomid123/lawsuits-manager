# Fix Supabase RLS Issues

This guide will help you fix the Row Level Security (RLS) issues in your Supabase project. Currently, you're experiencing issues with:
1. "فشل في تحميل المستندات" (Failed to load documents)
2. "Failed to load clients" when editing a case
3. No courts appearing in dropdown menus and the dashboard

All these issues are caused by missing or incorrect RLS policies.

## Step 1: Fix RLS for Tables

First, you need to set up RLS policies for the main tables to allow authenticated users to access them.

### SQL to Run in Supabase SQL Editor:

```sql
-- Enable RLS on all tables (if not already enabled)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Allow authenticated users full access to clients"
ON clients
FOR ALL
USING (auth.role() = 'authenticated');

-- Create policies for cases table
CREATE POLICY "Allow authenticated users full access to cases"
ON cases
FOR ALL
USING (auth.role() = 'authenticated');

-- Create policies for court_sessions table
CREATE POLICY "Allow authenticated users full access to court_sessions"
ON court_sessions
FOR ALL
USING (auth.role() = 'authenticated');

-- Create policies for courts table
CREATE POLICY "Allow authenticated users full access to courts"
ON courts
FOR ALL
USING (auth.role() = 'authenticated');

-- Create policy for public read access to courts
CREATE POLICY "Allow public read access to courts"
ON courts
FOR SELECT
USING (true);

-- Insert default courts if they don't exist
INSERT INTO courts (name, court_type)
VALUES
    ('ابتدائية', 'primary'),
    ('تجارية', 'commercial'),
    ('استئناف', 'appeal'),
    ('عليا', 'supreme')
ON CONFLICT (name) DO NOTHING;

-- Create the case_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS "case_documents" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "case_id" UUID NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "document_date" DATE,
  "file_path" VARCHAR,
  "file_name" VARCHAR,
  "file_type" VARCHAR,
  "file_size" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ
);

-- Enable RLS on case_documents
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for case_documents
CREATE POLICY "Allow authenticated users full access to case_documents"
ON case_documents
FOR ALL
USING (auth.role() = 'authenticated');
```

## Step 2: Fix Storage RLS Policies

You also need to fix the storage policies for document uploads.

### SQL for Storage Policies:

```sql
-- Storage bucket policies
CREATE POLICY "Public GET Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'case-documents');

CREATE POLICY "Authenticated User Access"
ON storage.objects
FOR ALL
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'case-documents'
);

-- Make sure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## Step 3: Create the Storage Bucket

After running the SQL commands, you need to create the storage bucket through the Supabase dashboard:

1. Go to the Supabase dashboard
2. Navigate to "Storage" in the left sidebar
3. Click "New Bucket"
4. Name it `case-documents`
5. Check the "Public bucket" option
6. Click "Create"

## Step 4: Verify Policies

After implementing these changes, you should check that the policies are in place:

1. Go to Supabase Dashboard
2. Navigate to "Authentication" → "Policies"
3. Verify that each table has the appropriate policies in place:
   - `clients`: Should have "Allow authenticated users full access to clients"
   - `cases`: Should have "Allow authenticated users full access to cases"
   - `court_sessions`: Should have "Allow authenticated users full access to court_sessions"
   - `courts`: Should have both "Allow authenticated users full access to courts" and "Allow public read access to courts"
   - `case_documents`: Should have "Allow authenticated users full access to case_documents"
4. In the Storage section, check that the `case-documents` bucket has the right policies

## Step 5: Test Your Application

After implementing these changes, test your application again:
1. Go to the dashboard - you should see all statistics and upcoming sessions
2. Try creating a new case - the courts dropdown should be populated
3. Try editing a case - the client data should load correctly
4. Try viewing documents - they should load correctly now

If you still experience issues, check the browser console for more specific error messages that might help diagnose the problem further.