-- Check if the invoices table exists and create it if not
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "client_id" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "invoice_number" VARCHAR NOT NULL,
  "invoice_date" DATE NOT NULL,
  "due_date" DATE NOT NULL,
  "subtotal" DECIMAL NOT NULL,
  "tax_rate" DECIMAL NOT NULL,
  "tax_amount" DECIMAL NOT NULL,
  "total" DECIMAL NOT NULL,
  "notes" TEXT,
  "status" VARCHAR NOT NULL DEFAULT 'draft',
  "pdf_url" VARCHAR,
  "created_by" UUID NOT NULL,
  "updated_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ
);

-- Trigger Supabase to refresh its schema cache
COMMENT ON TABLE "invoices" IS 'Stores invoice information for clients';
COMMENT ON COLUMN "invoices"."invoice_date" IS 'Date when the invoice was issued';

-- Check if the invoice_items table exists and create it if not
CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoice_id" UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL NOT NULL,
  "total" DECIMAL NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security if not already enabled
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for authenticated users
DROP POLICY IF EXISTS "Authenticated users can CRUD invoices" ON "invoices";
CREATE POLICY "Authenticated users can CRUD invoices" ON "invoices"
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can CRUD invoice items" ON "invoice_items";
CREATE POLICY "Authenticated users can CRUD invoice items" ON "invoice_items"
  FOR ALL USING (auth.role() = 'authenticated'); 