export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          conversation_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          profile_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          profile_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          profile_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          profile_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Functions: {
      create_new_conversation: {
        Args: {
          user1_id: string
          user2_id: string
        }
        Returns: string
      }
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
export type Participant = Database["public"]["Tables"]["participants"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
