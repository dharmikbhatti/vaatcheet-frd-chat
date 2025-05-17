import { createServerComponentClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { CTASection } from "@/components/landing/CTASection"
import { Footer } from "@/components/landing/Footer"
import { LoadingScreen } from "@/components/landing/LoadingScreen"

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
    <>
      <LoadingScreen />
      <div className="min-h-screen bg-gradient-to-br from-accent/20 to-primary/20">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  )
}
