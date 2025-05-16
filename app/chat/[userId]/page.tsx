"use client"

import { Button } from "@/components/ui/button"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ChatInterface from "@/components/chat-interface"
import { getInitials } from "@/lib/utils"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { LogoLoader } from "@/components/logo-loader"
import Image from "next/image"

export default function ChatPage() {
  const params = useParams()
  const userId = params?.userId as string
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadChatData() {
      try {
        setLoading(true)

        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setError("Authentication error")
          setLoading(false)
          return
        }

        if (!sessionData.session) {
          console.log("No session found in chat page")
          router.push("/login")
          return
        }

        // Get current user profile
        const { data: currentProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single()

        if (profileError) {
          console.error("Current profile error:", profileError)
          setError("Failed to load your profile")
          setLoading(false)
          return
        }

        setCurrentUser(currentProfile)

        // Get other user profile
        const { data: otherProfile, error: otherProfileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (otherProfileError) {
          console.error("Other profile error:", otherProfileError)
          setError("User not found")
          setLoading(false)
          return
        }

        setOtherUser(otherProfile)

        // Get or create conversation
        const { data: convoId, error: convoError } = await supabase.rpc("create_new_conversation", {
          user1_id: currentProfile.id,
          user2_id: otherProfile.id,
        })

        if (convoError) {
          console.error("Conversation error:", convoError)
          setError("Failed to load or create conversation")
          setLoading(false)
          return
        }

        console.log("Conversation created/retrieved:", convoId)
        setConversationId(convoId)

        // Get messages
        const { data: messageData, error: messageError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convoId)
          .order("created_at", { ascending: true })

        if (messageError) {
          console.error("Messages error:", messageError)
        }

        setMessages(messageData || [])
        setLoading(false)
      } catch (err) {
        console.error("Chat loading error:", err)
        setError("An unexpected error occurred loading the chat")
        setLoading(false)
      }
    }

    loadChatData()
  }, [supabase, userId, router])

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="text-center">
          <LogoLoader size="lg" variant="icon" />
          <p className="text-slate-600 mt-4">Loading chat...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 to-primary/10 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <Link href="/dashboard" className="block mt-2 underline">
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // If missing required data, redirect to dashboard
  if (!currentUser || !otherUser || !conversationId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Missing conversation data</p>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-accent/5 to-primary/5">
      <header className="fixed top-0 left-0 right-0 bg-white shadow z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link href="/dashboard" className="mr-4">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={otherUser.avatar_url || undefined} alt={otherUser.username} />
              <AvatarFallback className="bg-primary/20">{getInitials(otherUser.username)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-slate-900">{otherUser.username}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/profile")} title="Profile Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <Image src="/images/logo-icon.png" alt="VaatCheet Logo" width={32} height={32} />
          </div>
        </div>
      </header>
      <div className="flex-1 mt-16 overflow-auto">
        <ChatInterface
          currentUser={currentUser}
          otherUser={otherUser}
          conversationId={conversationId}
          initialMessages={messages}
        />
      </div>
    </div>
  )
}
