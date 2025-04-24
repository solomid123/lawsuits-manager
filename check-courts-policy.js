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

async function checkCourtsPolicy() {
  try {
    console.log('\n===== CHECKING COURTS TABLE POLICIES =====\n')
    
    // First, check if there's an issue with authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('Authentication error:', authError)
      return
    }
    
    console.log('Authentication status:', session ? 'Authenticated' : 'Not authenticated')
    
    if (session) {
      console.log('User ID:', session.user.id)
      console.log('User email:', session.user.email)
    }
    
    // Check if we can access courts with the anon key
    console.log('\nAttempting to access courts with anon key...')
    const { data: courtsData, error: courtsError } = await supabase
      .from('courts')
      .select('*')
    
    if (courtsError) {
      console.error('Error accessing courts:', courtsError)
      
      if (courtsError.code === 'PGRST301') {
        console.log('\nTHIS IS A ROW LEVEL SECURITY ISSUE.')
        console.log('The courts table has RLS enabled but no policy allows access.')
        console.log('\nTo fix this, you need to add a policy that allows public read access to the courts table:')
        console.log(`
        1. Go to the Supabase dashboard
        2. Navigate to Authentication > Policies
        3. Find the "courts" table
        4. Click "New Policy"
        5. Select "SELECT" (for read-only access)
        6. Policy name: "Allow public read access"
        7. Using expression: true
        8. Click "Review" then "Save policy"
        `)
      }
    } else {
      console.log(`Successfully retrieved ${courtsData.length} courts`)
      console.log('First court:', courtsData[0])
    }
    
    // Try to check policies directly (requires admin privileges)
    console.log('\nAttempting to check RLS policies directly... (may fail without admin rights)')
    try {
      const { data: policies, error: policiesError } = await supabase.rpc('get_policies_for_table', { 
        table_name: 'courts' 
      })
      
      if (policiesError) {
        console.error('Error checking policies:', policiesError)
      } else {
        console.log('Court table policies:', policies)
      }
    } catch (e) {
      console.log('Could not check policies directly (requires admin rights):', e.message)
    }
    
    console.log('\n===== COURT ACCESS CHECK COMPLETE =====')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkCourtsPolicy() 