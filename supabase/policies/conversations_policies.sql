-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

-- Allow users to view conversations they're part of
CREATE POLICY "Users can view their conversations" 
ON conversations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM participants
    WHERE 
      participants.conversation_id = id AND
      participants.profile_id = auth.uid()
  )
);
