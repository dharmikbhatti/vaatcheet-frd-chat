"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        toast({
          title: "Passwords do not match",
          description: "Please make sure your passwords match",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .limit(1)

      if (checkError) {
        console.error("Error checking existing user:", checkError)
      }

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Username already taken",
          description: "Please choose a different username",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (authError) {
        console.error("Registration error:", authError)
        toast({
          title: "Registration failed",
          description: authError.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!authData.user) {
        toast({
          title: "Registration failed",
          description: "Could not create user account",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Create a profile for the user
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        username,
        avatar_url: null,
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)

        // Try to delete the auth user since profile creation failed
        try {
          // We can't delete the user directly, but we can sign out
          await supabase.auth.signOut()
        } catch (e) {
          console.error("Error cleaning up after failed registration:", e)
        }

        toast({
          title: "Profile creation failed",
          description: profileError.message || "Could not create user profile",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Sign out the user to force them to log in after email confirmation
      await supabase.auth.signOut()

      // Show success state
      setRegistrationComplete(true)
      setLoading(false)
    } catch (error) {
      console.error("Registration exception:", error)
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (registrationComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Image src="/images/logo-icon.png" alt="VaatCheet Logo" width={80} height={80} className="mb-4" />
              <CheckCircle2 className="h-16 w-16 text-primary absolute -bottom-2" />
            </div>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a confirmation link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <div className="text-sm text-slate-700">
                  Please check your email and click the confirmation link to activate your account.
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => {
                router.push("/login")
              }}
            >
              Go to Login
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-slate-600">
              Didn't receive an email?{" "}
              <button onClick={() => setRegistrationComplete(false)} className="text-primary hover:underline">
                Try again
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image src="/images/logo-icon.png" alt="VaatCheet Logo" width={80} height={80} />
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details to create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                required
              />
            </div>
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
                minLength={6}
              />
              <p className="text-xs text-slate-500">Password must be at least 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating account...
                </div>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
