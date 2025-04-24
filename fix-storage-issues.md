# How to Fix Document Loading Issues

The error "فشل في تحميل المستندات" (Failed to load documents) is occurring because of permission issues with the Supabase storage bucket. Here's how to fix it:

## 1. Check Storage Bucket Setup

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to "Storage" in the left sidebar
4. Check if the `case-documents` bucket exists
   - If it doesn't exist, create it by clicking "New Bucket"
   - Name it `case-documents`
   - Check "Public bucket" to make it public

## 2. Fix Storage Bucket Policies

The main issue is with Row-Level Security (RLS) policies that are preventing access to the documents. You need to create policies that allow:

1. While in the Storage section, click on "Policies"
2. Look for the `case-documents` bucket
3. Add these policies:

### For Public Read Access:
1. Click "New Policy"
2. Select "GET" (download objects)
3. Policy name: `Public Access`
4. Policy definition: 
```sql
true
```
5. Click "Save"

### For Authenticated User Access:
1. Click "New Policy"
2. Select "All" for full CRUD operations
3. Policy name: `Authenticated Access`
4. Policy definition:
```sql
auth.role() = 'authenticated'
```
5. Click "Save"

## 3. Test Document Access

After setting up the policies, try accessing the documents page again. The "Failed to load documents" error should be resolved.

## Additional Troubleshooting

If you're still having issues:

1. Check your browser's developer console for any errors
2. Verify that the document paths stored in your database are correct
3. Ensure the `case_documents` table has the correct columns:
   - `file_path`
   - `file_name`
   - `file_type`
   - `file_size`

You can run this SQL to ensure these columns exist:

```sql
ALTER TABLE "case_documents" 
ADD COLUMN IF NOT EXISTS "file_path" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_name" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_type" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_size" INTEGER;
``` 