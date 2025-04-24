const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env.local file.')
  process.exit(1)
}

console.log(`Connecting to Supabase: ${supabaseUrl}`)
const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigrations() {
  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('./db-migration.sql', 'utf8')
    
    // Split by semicolon to execute each statement separately
    const statements = migrationSQL.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}:`)
      console.log(statement)
      
      const { error } = await supabase.rpc('pgmigrate', { query: statement })
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error)
      } else {
        console.log(`Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('Migration completed!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigrations() 