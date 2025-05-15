-- Enable RLS on participants table
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Participants can view other participants" ON participants;
DROP POLICY IF EXISTS "Users can add participants" ON participants;

-- Allow authenticated users to view participants
CREATE POLICY "Users can view participants" 
ON participants FOR SELECT 
USING (true);

-- Allow authenticated users to insert participants
CREATE POLICY "Users can add participants" 
ON participants FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own participant records
CREATE POLICY "Users can update their own participant records" 
ON participants FOR UPDATE 
USING (auth.uid() = profile_id);

-- Allow users to delete their own participant records
CREATE POLICY "Users can delete their own participant records" 
ON participants FOR DELETE 
USING (auth.uid() = profile_id);
