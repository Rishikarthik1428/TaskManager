"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const recentTasks = dashboard?.recentTasks || [];

  const statCards = [
    { label: "Total Projects", value: stats.totalProjects || 0, icon: "◫", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    { label: "Total Tasks", value: stats.totalTasks || 0, icon: "☰", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    { label: "In Progress", value: stats.inProgressTasks || 0, icon: "↻", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    { label: "Completed", value: stats.doneTasks || 0, icon: "✓", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { label: "To Do", value: stats.todoTasks || 0, icon: "○", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { label: "Overdue", value: stats.overdueTasks || 0, icon: "!", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  ];

  const getStatusBadge = (status) => {
    const map = {
      TODO: "badge-todo",
      IN_PROGRESS: "badge-progress",
      DONE: "badge-done",
    };
    const labels = {
      TODO: "To Do",
      IN_PROGRESS: "In Progress",
      DONE: "Done",
    };
    return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
  };

  const isOverdue = (task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.greeting}>
            Good {getGreeting()}, <span style={styles.name}>{session?.user?.name?.split(" ")[0]}</span>
          </h1>
          <p style={styles.subGreeting}>Here&apos;s what&apos;s happening with your projects</p>
        </div>
        {session?.user?.role === "ADMIN" && (
          <Link href="/projects" className="btn btn-primary">
            + New Project
          </Link>
        )}
      </div>

      <div style={styles.statsGrid}>
        {statCards.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <Link href="/tasks" style={styles.viewAll}>View all tasks →</Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No tasks yet</div>
            <div className="empty-state-text">
              Create a project and add tasks to get started
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task.id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {task.title}
                    </td>
                    <td>
                      <Link href={`/projects/${task.project?.id}`} style={{ color: "var(--accent-primary-hover)" }}>
                        {task.project?.name}
                      </Link>
                    </td>
                    <td>{task.assignee?.name || "—"}</td>
                    <td>
                      {isOverdue(task) ? (
                        <span className="badge badge-overdue">Overdue</span>
                      ) : (
                        getStatusBadge(task.status)
                      )}
                    </td>
                    <td>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const styles = {
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  greeting: {
    fontSize: "var(--font-3xl)",
    fontWeight: "800",
    letterSpacing: "-0.03em",
    marginBottom: "4px",
  },
  name: {
    background: "var(--accent-gradient)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subGreeting: {
    fontSize: "var(--font-md)",
    color: "var(--text-tertiary)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "40px",
  },
  section: {
    marginBottom: "32px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "var(--font-xl)",
    fontWeight: "700",
    letterSpacing: "-0.02em",
  },
  viewAll: {
    fontSize: "var(--font-sm)",
    color: "var(--accent-primary-hover)",
    fontWeight: "500",
  },
};
