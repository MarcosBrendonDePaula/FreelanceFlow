"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ChangePasswordForm from "@/components/change-password-form";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    },
  });

  // Update form values when session data is loaded
  useEffect(() => {
    if (session?.user) {
      reset({
        name: session.user.name || "",
        email: session.user.email || "",
      });
    }
  }, [session, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      setMessage(null);

      // Call the API to update the user profile
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      // Update the session with the new user data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
        },
      });

      setMessage({
        text: "Profile updated successfully",
        type: "success",
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed to update profile",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Your Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your personal information and account settings
        </p>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 bg-gray-100 dark:bg-gray-800"
              disabled
              {...register("email")}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Role
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800">
              {session?.user?.role === "FREELANCER" ? "Freelancer" : "Payer"}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your account type
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-foreground hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium mb-4">Account Security</h2>
        <div className="space-y-4">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
