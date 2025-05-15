"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { LogoLoader } from "@/components/logo-loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)

        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          toast({
            title: "Authentication error",
            description: "Please log in again",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        if (!sessionData.session) {
          router.push("/login")
          return
        }

        setUser(sessionData.session.user)

        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single()

        if (profileError) {
          console.error("Profile error:", profileError)
          toast({
            title: "Error loading profile",
            description: "Please try again later",
            variant: "destructive",
          })
          return
        }

        setUsername(profile.username)
        setAvatarUrl(profile.avatar_url)

        // Check if storage bucket exists
        try {
          // Try to list folders in avatars bucket
          await supabase.storage.from("avatars").list()
          // If we reach here, the bucket exists
        } catch (error: any) {
          console.error("Storage check error:", error)
          if (
            error.message &&
            (error.message.includes("bucket not found") || error.message.includes("does not exist"))
          ) {
            setStorageError(
              "The storage for profile pictures hasn't been set up yet. Please contact a site administrator.",
            )
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Profile loading error:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router, toast])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      // If we already know storage isn't set up, show the error message
      if (storageError) {
        toast({
          title: "Storage not available",
          description: storageError,
          variant: "destructive",
        })
        return
      }

      setUploading(true)
      const file = event.target.files[0]

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 2MB",
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      // Create a unique file path
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Try to upload the file to Supabase storage
      try {
        const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true })

        if (uploadError) {
          // Specific handling for bucket not found errors
          if (
            uploadError.message &&
            (uploadError.message.includes("bucket not found") || uploadError.message.includes("does not exist"))
          ) {
            setStorageError(
              "The storage for profile pictures hasn't been set up yet. Please contact a site administrator.",
            )
            throw new Error(storageError)
          }
          throw uploadError
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName)

        if (!publicUrlData) {
          throw new Error("Failed to get public URL")
        }

        // Update the user's profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq("id", user.id)

        if (updateError) {
          throw updateError
        }

        setAvatarUrl(publicUrlData.publicUrl)
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        })
      } catch (error: any) {
        console.error("Upload error:", error)

        // Set storage error if it's a bucket issue
        if (error.message && (error.message.includes("bucket not found") || error.message.includes("does not exist"))) {
          setStorageError(
            "The storage for profile pictures hasn't been set up yet. Please contact a site administrator.",
          )
          toast({
            title: "Storage not available",
            description: storageError,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Upload failed",
            description: "There was an error uploading your profile picture",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your profile picture",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUsernameUpdate = async () => {
    try {
      setUploading(true)

      // Check if username is already taken
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .limit(1)

      if (checkError) {
        throw checkError
      }

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Username already taken",
          description: "Please choose a different username",
          variant: "destructive",
        })
        return
      }

      // Update username
      const { error: updateError } = await supabase.from("profiles").update({ username }).eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Username updated",
        description: "Your username has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating username:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your username",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="text-center">
          <LogoLoader size="lg" variant="full" />
          <p className="text-slate-600 mt-4">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center mb-6">
          <Link href="/dashboard" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center">
            <Image src="/images/logo-full.png" alt="VaatCheet Logo" width={140} height={50} />
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {storageError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Storage Not Available</AlertTitle>
                <AlertDescription>{storageError} You can still update your username below.</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} alt={username} />
                <AvatarFallback className="text-lg bg-primary/20">{getInitials(username)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center">
                <Label
                  htmlFor="avatar-upload"
                  className={`cursor-pointer flex items-center gap-2 ${
                    storageError ? "bg-gray-400" : "bg-primary hover:bg-primary/90"
                  } text-white px-3 py-2 rounded-md transition-colors`}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Picture"}
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading || !!storageError}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-slate-500">Maximum file size: 2MB</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={uploading}
                />
                <Button onClick={handleUsernameUpdate} disabled={uploading || !username.trim()}>
                  Update
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email} disabled />
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
