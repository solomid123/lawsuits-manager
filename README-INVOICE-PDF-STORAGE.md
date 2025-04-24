# Invoice PDF Storage in Supabase

This feature enables automatically storing generated PDF invoices in Supabase Storage and linking them to the invoice record in the database.

## Setup Instructions

### 1. Add the PDF URL Column to the Invoices Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add PDF URL column to the invoices table
ALTER TABLE "invoices" 
ADD COLUMN IF NOT EXISTS "pdf_url" VARCHAR;

-- Add comment to describe the column
COMMENT ON COLUMN "invoices"."pdf_url" IS 'URL to the stored PDF file in Supabase storage';
```

Or you can run the included SQL script:

```bash
# Log into Supabase and run the SQL migration
node -r dotenv/config -e "const { exec } = require('child_process'); exec('cat add-invoice-pdf-column.sql | supabase sql --db-url=$SUPABASE_URL -k $SUPABASE_SERVICE_ROLE_KEY', (err, stdout, stderr) => { console.log(stdout); if (err) console.error(stderr); });"
```

### 2. Create the Invoice Storage Bucket

Run the setup script to create and configure the storage bucket:

```bash
# Make sure you have set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
node setup-invoice-storage.js
```

If the script doesn't have sufficient permissions to create the bucket or policies, you can create them manually in the Supabase dashboard:

1. Log in to your [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Navigate to the **Storage** tab
4. Click **Create bucket**
5. Enter bucket name: `invoice-documents`
6. Check **Public bucket** to make files publicly accessible
7. Click **Create bucket**

### 3. Configure Storage Policies

After creating the bucket, you need to configure policies:

1. In the Supabase dashboard, go to Storage > Policies
2. Select the `invoice-documents` bucket
3. Create policies for the bucket:

#### Read Policy (Select):
- Policy name: `Allow public read access`
- Policy definition: `true` (allows anyone to read files)

#### Write Policy (Insert):
- Policy name: `Allow authenticated uploads`
- Policy definition: `auth.role() = 'authenticated'`

#### Delete Policy:
- Policy name: `Allow authenticated deletes`
- Policy definition: `auth.role() = 'authenticated'`

## Usage

The enhanced PDF generation system will automatically:

1. Generate the PDF
2. Store it in Supabase Storage in the `invoice-documents` bucket
3. Update the invoice record with the PDF's public URL
4. Allow the user to download the PDF

### Implementation Details

- PDF files are stored in a structured path: `invoices/{invoice_id}/{filename}.pdf`
- Filenames include the invoice number and a timestamp
- The system falls back to local download if storage fails
- All Arabic text rendering optimizations are preserved

### Available Functions

- `generateInvoicePDF`: Creates the PDF and optionally stores it in Supabase
- `downloadInvoicePDF`: Utility to handle downloading PDFs in the browser
- `uploadInvoicePDF`: Uploads a PDF blob to Supabase Storage
- `getInvoicePdfUrl`: Gets the public URL for a stored PDF
- `deleteInvoicePdf`: Deletes a PDF from storage
- `updateInvoicePdfUrl`: Updates the invoice record with the PDF URL

## Troubleshooting

If you encounter issues with PDF storage:

1. Check that the `invoice-documents` bucket exists in Supabase Storage
2. Verify the storage policies are correctly configured
3. Ensure the `pdf_url` column has been added to the `invoices` table
4. Check browser console logs for detailed error messages

## Security Considerations

- PDFs are stored in a public bucket, meaning anyone with the URL can access them
- For more sensitive invoices, consider implementing authenticated access controls
- The system uses UUID-based paths to prevent URL guessing 