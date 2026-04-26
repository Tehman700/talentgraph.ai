-- Migration for One-Click Apply Form
-- Version: 3 (v3)

-- Table for hiring forms created by organizations
CREATE TABLE IF NOT EXISTS hiring_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES auth.users(id),
    job_title TEXT NOT NULL,
    job_description TEXT,
    company TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    questions JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active', -- active, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking which candidates have been sent which form
CREATE TABLE IF NOT EXISTS form_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES hiring_forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Candidate user ID
    status TEXT DEFAULT 'pending', -- pending, viewed, responded
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for candidate responses
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES hiring_forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Null if anonymous or not registered
    candidate_name TEXT,
    candidate_email TEXT,
    answers JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE hiring_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Orgs can see their own forms
CREATE POLICY "Users can manage their own forms" ON hiring_forms
    FOR ALL USING (auth.uid() = created_by);

-- Candidates can see notifications sent to them
CREATE POLICY "Users can see their own notifications" ON form_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Candidates can see the form details if they have a notification
CREATE POLICY "Users can view forms they are notified about" ON hiring_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM form_notifications 
            WHERE form_notifications.form_id = hiring_forms.id 
            AND form_notifications.user_id = auth.uid()
        )
    );

-- Orgs can see responses for their forms
CREATE POLICY "Orgs can view responses for their forms" ON form_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM hiring_forms
            WHERE hiring_forms.id = form_responses.form_id
            AND hiring_forms.created_by = auth.uid()
        )
    );

-- Responses can only be inserted by the candidate or anyone if we want public but lets stick to registered
CREATE POLICY "Candidates can submit responses" ON form_responses
    FOR INSERT WITH CHECK (true);
