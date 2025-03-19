"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export default function SelectRole() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedRole, setSelectedRole] = useState<"FREELANCER" | "PAYER" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render the page content if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to set role");
        return;
      }

      // Sign out and redirect to sign in page to refresh the session
      await signOut({ 
        redirect: false 
      });
      
      // Redirect to sign in page with callback to dashboard
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent('/dashboard')}`;
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Select Your Role</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose how you want to use FreelanceFlow
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedRole === "FREELANCER"
              ? "border-foreground bg-foreground/5"
              : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
          }`}
          onClick={() => setSelectedRole("FREELANCER")}
        >
          <div className="flex flex-col items-center text-center p-4">
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="font-medium text-lg">Freelancer</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Track your time, manage projects, and get paid for your work
            </p>
          </div>
        </div>

        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedRole === "PAYER"
              ? "border-foreground bg-foreground/5"
              : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
          }`}
          onClick={() => setSelectedRole("PAYER")}
        >
          <div className="flex flex-col items-center text-center p-4">
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
            <h3 className="font-medium text-lg">Payer</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Create projects, manage freelancers, and process payments
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleRoleSelection}
        disabled={isLoading || !selectedRole}
        className="inline-flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Continue"}
      </button>
    </div>
  );
}
