import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 sm:w-72 h-48 sm:h-72 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-[1.2] sm:leading-tight">
              Connect and Chat with Your{" "}
              <span className="text-primary">Friends</span> in{" "}
              <span className="relative inline-block">
                Real-Time
                <span className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-1.5 sm:h-2 bg-primary/20 rounded-full" />
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
              Experience seamless communication with VaatCheet. Join thousands of users who are already connected and chatting.
            </p>
          </div>

          <div className="flex sm:flex-col flex-row md:gap-4 pt-4 sm:pt-8 gap-4 justify-center sm:w-full w-auto px-4 md:px-0">
            <Link href="/register" className="w-full md:w-auto">
              <Button 
                className="w-auto h-10 md:h-11 lg:h-12 bg-primary hover:bg-primary/90 px-4 md:px-5 lg:px-6 text-sm md:text-base lg:text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full md:w-auto">
              <Button 
                variant="outline" 
                className="w-auto h-10 md:h-11 lg:h-12 border-primary text-primary hover:bg-primary/10 px-4 md:px-5 lg:px-6 text-sm md:text-base lg:text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 pt-8 sm:pt-12 w-full max-w-2xl px-4 sm:px-0">
            <div className="text-center p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-primary">10K+</div>
              <div className="text-xs sm:text-sm text-slate-600">Active Users</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-primary">24/7</div>
              <div className="text-xs sm:text-sm text-slate-600">Real-time Chat</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg col-span-2 sm:col-span-1">
              <div className="text-2xl sm:text-3xl font-bold text-primary">100%</div>
              <div className="text-xs sm:text-sm text-slate-600">Secure & Private</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 