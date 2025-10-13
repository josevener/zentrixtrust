"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";

export default function AuthHeader() {
  const { user, logout } = useUser();
  const pathname = usePathname();

  const navItems = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/ongoing", label: "Ongoing" },
    { href: "/completed", label: "Completed" },
    { href: "/cancelled", label: "Cancelled" },
    { href: `/profile/${user?.username}`, label: "Profile" },
  ];

  return (
    <header className="sticky w-full top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4">
        {/* Logo */}
        <Link
          href="/marketplace"
          className="text-2xl font-extrabold text-emerald-700"
        >
          Zentrix<span className="text-emerald-500">Trust</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
          {navItems.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative transition ${
                  isActive
                    ? "text-emerald-600 font-semibold"
                    : "hover:text-emerald-600"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-emerald-600 rounded-full"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Avatar Dropdown */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 rounded-full h-10 w-10 hover:shadow-md cursor-pointer">
                <Avatar className="h-10 w-10 border-2">
                  <AvatarImage
                    src={user?.avatar || "/assets/images/default_user.png"}
                    alt={user?.email || "User"}
                  />
                  <AvatarFallback>
                    {user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                {user?.email || "Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user?.username}`}>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 focus:text-red-700 cursor-pointer"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
