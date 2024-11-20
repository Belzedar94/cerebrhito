-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create enum types
CREATE TYPE user_role AS ENUM ('parent', 'professional');
CREATE TYPE subscription_type AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE media_type AS ENUM ('photo', 'video');
CREATE TYPE activity_status AS ENUM ('pending', 'completed', 'skipped');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'parent',
    subscription_type subscription_type NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create children table
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT,
    profile_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    min_age_months INTEGER NOT NULL,
    max_age_months INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    min_age_months INTEGER NOT NULL,
    max_age_months INTEGER NOT NULL,
    category TEXT NOT NULL,
    importance INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id),
    status activity_status NOT NULL DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create milestone_tracking table
CREATE TABLE milestone_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id),
    achieved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(child_id, milestone_id)
);

-- Create media table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    type media_type NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    analysis_data JSONB,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ai_chat_history table
CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_children_user_id ON children(user_id);
CREATE INDEX idx_activities_age_range ON activities(min_age_months, max_age_months);
CREATE INDEX idx_milestones_age_range ON milestones(min_age_months, max_age_months);
CREATE INDEX idx_activity_logs_child_id ON activity_logs(child_id);
CREATE INDEX idx_activity_logs_scheduled_for ON activity_logs(scheduled_for);
CREATE INDEX idx_milestone_tracking_child_id ON milestone_tracking(child_id);
CREATE INDEX idx_media_child_id ON media(child_id);
CREATE INDEX idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX idx_ai_chat_history_child_id ON ai_chat_history(child_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
    BEFORE UPDATE ON children
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestone_tracking_updated_at
    BEFORE UPDATE ON milestone_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_select ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY users_update ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Children policies
CREATE POLICY children_select ON children
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY children_insert ON children
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY children_update ON children
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY children_delete ON children
    FOR DELETE
    USING (user_id = auth.uid());

-- Activities policies (public read, admin write)
CREATE POLICY activities_select ON activities
    FOR SELECT
    USING (true);

-- Milestones policies (public read, admin write)
CREATE POLICY milestones_select ON milestones
    FOR SELECT
    USING (true);

-- Activity logs policies
CREATE POLICY activity_logs_select ON activity_logs
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

CREATE POLICY activity_logs_insert ON activity_logs
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

CREATE POLICY activity_logs_update ON activity_logs
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

-- Milestone tracking policies
CREATE POLICY milestone_tracking_select ON milestone_tracking
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

CREATE POLICY milestone_tracking_insert ON milestone_tracking
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

CREATE POLICY milestone_tracking_update ON milestone_tracking
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

-- Media policies
CREATE POLICY media_select ON media
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

CREATE POLICY media_insert ON media
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

CREATE POLICY media_update ON media
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

CREATE POLICY media_delete ON media
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM children
        WHERE children.id = child_id
        AND children.user_id = auth.uid()
    ));

-- AI chat history policies
CREATE POLICY ai_chat_history_select ON ai_chat_history
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY ai_chat_history_insert ON ai_chat_history
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY notifications_select ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notifications_update ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());