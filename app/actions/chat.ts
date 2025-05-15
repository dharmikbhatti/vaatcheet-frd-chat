"use server"

import { saveMessage } from "@/lib/db"

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  try {
    const message = await saveMessage(senderId, receiverId, content)
    return { success: true, message }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Failed to send message" }
  }
}
