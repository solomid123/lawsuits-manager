-- Add PDF URL column to the invoices table
ALTER TABLE "invoices" 
ADD COLUMN IF NOT EXISTS "pdf_url" VARCHAR;

-- Add comment to describe the column
COMMENT ON COLUMN "invoices"."pdf_url" IS 'URL to the stored PDF file in Supabase storage'; 