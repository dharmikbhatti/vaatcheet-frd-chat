-- Add status column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('sending', 'delivered', 'read')) DEFAULT 'delivered';

-- Update existing messages to have 'delivered' status
UPDATE messages SET status = 'delivered' WHERE status IS NULL; 