import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PaymentActions from "./payment-actions";

interface PaymentPageProps {
  params: {
    id: string;
  };
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const session = await getServerSession(authOptions);
  const isFreelancer = session?.user?.role === "FREELANCER";
  const isPayer = session?.user?.role === "PAYER";

  // Get payment details
  const payment = await prisma.payment.findUnique({
    where: {
      id: params.id,
    },
    include: {
      project: true,
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      receiver: {
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
          project: {
            select: {
              hourlyRate: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  // Check if user has access to this payment
  const isSender = payment.sender.id === session?.user?.id;
  const isReceiver = payment.receiver.id === session?.user?.id;

  if (!isSender && !isReceiver) {
    notFound();
  }

  // Calculate total hours
  const totalHours = payment.timeEntries.reduce((total: number, entry: any) => {
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Details</h1>
        <div className="flex space-x-2">
          <Link
            href="/payments"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Back to Payments
          </Link>
          <PaymentActions
            paymentId={payment.id}
            currentStatus={payment.status}
            isFreelancer={isFreelancer}
            isPayer={isPayer}
            isSender={isSender}
            isReceiver={isReceiver}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium mb-4">Payment Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </h3>
                  <p
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : payment.status === "RECEIPT_UPLOADED"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : payment.status === "DOCUMENT_SIGNED"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        : payment.status === "COMPLETED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {payment.status}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Amount
                  </h3>
                  <p className="mt-1 text-xl font-bold">
                    ${payment.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Project
                </h3>
                <p className="mt-1">{payment.project.name}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    From
                  </h3>
                  <p className="mt-1">{payment.sender.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {payment.sender.email}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    To
                  </h3>
                  <p className="mt-1">{payment.receiver.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {payment.receiver.email}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created
                </h3>
                <p className="mt-1">
                  {new Date(payment.createdAt).toLocaleDateString()}{" "}
                  {new Date(payment.createdAt).toLocaleTimeString()}
                </p>
              </div>
              {payment.receiptUrl && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Receipt
                  </h3>
                  <div className="mt-2">
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    >
                      View Receipt
                    </a>
                  </div>
                </div>
              )}
              {payment.signedDocumentUrl && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Signed Document
                  </h3>
                  <div className="mt-2">
                    <a
                      href={payment.signedDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    >
                      View Signed Document
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Time Entries</h2>
            {payment.timeEntries.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {payment.timeEntries.map((entry: any) => (
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
                          {new Date(entry.startTime).toLocaleDateString()}{" "}
                          {new Date(entry.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {entry.endTime
                            ? new Date(entry.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "In progress"}
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
                            const amount = hours * entry.project.hourlyRate;
                            return `$${amount.toFixed(2)} (${hours.toFixed(
                              1
                            )} hours)`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No time entries found.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Summary</h2>
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
                  Total Amount
                </h3>
                <p className="mt-1 text-2xl font-bold">
                  ${payment.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Hourly Rate
                </h3>
                <p className="mt-1">
                  ${payment.project.hourlyRate.toFixed(2)}/hr
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Payment Process</h2>
            <ol className="space-y-4 list-decimal list-inside">
              <li className={payment.status === "PENDING" ? "font-bold" : ""}>
                Payer creates payment
              </li>
              <li className={payment.status === "RECEIPT_UPLOADED" ? "font-bold" : ""}>
                Payer uploads payment receipt
              </li>
              <li className={payment.status === "DOCUMENT_SIGNED" ? "font-bold" : ""}>
                Freelancer uploads signed document
              </li>
              <li className={payment.status === "COMPLETED" ? "font-bold" : ""}>
                Payer marks payment as completed
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
