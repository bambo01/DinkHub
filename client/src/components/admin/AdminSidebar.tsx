"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiSettings,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: FiHome },
  { label: "Users", href: "/admin/users", icon: FiUsers },
  { label: "Courts", href: "/admin/courts", icon: FiGrid },
  {
    label: "Court Bookings",
    href: "/admin/court-bookings",
    icon: FiCalendar,
  },
  { label: "Open Play", href: "/admin/open-play", icon: FiActivity },
  {
    label: "Open Play Bookings",
    href: "/admin/open-play-bookings",
    icon: FiClipboard,
  },
  { label: "Payments", href: "/admin/payments", icon: FiCreditCard },
  { label: "Reports", href: "/admin/reports", icon: FiBarChart2 },
  { label: "Settings", href: "/admin/settings", icon: FiSettings },
];

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({
  isMobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  function renderNav(onNavigate?: () => void) {
    return (
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-secondary"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col bg-secondary md:flex">
        <div className="flex h-16 items-center px-6 text-lg font-bold text-white">
          DinkHub <span className="ml-1.5 text-primary">Admin</span>
        </div>
        {renderNav()}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-64 flex-col bg-secondary">
            <div className="flex h-16 items-center justify-between px-6">
              <span className="text-lg font-bold text-white">
                DinkHub <span className="text-primary">Admin</span>
              </span>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close menu"
                className="text-white/80 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {renderNav(onMobileClose)}
          </aside>
        </div>
      )}
    </>
  );
}
