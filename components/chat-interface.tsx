"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import type { Profile, Message } from "@/lib/database.types";
import { Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { motion, AnimatePresence } from "framer-motion";
import TypingBox from "./typing-box";

// Extend Message type to include status
interface MessageWithStatus extends Message {
  status?: "sending" | "delivered" | "read";
}

interface ChatRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

interface ChatInterfaceProps {
  currentUser: Profile;
  otherUser: Profile;
  conversationId: string | null;
  initialMessages: MessageWithStatus[];
}

// Add these animation variants
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const typingVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const emojiPickerVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export default function ChatInterface({
  currentUser,
  otherUser,
  conversationId,
  initialMessages,
}: ChatInterfaceProps) {
  const [messages, setMessages] =
    useState<MessageWithStatus[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [statusColumnExists, setStatusColumnExists] = useState(false);
  const [chatRequest, setChatRequest] = useState<ChatRequest | null>(null);
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  // Add a channelRef to store the channel instance
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldFocusInput, setShouldFocusInput] = useState(false);

  // Check if status column exists
  useEffect(() => {
    const checkStatusColumn = async () => {
      try {
        // Try a simple query to check if the status column exists
        const { error } = await supabase
          .from("messages")
          .select("status")
          .limit(1);

        if (error && error.message.includes("status")) {
          console.warn("Status column does not exist yet:", error.message);
          setStatusColumnExists(false);
        } else {
          console.log("Status column exists");
          setStatusColumnExists(true);
        }
      } catch (error) {
        console.error("Error checking status column:", error);
        setStatusColumnExists(false);
      }
    };

    checkStatusColumn();
  }, [supabase]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  // Mark messages as read when viewed
  useEffect(() => {
    const markMessagesAsRead = async () => {
      // Skip if status column doesn't exist yet
      if (!statusColumnExists || !conversationId) return;

      try {
        // Get all unread messages from the other user
        const unreadMessages = messages.filter(
          (msg) => msg.profile_id === otherUser.id && msg.status !== "read"
        );

        if (unreadMessages.length === 0) return;

        // Update all unread messages to "read" status
        const { error } = await supabase
          .from("messages")
          .update({ status: "read" })
          .in(
            "id",
            unreadMessages.map((msg) => msg.id)
          );

        if (error) {
          console.error("Error marking messages as read:", error);
        }
      } catch (error) {
        console.error("Error in markMessagesAsRead:", error);
      }
    };

    // Mark messages as read when component mounts and when messages change
    markMessagesAsRead();
  }, [messages, otherUser.id, supabase, statusColumnExists, conversationId]);

  // Set up real-time updates for messages and typing indicators
  useEffect(() => {
    // Only set up real-time updates if we have a conversation
    if (!conversationId) return;

    // Replace the setupRealtime function with this updated version that stores the channel in the ref
    const setupRealtime = async () => {
      try {
        // First make sure our subscription isn't going to fail
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.warn("No session found for real-time updates");
          return;
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
              console.log("New message received:", payload);
              const newMessage = payload.new as MessageWithStatus;

              // Only add the message if it's not already in the list
              // This prevents duplicate messages
              setMessages((prev) => {
                if (prev.some((msg) => msg.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
            }
          )
          // Listen for message status updates
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              console.log("Message updated:", payload);
              const updatedMessage = payload.new as MessageWithStatus;

              // Update the message in our local state
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                )
              );
            }
          )
          // Listen for typing indicators
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            console.log("Presence state:", state);

            // Check if other user is typing
            const otherUserState = Object.values(state).flat() as any[];
            const isOtherUserTyping = otherUserState.some(
              (presence) =>
                presence.user_id === otherUser.id && presence.typing === true
            );

            setOtherUserTyping(isOtherUserTyping);
          })
          .on("presence", { event: "join" }, ({ key, newPresences }) => {
            console.log("Join:", key, newPresences);
          })
          .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
            console.log("Leave:", key, leftPresences);
          });

        // Subscribe to the channel
        channel.subscribe((status) => {
          console.log("Subscription status:", status);
          if (status === "SUBSCRIBED") {
            // Only track presence after we're subscribed
            channel.track({
              user_id: currentUser.id,
              typing: false,
            });

            // Store the channel in the ref after successful subscription
            channelRef.current = channel;
          }
        });

        return () => {
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        };
      } catch (error) {
        console.error("Error setting up real-time subscription:", error);
      }
    };

    setupRealtime();
  }, [
    conversationId,
    supabase,
    currentUser.id,
    otherUser.id,
    statusColumnExists,
  ]);

  // Handle typing indicator
  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);

      try {
        // Only update presence if we have a valid channel
        if (channelRef.current) {
          await channelRef.current.track({
            user_id: currentUser.id,
            typing: true,
          });
        } else {
          console.warn(
            "Channel not initialized yet, can't track typing status"
          );
        }
      } catch (error) {
        console.error("Error updating typing status:", error);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);

      try {
        // Only update presence if we have a valid channel
        if (channelRef.current) {
          await channelRef.current.track({
            user_id: currentUser.id,
            typing: false,
          });
        }
      } catch (error) {
        console.error("Error updating typing status:", error);
      }
    }, 2000);
  };

  // Add this new useEffect for handling input focus
  useEffect(() => {
    if (shouldFocusInput && inputRef.current) {
      inputRef.current.focus();
      setShouldFocusInput(false);
    }
  }, [shouldFocusInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions or if no conversation exists
    if (isSending || loading || !newMessage.trim() || !conversationId) return;

    setIsSending(true);
    setLoading(true);

    const messageToSend = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    try {
      // Check if we have a valid session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue chatting",
          variant: "destructive",
        });
        setLoading(false);
        setIsSending(false);
        return;
      }

      // Generate a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;

      // Add the message optimistically
      const optimisticMessage: MessageWithStatus = {
        id: tempId,
        conversation_id: conversationId,
        profile_id: currentUser.id,
        content: messageToSend,
        created_at: new Date().toISOString(),
        status: statusColumnExists ? "sending" : undefined,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Send the message
      let insertData: any = {
        conversation_id: conversationId,
        profile_id: currentUser.id,
        content: messageToSend,
      };

      // Only add status field if the column exists
      if (statusColumnExists) {
        insertData.status = "delivered";
      }

      const { error, data } = await supabase
        .from("messages")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Message error:", error);
        toast({
          title: "Error sending message",
          description: error.message,
          variant: "destructive",
        });

        // Remove the optimistic message
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setNewMessage(messageToSend); // Restore the message in the input
        return;
      }

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? data : msg))
      );
    } catch (error) {
      console.error("Message error:", error);
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      });
      setNewMessage(messageToSend); // Restore the message in the input
    } finally {
      setLoading(false);
      setIsSending(false);
      // Set shouldFocusInput to true to trigger the useEffect
      setShouldFocusInput(true);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Render read receipt status icon
  const renderReadStatus = (message: MessageWithStatus) => {
    // Only render status for current user's messages if status column exists
    if (message.profile_id !== currentUser.id || !statusColumnExists)
      return null;

    switch (message.status) {
      case "read":
        return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
      case "delivered":
        return <Check className="h-3.5 w-3.5 text-gray-400" />;
      default:
        return <Check className="h-3.5 w-3.5 text-gray-300" />;
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups: { [date: string]: Message[] }, message) => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {}
  );

  // Check for existing chat request
  useEffect(() => {
    const checkChatRequest = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_requests")
          .select("*")
          .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`
          )
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows returned"
          console.error("Error checking chat request:", error);
          return;
        }

        if (data) {
          setChatRequest(data);
        }
      } catch (error) {
        console.error("Error in checkChatRequest:", error);
      }
    };

    if (!conversationId) {
      checkChatRequest();
    }
  }, [currentUser.id, otherUser.id, conversationId, supabase]);

  // Handle sending chat request
  const handleSendChatRequest = async () => {
    try {
      setRequestStatus("sending");

      const { data, error } = await supabase
        .from("chat_requests")
        .insert({
          sender_id: currentUser.id,
          receiver_id: otherUser.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setChatRequest(data);
      setRequestStatus("sent");
      toast({
        title: "Chat request sent",
        description: "Waiting for the other user to accept your request",
      });
    } catch (error) {
      console.error("Error sending chat request:", error);
      setRequestStatus("error");
      toast({
        title: "Error",
        description: "Failed to send chat request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle accepting chat request
  const handleAcceptRequest = async () => {
    if (!chatRequest) return;

    try {
      setRequestStatus("sending");

      const { data: conversationId, error } = await supabase.rpc(
        "handle_chat_request_acceptance",
        {
          request_id: chatRequest.id,
        }
      );

      if (error) throw error;

      setRequestStatus("sent");
      toast({
        title: "Chat request accepted",
        description: "You can now start chatting!",
      });

      // Refresh the page to load the new conversation
      window.location.reload();
    } catch (error) {
      console.error("Error accepting chat request:", error);
      setRequestStatus("error");
      toast({
        title: "Error",
        description: "Failed to accept chat request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle rejecting chat request
  const handleRejectRequest = async () => {
    if (!chatRequest) return;

    try {
      setRequestStatus("sending");

      const { error } = await supabase
        .from("chat_requests")
        .update({ status: "rejected" })
        .eq("id", chatRequest.id);

      if (error) throw error;

      setRequestStatus("sent");
      toast({
        title: "Chat request rejected",
        description: "The chat request has been rejected",
      });

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Error rejecting chat request:", error);
      setRequestStatus("error");
      toast({
        title: "Error",
        description: "Failed to reject chat request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-white mb-10">
      {!conversationId ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            {!chatRequest ? (
              <motion.div    
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center"
              >
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Start a Conversation
                </h2>
                <p className="text-slate-600 mb-6">
                  Send a chat request to {otherUser.username} to start messaging
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendChatRequest}
                  disabled={requestStatus === "sending"}
                  className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {requestStatus === "sending"
                    ? "Sending..."
                    : "Send Chat Request"}
                </motion.button>
              </motion.div>
            ) : chatRequest.status === "pending" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center"
              >
                {chatRequest.sender_id === currentUser.id ? (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      Request Sent
                    </h2>
                    <p className="text-slate-600 mb-6">
                      Waiting for {otherUser.username} to accept your chat
                      request
                    </p>
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      Chat Request
                    </h2>
                    <p className="text-slate-600 mb-6">
                      {otherUser.username} wants to chat with you
                    </p>
                    <div className="flex gap-4 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAcceptRequest}
                        disabled={requestStatus === "sending"}
                        className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRejectRequest}
                        disabled={requestStatus === "sending"}
                        className="bg-slate-200 text-slate-700 py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center"
              >
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Request {chatRequest.status}
                </h2>
                <p className="text-slate-600 mb-6">
                  {chatRequest.status === "rejected"
                    ? "The chat request has been rejected"
                    : "The chat request has been accepted"}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center h-full space-y-4"
              >
                <div className="bg-white/50 p-6 rounded-lg shadow-sm">
                  <p className="text-slate-600 text-center">
                    No messages yet. Start the conversation!
                  </p>
                  <p className="text-slate-400 text-sm text-center mt-2">
                    Send a message to begin chatting.
                  </p>
                </div>
              </motion.div>
            ) : (
              Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center"
                  >
                    <div className="bg-gradient-to-r from-purple-200 to-pink-100 text-purple-700 text-xs px-3 py-1.5 rounded-full shadow-sm">
                      {new Date(date).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </motion.div>

                  {dateMessages.map((message, index) => {
                    const isCurrentUser = message.profile_id === currentUser.id;
                    const isLastInGroup =
                      index === dateMessages.length - 1 ||
                      dateMessages[index + 1].profile_id !== message.profile_id;
                    const isFirstInGroup =
                      index === 0 ||
                      dateMessages[index - 1].profile_id !== message.profile_id;

                    return (
                      <motion.div
                        key={message.id}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className={`flex items-end gap-2 ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        } ${isFirstInGroup ? "mt-4" : "mt-0"}`}
                      >
                        {/* Avatar or spacer for alignment */}
                        {!isCurrentUser &&
                          (isLastInGroup ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                              }}
                            >
                              <Avatar className="h-9 w-9 ring-2 ring-white shadow">
                                <AvatarImage
                                  src={otherUser.avatar_url || undefined}
                                  alt={otherUser.username}
                                />
                                <AvatarFallback>
                                  {getInitials(otherUser.username)}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                          ) : (
                            <div className="w-9" />
                          ))}

                        <div
                          className={`flex flex-col max-w-xs sm:max-w-md md:max-w-lg ${
                            isCurrentUser ? "items-end" : "items-start"
                          }`}
                        >
                          <motion.div
                            variants={messageVariants}
                            className={`px-4 py-2 rounded-3xl shadow-md transition-all duration-200 ${
                              isCurrentUser
                                ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                                : "bg-white text-gray-900 border border-gray-200"
                            } ${
                              isFirstInGroup
                                ? ""
                                : "rounded-tl-3xl rounded-tr-3xl"
                            } relative`}
                            style={{
                              marginTop: isFirstInGroup ? 0 : 2,
                              marginBottom: isLastInGroup ? 6 : 2,
                              borderTopLeftRadius:
                                !isCurrentUser && !isFirstInGroup ? 16 : 28,
                              borderTopRightRadius:
                                isCurrentUser && !isFirstInGroup ? 16 : 28,
                            }}
                          >
                            <p className="break-words text-base leading-relaxed">{message.content}</p>
                            {isCurrentUser && isLastInGroup && (
                              <div className="absolute -bottom-5 right-0 flex items-center gap-1">
                                {renderReadStatus(message)}
                              </div>
                            )}
                          </motion.div>
                          {/* Show timestamp only for last in group */}
                          {isLastInGroup && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="text-xs text-gray-400 mt-1"
                            >
                              {formatDate(message.created_at)}
                            </motion.span>
                          )}
                        </div>

                        {/* Avatar or spacer for alignment (current user) */}
                        {isCurrentUser &&
                          (isLastInGroup ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                              }}
                            >
                              <Avatar className="h-9 w-9 ring-2 ring-white shadow">
                                <AvatarImage
                                  src={currentUser.avatar_url || undefined}
                                  alt={currentUser.username}
                                />
                                <AvatarFallback>
                                  {getInitials(currentUser.username)}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                          ) : (
                            <div className="w-9" />
                          ))}
                      </motion.div>
                    );
                  })}
                </div>
              ))
            )}

            {/* Typing indicator */}
            <AnimatePresence>
              {otherUserTyping && (
                <motion.div
                  variants={typingVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex justify-start items-end gap-2"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-white">
                    <AvatarImage
                      src={otherUser.avatar_url || undefined}
                      alt={otherUser.username}
                    />
                    <AvatarFallback className="bg-primary/20 text-xs">
                      {getInitials(otherUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0.3,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0,
                        }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {conversationId && (
            <TypingBox
              onSendMessage={async (message) => {
                if (isSending || loading || !message.trim() || !conversationId) return;

                setIsSending(true);
                setLoading(true);

                try {
                  const { data: sessionData } = await supabase.auth.getSession();
                  if (!sessionData.session) {
                    toast({
                      title: "Session expired",
                      description: "Please log in again to continue chatting",
                      variant: "destructive",
                    });
                    setLoading(false);
                    setIsSending(false);
                    return;
                  }

                  const tempId = `temp-${Date.now()}`;

                  const optimisticMessage: MessageWithStatus = {
                    id: tempId,
                    conversation_id: conversationId,
                    profile_id: currentUser.id,
                    content: message,
                    created_at: new Date().toISOString(),
                    status: statusColumnExists ? "sending" : undefined,
                  };

                  setMessages((prev) => [...prev, optimisticMessage]);

                  let insertData: any = {
                    conversation_id: conversationId,
                    profile_id: currentUser.id,
                    content: message,
                  };

                  if (statusColumnExists) {
                    insertData.status = "delivered";
                  }

                  const { error, data } = await supabase
                    .from("messages")
                    .insert(insertData)
                    .select()
                    .single();

                  if (error) {
                    console.error("Message error:", error);
                    toast({
                      title: "Error sending message",
                      description: error.message,
                      variant: "destructive",
                    });
                    setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
                    return;
                  }

                  setMessages((prev) =>
                    prev.map((msg) => (msg.id === tempId ? data : msg))
                  );
                } catch (error) {
                  console.error("Message error:", error);
                  toast({
                    title: "An error occurred",
                    description: "Please try again later",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                  setIsSending(false);
                }
              }}
              onTyping={handleTyping}
              loading={loading}
              isSending={isSending}
            />
          )}
        </>
      )}
    </div>
  );
}
