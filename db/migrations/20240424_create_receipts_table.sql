-- Create the receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL,
  reference_number TEXT,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  vendor TEXT,
  notes TEXT,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add RLS policies for the receipts table
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy for selecting receipts (all authenticated users can select)
CREATE POLICY select_receipts ON receipts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for inserting receipts (all authenticated users can insert)
CREATE POLICY insert_receipts ON receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy for updating receipts (creator or admin can update)
CREATE POLICY update_receipts ON receipts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR 
         auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Policy for deleting receipts (creator or admin can delete)
CREATE POLICY delete_receipts ON receipts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR 
         auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Add receipt_type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_type') THEN
    CREATE TYPE receipt_type AS ENUM ('expense', 'vendor_invoice', 'other');
  END IF;
END 
$$;

-- Create function to log receipt activities in the activity_log table
CREATE OR REPLACE FUNCTION log_receipt_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (user_id, action, description, entity_type, entity_id)
    VALUES (NEW.created_by, 'create', 'Created receipt: ' || NEW.title, 'receipt', NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if significant fields are changed
    IF NEW.status <> OLD.status OR NEW.amount <> OLD.amount THEN
      INSERT INTO activity_log (user_id, action, description, entity_type, entity_id)
      VALUES (NEW.updated_by, 'update', 'Updated receipt: ' || NEW.title, 'receipt', NEW.id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_log (user_id, action, description, entity_type, entity_id)
    VALUES (OLD.created_by, 'delete', 'Deleted receipt: ' || OLD.title, 'receipt', OLD.id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for receipt activities
CREATE TRIGGER after_receipt_insert
AFTER INSERT ON receipts
FOR EACH ROW
EXECUTE FUNCTION log_receipt_activity();

CREATE TRIGGER after_receipt_update
AFTER UPDATE ON receipts
FOR EACH ROW
EXECUTE FUNCTION log_receipt_activity();

CREATE TRIGGER after_receipt_delete
AFTER DELETE ON receipts
FOR EACH ROW
EXECUTE FUNCTION log_receipt_activity(); 