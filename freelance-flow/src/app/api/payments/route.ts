import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const paymentSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  receiverId: z.string().min(1, "Freelancer is required"),
  timeEntryIds: z.array(z.string()).min(1, "At least one time entry is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  requiresSignedDocument: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only payers can create payments
    if (session.user.role !== "PAYER") {
      return NextResponse.json(
        { message: "Only payers can create payments" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { projectId, receiverId, timeEntryIds, amount, requiresSignedDocument } = paymentSchema.parse(body);

    // Check if project exists and user is the owner
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // Check if receiver is a member of the project
    const isMember = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            id: receiverId,
          },
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { message: "Freelancer is not a member of this project" },
        { status: 400 }
      );
    }

    // Check if time entries belong to the project and freelancer
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        id: {
          in: timeEntryIds,
        },
        projectId,
        userId: receiverId,
        payment: null, // Only unpaid time entries
      },
    });

    if (timeEntries.length !== timeEntryIds.length) {
      return NextResponse.json(
        { message: "Some time entries are invalid or already paid" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        amount,
        status: "PENDING",
        requiresSignedDocument,
        project: {
          connect: {
            id: projectId,
          },
        },
        sender: {
          connect: {
            id: session.user.id,
          },
        },
        receiver: {
          connect: {
            id: receiverId,
          },
        },
        timeEntries: {
          connect: timeEntryIds.map((id) => ({ id })),
        },
      },
      include: {
        project: true,
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            name: true,
            email: true,
          },
        },
        timeEntries: true,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Payment creation error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isFreelancer = session.user.role === "FREELANCER";
    const isPayer = session.user.role === "PAYER";

    // Get URL parameters
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");

    // Get payments
    const payments = await prisma.payment.findMany({
      where: {
        ...(isFreelancer
          ? { receiverId: session.user.id }
          : { senderId: session.user.id }),
        ...(projectId ? { projectId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: {
        createdAt: "desc",
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
          },
        },
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
