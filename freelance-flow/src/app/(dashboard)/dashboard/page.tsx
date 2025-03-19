import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
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
    take: 5,
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get recent time entries (for freelancers)
  const timeEntries = isFreelancer
    ? await prisma.timeEntry.findMany({
        where: {
          userId: session?.user?.id,
        },
        take: 5,
        orderBy: {
          startTime: "desc",
        },
        include: {
          project: true,
        },
      })
    : [];

  // Get recent payments
  const payments = await prisma.payment.findMany({
    where: isFreelancer
      ? {
          receiverId: session?.user?.id,
        }
      : {
          senderId: session?.user?.id,
        },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: true,
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Projects</h2>
          <p className="text-3xl font-bold">{projects.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isFreelancer ? "Projects you're working on" : "Projects you manage"}
          </p>
        </div>

        {isFreelancer && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Time Tracked</h2>
            <p className="text-3xl font-bold">
              {timeEntries.reduce((total, entry) => {
                const start = new Date(entry.startTime);
                const end = entry.endTime ? new Date(entry.endTime) : new Date();
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return total + hours;
              }, 0).toFixed(1)}h
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total hours tracked
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Payments</h2>
          <p className="text-3xl font-bold">
            ${payments.reduce((total, payment) => total + payment.amount, 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isFreelancer ? "Total received" : "Total paid"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Projects</h2>
            <a
              href="/projects"
              className="text-sm text-foreground hover:underline"
            >
              View all
            </a>
          </div>
          {projects.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {projects.map((project) => (
                <div key={project.id} className="py-3">
                  <a
                    href={`/projects/${project.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-800 -mx-6 px-6 py-2 rounded-md"
                  >
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {project.description || "No description"}
                    </p>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No projects found.{" "}
              {isPayer && (
                <a
                  href="/projects/new"
                  className="text-foreground hover:underline"
                >
                  Create one
                </a>
              )}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">
              {isFreelancer ? "Recent Time Entries" : "Recent Payments"}
            </h2>
            <a
              href={isFreelancer ? "/time-entries" : "/payments"}
              className="text-sm text-foreground hover:underline"
            >
              View all
            </a>
          </div>
          {isFreelancer ? (
            timeEntries.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="py-3">
                    <a
                      href={`/time-entries/${entry.id}`}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-800 -mx-6 px-6 py-2 rounded-md"
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">{entry.project.name}</h3>
                        <p className="text-sm">
                          {new Date(entry.startTime).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {entry.description || "No description"}
                      </p>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No time entries found.{" "}
                <a
                  href="/time-entries/new"
                  className="text-foreground hover:underline"
                >
                  Create one
                </a>
              </p>
            )
          ) : payments.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {payments.map((payment) => (
                <div key={payment.id} className="py-3">
                  <a
                    href={`/payments/${payment.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-800 -mx-6 px-6 py-2 rounded-md"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium">{payment.project.name}</h3>
                      <p className="text-sm font-medium">
                        ${payment.amount.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No payments found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
