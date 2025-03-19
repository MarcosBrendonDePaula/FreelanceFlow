"use client";

import UploadReceiptButton from "./upload-receipt-button";
import UploadSignedDocumentButton from "./upload-signed-document-button";
import UpdateStatusButton from "./update-status-button";

interface PaymentActionsProps {
  paymentId: string;
  currentStatus: string;
  isFreelancer: boolean;
  isPayer: boolean;
  isSender: boolean;
  isReceiver: boolean;
}

export default function PaymentActions({
  paymentId,
  currentStatus,
  isFreelancer,
  isPayer,
  isSender,
  isReceiver,
}: PaymentActionsProps) {
  return (
    <div className="flex space-x-2">
      {isPayer && isSender && currentStatus === "PENDING" && (
        <UploadReceiptButton paymentId={paymentId} />
      )}
      {isFreelancer && isReceiver && currentStatus === "RECEIPT_UPLOADED" && (
        <UploadSignedDocumentButton paymentId={paymentId} />
      )}
      {isPayer && isSender && (currentStatus === "DOCUMENT_SIGNED" || currentStatus === "PENDING") && (
        <UpdateStatusButton
          paymentId={paymentId}
          currentStatus={currentStatus}
        />
      )}
    </div>
  );
}
