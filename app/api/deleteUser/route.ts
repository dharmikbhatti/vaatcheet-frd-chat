import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Delete user's avatar from storage if it exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (profile?.avatar_url) {
      const avatarPath = profile.avatar_url.split('/').pop()
      if (avatarPath) {
        await supabase.storage
          .from('avatars')
          .remove([`${userId}/${avatarPath}`])
      }
    }

    // Delete user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return NextResponse.json(
        { error: "Failed to delete user profile" },
        { status: 500 }
      )
    }

    // Delete user's auth account
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return NextResponse.json(
        { error: "Failed to delete user account" },
        { status: 500 }
      )
    }

    // Clear the session cookie
    await supabase.auth.signOut()

    return NextResponse.json(
      { message: "User and all associated data deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in delete user route:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 