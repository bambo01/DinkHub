"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiInfo,
  FiGrid,
  FiMail,
  FiUsers,
  FiUserPlus,
  FiLogIn,
  FiLogOut,
  FiUser,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { LinkButton } from "@/components/ui/LinkButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/", icon: FiHome },
  { label: "About Us", href: "/#about", icon: FiInfo },
  { label: "Courts", href: "/courts", icon: FiGrid },
  { label: "Contact", href: "/#contact", icon: FiMail },
  { label: "Open Play", href: "/open-play", icon: FiUsers },
];

const mobileAccountLinks = [
  { label: "View Profile", href: "/profile", icon: FiUser },
  {
    label: "Booking Confirmation",
    href: "/bookings/confirmation",
    icon: FiCheckCircle,
  },
  { label: "History", href: "/bookings/history", icon: FiClock },
];

// Homepage-only sections that don't have their own route — the header
// scroll-spies these so "About Us"/"Contact" can show active while the user
// is anchored on /, since usePathname() never reflects a hash.
type HomeSection = "home" | "about" | "contact";

function getActiveHomeSection(): HomeSection {
  // Contact is the last section on the page — once the page has scrolled as
  // far as it can, count it active even if its top never reaches the
  // threshold below. That happens whenever the viewport is taller than
  // whatever's left below Contact (its own height plus the footer), which
  // on a typical 1080p screen it easily is — the page runs out of room to
  // scroll before the threshold check below would ever fire.
  const scrolledToBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (scrolledToBottom && document.getElementById("contact")) return "contact";

  // Matches the sticky header height (h-20) plus a little slack, so a
  // section only counts as active once it's actually visible below it.
  const threshold = 96;
  const contactTop = document.getElementById("contact")?.getBoundingClientRect().top;
  if (contactTop !== undefined && contactTop <= threshold) return "contact";
  const aboutTop = document.getElementById("about")?.getBoundingClientRect().top;
  if (aboutTop !== undefined && aboutTop <= threshold) return "about";
  return "home";
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [activeHomeSection, setActiveHomeSection] = useState<HomeSection>("home");

  // setActiveHomeSection runs synchronously on mount/pathname-change before
  // the listeners attach, which react-hooks/set-state-in-effect flags on
  // principle — but the very first paint needs a correct value too, not
  // just later scroll events.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (pathname !== "/") return;

    setActiveHomeSection(getActiveHomeSection());

    function handleScroll() {
      setActiveHomeSection(getActiveHomeSection());
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function isLinkActive(href: string) {
    if (href === "/#about") return pathname === "/" && activeHomeSection === "about";
    if (href === "/#contact") return pathname === "/" && activeHomeSection === "contact";
    if (href === "/") return pathname === "/" && activeHomeSection === "home";
    return pathname === href;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-secondary/10 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="DinkHub"
            width={1920}
            height={1080}
            priority
            className="h-30 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:text-primary",
                isLinkActive(link.href) &&
                  "bg-primary text-secondary font-semibold hover:text-secondary",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <LinkButton href="/register" icon={FiUserPlus} variant="outline">
                Register
              </LinkButton>
              <LinkButton href="/login" icon={FiLogIn} variant="primary">
                Login
              </LinkButton>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex items-center justify-center rounded-md p-2 text-secondary md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-secondary/10 px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-secondary hover:bg-secondary/5",
                isLinkActive(link.href) && "bg-primary hover:bg-primary",
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="mt-2 border-t border-secondary/10 px-2 pt-2">
              <p className="px-2 py-1 text-sm font-semibold text-secondary">
                {user.fullName ?? user.email}
              </p>
              {mobileAccountLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-secondary hover:bg-secondary/5"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <FiLogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="mt-2 flex gap-3 px-2">
              <LinkButton
                href="/register"
                icon={FiUserPlus}
                variant="outline"
                linkClassName="flex-1"
                className="w-full"
                onLinkClick={() => setIsMenuOpen(false)}
              >
                Register
              </LinkButton>
              <LinkButton
                href="/login"
                icon={FiLogIn}
                variant="primary"
                linkClassName="flex-1"
                className="w-full"
                onLinkClick={() => setIsMenuOpen(false)}
              >
                Login
              </LinkButton>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
