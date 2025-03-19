import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Payments() {
  const session = await getServerSession(authOptions);
  const isFreelancer = session?.user?.role === "FREELANCER";
  const isPayer = session?.user?.role === "PAYER";

  // Get payments
  const payments = await prisma.payment.findMany({
    where: isFreelancer
      ? {
          receiverId: session?.user?.id,
        }
      : {
          senderId: session?.user?.id,
        },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: true,
      sender: {
        select: {
          name: true,
        },
      },
      receiver: {
        select: {
          name: true,
        },
      },
      timeEntries: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Calculate total amount
  const totalAmount = payments.reduce(
    (total: number, payment: any) => total + payment.amount,
    0
  );

  // Group payments by status
  const pendingPayments = payments.filter(
    (payment: any) => payment.status === "PENDING"
  );
  const completedPayments = payments.filter(
    (payment: any) => payment.status === "COMPLETED"
  );
  const cancelledPayments = payments.filter(
    (payment: any) => payment.status === "CANCELLED"
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        {isPayer && (
          <Link
            href="/payments/new"
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Create Payment
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Total</h2>
          <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isFreelancer ? "Total received" : "Total paid"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Pending</h2>
          <p className="text-3xl font-bold">
            $
            {pendingPayments
              .reduce((total: number, payment: any) => total + payment.amount, 0)
              .toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pendingPayments.length} payment(s)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Completed</h2>
          <p className="text-3xl font-bold">
            $
            {completedPayments
              .reduce((total: number, payment: any) => total + payment.amount, 0)
              .toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {completedPayments.length} payment(s)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Cancelled</h2>
          <p className="text-3xl font-bold">
            $
            {cancelledPayments
              .reduce((total: number, payment: any) => total + payment.amount, 0)
              .toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {cancelledPayments.length} payment(s)
          </p>
        </div>
      </div>

      {payments.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {payments.map((payment: any) => (
              <li key={payment.id}>
                <Link
                  href={`/payments/${payment.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-foreground truncate">
                          {payment.project.name}
                        </p>
                        <p
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : payment.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {payment.status}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm font-medium">
                          ${payment.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {isFreelancer
                            ? `From: ${payment.sender.name}`
                            : `To: ${payment.receiver.name}`}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <p>
                          {new Date(payment.createdAt).toLocaleDateString()}
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
          <h3 className="text-lg font-medium mb-2">No payments found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isPayer
              ? "You haven't made any payments yet"
              : "You haven't received any payments yet"}
          </p>
          {isPayer && (
            <Link
              href="/payments/new"
              className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Create Payment
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
