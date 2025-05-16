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
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist, create a new one
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([{ id: sessionData.session.user.id, username: sessionData.session.user.email?.split('@')[0] }])
              .select()
              .single()

            if (createError) {
              console.error("Profile creation error:", createError)
              toast({
                title: "Error creating profile",
                description: "Please try again later",
                variant: "destructive",
              })
              return
            }

            setUsername(newProfile.username)
            setAvatarUrl(newProfile.avatar_url)
          } else {
            console.error("Profile error:", profileError)
            toast({
              title: "Error loading profile",
              description: "Please try again later",
              variant: "destructive",
            })
            return
          }
        } else {
          setUsername(profile.username)
          setAvatarUrl(profile.avatar_url)
        }

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
            throw new Error(storageError || 'Storage error occurred')
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

const handleDeleteProfile = async () => {
  if (!confirm("Are you sure you want to delete your profile? This action cannot be undone and will permanently delete all your data.")) {
    return;
  }

  try {
    setUploading(true);

    // Call the API to delete the user
    const response = await fetch("/api/deleteUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete profile");
    }

    toast({
      title: "Profile deleted",
      description: "Your profile and all associated data have been deleted successfully.",
    });

    // Redirect to the login page
    router.push("/login");
  } catch (error) {
    console.error("Error deleting profile:", error);
    toast({
      title: "Deletion failed",
      description: error instanceof Error ? error.message : "An error occurred while deleting your profile. Please try again later.",
      variant: "destructive",
    });
  } finally {
    setUploading(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <LogoLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-start justify-center bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container max-w-3xl py-12 px-4 sm:px-6">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="hover:scale-105 transition-all duration-300 hover:bg-primary/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center hover:opacity-90 transition-all duration-300 transform hover:scale-105">
            <Image src="/images/logo-full.png" alt="VaatCheet Logo" width={160} height={60} priority />
          </div>
        </header>

        <Card className="shadow-xl border-t-4 border-t-primary/80 backdrop-blur-sm bg-background/95">
          <CardHeader className="space-y-2 pb-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Profile Settings
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Customize your profile information and manage your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            {storageError && (
              <Alert variant="destructive" className="animate-fadeIn border-l-4 border-l-destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-base">Storage Not Available</AlertTitle>
                <AlertDescription className="text-sm">{storageError} You can still update your username below.</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center space-y-8">
              <div className="relative group">
                <Avatar className="h-36 w-36 ring-4 ring-primary/20 ring-offset-4 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105">
                  <AvatarImage src={avatarUrl || undefined} alt={username} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-primary/20">{getInitials(username)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Label
                    htmlFor="avatar-upload"
                    className={`cursor-pointer flex items-center gap-2 ${
                      storageError ? "bg-gray-400" : "bg-white hover:bg-white/90"
                    } text-primary px-4 py-2 rounded-full transition-all duration-200 hover:shadow-lg`}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Change Photo"}
                  </Label>
                </div>
              </div>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading || !!storageError}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">Maximum file size: 2MB</p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
              <div className="flex gap-4">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={uploading}
                  className="focus-visible:ring-primary h-12 text-base"
                  placeholder="Enter your username"
                />
                <Button 
                  onClick={handleUsernameUpdate} 
                  disabled={uploading || !username.trim()}
                  className="h-12 px-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 bg-primary hover:bg-primary/90"
                >
                  Update
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold">Email Address</Label>
              <Input 
                value={user?.email} 
                disabled 
                className="bg-muted/50 h-12 text-base" 
              />
              <p className="text-xs text-muted-foreground italic">Email cannot be changed</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-8">
            <Button 
              variant="destructive" 
              onClick={handleDeleteProfile} 
              disabled={uploading}
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Delete Profile
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard")}
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-primary/20 hover:border-primary/40"
            >
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
