"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpdateStatusButtonProps {
  paymentId: string;
  currentStatus: string;
}

export default function UpdateStatusButton({
  paymentId,
  currentStatus,
}: UpdateStatusButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState(currentStatus);

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
    setStatus(currentStatus);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!status || status === currentStatus) {
      setError("Please select a different status");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to update status");
        return;
      }

      setSuccess("Status updated successfully");
      router.refresh();
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        Update Status
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Update Payment Status</h3>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-md text-sm mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="PENDING">Pending</option>
                    {currentStatus === "DOCUMENT_SIGNED" && (
                      <option value="COMPLETED">Completed</option>
                    )}
                    {currentStatus === "RECEIPT_UPLOADED" && (
                      <option value="DOCUMENT_SIGNED">Document Signed</option>
                    )}
                    {currentStatus === "PENDING" && (
                      <option value="RECEIPT_UPLOADED">Receipt Uploaded</option>
                    )}
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || status === currentStatus}
                    className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isLoading ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
