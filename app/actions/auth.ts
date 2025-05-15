"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createUser, getUserByEmail, verifyPassword } from "@/lib/db"
import { createSession } from "@/lib/auth"

export async function register(name: string, email: string, password: string) {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return { success: false, error: "User with this email already exists" }
    }

    // Create new user
    const user = await createUser(name, email, password)

    // Create session
    const session = await createSession(user.id)

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Failed to register user" }
  }
}

export async function login(email: string, password: string) {
  try {
    // Get user by email
    const user = await getUserByEmail(email)
    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    // Verify password
    const isValid = await verifyPassword(user.id, password)
    if (!isValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create session
    const session = await createSession(user.id)

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Failed to log in" }
  }
}

export async function logout() {
  const cookieStore = cookies()
  cookieStore.delete("session")
  redirect("/login")
}
