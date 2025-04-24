const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env.local file.')
  process.exit(1)
}

console.log(`Connecting to Supabase: ${supabaseUrl}`)
const supabase = createClient(supabaseUrl, supabaseKey)

async function setupStorage() {
  const bucketName = 'case-documents'
  
  try {
    console.log(`Setting up storage bucket: ${bucketName}`)
    
    // Check if the bucket already exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError)
      return
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName)
    
    // Create the bucket if it doesn't exist
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`)
      
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make bucket public
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
        return
      }
      
      console.log(`Bucket created successfully: ${bucketName}`)
    } else {
      console.log(`Bucket already exists: ${bucketName}`)
      
      // Update bucket to ensure it's public
      const { error } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
      })
      
      if (error) {
        console.error('Error updating bucket:', error)
        return
      }
      
      console.log(`Bucket updated successfully: ${bucketName}`)
    }
    
    // Setup public access policy for the bucket
    try {
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: bucketName,
        policy_name: `${bucketName}_public_access`,
        definition: `(bucket_id = '${bucketName}'::text)`
      })
      
      if (policyError) {
        console.log('Note: Could not create storage policy using RPC. This might be normal if you don\'t have admin access.')
        console.log('You can manually set up policies in the Supabase dashboard:')
        console.log('1. Go to Storage > Policies')
        console.log('2. Create a new policy for the case-documents bucket')
        console.log('3. Allow public read access for files')
      } else {
        console.log('Public access policy created successfully')
      }
    } catch (policyError) {
      console.log('Note: Could not create storage policy. You may need to set it up manually.')
    }
    
    console.log('Storage setup completed successfully')
    console.log(`
To complete the setup, make sure to:
1. Add the 'file_path', 'file_name', 'file_type', and 'file_size' columns to your case_documents table
2. Ensure your Supabase storage policies allow uploads and downloads for authenticated users

You can run this SQL in the Supabase SQL Editor:

ALTER TABLE "case_documents" 
ADD COLUMN IF NOT EXISTS "file_path" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_name" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_type" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_size" INTEGER;
    `)
    
  } catch (error) {
    console.error('Error setting up storage:', error)
  }
}

setupStorage() 