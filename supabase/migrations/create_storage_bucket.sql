-- Create a storage bucket for avatars if it doesn't exist
DO $$
BEGIN
    -- Check if the bucket already exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'avatars'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
        
        -- Set up storage policy to allow authenticated users to upload their own avatars
        CREATE POLICY "Users can upload their own avatars" 
        ON storage.objects 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (bucket_id = 'avatars');
        
        -- Allow users to update their own avatars
        CREATE POLICY "Users can update their own avatars" 
        ON storage.objects 
        FOR UPDATE 
        TO authenticated 
        USING (bucket_id = 'avatars');
        
        -- Allow users to delete their own avatars
        CREATE POLICY "Users can delete their own avatars" 
        ON storage.objects 
        FOR DELETE 
        TO authenticated 
        USING (bucket_id = 'avatars');
        
        -- Allow public read access to all avatars
        CREATE POLICY "Public read access for avatars" 
        ON storage.objects 
        FOR SELECT 
        TO public 
        USING (bucket_id = 'avatars');
    END IF;
END
$$;
