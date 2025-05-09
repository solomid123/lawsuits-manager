const { createClient } = require('@supabase/supabase-js'); require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env.local file.')
  process.exit(1)
}

console.log(`Connecting to Supabase: ${supabaseUrl}`)
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyRlsPolicies() {
  console.log("\n====== VERIFYING ALL RLS POLICIES ======\n")
  
  // Check authentication status
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  console.log('Authentication status:', session ? 'Authenticated' : 'Not authenticated')
  
  if (session) {
    console.log('User ID:', session.user.id)
    console.log('User email:', session.user.email)
  } else {
    console.log('WARNING: You are not authenticated. Some tests may fail.')
  }
  
  // Tables to check
  const tables = [
    'clients',
    'cases',
    'court_sessions',
    'courts',
    'case_documents'
  ]
  
  const results = {
    success: [],
    failure: []
  }
  
  // Check each table
  for (const table of tables) {
    console.log(`\n----- Checking "${table}" table -----`)
    
    try {
      // Try to select from the table
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5)
      
      if (error) {
        console.error(`❌ Error accessing ${table}:`, error)
        results.failure.push({ table, operation: 'select', error })
      } else {
        console.log(`✅ Successfully accessed ${table} (found ${data.length} rows)`)
        results.success.push({ table, operation: 'select' })
      }
    } catch (error) {
      console.error(`❌ Unexpected error with ${table}:`, error)
      results.failure.push({ table, operation: 'select', error })
    }
  }
  
  // Check storage
  console.log("\n----- Checking storage -----")
  try {
    // Try to list files in the storage bucket
    const { data, error } = await supabase.storage
      .from('case-documents')
      .list()
    
    if (error) {
      console.error('❌ Error accessing storage:', error)
      results.failure.push({ table: 'storage', operation: 'list', error })
    } else {
      console.log(`✅ Successfully accessed storage (found ${data.length} files)`)
      results.success.push({ table: 'storage', operation: 'list' })
    }
  } catch (error) {
    console.error('❌ Unexpected error with storage:', error)
    results.failure.push({ table: 'storage', operation: 'list', error })
  }
  
  // Print summary
  console.log("\n====== RLS POLICY VERIFICATION SUMMARY ======\n")
  console.log(`Total successful operations: ${results.success.length}`)
  console.log(`Total failed operations: ${results.failure.length}`)
  
  if (results.failure.length > 0) {
    console.log("\n----- Failed operations: -----")
    for (const failure of results.failure) {
      if (failure.table) {
        console.log(`❌ ${failure.table} (${failure.operation}): ${failure.error.message}`)
      } else if (failure.query) {
        console.log(`❌ Query ${failure.query}: ${failure.error.message}`)
      }
    }
    
    console.log("\nSuggested fix: Run the SQL commands in fix-supabase-rls-issues.md")
  } else {
    console.log("\n✅ All RLS policies appear to be working correctly!")
  }
}

verifyRlsPolicies()
