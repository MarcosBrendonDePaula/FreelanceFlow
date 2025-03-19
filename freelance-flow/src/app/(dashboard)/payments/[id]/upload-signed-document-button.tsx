"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UploadSignedDocumentButtonProps {
  paymentId: string;
}

export default function UploadSignedDocumentButton({
  paymentId,
}: UploadSignedDocumentButtonProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [signedDocumentUrl, setSignedDocumentUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
    setSelectedFile(null);
    setSignedDocumentUrl("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSignedDocumentUrl("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadMethod === "url" && !signedDocumentUrl) {
      setError("Document URL is required");
      return;
    }

    if (uploadMethod === "file" && !selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      let finalDocumentUrl = signedDocumentUrl;

      // If uploading a file, first upload it to our server
      if (uploadMethod === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          setError(uploadResult.message || "Failed to upload file");
          return;
        }

        const uploadResult = await uploadResponse.json();
        finalDocumentUrl = uploadResult.url;
      }

      // Now update the payment with the signed document URL
      const response = await fetch(`/api/payments/${paymentId}/signed-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signedDocumentUrl: finalDocumentUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to upload signed document");
        return;
      }

      setSuccess("Signed document uploaded successfully");
      setSignedDocumentUrl("");
      setSelectedFile(null);
      
      // Close modal and refresh page after successful upload
      setTimeout(() => {
        closeModal();
        router.refresh();
      }, 1500); // Wait 1.5 seconds to show success message before closing
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
        className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        Upload Signed Document
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Upload Signed Document</h3>
              
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

              <div className="mb-4">
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setUploadMethod("file")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md ${
                      uploadMethod === "file"
                        ? "bg-foreground text-background"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod("url")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md ${
                      uploadMethod === "url"
                        ? "bg-foreground text-background"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Provide URL
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {uploadMethod === "url" ? (
                  <div className="mb-4">
                    <label
                      htmlFor="signedDocumentUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Document URL
                    </label>
                    <input
                      type="url"
                      id="signedDocumentUrl"
                      value={signedDocumentUrl}
                      onChange={(e) => setSignedDocumentUrl(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="https://example.com/document.pdf"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter the URL of the signed document (e.g., Google Drive, Dropbox, etc.)
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label
                      htmlFor="signedDocumentFile"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Signed Document
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="signedDocumentFile"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            ></path>
                          </svg>
                          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                            {selectedFile
                              ? selectedFile.name
                              : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PDF or Image (max. 5MB)
                          </p>
                        </div>
                        <input
                          id="signedDocumentFile"
                          type="file"
                          className="hidden"
                          accept=".pdf,image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />
                      </label>
                    </div>
                  </div>
                )}

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
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isLoading ? "Uploading..." : "Upload Document"}
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
