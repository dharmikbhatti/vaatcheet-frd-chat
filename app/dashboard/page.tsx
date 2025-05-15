"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getInitials } from "@/lib/utils"
import LogoutButton from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { LogoLoader } from "@/components/logo-loader"
import Image from "next/image"
import { Settings, UserCircle } from "lucide-react"

export default function Dashboard() {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUsers, setOtherUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Check session and load users
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setError("Authentication error")
          setSessionChecked(true)
          setLoading(false)
          return
        }

        if (!sessionData.session) {
          console.log("No session found")
          setSessionChecked(true)
          router.push("/login")
          return
        }

        setSessionChecked(true)

        // Get current user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)

          // If profile doesn't exist, create one
          if (profileError.code === "PGRST116") {
            const username = sessionData.session.user.email?.split("@")[0] || "user"

            console.log("Creating new profile for user:", username)

            const { error: insertError } = await supabase.from("profiles").insert({
              id: sessionData.session.user.id,
              username,
              avatar_url: null,
            })

            if (insertError) {
              console.error("Profile creation error:", insertError)
              setError("Failed to create profile")
              setLoading(false)
              return
            }

            // Retry fetching the profile
            const { data: newProfile, error: refetchError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", sessionData.session.user.id)
              .single()

            if (refetchError) {
              console.error("Profile refetch error:", refetchError)
              setError("Failed to load user profile")
              setLoading(false)
              return
            }

            setCurrentUser(newProfile)
          } else {
            setError("Failed to load user profile")
            setLoading(false)
            return
          }
        } else {
          setCurrentUser(profile)
        }

        // Get other users
        const { data: others, error: othersError } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", sessionData.session.user.id)

        if (othersError) {
          console.error("Users fetch error:", othersError)
        }

        setOtherUsers(others || [])
        setLoading(false)
      } catch (err) {
        console.error("Dashboard error:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router, toast])

  // Handle redirection after session check
  useEffect(() => {
    if (sessionChecked && !currentUser && !loading && !error) {
      console.log("No user found after session check, redirecting to login")
      router.push("/login")
    }
  }, [sessionChecked, currentUser, loading, error, router])

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="text-center">
          <LogoLoader size="lg" variant="full" />
          <p className="text-slate-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/10 to-primary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{error}</p>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.reload()
                }}
              >
                Retry
              </Button>
              <Button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push("/login")
                }}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no current user but no error, show loading (should redirect via useEffect)
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="text-center">
          <LogoLoader size="lg" variant="full" />
          <p className="text-slate-600 mt-4">Initializing session...</p>
        </div>
      </div>
    )
  }

  // Render dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/5">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/images/logo-full.png" alt="VaatCheet Logo" width={140} height={50} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.username} />
                <AvatarFallback className="bg-primary/20">{getInitials(currentUser.username)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{currentUser.username}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push("/profile")} title="Profile Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Conversations</h1>
          <Button variant="outline" onClick={() => router.push("/profile")}>
            <UserCircle className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select a friend to chat with</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {otherUsers.length === 0 ? (
                <p className="text-slate-600">No other users found. Invite your friends to join!</p>
              ) : (
                otherUsers.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/chat/${profile.id}`}
                    className="flex items-center p-3 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                      <AvatarFallback className="bg-primary/20">{getInitials(profile.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{profile.username}</p>
                      <p className="text-sm text-slate-500">Click to start chatting</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
