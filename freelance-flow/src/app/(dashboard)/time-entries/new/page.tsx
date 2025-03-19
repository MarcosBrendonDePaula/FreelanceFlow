"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import dayjs from "dayjs";

interface Project {
  id: string;
  name: string;
  hourlyRate: number;
}

const timeEntrySchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
});

type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

export default function NewTimeEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      projectId: projectIdParam || "",
      description: "",
      startDate: dayjs().format("YYYY-MM-DD"),
      startTime: dayjs().format("HH:mm"),
      endDate: "",
      endTime: "",
    },
  });

  // Watch form values
  const watchProjectId = watch("projectId");

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again.");
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const onSubmit = async (data: TimeEntryFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // Format dates
      const startDateTime = new Date(
        `${data.startDate}T${data.startTime}`
      ).toISOString();

      let endDateTime = null;
      if (data.endDate && data.endTime) {
        endDateTime = new Date(
          `${data.endDate}T${data.endTime}`
        ).toISOString();
      }

      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: data.projectId,
          description: data.description,
          startTime: startDateTime,
          endTime: endDateTime,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to create time entry");
        return;
      }

      // Redirect to time entries page
      router.push("/time-entries");
      router.refresh();
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get selected project
  const selectedProject = projects.find(
    (project) => project.id === watchProjectId
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Log Time</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
        {isLoadingProjects ? (
          <div className="text-center py-4">Loading projects...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="projectId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Project
              </label>
              <select
                id="projectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("projectId")}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} (${project.hourlyRate.toFixed(2)}/hr)
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-sm text-red-500">
                  {errors.projectId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="What did you work on?"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="time"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("startTime")}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  End Date (Optional)
                </label>
                <input
                  id="endDate"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("endDate")}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  End Time (Optional)
                </label>
                <input
                  id="endTime"
                  type="time"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("endTime")}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            {selectedProject && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hourly Rate: ${selectedProject.hourlyRate.toFixed(2)}/hr
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-2 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Time Entry"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
