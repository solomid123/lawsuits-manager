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

async function addSessionTimeColumn() {
  try {
    console.log('Adding session_time and session_type columns to court_sessions table...')
    
    // Execute the alter table query directly using RPSQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: `
        ALTER TABLE "court_sessions"
        ADD COLUMN IF NOT EXISTS "session_time" VARCHAR,
        ADD COLUMN IF NOT EXISTS "session_type" VARCHAR;
      `
    })
    
    if (error) {
      if (error.message.includes('exec_sql')) {
        console.log('The exec_sql RPC function is not available. Alternative approach required.')
        console.log('Please execute this SQL in the Supabase SQL Editor:')
        console.log(`
ALTER TABLE "court_sessions"
ADD COLUMN IF NOT EXISTS "session_time" VARCHAR,
ADD COLUMN IF NOT EXISTS "session_type" VARCHAR;
        `)
        
        // Fallback to checking if the column exists
        await checkColumns()
      } else {
        console.error('Error adding columns:', error)
      }
    } else {
      console.log('Successfully added columns to court_sessions table')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

async function checkColumns() {
  try {
    console.log('Checking if session_time column exists...')
    
    // Try to select using the session_time column
    const { data, error } = await supabase
      .from('court_sessions')
      .select('session_time')
      .limit(1)
    
    if (error) {
      console.error('Error checking column:', error)
      if (error.message.includes('session_time')) {
        console.log(`
The 'session_time' column doesn't exist. You need to add it manually.
Please go to the Supabase dashboard and execute the SQL in the SQL Editor.
        `)
      }
    } else {
      console.log('The session_time column exists!')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

addSessionTimeColumn() 