import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const memberSchema = z.object({
  email: z.string().email("Invalid email address"),
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

    // Only payers can add members to projects
    if (session.user.role !== "PAYER") {
      return NextResponse.json(
        { message: "Only payers can add members to projects" },
        { status: 403 }
      );
    }

    // Check if project exists and user is the owner
    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        owner: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.owner.id !== session.user.id) {
      return NextResponse.json(
        { message: "Only the project owner can add members" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email } = memberSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is a freelancer
    if (user.role !== "FREELANCER") {
      return NextResponse.json(
        { message: "Only freelancers can be added to projects" },
        { status: 400 }
      );
    }

    // Check if user is already a member of the project
    const isMember = await prisma.project.findFirst({
      where: {
        id: params.id,
        members: {
          some: {
            id: user.id,
          },
        },
      },
    });

    if (isMember) {
      return NextResponse.json(
        { message: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // Add user to project
    const updatedProject = await prisma.project.update({
      where: {
        id: params.id,
      },
      data: {
        members: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Member added successfully",
      members: updatedProject.members,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Add member error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        owner: {
          select: {
            id: true,
          },
        },
        members: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.owner.id === session.user.id;
    const isMember = project.members.some(
      (member: { id: string }) => member.id === session.user.id
    );

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { message: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get project members
    const members = await prisma.user.findMany({
      where: {
        projects: {
          some: {
            id: params.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
