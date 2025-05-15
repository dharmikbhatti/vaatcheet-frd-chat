import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromSession } from "@/lib/auth"
import { getMessages } from "@/lib/db"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const session = cookieStore.get("session")?.value

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await getUserFromSession(session)
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const sender = searchParams.get("sender")
  const receiver = searchParams.get("receiver")

  if (!sender || !receiver) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  // Ensure the current user is part of the conversation
  if (currentUser.id !== sender && currentUser.id !== receiver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const messages = await getMessages(sender, receiver)
    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
