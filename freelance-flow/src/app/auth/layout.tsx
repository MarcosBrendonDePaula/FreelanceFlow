import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Authentication - FreelanceFlow",
  description: "Sign in or sign up to FreelanceFlow",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-foreground">FreelanceFlow</h1>
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your freelance work efficiently
          </p>
        </div>
        <div className="mt-8 bg-white dark:bg-gray-900 p-8 shadow rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
