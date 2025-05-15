"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LogoutButton() {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      // First clear local storage to ensure session is removed
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase-auth")
      }

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Logout error:", error)
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        })
        setIsLoggingOut(false)
        return
      }

      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      })

      // Hard redirect to login page to ensure clean state
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout exception:", error)
      toast({
        title: "Error signing out",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-primary hover:bg-primary/10"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  )
}
