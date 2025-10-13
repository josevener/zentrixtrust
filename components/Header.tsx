"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useUser } from "@/context/UserContext";

export default function Header() {
  const { isAuthenticated, logout } = useUser();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <Link href="/" className="text-2xl font-extrabold text-emerald-700">
          Zentrix<span className="text-emerald-500">Trust</span>
        </Link>

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

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-emerald-700 hover:text-emerald-800"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/marketplace">
                <Button variant="ghost" className="text-emerald-700 hover:text-emerald-800">
                  Go to Marketplace
                </Button>
              </Link>
              <Button
                onClick={logout}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
