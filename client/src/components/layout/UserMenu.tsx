"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "View Profile", href: "/profile", icon: FiUser },
  {
    label: "Booking Confirmation",
    href: "/bookings/confirmation",
    icon: FiCheckCircle,
  },
  { label: "History", href: "/bookings/history", icon: FiClock },
];

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  function handleLogout() {
    logout();
    setIsOpen(false);
    router.push("/");
  }

  const displayName = user.fullName ?? user.email;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/5"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-secondary">
          {displayName.charAt(0).toUpperCase()}
        </span>
        {displayName}
        <FiChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:bg-secondary/5"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <FiLogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
