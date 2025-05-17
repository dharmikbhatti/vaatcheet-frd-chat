import Link from "next/link"

export function Footer() {
  return (
    <footer className="container mx-auto px-4 py-8">
      <div className="border-t border-slate-200 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">VaatCheet</h3>
            <p className="text-sm text-slate-600">
              Connect and chat with your friends in real-time. Experience seamless communication.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-sm text-slate-600 hover:text-primary">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-slate-600 hover:text-primary">Pricing</Link></li>
              <li><Link href="/security" className="text-sm text-slate-600 hover:text-primary">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-slate-600 hover:text-primary">About</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-600 hover:text-primary">Blog</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-600 hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-slate-600 hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-600 hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-600">
          <p>© 2024 VaatCheet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 