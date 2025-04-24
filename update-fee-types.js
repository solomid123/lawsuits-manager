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

async function updateFeeTypes() {
  try {
    console.log('Updating fee_type values based on case_value...')
    
    // First, check if the fee_type column exists
    try {
      const { data: testData, error: testError } = await supabase
        .from('cases')
        .select('fee_type')
        .limit(1)
      
      if (testError && testError.message.includes('fee_type')) {
        console.error('The fee_type column does not exist. Please run the migration first.')
        console.log(`
Please execute this SQL in the Supabase SQL Editor:

ALTER TABLE "cases" 
ADD COLUMN IF NOT EXISTS "fee_type" VARCHAR DEFAULT 'fixed';
        `)
        return
      }
    } catch (error) {
      console.error('Error checking column:', error)
      return
    }
    
    // Get all cases with case_value
    const { data: cases, error: getError } = await supabase
      .from('cases')
      .select('id, case_value')
      .not('case_value', 'is', null)
    
    if (getError) {
      console.error('Error getting cases:', getError)
      return
    }
    
    console.log(`Found ${cases.length} cases with case_value set`)
    
    let updatedCount = 0
    let errorCount = 0
    
    // Update each case with the appropriate fee_type
    for (const caseItem of cases) {
      const feeType = caseItem.case_value > 100 ? 'fixed' : 'percentage'
      
      const { error: updateError } = await supabase
        .from('cases')
        .update({ fee_type: feeType })
        .eq('id', caseItem.id)
      
      if (updateError) {
        console.error(`Error updating case ${caseItem.id}:`, updateError)
        errorCount++
      } else {
        updatedCount++
        console.log(`Updated case ${caseItem.id}: value=${caseItem.case_value}, fee_type=${feeType}`)
      }
    }
    
    console.log(`
Update completed:
- Total cases processed: ${cases.length}
- Successfully updated: ${updatedCount}
- Errors: ${errorCount}
    `)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

updateFeeTypes() 