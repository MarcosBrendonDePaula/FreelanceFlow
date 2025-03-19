import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const signedDocumentSchema = z.object({
  signedDocumentUrl: z.string().min(1, "Document URL is required"),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // Extract the payment ID from params
    const paymentId = params.id;
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only freelancers can upload signed documents
    if (session.user.role !== "FREELANCER") {
      return NextResponse.json(
        { message: "Only freelancers can upload signed documents" },
        { status: 403 }
      );
    }

    // Check if payment exists and user is the receiver
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
        receiverId: session.user.id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found or you are not the receiver" },
        { status: 404 }
      );
    }

    // Check if payment is in RECEIPT_UPLOADED status
    if (payment.status !== "RECEIPT_UPLOADED") {
      return NextResponse.json(
        { message: "Only payments with uploaded receipts can be updated with signed documents" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { signedDocumentUrl } = signedDocumentSchema.parse(body);

    // Update payment with signed document URL and change status to DOCUMENT_SIGNED
    const updatedPayment = await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        signedDocumentUrl,
        status: "DOCUMENT_SIGNED",
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Upload signed document error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
