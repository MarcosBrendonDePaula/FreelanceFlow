import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only payers can update payment status
    if (session.user.role !== "PAYER") {
      return NextResponse.json(
        { message: "Only payers can update payment status" },
        { status: 403 }
      );
    }

    // Check if payment exists and user is the sender
    const payment = await prisma.payment.findUnique({
      where: {
        id: params.id,
        senderId: session.user.id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found or you are not the sender" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status } = statusSchema.parse(body);

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: {
        id: params.id,
      },
      data: {
        status,
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

    console.error("Update payment status error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
