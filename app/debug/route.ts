import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  const cookieStore = cookies()
  const cookieString = cookieStore.toString()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
    },
    global: {
      headers: {
        cookie: cookieString,
      },
    },
  })

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  return NextResponse.json({
    cookies: cookieString,
    session: sessionData,
    sessionError,
  })
}
