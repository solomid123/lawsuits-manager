-- This script ensures that both case-documents and receipts buckets exist
-- and have the proper permissions for file access

-- 1. Create both buckets if they don't exist
DO $$
BEGIN
    -- Create case-documents bucket
    BEGIN
        INSERT INTO storage.buckets (id, name, public, avif_autodetection)
        VALUES ('case-documents', 'case-documents', true, false);
        RAISE NOTICE 'Created case-documents bucket';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'case-documents bucket already exists';
    END;
    
    -- Create receipts bucket
    BEGIN
        INSERT INTO storage.buckets (id, name, public, avif_autodetection)
        VALUES ('receipts', 'receipts', true, false);
        RAISE NOTICE 'Created receipts bucket';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'receipts bucket already exists';
    END;
END $$;

-- 2. Set both buckets to public access
UPDATE storage.buckets
SET public = true
WHERE id IN ('case-documents', 'receipts');

-- 3. Create/update bucket policies for both buckets

-- Public read access for case-documents
DO $$
BEGIN
    -- Create or replace public read policy for case-documents
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Public Read Policy for case-documents', 
            'case-documents', 
            '(bucket_id = ''case-documents'')::boolean', 
            '{"SELECT"}', 
            '{"authenticated", "anon"}'
        );
        RAISE NOTICE 'Created public read policy for case-documents';
    EXCEPTION WHEN unique_violation THEN
        UPDATE storage.policies
        SET definition = '(bucket_id = ''case-documents'')::boolean',
            actions = '{"SELECT"}',
            roles = '{"authenticated", "anon"}'
        WHERE name = 'Public Read Policy for case-documents'
          AND bucket_id = 'case-documents';
        RAISE NOTICE 'Updated public read policy for case-documents';
    END;
    
    -- Create or replace public read policy for receipts
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Public Read Policy for receipts', 
            'receipts', 
            '(bucket_id = ''receipts'')::boolean', 
            '{"SELECT"}', 
            '{"authenticated", "anon"}'
        );
        RAISE NOTICE 'Created public read policy for receipts';
    EXCEPTION WHEN unique_violation THEN
        UPDATE storage.policies
        SET definition = '(bucket_id = ''receipts'')::boolean',
            actions = '{"SELECT"}',
            roles = '{"authenticated", "anon"}'
        WHERE name = 'Public Read Policy for receipts'
          AND bucket_id = 'receipts';
        RAISE NOTICE 'Updated public read policy for receipts';
    END;
END $$;

-- Create write access policies
DO $$
BEGIN
    -- Upload policies for case-documents
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Upload Policy for case-documents', 
            'case-documents', 
            '(bucket_id = ''case-documents'')::boolean', 
            '{"INSERT"}', 
            '{"authenticated"}'
        );
        RAISE NOTICE 'Created upload policy for case-documents';
    EXCEPTION WHEN unique_violation THEN
        UPDATE storage.policies
        SET definition = '(bucket_id = ''case-documents'')::boolean',
            actions = '{"INSERT"}',
            roles = '{"authenticated"}'
        WHERE name = 'Upload Policy for case-documents'
          AND bucket_id = 'case-documents';
        RAISE NOTICE 'Updated upload policy for case-documents';
    END;
    
    -- Upload policies for receipts
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Upload Policy for receipts', 
            'receipts', 
            '(bucket_id = ''receipts'')::boolean', 
            '{"INSERT"}', 
            '{"authenticated"}'
        );
        RAISE NOTICE 'Created upload policy for receipts';
    EXCEPTION WHEN unique_violation THEN
        UPDATE storage.policies
        SET definition = '(bucket_id = ''receipts'')::boolean',
            actions = '{"INSERT"}',
            roles = '{"authenticated"}'
        WHERE name = 'Upload Policy for receipts'
          AND bucket_id = 'receipts';
        RAISE NOTICE 'Updated upload policy for receipts';
    END;
END $$;

-- Create delete policies
DO $$
BEGIN
    -- Delete policies for case-documents
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Delete Policy for case-documents', 
            'case-documents', 
            '(bucket_id = ''case-documents'')::boolean', 
            '{"DELETE"}', 
            '{"authenticated"}'
        );
        RAISE NOTICE 'Created delete policy for case-documents';
    EXCEPTION WHEN unique_violation THEN
        UPDATE storage.policies
        SET definition = '(bucket_id = ''case-documents'')::boolean',
            actions = '{"DELETE"}',
            roles = '{"authenticated"}'
        WHERE name = 'Delete Policy for case-documents'
          AND bucket_id = 'case-documents';
        RAISE NOTICE 'Updated delete policy for case-documents';
    END;
    
    -- Delete policies for receipts
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Delete Policy for receipts', 
            'receipts', 
            '(bucket_id = ''receipts'')::boolean', 
            '{"DELETE"}', 
            '{"authenticated"}'
        );
        RAISE NOTICE 'Created delete policy for receipts';
    EXCEPTION WHEN unique_violation THEN
        UPDATE storage.policies
        SET definition = '(bucket_id = ''receipts'')::boolean',
            actions = '{"DELETE"}',
            roles = '{"authenticated"}'
        WHERE name = 'Delete Policy for receipts'
          AND bucket_id = 'receipts';
        RAISE NOTICE 'Updated delete policy for receipts';
    END;
END $$; 