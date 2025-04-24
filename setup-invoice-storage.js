// Script to create and configure the 'invoice-documents' bucket in Supabase Storage
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and service role key are required')
  console.error('Make sure to set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupStorage() {
  const bucketName = 'invoice-documents'
  
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
        allowedMimeTypes: ['application/pdf']
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
        allowedMimeTypes: ['application/pdf']
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
        console.log('2. Create a new policy for the invoice-documents bucket')
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
1. Add the 'pdf_url' column to your invoices table if it doesn't exist already
2. Ensure your Supabase storage policies allow uploads and downloads for authenticated users

You can run this SQL in the Supabase SQL Editor:

ALTER TABLE "invoices" 
ADD COLUMN IF NOT EXISTS "pdf_url" VARCHAR;
    `)
    
  } catch (error) {
    console.error('Error setting up storage:', error)
  }
}

setupStorage() 