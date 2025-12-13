-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

-- RLS Policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can read their own friendships (either as sender or receiver)
CREATE POLICY "Users can view their own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can insert friendship requests (sender is themselves)
CREATE POLICY "Users can send friendship requests"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update friendships (accept/reject) if they are involved
CREATE POLICY "Users can update their own friendships"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- View to simplify getting friends
-- Returns distinct profiles that are friends with the current user
CREATE OR REPLACE VIEW user_friends_view AS
SELECT 
    f.id as friendship_id,
    CASE 
        WHEN f.user_id = auth.uid() THEN f.friend_id 
        ELSE f.user_id 
    END as friend_user_id,
    f.status,
    f.created_at as friendship_created_at
FROM friendships f
WHERE 
    (f.user_id = auth.uid() OR f.friend_id = auth.uid())
    AND f.status = 'accepted';
