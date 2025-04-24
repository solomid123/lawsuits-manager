-- Migration to create the case_events table with all required columns
-- Includes is_decision column that was missing

-- Check if the case_events table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'case_events'
    ) THEN
        -- Create the case_events table
        CREATE TABLE public.case_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            date DATE NOT NULL,
            time TIME WITHOUT TIME ZONE,
            title TEXT NOT NULL,
            description TEXT,
            is_decision BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        -- Add table comment
        COMMENT ON TABLE public.case_events IS 'Timeline events for legal cases including hearings, decisions, and other important events';
        
        -- Add comment on is_decision column
        COMMENT ON COLUMN public.case_events.is_decision IS 'Indicates if this event represents a court decision';

        -- Enable Row Level Security
        ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;

        -- Create policy for authenticated users
        CREATE POLICY "Authenticated users can CRUD case events" ON public.case_events
            FOR ALL USING (auth.uid() IS NOT NULL);

        -- Add an index on case_id for better performance
        CREATE INDEX idx_case_events_case_id ON public.case_events(case_id);

        -- Create a trigger to update the updated_at timestamp
        CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.case_events
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();

        RAISE NOTICE 'Created case_events table with is_decision column';
    ELSE
        -- Check if the is_decision column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'case_events'
            AND column_name = 'is_decision'
        ) THEN
            -- Add the is_decision column
            ALTER TABLE public.case_events ADD COLUMN is_decision BOOLEAN DEFAULT FALSE;
            
            -- Add comment on is_decision column
            COMMENT ON COLUMN public.case_events.is_decision IS 'Indicates if this event represents a court decision';
            
            RAISE NOTICE 'Added is_decision column to existing case_events table';
        ELSE
            RAISE NOTICE 'The is_decision column already exists in the case_events table';
        END IF;
    END IF;
END$$; 