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

async function checkCourts() {
  try {
    console.log('Checking courts table...')
    
    // Get table information
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_definition', { table_name: 'courts' })
    
    if (tableError) {
      console.error('Error getting table info:', tableError)
      console.log('Trying direct query instead...')
    } else {
      console.log('Table definition:', tableInfo)
    }
    
    // List all courts
    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
    
    if (error) {
      console.error('Error getting courts:', error)
      return
    }
    
    console.log(`Found ${courts.length} courts:`)
    console.log(JSON.stringify(courts, null, 2))
    
    // Check permissions on the courts table
    const { data: authData } = await supabase.auth.getSession()
    console.log('Current auth status:', authData ? 'Authenticated' : 'Not authenticated')
    
    // Try to insert a test court to check write permissions
    console.log('Testing court write permissions...')
    const testCourt = {
      name: 'Test Court ' + new Date().toISOString(),
      court_type: 'test'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('courts')
      .insert(testCourt)
      .select()
    
    if (insertError) {
      console.error('Error inserting test court (this might be expected if you have row-level security):', insertError)
    } else {
      console.log('Successfully inserted test court:', insertData)
      
      // Clean up the test court
      const { error: deleteError } = await supabase
        .from('courts')
        .delete()
        .eq('id', insertData[0].id)
      
      if (deleteError) {
        console.error('Error deleting test court:', deleteError)
      } else {
        console.log('Successfully cleaned up test court')
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkCourts() 