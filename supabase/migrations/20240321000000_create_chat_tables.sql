-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(conversation_id, profile_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM participants
        WHERE participants.conversation_id = conversations.id
        AND participants.profile_id = auth.uid()
    )
);

CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (true);

-- Create policies for participants
CREATE POLICY "Users can view participants in their conversations"
ON participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM participants p
        WHERE p.conversation_id = participants.conversation_id
        AND p.profile_id = auth.uid()
    )
);

CREATE POLICY "Users can add participants to their conversations"
ON participants FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM participants p
        WHERE p.conversation_id = participants.conversation_id
        AND p.profile_id = auth.uid()
    )
);

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM participants
        WHERE participants.conversation_id = messages.conversation_id
        AND participants.profile_id = auth.uid()
    )
);

CREATE POLICY "Users can send messages to their conversations"
ON messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM participants
        WHERE participants.conversation_id = messages.conversation_id
        AND participants.profile_id = auth.uid()
    )
);

-- Create function to update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation timestamp
CREATE TRIGGER update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp(); 