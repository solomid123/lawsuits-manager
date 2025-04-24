-- Query to get column information for the invoices table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'invoices'
ORDER BY 
  ordinal_position; 