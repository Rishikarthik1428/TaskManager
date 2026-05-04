import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects — list projects the user belongs to
export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let projects;

    if (session.user.role === "ADMIN") {
      // Admins see all projects
      projects = await prisma.project.findMany({
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
          },
          tasks: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Members see only their projects
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: { userId: session.user.id },
          },
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
          },
          tasks: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/projects — create a new project (Admin only)
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can create projects" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, memberIds } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        members: {
          create: [
            { userId: session.user.id, role: "ADMIN" },
            ...(memberIds || []).map((id) => ({ userId: id, role: "MEMBER" })),
          ],
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
