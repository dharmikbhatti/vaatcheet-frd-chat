import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

// Get environment variables with fallbacks to prevent runtime errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// For server components - must be called in a Server Component
export function createServerComponentClient() {
  try {
    // Verify that environment variables are set
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase URL or Anon Key is missing. Check your environment variables.")
    }

    const cookieStore = cookies()

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    })
  } catch (e) {
    console.error("Error creating server component client:", e)

    // Fallback for usage in Client Components where cookies() will throw
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
    })
  }
}
