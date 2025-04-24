-- Create the receipts storage bucket if it doesn't exist
DO $$
BEGIN
    -- Attempt to create the bucket
    BEGIN
        INSERT INTO storage.buckets (id, name, public, avif_autodetection)
        VALUES ('receipts', 'receipts', true, false);
        RAISE NOTICE 'Created receipts bucket';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Receipts bucket already exists';
    END;
    
    -- Create bucket policies
    -- Allow public read access for authenticated users
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Public Read Policy for Receipts', 
            'receipts', 
            '(bucket_id = ''receipts'')::boolean', 
            '{"SELECT"}', 
            '{"authenticated"}'
        );
        RAISE NOTICE 'Created public read policy for receipts';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Public read policy already exists';
    END;

    -- Allow authenticated users to upload
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Upload Policy for Receipts', 
            'receipts', 
            '(bucket_id = ''receipts'')::boolean', 
            '{"INSERT"}', 
            '{"authenticated"}'
        );
        RAISE NOTICE 'Created upload policy for receipts';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Upload policy already exists';
    END;

    -- Allow authenticated users to delete their own files
    BEGIN
        INSERT INTO storage.policies (name, bucket_id, definition, actions, roles)
        VALUES (
            'Delete Policy for Receipts', 
            'receipts', 
            '(bucket_id = ''receipts'')::boolean', 
            '{"DELETE"}', 
            '{"authenticated"}'
        );
        RAISE NOTICE 'Created delete policy for receipts';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Delete policy already exists';
    END;
END $$; 