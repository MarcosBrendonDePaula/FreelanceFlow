import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TimeEntryPageProps {
  params: {
    id: string;
  };
}

export default async function TimeEntryPage({ params }: TimeEntryPageProps) {
  const session = await getServerSession(authOptions);
  const isFreelancer = session?.user?.role === "FREELANCER";

  // Only freelancers can access time entries
  if (!isFreelancer) {
    redirect("/dashboard");
  }

  // Get time entry details
  const timeEntry = await prisma.timeEntry.findUnique({
    where: {
      id: params.id,
    },
    include: {
      project: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!timeEntry) {
    notFound();
  }

  // Check if user has access to this time entry
  if (timeEntry.userId !== session?.user?.id) {
    notFound();
  }

  // Calculate hours
  const start = new Date(timeEntry.startTime);
  const end = timeEntry.endTime ? new Date(timeEntry.endTime) : new Date();
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  // Calculate earnings
  const earnings = hours * timeEntry.project.hourlyRate;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Time Entry Details</h1>
        <div className="flex space-x-2">
          <Link
            href={`/time-entries/${timeEntry.id}/edit`}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Edit
          </Link>
          <Link
            href="/time-entries"
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Back to Time Entries
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4">Time Entry Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Project
                </h3>
                <p className="mt-1 font-medium">{timeEntry.project.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </h3>
                <p className="mt-1">
                  {timeEntry.description || "No description provided"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Start Time
                </h3>
                <p className="mt-1">
                  {new Date(timeEntry.startTime).toLocaleDateString()}{" "}
                  {new Date(timeEntry.startTime).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  End Time
                </h3>
                <p className="mt-1">
                  {timeEntry.endTime
                    ? `${new Date(timeEntry.endTime).toLocaleDateString()} ${new Date(
                        timeEntry.endTime
                      ).toLocaleTimeString()}`
                    : "In progress"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">Summary</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Hours Worked
                </h3>
                <p className="mt-1 text-2xl font-bold">{hours.toFixed(1)}h</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Hourly Rate
                </h3>
                <p className="mt-1 font-medium">
                  ${timeEntry.project.hourlyRate.toFixed(2)}/hr
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Earnings
                </h3>
                <p className="mt-1 text-2xl font-bold">
                  ${earnings.toFixed(2)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Payment Status
                </h3>
                <p className="mt-1">
                  {timeEntry.payment ? (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        timeEntry.payment.status === "COMPLETED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : timeEntry.payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {timeEntry.payment.status}
                    </span>
                  ) : (
                    "Not submitted for payment"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {timeEntry.payment && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Payment Details</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Payment ID
              </h3>
              <p className="mt-1">
                <Link
                  href={`/payments/${timeEntry.payment.id}`}
                  className="text-primary hover:underline"
                >
                  {timeEntry.payment.id}
                </Link>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Amount
              </h3>
              <p className="mt-1">${timeEntry.payment.amount.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Date
              </h3>
              <p className="mt-1">
                {new Date(timeEntry.payment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
