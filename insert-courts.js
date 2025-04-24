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

async function insertCourts() {
  try {
    // Define the courts to insert
    const courts = [
      { name: 'ابتدائية', court_type: 'primary' },
      { name: 'تجارية', court_type: 'commercial' },
      { name: 'استئناف', court_type: 'appeal' },
      { name: 'عليا', court_type: 'supreme' }
    ]
    
    console.log('Inserting courts...')
    
    // Check if courts already exist
    const { data: existingCourts, error: checkError } = await supabase
      .from('courts')
      .select('name')
    
    if (checkError) {
      console.error('Error checking existing courts:', checkError)
      return
    }
    
    // Filter out courts that already exist
    const existingCourtNames = existingCourts.map(c => c.name)
    const courtsToInsert = courts.filter(c => !existingCourtNames.includes(c.name))
    
    if (courtsToInsert.length === 0) {
      console.log('All courts already exist, no need to insert.')
      return
    }
    
    // Insert the new courts
    const { data, error } = await supabase
      .from('courts')
      .insert(courtsToInsert)
      .select()
    
    if (error) {
      console.error('Error inserting courts:', error)
      return
    }
    
    console.log(`Successfully inserted ${courtsToInsert.length} courts:`)
    console.log(data)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

insertCourts() 