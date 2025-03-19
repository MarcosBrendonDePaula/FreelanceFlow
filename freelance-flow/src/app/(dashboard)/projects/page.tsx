import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Projects() {
  const session = await getServerSession(authOptions);
  const isFreelancer = session?.user?.role === "FREELANCER";
  const isPayer = session?.user?.role === "PAYER";

  // Get user's projects
  const projects = await prisma.project.findMany({
    where: isFreelancer
      ? {
          members: {
            some: {
              id: session?.user?.id,
            },
          },
        }
      : {
          ownerId: session?.user?.id,
        },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      owner: {
        select: {
          name: true,
        },
      },
      members: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        {isPayer && (
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Create Project
          </Link>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-foreground truncate">
                        {project.name}
                      </h3>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ${project.hourlyRate.toFixed(2)}/hr
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {project.description || "No description"}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <p>
                          {isFreelancer
                            ? `Owner: ${project.owner.name}`
                            : `${project.members.length} freelancers`}
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
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isPayer
              ? "Create your first project to get started"
              : "You haven't been added to any projects yet"}
          </p>
          {isPayer && (
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Create Project
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
