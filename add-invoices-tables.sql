-- Add extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the invoices table
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
  "created_by" UUID NOT NULL,
  "updated_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ
);

-- Create the invoice_items table
CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoice_id" UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL NOT NULL,
  "total" DECIMAL NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS "idx_invoices_client_id" ON "invoices" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices" ("status");
CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice_id" ON "invoice_items" ("invoice_id");

-- Add comments to describe tables
COMMENT ON TABLE "invoices" IS 'Stores invoice information for clients';
COMMENT ON TABLE "invoice_items" IS 'Stores line items for each invoice';

-- Enable Row Level Security
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can CRUD invoices" ON "invoices"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can CRUD invoice items" ON "invoice_items"
  FOR ALL USING (auth.role() = 'authenticated'); 