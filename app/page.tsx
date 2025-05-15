import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { createServerComponentClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

// Disable caching for this page
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Home() {
  const supabase = createServerComponentClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo-icon.png"
              alt="VaatCheet Logo"
              width={150}
              height={150}
              className="logo-pulse"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">VaatCheet</h1>
          <p className="mt-3 text-slate-600">Connect and chat with your friends in real-time</p>
        </div>

        <div className="flex flex-col space-y-4">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
              Login
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button className="w-full border-primary text-primary hover:bg-primary/10" variant="outline" size="lg">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
