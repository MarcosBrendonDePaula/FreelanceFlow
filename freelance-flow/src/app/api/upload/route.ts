import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { constants } from "fs";
import { authOptions } from "@/lib/auth";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only authenticated users can upload files
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File size exceeds the 5MB limit" },
        { status: 400 }
      );
    }

    // Check file type (allow only images and PDFs)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "File type not allowed. Please upload an image or PDF." },
        { status: 400 }
      );
    }

    // Create a unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const filename = `${timestamp}-${originalName}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    
    // Check if uploads directory exists, if not create it
    try {
      await access(uploadsDir, constants.F_OK);
    } catch (error) {
      // Directory doesn't exist, create it
      await mkdir(uploadsDir, { recursive: true });
      console.log(`Created uploads directory at ${uploadsDir}`);
    }
    
    // Save the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    // Return the file URL
    const fileUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
