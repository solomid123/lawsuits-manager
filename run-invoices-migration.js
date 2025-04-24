require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set. Please provide it in your .env.local file');
  console.log('This is a different key from the anon key - it\'s the service role key with admin privileges');
  process.exit(1);
}

// Initialize Supabase client with service role key (has admin privileges)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Path to the SQL file
const sqlFilePath = path.join(__dirname, 'add-invoices-tables.sql');

async function runMigration() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL migration to create invoices tables...');
    
    // Execute the SQL command using RPC
    const { error } = await supabase.rpc('pgbouncer_exec', { 
      query: sql 
    });
    
    if (error) {
      console.error('Migration failed:', error.message);
      
      if (error.message.includes('function "pgbouncer_exec" does not exist')) {
        console.log('\nAlternatively, you can run this SQL directly in the Supabase SQL Editor:');
        console.log('1. Go to the Supabase Dashboard');
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Paste and execute the contents of add-invoices-tables.sql');
      }
      
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log('The invoices and invoice_items tables have been created.');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration(); 