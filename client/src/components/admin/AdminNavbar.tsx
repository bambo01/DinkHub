"use client";

import { useRouter } from "next/navigation";
import { FiLogOut, FiMenu } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

interface AdminNavbarProps {
  onMenuClick: () => void;
}

export function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Toggle menu"
        className="flex items-center justify-center rounded-md p-2 text-secondary md:hidden"
      >
        <FiMenu className="h-5 w-5" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-secondary">
            {user?.fullName ?? user?.email}
          </p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-secondary hover:bg-gray-50"
        >
          <FiLogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
