import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  hourlyRate: z.number().min(0, "Hourly rate must be a positive number"),
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

    // Only payers can create projects
    if (session.user.role !== "PAYER") {
      return NextResponse.json(
        { message: "Only payers can create projects" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, hourlyRate } = projectSchema.parse(body);

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        hourlyRate,
        owner: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Project creation error:", error);
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

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: isFreelancer
        ? {
            members: {
              some: {
                id: session.user.id,
              },
            },
          }
        : {
            ownerId: session.user.id,
          },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
