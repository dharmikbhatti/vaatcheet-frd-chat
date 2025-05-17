import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="flex flex-col items-center text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 max-w-3xl">
          Connect and Chat with Your Friends in Real-Time
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl">
          Experience seamless communication with VaatCheet. Join thousands of users who are already connected and chatting.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
} 