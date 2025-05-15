import type { User, Message } from "@/lib/types"
import crypto from "crypto"

// In-memory database for demonstration
// In a real app, you would use a proper database like Supabase, PostgreSQL, etc.
const users: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    passwordHash: hashPassword("password123"),
    online: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    passwordHash: hashPassword("password123"),
    online: false,
  },
]

const messages: Message[] = [
  {
    id: "1",
    senderId: "1",
    receiverId: "2",
    content: "Hey Jane, how are you?",
    timestamp: "2023-05-10T10:30:00Z",
    status: "sent",
  },
  {
    id: "2",
    senderId: "2",
    receiverId: "1",
    content: "Hi John! I'm good, thanks for asking. How about you?",
    timestamp: "2023-05-10T10:32:00Z",
    status: "sent",
  },
]

// Helper function to hash passwords
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// User functions
export async function createUser(name: string, email: string, password: string): Promise<User> {
  const id = (users.length + 1).toString()
  const passwordHash = hashPassword(password)

  const newUser: User = {
    id,
    name,
    email,
    passwordHash,
    online: true,
  }

  users.push(newUser)
  return newUser
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return users.find((user) => user.email === email) || null
}

export async function getUserById(id: string): Promise<User | null> {
  return users.find((user) => user.id === id) || null
}

export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const user = await getUserById(userId)
  if (!user) return false

  return user.passwordHash === hashPassword(password)
}

export async function getAllUsers(): Promise<User[]> {
  return users.map(({ passwordHash, ...user }) => user as User)
}

// Message functions
export async function saveMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
  const id = (messages.length + 1).toString()

  const newMessage: Message = {
    id,
    senderId,
    receiverId,
    content,
    timestamp: new Date().toISOString(),
    status: "sent",
  }

  messages.push(newMessage)
  return newMessage
}

export async function getMessages(user1Id: string, user2Id: string): Promise<Message[]> {
  return messages
    .filter(
      (message) =>
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id),
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}
