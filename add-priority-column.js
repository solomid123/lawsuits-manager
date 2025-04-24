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

async function addPriorityColumn() {
  try {
    console.log('Checking if the priority column exists...')
    
    // Try to select from the 'cases' table using the 'priority' column
    const { data, error } = await supabase
      .from('cases')
      .select('priority')
      .limit(1)
    
    if (error) {
      console.error('Error checking priority column:', error)
      
      if (error.message.includes('priority')) {
        console.log('Priority column does not exist. Creating it...')
        
        // You need to execute raw SQL to alter the table.
        // Unfortunately, this requires elevated permissions in Supabase.
        console.log(`
The 'priority' column doesn't exist in the 'cases' table.
To add it, please follow these steps:

1. Log in to your Supabase dashboard: https://app.supabase.io
2. Select your project
3. Go to the "SQL Editor" tab
4. Execute the following SQL:

ALTER TABLE "cases" 
ADD COLUMN IF NOT EXISTS "priority" VARCHAR NOT NULL DEFAULT 'medium';

This will add the missing 'priority' column to your cases table.
        `)
      }
      return
    }
    
    console.log('The priority column exists in the cases table.')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

addPriorityColumn() 