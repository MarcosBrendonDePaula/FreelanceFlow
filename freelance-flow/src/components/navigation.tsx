"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isFreelancer = session?.user?.role === "FREELANCER";
  const isPayer = session?.user?.role === "PAYER";

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      visible: true,
    },
    {
      name: "Projects",
      href: "/projects",
      visible: true,
    },
    {
      name: "Time Entries",
      href: "/time-entries",
      visible: isFreelancer,
    },
    {
      name: "Payments",
      href: "/payments",
      visible: true,
    },
    {
      name: "Profile",
      href: "/profile",
      visible: true,
    },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold">
                FreelanceFlow
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems
                .filter((item) => item.visible)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === item.href
                        ? "border-foreground text-foreground dark:text-white"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:border-gray-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">
                  {session?.user?.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`${isMenuOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems
            .filter((item) => item.visible)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname === item.href
                    ? "border-foreground text-foreground dark:text-white bg-foreground/5"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 dark:hover:border-gray-700"
                }`}
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            ))}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center px-4">
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800 dark:text-white">
                {session?.user?.name}
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {session?.user?.email}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
