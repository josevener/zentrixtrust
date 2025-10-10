import Link from "next/link";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-extrabold text-emerald-700">
          Zentrix<span className="text-emerald-500">Trust</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
          <Link href="/marketplace" className="hover:text-emerald-600 transition">
            Marketplace
          </Link>
          <Link href="/about" className="hover:text-emerald-600 transition">
            About
          </Link>
          <Link href="/faq" className="hover:text-emerald-600 transition">
            FAQ
          </Link>
          <Link href="/contact" className="hover:text-emerald-600 transition">
            Contact
          </Link>
        </nav>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-emerald-700 hover:text-emerald-800 cursor-pointer">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}