import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export function CTASection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="bg-primary/10 rounded-2xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Chatting?</h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Join VaatCheet today and experience the next level of real-time communication.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Create Free Account
              <Zap className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
} 