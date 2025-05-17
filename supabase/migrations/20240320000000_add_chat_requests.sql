-- Create chat_requests table
CREATE TABLE IF NOT EXISTS chat_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chat requests"
ON chat_requests FOR SELECT
USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
);

CREATE POLICY "Users can create chat requests"
ON chat_requests FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
);

CREATE POLICY "Users can update their received chat requests"
ON chat_requests FOR UPDATE
USING (
    auth.uid() = receiver_id
);

-- Create function to handle chat request acceptance
CREATE OR REPLACE FUNCTION handle_chat_request_acceptance(request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_conversation_id UUID;
    sender_id UUID;
    receiver_id UUID;
BEGIN
    -- Get the request details
    SELECT sender_id, receiver_id INTO sender_id, receiver_id
    FROM chat_requests
    WHERE id = request_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Chat request not found or not pending';
    END IF;

    -- Create new conversation
    INSERT INTO conversations DEFAULT VALUES
    RETURNING id INTO new_conversation_id;

    -- Add both users as participants
    INSERT INTO participants (conversation_id, profile_id)
    VALUES 
        (new_conversation_id, sender_id),
        (new_conversation_id, receiver_id);

    -- Update request status
    UPDATE chat_requests
    SET status = 'accepted',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = request_id;

    RETURN new_conversation_id;
END;
$$; 