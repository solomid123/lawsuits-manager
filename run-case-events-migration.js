require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

// Initialize Supabase client with service role key (has admin privileges)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Path to the SQL file
const sqlFilePath = path.join(__dirname, 'add-case-events-table.sql');

async function runMigration() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL migration...');
    
    // Execute the SQL command using RPC
    const { data, error } = await supabase.rpc('pgbouncer_exec', { 
      query: sql 
    });
    
    if (error) {
      throw error;
    }
    
    console.log('Migration completed successfully!');
    console.log('The case_events table has been created or updated with the is_decision column.');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration(); 