-- Supabase Database Schema for Scheme Saathi
-- Run these commands in the Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    occupation VARCHAR(255),
    income_range VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interactions table (for analytics)
CREATE TABLE public.user_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
        'page_view', 
        'scheme_search', 
        'chat_message', 
        'voice_query', 
        'document_upload',
        'profile_update',
        'sign_in',
        'sign_up',
        'sign_out'
    )),
    interaction_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User schemes table (bookmarks, recommendations, etc.)
CREATE TABLE public.user_schemes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    scheme_name VARCHAR(255) NOT NULL,
    scheme_category VARCHAR(100),
    eligibility_score INTEGER DEFAULT 0 CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
    bookmarked BOOLEAN DEFAULT FALSE,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheme applications table
CREATE TABLE public.scheme_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    scheme_name VARCHAR(255) NOT NULL,
    application_status VARCHAR(20) DEFAULT 'draft' CHECK (application_status IN (
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected'
    )),
    application_data JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_interactions table
CREATE POLICY "Users can view own interactions" ON public.user_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON public.user_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_schemes table
CREATE POLICY "Users can view own schemes" ON public.user_schemes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schemes" ON public.user_schemes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schemes" ON public.user_schemes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schemes" ON public.user_schemes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for scheme_applications table
CREATE POLICY "Users can view own applications" ON public.scheme_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON public.scheme_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.scheme_applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_timestamp ON public.user_interactions(timestamp);
CREATE INDEX idx_user_interactions_type ON public.user_interactions(interaction_type);

CREATE INDEX idx_user_schemes_user_id ON public.user_schemes(user_id);
CREATE INDEX idx_user_schemes_bookmarked ON public.user_schemes(bookmarked);
CREATE INDEX idx_user_schemes_applied ON public.user_schemes(applied);

CREATE INDEX idx_scheme_applications_user_id ON public.scheme_applications(user_id);
CREATE INDEX idx_scheme_applications_status ON public.scheme_applications(application_status);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_scheme_applications_updated_at BEFORE UPDATE ON public.scheme_applications
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Enable real-time subscriptions (optional)
-- Run these if you want real-time updates
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_interactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_schemes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.scheme_applications;

-- Notifications Table (for smart notifications feature)
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('deadline', 'recommendation', 'update', 'scheme_match', 'application_status', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
