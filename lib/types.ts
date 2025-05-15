export interface User {
  id: string
  name: string
  email: string
  passwordHash?: string
  online?: boolean
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  status: "sending" | "sent" | "delivered" | "read" | "failed"
}
