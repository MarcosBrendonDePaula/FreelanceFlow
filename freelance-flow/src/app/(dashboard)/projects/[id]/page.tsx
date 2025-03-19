import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddFreelancerButton from "./add-freelancer-button";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);
  const isFreelancer = session?.user?.role === "FREELANCER";
  const isPayer = session?.user?.role === "PAYER";

  // Get project details
  const project = await prisma.project.findUnique({
    where: {
      id: params.id,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      timeEntries: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
        take: 10,
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Check if user has access to this project
  const isOwner = project.owner.id === session?.user?.id;
  const isMember = project.members.some(
    (member: { id: string }) => member.id === session?.user?.id
  );

  if (!isOwner && !isMember) {
    notFound();
  }

  // Calculate total hours
  const totalHours = project.timeEntries.reduce((total: number, entry: any) => {
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  // Calculate total cost
  const totalCost = totalHours * project.hourlyRate;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex space-x-2">
          {isPayer && isOwner && (
            <>
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Edit Project
              </Link>
              <AddFreelancerButton projectId={project.id} />
            </>
          )}
          {isFreelancer && (
            <Link
              href={`/time-entries/new?projectId=${project.id}`}
              className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Log Time
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium mb-4">Project Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </h3>
                <p className="mt-1">
                  {project.description || "No description provided"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Hourly Rate
                </h3>
                <p className="mt-1">${project.hourlyRate.toFixed(2)}/hr</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Owner
                </h3>
                <p className="mt-1">{project.owner.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created
                </h3>
                <p className="mt-1">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Time Entries</h2>
              <Link
                href={`/time-entries?projectId=${project.id}`}
                className="text-sm text-foreground hover:underline"
              >
                View all
              </Link>
            </div>
            {project.timeEntries.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {project.timeEntries.map((entry: any) => (
                  <div key={entry.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{entry.user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {entry.description || "No description"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(entry.startTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium mt-1">
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
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No time entries yet.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Project Summary</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Hours
                </h3>
                <p className="mt-1 text-2xl font-bold">
                  {totalHours.toFixed(1)}h
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Cost
                </h3>
                <p className="mt-1 text-2xl font-bold">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Team Members</h2>
            {project.members.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {project.members.map((member: any) => (
                  <li key={member.id} className="py-3">
                    <div className="flex items-center">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No team members yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
