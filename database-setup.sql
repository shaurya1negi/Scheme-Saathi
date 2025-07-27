-- Create user_interactions table for tracking user behavior
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    interaction_data JSONB DEFAULT '{}',
    page_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own interactions" ON user_interactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON user_interactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);

-- Insert some sample interaction data (you can run this after authenticating)
-- This is just for reference, you'd need to replace with actual user ID
/*
INSERT INTO user_interactions (user_id, interaction_type, interaction_data, page_url) VALUES
    ('your-user-id-here', 'page_view', '{"page": "home"}', '/'),
    ('your-user-id-here', 'scheme_search', '{"query": "agriculture", "filters": {"category": "farming"}}', '/'),
    ('your-user-id-here', 'scheme_view', '{"schemeId": "agri-001", "schemeName": "PM-KISAN"}', '/schemes/agri-001'),
    ('your-user-id-here', 'chat_message', '{"message": "Tell me about education schemes", "response": "Here are the education schemes..."}', '/chat'),
    ('your-user-id-here', 'document_upload', '{"documentType": "aadhar", "fileName": "aadhar.pdf"}', '/'),
    ('your-user-id-here', 'scheme_bookmark', '{"schemeId": "edu-001", "schemeName": "Scholarship Scheme", "action": "add"}', '/schemes/edu-001');
*/
