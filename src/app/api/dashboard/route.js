import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/dashboard — dashboard stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

    // Get project IDs the user has access to
    let projectFilter = {};
    if (!isAdmin) {
      const memberships = await prisma.projectMember.findMany({
        where: { userId: session.user.id },
        select: { projectId: true },
      });
      projectFilter = { projectId: { in: memberships.map((m) => m.projectId) } };
    }

    // Count projects
    const totalProjects = isAdmin
      ? await prisma.project.count()
      : await prisma.projectMember.count({ where: { userId: session.user.id } });

    // Task statistics
    const allTasks = await prisma.task.findMany({
      where: projectFilter,
      select: { id: true, status: true, dueDate: true, assigneeId: true },
    });

    const totalTasks = allTasks.length;
    const todoTasks = allTasks.filter((t) => t.status === "TODO").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const doneTasks = allTasks.filter((t) => t.status === "DONE").length;

    const now = new Date();
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
    ).length;

    const myTasks = allTasks.filter((t) => t.assigneeId === session.user.id).length;

    // Recent tasks
    const recentTasks = await prisma.task.findMany({
      where: projectFilter,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // Get all members (admin only for adding members)
    let users = [];
    if (isAdmin) {
      users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({
      stats: {
        totalProjects,
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
        myTasks,
      },
      recentTasks,
      users,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
