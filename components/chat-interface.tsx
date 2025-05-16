"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import type { Profile, Message } from "@/lib/database.types"
import { Check, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

// Extend Message type to include status
interface MessageWithStatus extends Message {
  status?: 'sending' | 'delivered' | 'read'
}

interface ChatInterfaceProps {
  currentUser: Profile
  otherUser: Profile
  conversationId: string
  initialMessages: MessageWithStatus[]
}

export default function ChatInterface({ currentUser, otherUser, conversationId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageWithStatus[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [statusColumnExists, setStatusColumnExists] = useState(false)
  // Add a channelRef to store the channel instance
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Check if status column exists
  useEffect(() => {
    const checkStatusColumn = async () => {
      try {
        // Try a simple query to check if the status column exists
        const { error } = await supabase.from("messages").select("status").limit(1)

        if (error && error.message.includes("status")) {
          console.warn("Status column does not exist yet:", error.message)
          setStatusColumnExists(false)
        } else {
          console.log("Status column exists")
          setStatusColumnExists(true)
        }
      } catch (error) {
        console.error("Error checking status column:", error)
        setStatusColumnExists(false)
      }
    }

    checkStatusColumn()
  }, [supabase])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, otherUserTyping])

  // Mark messages as read when viewed
  useEffect(() => {
    const markMessagesAsRead = async () => {
      // Skip if status column doesn't exist yet
      if (!statusColumnExists) return

      try {
        // Get all unread messages from the other user
        const unreadMessages = messages.filter(
          (msg) => msg.profile_id === otherUser.id && msg.status !== "read"
        )

        if (unreadMessages.length === 0) return

        // Update all unread messages to "read" status
        const { error } = await supabase
          .from("messages")
          .update({ status: "read" })
          .in(
            "id",
            unreadMessages.map((msg) => msg.id),
          )

        if (error) {
          console.error("Error marking messages as read:", error)
        } else {
          // Update local state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.profile_id === otherUser.id && msg.status !== "read" 
                ? { ...msg, status: "read" } 
                : msg
            ),
          )
        }
      } catch (error) {
        console.error("Error in markMessagesAsRead:", error)
      }
    }

    markMessagesAsRead()
  }, [messages, otherUser.id, supabase, statusColumnExists])

  // Set up real-time updates for messages and typing indicators
  useEffect(() => {
    // Replace the setupRealtime function with this updated version that stores the channel in the ref
    const setupRealtime = async () => {
      try {
        // First make sure our subscription isn't going to fail
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          console.warn("No session found for real-time updates")
          return
        }

        // Create the channel and store it in the ref
        const channel = supabase
          .channel(`room:${conversationId}`)
          // Listen for new messages
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              console.log("New message received:", payload)
              const newMessage = payload.new as MessageWithStatus

              // Only add the message if it's not already in the list
              // This prevents duplicate messages
              setMessages((prev) => {
                if (prev.some((msg) => msg.id === newMessage.id)) {
                  return prev
                }
                return [...prev, newMessage]
              })
            },
          )

          // Only set up update subscription if status column exists
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              if (statusColumnExists) {
                console.log("Message updated:", payload)
                const updatedMessage = payload.new as MessageWithStatus

                // Update the message in our local state
                setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
              }
            },
          )
          // Listen for typing indicators
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState()
            console.log("Presence state:", state)

            // Check if other user is typing
            const otherUserState = Object.values(state).flat() as any[]
            const isOtherUserTyping = otherUserState.some(
              (presence) => presence.user_id === otherUser.id && presence.typing === true,
            )

            setOtherUserTyping(isOtherUserTyping)
          })
          .on("presence", { event: "join" }, ({ key, newPresences }) => {
            console.log("Join:", key, newPresences)
          })
          .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
            console.log("Leave:", key, leftPresences)
          })

        // Subscribe to the channel
        channel.subscribe((status) => {
          console.log("Subscription status:", status)
          if (status === "SUBSCRIBED") {
            // Only track presence after we're subscribed
            channel.track({
              user_id: currentUser.id,
              typing: false,
            })

            // Store the channel in the ref after successful subscription
            channelRef.current = channel
          }
        })

        return () => {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
            channelRef.current = null
          }
        }
      } catch (error) {
        console.error("Error setting up real-time subscription:", error)
      }
    }

    setupRealtime()
  }, [conversationId, supabase, currentUser.id, otherUser.id, statusColumnExists])

  // Handle typing indicator
  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true)

      try {
        // Only update presence if we have a valid channel
        if (channelRef.current) {
          await channelRef.current.track({
            user_id: currentUser.id,
            typing: true,
          })
        } else {
          console.warn("Channel not initialized yet, can't track typing status")
        }
      } catch (error) {
        console.error("Error updating typing status:", error)
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)

      try {
        // Only update presence if we have a valid channel
        if (channelRef.current) {
          await channelRef.current.track({
            user_id: currentUser.id,
            typing: false,
          })
        }
      } catch (error) {
        console.error("Error updating typing status:", error)
      }
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSending || loading || !newMessage.trim()) return

    setIsSending(true)
    setLoading(true)

    const messageToSend = newMessage.trim()
    setNewMessage("") // Clear input immediately

    try {
      // Check if we have a valid session first
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue chatting",
          variant: "destructive",
        })
        setLoading(false)
        setIsSending(false)
        return
      }

      // Generate a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`

      // Add the message optimistically
      const optimisticMessage: MessageWithStatus = {
        id: tempId,
        conversation_id: conversationId,
        profile_id: currentUser.id,
        content: messageToSend,
        created_at: new Date().toISOString(),
        status: statusColumnExists ? "sending" : undefined,
      }

      setMessages((prev) => [...prev, optimisticMessage])

      // Send the message
      let insertData: any = {
        conversation_id: conversationId,
        profile_id: currentUser.id,
        content: messageToSend,
      }

      // Only add status field if the column exists
      if (statusColumnExists) {
        insertData.status = "delivered"
      }

      const { error, data } = await supabase.from("messages").insert(insertData).select().single()

      if (error) {
        console.error("Message error:", error)
        toast({
          title: "Error sending message",
          description: error.message,
          variant: "destructive",
        })

        // Remove the optimistic message
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        setNewMessage(messageToSend) // Restore the message in the input
        return
      }

      // Replace optimistic message with real one
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? data : msg)))
    } catch (error) {
      console.error("Message error:", error)
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      })
      setNewMessage(messageToSend) // Restore the message in the input
    } finally {
      setLoading(false)
      setIsSending(false)
    }
  }

  // Render read receipt status icon
  const renderReadStatus = (message: MessageWithStatus) => {
    // Only render status for current user's messages if status column exists
    if (message.profile_id !== currentUser.id || !statusColumnExists) return null

    switch (message.status) {
      case "read":
        return <CheckCheck className="h-3.5 w-3.5 text-primary" />
      case "delivered":
        return <Check className="h-3.5 w-3.5 text-gray-400" />
      default:
        return <Check className="h-3.5 w-3.5 text-gray-300" />
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [date: string]: Message[] }, message) => {
    const date = new Date(message.created_at).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                  {new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </div>
              </div>

              {dateMessages.map((message, index) => {
                const isCurrentUser = message.profile_id === currentUser.id
                const showAvatar = index === 0 || dateMessages[index - 1]?.profile_id !== message.profile_id

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} items-end gap-2`}
                  >
                    {!isCurrentUser && showAvatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={otherUser.avatar_url || undefined} alt={otherUser.username} />
                        <AvatarFallback className="bg-primary/20 text-xs">
                          {getInitials(otherUser.username)}
                        </AvatarFallback>
                      </Avatar>
                    ) : !isCurrentUser ? (
                      <div className="w-8" /> // Spacer for alignment
                    ) : null}

                    <div
                      className={`max-w-xs sm:max-w-md md:max-w-lg p-3 rounded-lg ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-accent text-accent-foreground rounded-tl-none"
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="text-xs mt-1 opacity-70 text-right flex items-center justify-end gap-1">
                        <span>{formatDate(message.created_at)}</span>
                        {renderReadStatus(message)}
                      </div>
                    </div>

                    {isCurrentUser && showAvatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.username} />
                        <AvatarFallback className="bg-primary/20 text-xs">
                          {getInitials(currentUser.username)}
                        </AvatarFallback>
                      </Avatar>
                    ) : isCurrentUser ? (
                      <div className="w-8" /> // Spacer for alignment
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="flex justify-start items-end gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.avatar_url || undefined} alt={otherUser.username} />
              <AvatarFallback className="bg-primary/20 text-xs">{getInitials(otherUser.username)}</AvatarFallback>
            </Avatar>
            <div className="bg-slate-100 p-3 rounded-lg rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div
                  className="w-2 h-2 bg-accent rounded-full animate-bounce"
                  style={{ animationDelay: "50ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-accent rounded-full animate-bounce"
                  style={{ animationDelay: "200ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            placeholder="Type a message..."
            disabled={loading || isSending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || isSending || !newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
