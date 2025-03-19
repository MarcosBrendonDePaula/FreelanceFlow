import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const timeEntrySchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  description: z.string().optional(),
  startTime: z.string().datetime("Invalid start time"),
  endTime: z.string().datetime("Invalid end time").optional(),
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

    // Only freelancers can create time entries
    if (session.user.role !== "FREELANCER") {
      return NextResponse.json(
        { message: "Only freelancers can create time entries" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { projectId, description, startTime, endTime } = timeEntrySchema.parse(body);

    // Check if user is a member of the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "You are not a member of this project" },
        { status: 403 }
      );
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        description,
        user: {
          connect: {
            id: session.user.id,
          },
        },
        project: {
          connect: {
            id: projectId,
          },
        },
      },
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Time entry creation error:", error);
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
    const userId = url.searchParams.get("userId");
    const status = url.searchParams.get("status");
    const completed = url.searchParams.get("completed");

    // Get time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        ...(isFreelancer
          ? { userId: session.user.id }
          : isPayer
          ? {
              project: {
                ownerId: session.user.id,
              },
            }
          : {}),
        ...(projectId ? { projectId } : {}),
        ...(userId ? { userId } : {}),
        ...(status === "unpaid" ? { paymentId: null } : {}),
        ...(completed === "true" ? { endTime: { not: null } } : 
           completed === "false" ? { endTime: null } : {}),
      },
      orderBy: {
        startTime: "desc",
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
      },
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error("Get time entries error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
