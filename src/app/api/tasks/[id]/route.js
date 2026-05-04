import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tasks/[id]
export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tasks/[id] — update task
export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, description, status, assigneeId, priority, dueDate } = body;

    // Members can only update status of tasks assigned to them
    if (session.user.role !== "ADMIN") {
      const task = await prisma.task.findUnique({ where: { id } });
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Members can update status of any task in their projects
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: session.user.id, projectId: task.projectId } },
      });

      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Members can only change status
      const updated = await prisma.task.update({
        where: { id },
        data: { status: status || task.status },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json(updated);
    }

    // Admin can update everything
    const data = {};
    if (title) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (status) data.status = status;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (priority) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — delete task (Admin only)
export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete tasks" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
