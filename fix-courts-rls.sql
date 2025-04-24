-- Enable RLS on courts table (if not already enabled)
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Create policy for courts table to allow authenticated users full access
CREATE POLICY "Allow authenticated users full access to courts"
ON courts
FOR ALL
USING (auth.role() = 'authenticated');

-- Create policy for courts table to allow public read access
CREATE POLICY "Allow public read access to courts"
ON courts
FOR SELECT
USING (true);

-- Insert default courts if they don't exist
INSERT INTO courts (name, court_type)
VALUES
    ('ابتدائية', 'primary'),
    ('تجارية', 'commercial'),
    ('استئناف', 'appeal'),
    ('عليا', 'supreme')
ON CONFLICT (name) DO NOTHING; 