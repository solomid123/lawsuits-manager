-- Add missing fields to the clients table
ALTER TABLE "clients" 
ADD COLUMN IF NOT EXISTS "client_type" VARCHAR NOT NULL DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS "city" VARCHAR,
ADD COLUMN IF NOT EXISTS "postal_code" VARCHAR,
ADD COLUMN IF NOT EXISTS "national_id" VARCHAR;

-- Add missing fields to the cases table
ALTER TABLE "cases" 
ADD COLUMN IF NOT EXISTS "case_type" VARCHAR NOT NULL DEFAULT 'civil',
ADD COLUMN IF NOT EXISTS "case_value" DECIMAL,
ADD COLUMN IF NOT EXISTS "priority" VARCHAR NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS "fee_type" VARCHAR DEFAULT 'fixed';

-- Add missing columns to court_sessions table
ALTER TABLE "court_sessions"
ADD COLUMN IF NOT EXISTS "session_time" VARCHAR,
ADD COLUMN IF NOT EXISTS "session_type" VARCHAR;

-- Create table for case parties if it doesn't exist
CREATE TABLE IF NOT EXISTS "case_parties" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "case_id" UUID NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "name" VARCHAR NOT NULL,
  "role" VARCHAR NOT NULL,
  "type" VARCHAR NOT NULL,
  "contact" VARCHAR,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ
);

-- Create table for case documents if it doesn't exist
CREATE TABLE IF NOT EXISTS "case_documents" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "case_id" UUID NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "document_date" DATE,
  "file_path" VARCHAR,
  "file_name" VARCHAR,
  "file_type" VARCHAR,
  "file_size" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ
);

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 