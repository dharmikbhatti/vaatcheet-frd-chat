-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update message status in their conversations" ON messages;

-- Allow users to view messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations" 
ON messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM participants
    WHERE 
      participants.conversation_id = messages.conversation_id AND
      participants.profile_id = auth.uid()
  )
);

-- Allow users to insert messages in conversations they're part of
CREATE POLICY "Users can insert messages in their conversations" 
ON messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM participants
    WHERE 
      participants.conversation_id = conversation_id AND
      participants.profile_id = auth.uid()
  )
);

-- Allow users to update message status in conversations they're part of
CREATE POLICY "Users can update message status in their conversations"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM participants
    WHERE 
      participants.conversation_id = messages.conversation_id AND
      participants.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM participants
    WHERE 
      participants.conversation_id = messages.conversation_id AND
      participants.profile_id = auth.uid()
  )
);
