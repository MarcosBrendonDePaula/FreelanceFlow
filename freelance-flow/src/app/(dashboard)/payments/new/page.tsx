"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface Project {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
  }[];
}

interface TimeEntry {
  id: string;
  startTime: string;
  endTime: string | null;
  description: string | null;
  user: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
    hourlyRate: number;
  };
}

const paymentSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  receiverId: z.string().min(1, "Freelancer is required"),
  timeEntryIds: z.array(z.string()).min(1, "At least one time entry is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  requiresSignedDocument: z.boolean().default(false),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function NewPayment() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(false);
  const [selectedTimeEntries, setSelectedTimeEntries] = useState<string[]>([]);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      projectId: "",
      receiverId: "",
      timeEntryIds: [],
      amount: 0,
    },
  });

  // Watch form values
  const watchProjectId = watch("projectId");
  const watchReceiverId = watch("receiverId");
  const watchTimeEntryIds = watch("timeEntryIds");

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

  // Fetch time entries when project and freelancer are selected
  useEffect(() => {
    if (watchProjectId && watchReceiverId) {
      const fetchTimeEntries = async () => {
        setIsLoadingTimeEntries(true);
        try {
          const response = await fetch(
            `/api/time-entries?projectId=${watchProjectId}&userId=${watchReceiverId}&status=unpaid&completed=false`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch time entries");
          }
          const data = await response.json();
          setTimeEntries(data);
        } catch (error) {
          console.error("Error fetching time entries:", error);
          setError("Failed to load time entries. Please try again.");
        } finally {
          setIsLoadingTimeEntries(false);
        }
      };

      fetchTimeEntries();
    } else {
      setTimeEntries([]);
    }
  }, [watchProjectId, watchReceiverId]);

  // Calculate amount when time entries are selected
  useEffect(() => {
    if (selectedTimeEntries.length > 0) {
      const amount = selectedTimeEntries.reduce((total, entryId) => {
        const entry = timeEntries.find((e) => e.id === entryId);
        if (entry) {
          const start = new Date(entry.startTime);
          const end = entry.endTime ? new Date(entry.endTime) : new Date();
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return total + hours * entry.project.hourlyRate;
        }
        return total;
      }, 0);
      setCalculatedAmount(amount);
      setValue("amount", parseFloat(amount.toFixed(2)));
    } else {
      setCalculatedAmount(0);
      setValue("amount", 0);
    }
  }, [selectedTimeEntries, timeEntries, setValue]);

  const handleTimeEntryChange = (entryId: string) => {
    setSelectedTimeEntries((prev) => {
      if (prev.includes(entryId)) {
        const newSelected = prev.filter((id) => id !== entryId);
        setValue("timeEntryIds", newSelected);
        return newSelected;
      } else {
        const newSelected = [...prev, entryId];
        setValue("timeEntryIds", newSelected);
        return newSelected;
      }
    });
  };

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to create payment");
        return;
      }

      // Redirect to payments page
      router.push("/payments");
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

  // Get freelancers for selected project
  const freelancers = selectedProject?.members || [];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Payment</h1>

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
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-sm text-red-500">
                  {errors.projectId.message}
                </p>
              )}
            </div>

            {watchProjectId && (
              <div className="space-y-2">
                <label
                  htmlFor="receiverId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Freelancer
                </label>
                <select
                  id="receiverId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("receiverId")}
                >
                  <option value="">Select a freelancer</option>
                  {freelancers.map((freelancer) => (
                    <option key={freelancer.id} value={freelancer.id}>
                      {freelancer.name}
                    </option>
                  ))}
                </select>
                {errors.receiverId && (
                  <p className="text-sm text-red-500">
                    {errors.receiverId.message}
                  </p>
                )}
              </div>
            )}

            {watchProjectId && watchReceiverId && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Time Entries
                  </label>
                  {timeEntries.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = timeEntries.map(entry => entry.id);
                          setSelectedTimeEntries(allIds);
                          setValue("timeEntryIds", allIds);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTimeEntries([]);
                          setValue("timeEntryIds", []);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
                
                {isLoadingTimeEntries ? (
                  <div className="text-center py-4">Loading time entries...</div>
                ) : timeEntries.length > 0 ? (
                  <>
                    {selectedTimeEntries.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-medium">{selectedTimeEntries.length}</span> time {selectedTimeEntries.length === 1 ? 'entry' : 'entries'} selected
                          {' '}
                          ({(() => {
                            const totalHours = selectedTimeEntries.reduce((total, entryId) => {
                              const entry = timeEntries.find(e => e.id === entryId);
                              if (entry) {
                                const start = new Date(entry.startTime);
                                const end = entry.endTime ? new Date(entry.endTime) : new Date();
                                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                return total + hours;
                              }
                              return total;
                            }, 0);
                            return `${totalHours.toFixed(1)} hours total`;
                          })()})
                        </p>
                      </div>
                    )}
                    <div className="border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                        {timeEntries.map((entry) => (
                          <li 
                            key={entry.id} 
                            className={`p-4 ${
                              selectedTimeEntries.includes(entry.id) 
                                ? "bg-blue-50 dark:bg-blue-900/10" 
                                : ""
                            }`}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`entry-${entry.id}`}
                                checked={selectedTimeEntries.includes(entry.id)}
                                onChange={() => handleTimeEntryChange(entry.id)}
                                className="h-4 w-4 text-foreground focus:ring-foreground border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`entry-${entry.id}`}
                                className="ml-3 block w-full"
                              >
                                <div className="flex justify-between">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {entry.description || "No description"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(
                                        entry.startTime
                                      ).toLocaleDateString()}{" "}
                                      {new Date(
                                        entry.startTime
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      {" - "}
                                      {entry.endTime
                                        ? new Date(
                                            entry.endTime
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "In progress"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      {(() => {
                                        const start = new Date(entry.startTime);
                                        const end = entry.endTime
                                          ? new Date(entry.endTime)
                                          : new Date();
                                        const hours =
                                          (end.getTime() - start.getTime()) /
                                          (1000 * 60 * 60);
                                        const amount =
                                          hours * entry.project.hourlyRate;
                                        return `$${amount.toFixed(2)}`;
                                      })()}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {(() => {
                                        const start = new Date(entry.startTime);
                                        const end = entry.endTime
                                          ? new Date(entry.endTime)
                                          : new Date();
                                        const hours =
                                          (end.getTime() - start.getTime()) /
                                          (1000 * 60 * 60);
                                        return `${hours.toFixed(1)} hours`;
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No unpaid time entries found for this freelancer.
                  </p>
                )}
                {errors.timeEntryIds && (
                  <p className="text-sm text-red-500">
                    {errors.timeEntryIds.message}
                  </p>
                )}
              </div>
            )}

            {selectedTimeEntries.length > 0 && (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Amount ($)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("amount")}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">
                      {errors.amount.message}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Calculated amount: ${calculatedAmount.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiresSignedDocument"
                    className="h-4 w-4 text-foreground focus:ring-foreground border-gray-300 rounded"
                    {...register("requiresSignedDocument")}
                  />
                  <label
                    htmlFor="requiresSignedDocument"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Require freelancer to return a signed document
                  </label>
                </div>
              </>
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
                disabled={isLoading || selectedTimeEntries.length === 0}
                className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Payment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
