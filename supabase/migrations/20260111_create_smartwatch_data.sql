-- Create smartwatch_data table for Google Fit integration
CREATE TABLE IF NOT EXISTS smartwatch_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    steps INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    source TEXT DEFAULT 'google_fit_import',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique entry per user per date
    UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_smartwatch_user_date ON smartwatch_data(user_id, date DESC);

-- Enable Row Level Security
ALTER TABLE smartwatch_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can view their own smartwatch data"
    ON smartwatch_data
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own data
CREATE POLICY "Users can insert their own smartwatch data"
    ON smartwatch_data
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own smartwatch data"
    ON smartwatch_data
    FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Create policy to allow users to delete their own data
CREATE POLICY "Users can delete their own smartwatch data"
    ON smartwatch_data
    FOR DELETE
    USING (auth.uid()::text = user_id);
