import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold">FreelanceFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div>
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                  Simplify Your Freelance Work Management
                </h2>
                <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
                  Track time, manage projects, and handle payments all in one place.
                  FreelanceFlow makes freelancing easier for both freelancers and clients.
                </p>
                <div className="mt-8">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-3 text-base font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
              <div className="mt-12 lg:mt-0">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 flex items-center justify-center">
                  <svg
                    className="w-64 h-64 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.25 17.5h-1.5v-1.5h1.5v1.5zm1.5-4.5h-1.5v-7.5h-1.5v-1.5h3v9z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                Key Features
              </h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Everything you need to manage your freelance work efficiently
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  Time Tracking
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Easily track your working hours for different projects and clients.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  Project Management
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Organize your work by projects and collaborate with clients efficiently.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  Payment Management
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Track payments, upload receipts, and manage your finances in one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-foreground rounded-lg shadow-xl overflow-hidden">
              <div className="px-6 py-12 sm:px-12 lg:py-16">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-3xl font-extrabold text-white">
                    Ready to streamline your freelance work?
                  </h2>
                  <p className="mt-4 text-lg text-foreground-200">
                    Join FreelanceFlow today and take control of your freelance business.
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-base font-medium text-foreground hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-foreground"
                    >
                      Sign Up Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} FreelanceFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
