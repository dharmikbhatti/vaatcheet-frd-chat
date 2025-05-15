"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Copy } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function AdminSetupPage() {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const supabase = createClientComponentClient()

  const sqlQuery = `
-- Create a storage bucket for avatars
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
`

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(sqlQuery)
    setCopied(true)
    toast({ title: "SQL copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/5 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Admin Setup Guide</CardTitle>
            <CardDescription>
              Follow these instructions to set up the required storage for profile pictures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Creating the Storage Bucket</h3>
              <p>
                VaatCheet requires a storage bucket named{" "}
                <code className="bg-slate-100 px-1 py-0.5 rounded">avatars</code> to store profile pictures. This needs
                to be set up by an admin using the Supabase SQL editor or dashboard.
              </p>

              <Tabs defaultValue="sql">
                <TabsList>
                  <TabsTrigger value="sql">SQL Method</TabsTrigger>
                  <TabsTrigger value="dashboard">Dashboard Method</TabsTrigger>
                </TabsList>
                <TabsContent value="sql" className="space-y-4">
                  <p>Run the following SQL queries in your Supabase SQL editor:</p>
                  <div className="relative">
                    <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto">{sqlQuery}</pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleCopyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="dashboard" className="space-y-4">
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Log in to your Supabase dashboard</li>
                    <li>Navigate to the "Storage" section</li>
                    <li>Click "Create new bucket"</li>
                    <li>Name the bucket "avatars"</li>
                    <li>Enable "Public bucket" option</li>
                    <li>Click "Create bucket"</li>
                    <li>After creating the bucket, click on it and go to "Policies" tab</li>
                    <li>Add policies for INSERT, UPDATE, and DELETE for authenticated users</li>
                    <li>Add a policy for SELECT for public access</li>
                  </ol>
                </TabsContent>
              </Tabs>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-lg font-medium text-amber-800 mb-2">Important Note</h3>
              <p className="text-amber-700">
                Until this storage bucket is set up, users will not be able to upload profile pictures. Username updates
                will still work correctly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
