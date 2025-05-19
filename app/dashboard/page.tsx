"use client"

import { ThemeProvider } from "@/components/theme-provider"
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
import { Search, UserCircle, Users, MessageSquare, Plus, UsersRound, Mail, Settings, AlertCircle, RefreshCw, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

const headerVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

// New types for enhanced features
type ChatCategory = "all" | "work" | "friends" | "family"
type UserStatus = "online" | "offline" | "away"

export default function Dashboard() {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUsers, setOtherUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ChatCategory>("all")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

        // Fetch last message for each user
        const userId = sessionData.session.user.id
        const usersWithLastMessage = await Promise.all(
          (others || []).map(async (profile) => {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content, created_at')
              .or(`and(sender_id.eq.${userId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${userId})`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            return {
              ...profile,
              lastMessage: lastMsg?.content || "No messages yet",
            }
          })
        )

        setOtherUsers(usersWithLastMessage)
        setFilteredUsers(usersWithLastMessage)
        setLoading(false)
      } catch (err) {
        console.error("Dashboard error:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router, toast])

  // Filter users based on category and search
  useEffect(() => {
    let filtered = otherUsers

    if (selectedCategory !== "all") {
      filtered = filtered.filter((user) => user.category === selectedCategory)
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }, [searchQuery, otherUsers, selectedCategory])

  // Handle redirection after session check
  useEffect(() => {
    if (sessionChecked && !currentUser && !loading && !error) {
      console.log("No user found after session check, redirecting to login")
      router.push("/login")
    }
  }, [sessionChecked, currentUser, loading, error, router])

  // Add error alert component
  const ErrorAlert = ({ error, onRetry }: { error: string | null, onRetry: () => void }) => {
    if (!error) return null

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Add delete profile function
  const handleDeleteProfile = async () => {
    if (!currentUser) return

    try {
      setIsDeleting(true)

      // First delete the profile from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', currentUser.id)

      if (profileError) {
        console.error("Error deleting profile:", profileError)
        toast({
          title: "Error",
          description: "Failed to delete profile. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Then delete the user from auth.users
      const { error: authError } = await supabase.auth.admin.deleteUser(
        currentUser.id
      )

      if (authError) {
        console.error("Error deleting auth user:", authError)
        toast({
          title: "Error",
          description: "Failed to delete user account. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Sign out and redirect to login
      await supabase.auth.signOut()
      router.push('/login')
      
      toast({
        title: "Success",
        description: "Your account has been deleted successfully.",
      })
    } catch (err) {
      console.error("Unexpected error during deletion:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
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
        </div>
      </div>
    )
  }

  // Render dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/5">
      <motion.header 
        initial="hidden"
        animate="visible"
        variants={headerVariants}
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b z-10"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center w-full sm:w-auto justify-between sm:justify-start"
          >
            <Image 
              src="/images/logo-icon.png" 
              alt="VaatCheet Logo" 
              width={280} 
              height={100} 
              className="h-auto sm:w-[18vw] md:w-10 lg:w-12"
              priority
            />
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-50 border border-slate-200 shadow-sm hover:bg-slate-100 transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                <Avatar className="h-7 w-7 ring-2 ring-primary/10">
                  <AvatarImage src={currentUser?.avatar_url || undefined} alt={currentUser?.username} />
                  <AvatarFallback className="bg-primary/20">{getInitials(currentUser?.username || '')}</AvatarFallback>
                </Avatar>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Notification Preferences</DropdownMenuItem>
                  <DropdownMenuItem>Privacy Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onSelect={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden sm:flex items-center space-x-4"
          >
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 shadow-sm hover:bg-slate-100 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                <AvatarImage src={currentUser?.avatar_url || undefined} alt={currentUser?.username} />
                <AvatarFallback className="bg-primary/20">{getInitials(currentUser?.username || '')}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-slate-700">{currentUser?.username}</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Notification Preferences</DropdownMenuItem>
                <DropdownMenuItem>Privacy Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onSelect={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 mt-16 sm:mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Chats</h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">Connect with your friends and colleagues</p>
          </div>
        </motion.div>

        {/* Main Chat Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Find someone to chat with
                </CardTitle>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {["all", "work", "friends", "family"].map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category as ChatCategory)}
                      className="capitalize text-xs sm:text-sm"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 sm:h-11 bg-white border-slate-200 focus:border-primary/50 focus:ring-primary/50 transition-all duration-200 text-sm sm:text-base"
                  />
                </motion.div>
                
                <AnimatePresence mode="wait">
                  {filteredUsers.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center py-8 sm:py-12"
                    >
                      <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-50 mb-3 sm:mb-4"
                      >
                        <Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                      </motion.div>
                      <p className="text-base sm:text-lg text-slate-600 font-medium">
                        {otherUsers.length === 0 ? (
                          "No other users found. Invite your friends to join!"
                        ) : (
                          "No users match your search"
                        )}
                      </p>
                      {otherUsers.length === 0 && (
                        <p className="text-sm sm:text-base text-slate-500 mt-2">Be the first to start a conversation</p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="user-list"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-2 sm:gap-3"
                    >
                      {filteredUsers.map((profile) => (
                        <motion.div
                          key={profile.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Link
                            href={`/chat/${profile.id}`}
                            className="flex items-center p-3 sm:p-4 rounded-lg hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-200 hover:shadow-sm"
                          >
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4 ring-2 ring-primary/10">
                              <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                              <AvatarFallback className="bg-primary/20">{getInitials(profile.username)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 text-sm sm:text-base truncate">{profile.username}</p>
                              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 truncate">
                                <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{profile.lastMessage || "No messages yet"}</span>
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
