import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

const timeEntryUpdateSchema = z.object({
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get time entry
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
      return NextResponse.json(
        { message: "Time entry not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this time entry
    if (timeEntry.userId !== session.user.id) {
      return NextResponse.json(
        { message: "You don't have access to this time entry" },
        { status: 403 }
      );
    }

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("Get time entry error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get time entry
    const timeEntry = await prisma.timeEntry.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { message: "Time entry not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this time entry
    if (timeEntry.userId !== session.user.id) {
      return NextResponse.json(
        { message: "You don't have access to this time entry" },
        { status: 403 }
      );
    }

    // Check if time entry is part of a payment
    if (timeEntry.paymentId) {
      return NextResponse.json(
        { message: "Cannot update a time entry that has been submitted for payment" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { description, startTime, endTime } = timeEntryUpdateSchema.parse(body);

    // Update time entry
    const updatedTimeEntry = await prisma.timeEntry.update({
      where: {
        id: params.id,
      },
      data: {
        description,
        startTime,
        endTime,
      },
    });

    return NextResponse.json(updatedTimeEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Update time entry error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get time entry
    const timeEntry = await prisma.timeEntry.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { message: "Time entry not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this time entry
    if (timeEntry.userId !== session.user.id) {
      return NextResponse.json(
        { message: "You don't have access to this time entry" },
        { status: 403 }
      );
    }

    // Check if time entry is part of a payment
    if (timeEntry.paymentId) {
      return NextResponse.json(
        { message: "Cannot delete a time entry that has been submitted for payment" },
        { status: 400 }
      );
    }

    // Delete time entry
    await prisma.timeEntry.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Time entry deleted successfully" });
  } catch (error) {
    console.error("Delete time entry error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
