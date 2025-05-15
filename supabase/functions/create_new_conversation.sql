-- This is the SQL function that creates a new conversation or returns an existing one
CREATE OR REPLACE FUNCTION create_new_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_conversation_id UUID;
  new_conversation_id UUID;
BEGIN
  -- Check if a conversation already exists between these users
  SELECT c.id INTO existing_conversation_id
  FROM conversations c
  JOIN participants p1 ON c.id = p1.conversation_id
  JOIN participants p2 ON c.id = p2.conversation_id
  WHERE 
    p1.profile_id = user1_id AND 
    p2.profile_id = user2_id;
    
  -- If conversation exists, return it
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;
  
  -- Create a new conversation
  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO new_conversation_id;
  
  -- Add both users as participants
  INSERT INTO participants (conversation_id, profile_id)
  VALUES 
    (new_conversation_id, user1_id),
    (new_conversation_id, user2_id);
    
  RETURN new_conversation_id;
END;
$$;
