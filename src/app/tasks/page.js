"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) setTasks(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const isOverdue = (task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  };

  const getPriorityColor = (priority) => {
    const map = { HIGH: "var(--priority-high)", MEDIUM: "var(--priority-medium)", LOW: "var(--priority-low)" };
    return map[priority] || "var(--text-tertiary)";
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "OVERDUE") return isOverdue(t);
    if (filter === "MY_TASKS") return t.assigneeId === session?.user?.id;
    return t.status === filter;
  });

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  const filterTabs = [
    { key: "ALL", label: "All" },
    { key: "TODO", label: "To Do" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "DONE", label: "Done" },
    { key: "OVERDUE", label: "Overdue" },
    { key: "MY_TASKS", label: "My Tasks" },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Tasks</h1>
          <p style={styles.subtitle}>{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.tabs}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              ...styles.tab,
              ...(filter === tab.key ? styles.tabActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No tasks found</div>
          <div className="empty-state-text">
            {filter === "ALL" ? "No tasks have been created yet" : `No tasks match the "${filter.replace("_", " ").toLowerCase()}" filter`}
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
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500, maxWidth: "250px" }}>
                    {task.title}
                    {task.description && (
                      <p style={{ fontSize: "var(--font-xs)", color: "var(--text-tertiary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td>
                    <Link href={`/projects/${task.project?.id}`} style={{ color: "var(--accent-primary-hover)" }}>
                      {task.project?.name}
                    </Link>
                  </td>
                  <td>
                    {task.assignee ? (
                      <span style={styles.assigneeCell}>
                        <span style={styles.assigneeAvatar}>{task.assignee.name.charAt(0)}</span>
                        {task.assignee.name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ ...styles.priorityBadge, color: getPriorityColor(task.priority), borderColor: getPriorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={styles.statusSelect}
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </td>
                  <td>
                    {task.dueDate ? (
                      <span style={{ color: isOverdue(task) ? "var(--status-overdue)" : "var(--text-secondary)", fontWeight: isOverdue(task) ? 600 : 400 }}>
                        {isOverdue(task) ? "⚠ " : ""}
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    ) : "—"}
                  </td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(task.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "var(--font-3xl)",
    fontWeight: "800",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    fontSize: "var(--font-sm)",
    color: "var(--text-tertiary)",
    marginTop: "4px",
  },
  tabs: {
    display: "flex",
    gap: "4px",
    marginBottom: "24px",
    padding: "4px",
    background: "var(--bg-glass)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-primary)",
    overflowX: "auto",
  },
  tab: {
    padding: "8px 16px",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--font-sm)",
    fontWeight: "500",
    color: "var(--text-tertiary)",
    transition: "all var(--transition-fast)",
    whiteSpace: "nowrap",
    cursor: "pointer",
    border: "none",
    background: "none",
    fontFamily: "var(--font-family)",
  },
  tabActive: {
    background: "var(--accent-primary-glow)",
    color: "var(--accent-primary-hover)",
    fontWeight: "600",
  },
  assigneeCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  assigneeAvatar: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "var(--accent-gradient)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.6rem",
    fontWeight: "700",
    color: "white",
    flexShrink: 0,
  },
  priorityBadge: {
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    fontSize: "var(--font-xs)",
    fontWeight: "600",
    border: "1px solid",
    textTransform: "capitalize",
  },
  statusSelect: {
    padding: "4px 24px 4px 8px",
    fontSize: "var(--font-xs)",
    backgroundSize: "14px",
    minWidth: "100px",
  },
};
