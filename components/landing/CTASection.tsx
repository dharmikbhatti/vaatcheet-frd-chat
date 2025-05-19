import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, Star } from "lucide-react"

export function CTASection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="bg-primary/10 rounded-2xl p-6 sm:p-8 lg:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="absolute top-4 right-4 text-primary/20">
          <Star className="h-12 w-12 animate-pulse" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Ready to Start Chatting?</h2>
          <p className="text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base">
            Join VaatCheet today and experience the next level of real-time communication.
          </p>
          <Link href="/register" className="inline-block">
            <Button size="sm" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              Create Free Account
              <Zap className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
} 