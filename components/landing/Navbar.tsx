"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-700">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-slate-700" />
          ) : (
            <Menu className="h-6 w-6 text-slate-700" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden ${
          isMenuOpen
            ? "max-h-48 opacity-100"
            : "max-h-0 opacity-0"
        } transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <div className="flex flex-col space-y-4 pt-4 pb-2">
          <Link href="/login">
            <Button variant="ghost" className="w-full text-slate-700">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="w-full bg-primary hover:bg-primary/90">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
} 