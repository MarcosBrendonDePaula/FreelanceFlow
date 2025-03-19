import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const receiptSchema = z.object({
  receiptUrl: z.string().url("Invalid URL"),
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

    // Only payers can upload receipts
    if (session.user.role !== "PAYER") {
      return NextResponse.json(
        { message: "Only payers can upload receipts" },
        { status: 403 }
      );
    }

    // Check if payment exists and user is the sender
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
        senderId: session.user.id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found or you are not the sender" },
        { status: 404 }
      );
    }

    // Check if payment is in PENDING status
    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { message: "Only pending payments can be updated" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { receiptUrl } = receiptSchema.parse(body);

    // Update payment with receipt URL and change status to RECEIPT_UPLOADED
    const updatedPayment = await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        receiptUrl,
        status: "RECEIPT_UPLOADED",
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

    console.error("Upload receipt error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
