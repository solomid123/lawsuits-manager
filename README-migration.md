# Database Migration Instructions

This document provides instructions for applying the necessary database migrations to your Supabase project.

## Option 1: Using the SQL Editor in Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Navigate to the **SQL Editor** tab
4. Create a new query
5. Copy and paste the contents of the `db-migration.sql` file
6. Click **Run** to execute the SQL statements

## Option 2: Using the Node.js Script (Requires pgmigrate function)

If you have the `pgmigrate` RPC function enabled in your Supabase project, you can use the provided Node.js script:

1. Make sure you have the required packages installed:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. Run the migration script:
   ```bash
   node run-migrations.js
   ```

## Verifying the Migration

After running the migration:

1. Go to the Supabase Dashboard
2. Navigate to the **Table Editor**
3. Check the `clients` table to confirm it has the new columns:
   - `client_type`
   - `city`
   - `postal_code`
   - `national_id`

4. Check the `cases` table to confirm it has the new columns:
   - `case_type`
   - `case_value`

## Troubleshooting

If you encounter errors when running the migration:

- Make sure your Supabase URL and key are correct in the `.env.local` file
- Check that you have the necessary permissions to alter tables
- If you're using the SQL Editor, try running each ALTER TABLE statement separately 