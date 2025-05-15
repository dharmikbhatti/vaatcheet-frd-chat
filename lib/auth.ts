import { cookies } from "next/headers"
import { getUserById } from "@/lib/db"
import type { User } from "@/lib/types"

// In a real app, you would use a proper encryption library
// This is a simplified example for demonstration purposes
export async function encrypt(data: any): Promise<string> {
  return JSON.stringify(data)
}

export async function decrypt(encryptedData: string | undefined): Promise<any> {
  if (!encryptedData) return null
  try {
    return JSON.parse(encryptedData)
  } catch (error) {
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const sessionData = {
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
  }

  return encrypt(sessionData)
}

export async function getUserFromSession(session: string): Promise<User | null> {
  try {
    const sessionData = await decrypt(session)

    if (!sessionData || !sessionData.userId) {
      return null
    }

    // Check if session is expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      return null
    }

    return getUserById(sessionData.userId)
  } catch (error) {
    console.error("Error getting user from session:", error)
    return null
  }
}

export async function updateSession(): Promise<void> {
  const cookieStore = cookies()
  const session = cookieStore.get("session")?.value
  const sessionData = await decrypt(session)

  if (!session || !sessionData) {
    return
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
  sessionData.expiresAt = expires

  const updatedSession = await encrypt(sessionData)

  cookieStore.set("session", updatedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete("session")
}
