import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Get environment variables with fallbacks to prevent runtime errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a singleton for client components
let clientSingleton: ReturnType<typeof createClient<Database>>

export function createClientComponentClient() {
  // Make sure we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("Warning: createClientComponentClient called in a server context")
  }

  if (clientSingleton) return clientSingleton

  // Verify that environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Check your environment variables.")
  }

  // Create a fresh client with browser persistence
  clientSingleton = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "supabase-auth",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return clientSingleton
}

// Export the URL and key for debugging purposes
export const debug = {
  url: supabaseUrl ? supabaseUrl.substring(0, 10) + "..." : "not set",
  keyPresent: !!supabaseAnonKey,
}
