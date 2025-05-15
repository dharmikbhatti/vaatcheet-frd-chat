"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clear any existing session first to prevent issues
      await supabase.auth.signOut()

      // Login with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error)
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!data.session) {
        toast({
          title: "Login failed",
          description: "No session was created",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Verify the user has a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (profileError && profileError.code === "PGRST116") {
        // Profile doesn't exist, create one
        const username = email.split("@")[0]
        const { error: insertError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username,
          avatar_url: null,
        })

        if (insertError) {
          console.error("Profile creation error:", insertError)
          toast({
            title: "Profile creation failed",
            description: "Could not create user profile",
            variant: "destructive",
          })
          // Sign out since profile creation failed
          await supabase.auth.signOut()
          setLoading(false)
          return
        }
      } else if (profileError) {
        console.error("Profile check error:", profileError)
      }

      // If login successful, show a toast and redirect
      toast({
        title: "Login successful",
        description: "Redirecting to dashboard...",
      })

      // Push to dashboard using router
      router.push("/dashboard")
    } catch (error) {
      console.error("Login exception:", error)
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image src="/images/logo-icon.png" alt="VaatCheet Logo" width={80} height={80} />
          </div>
          <CardTitle className="text-2xl">Login to VaatCheet</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
