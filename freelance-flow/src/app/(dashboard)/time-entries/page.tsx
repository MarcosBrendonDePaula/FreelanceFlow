import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TimeEntries({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  // Extract projectId from searchParams to avoid Next.js dynamic API error
  const projectId = searchParams?.projectId;
  
  const session = await getServerSession(authOptions);
  const isFreelancer = session?.user?.role === "FREELANCER";

  // Only freelancers can access time entries
  if (!isFreelancer) {
    redirect("/dashboard");
  }

  // Get time entries
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: session?.user?.id,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: {
      startTime: "desc",
    },
    include: {
      project: true,
    },
  });

  // Get projects for filter
  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          id: session?.user?.id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate total hours
  const totalHours = timeEntries.reduce((total: number, entry: any) => {
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  // Calculate total earnings
  const totalEarnings = timeEntries.reduce((total: number, entry: any) => {
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours * entry.project.hourlyRate;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Time Entries</h1>
        <Link
          href="/time-entries/new"
          className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Log Time
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Total Hours</h2>
          <p className="text-3xl font-bold">{totalHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {projectId ? "For selected project" : "All projects"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Total Earnings</h2>
          <p className="text-3xl font-bold">${totalEarnings.toFixed(2)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {projectId ? "For selected project" : "All projects"}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Filter by Project</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/time-entries"
            className={`px-3 py-1 rounded-full text-sm ${
              !projectId
                ? "bg-foreground text-background"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All Projects
          </Link>
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/time-entries?projectId=${project.id}`}
              className={`px-3 py-1 rounded-full text-sm ${
                projectId === project.id
                  ? "bg-foreground text-background"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {project.name}
            </Link>
          ))}
        </div>
      </div>

      {timeEntries.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {timeEntries.map((entry: any) => (
              <li key={entry.id}>
                <Link
                  href={`/time-entries/${entry.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.project.name}
                        </p>
                        <p className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ${entry.project.hourlyRate.toFixed(2)}/hr
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {entry.description || "No description"}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <p>
                          {new Date(entry.startTime).toLocaleDateString()}{" "}
                          {new Date(entry.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {entry.endTime
                            ? `${new Date(
                                entry.endTime
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : "In progress"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow text-center">
          <h3 className="text-lg font-medium mb-2">No time entries found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {projectId
              ? "You haven't logged any time for this project yet"
              : "You haven't logged any time yet"}
          </p>
          <Link
            href="/time-entries/new"
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Log Time
          </Link>
        </div>
      )}
    </div>
  );
}
