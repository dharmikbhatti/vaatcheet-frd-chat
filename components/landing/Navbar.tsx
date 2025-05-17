import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image
            src="/images/logo-icon.png"
            alt="VaatCheet Logo"
            width={40}
            height={40}
            className="logo-pulse"
            priority
          />
          <span className="text-xl font-bold text-slate-900">VaatCheet</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-700">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
} 