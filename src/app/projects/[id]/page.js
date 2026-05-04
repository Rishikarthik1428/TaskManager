"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ProjectDetailPage({ params }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    priority: "MEDIUM",
    dueDate: "",
    status: "TODO",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, []);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${resolvedParams.id}`);
      if (res.ok) setProject(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          projectId: resolvedParams.id,
          assigneeId: taskForm.assigneeId || null,
          dueDate: taskForm.dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setProject((prev) => ({
          ...prev,
          tasks: [data, ...(prev?.tasks || [])],
        }));
        setShowTaskModal(false);
        setTaskForm({ title: "", description: "", assigneeId: "", priority: "MEDIUM", dueDate: "", status: "TODO" });
      }
    } catch {
      setError("Failed to create task");
    } finally {
      setCreating(false);
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
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? updated : t)),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await fetch(`/api/projects/${resolvedParams.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchProject();
      }
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

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!project) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">Project not found</div>
        <Link href="/projects" className="btn btn-secondary">Back to Projects</Link>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  const existingMemberIds = (project.members || []).map((m) => m.userId);
  const availableUsers = users.filter((u) => !existingMemberIds.includes(u.id));

  return (
    <div>
      <div style={styles.breadcrumb}>
        <Link href="/projects" style={styles.breadcrumbLink}>Projects</Link>
        <span style={styles.breadcrumbSep}>/</span>
        <span>{project.name}</span>
      </div>

      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>{project.name}</h1>
          {project.description && <p style={styles.description}>{project.description}</p>}
        </div>
        <div style={styles.actions}>
          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
              👥 Members
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            + Add Task
          </button>
        </div>
      </div>

      {/* Team Members */}
      <div style={styles.membersRow}>
        {(project.members || []).map((m) => (
          <div key={m.id} style={styles.memberChip}>
            <div style={styles.memberAvatar}>{m.user.name.charAt(0).toUpperCase()}</div>
            <span style={styles.memberName}>{m.user.name}</span>
            <span className={`badge ${m.role === "ADMIN" ? "badge-admin" : "badge-member"}`} style={{ fontSize: "0.65rem" }}>
              {m.role}
            </span>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div style={styles.board}>
        {[
          { title: "To Do", tasks: todoTasks, color: "var(--status-todo)" },
          { title: "In Progress", tasks: inProgressTasks, color: "var(--status-progress)" },
          { title: "Done", tasks: doneTasks, color: "var(--status-done)" },
        ].map((column) => (
          <div key={column.title} style={styles.column}>
            <div style={styles.columnHeader}>
              <div style={{ ...styles.columnDot, background: column.color }} />
              <span style={styles.columnTitle}>{column.title}</span>
              <span style={styles.columnCount}>{column.tasks.length}</span>
            </div>
            <div style={styles.columnBody}>
              {column.tasks.length === 0 ? (
                <div style={styles.emptyColumn}>No tasks</div>
              ) : (
                column.tasks.map((task) => (
                  <div key={task.id} className="card" style={styles.taskCard}>
                    <div style={styles.taskTop}>
                      <span style={styles.taskTitle}>{task.title}</span>
                      <span style={{ ...styles.priorityDot, background: getPriorityColor(task.priority) }} title={task.priority} />
                    </div>
                    {task.description && (
                      <p style={styles.taskDesc}>{task.description}</p>
                    )}
                    <div style={styles.taskMeta}>
                      {task.assignee && (
                        <span style={styles.taskAssignee}>
                          <span style={styles.assigneeAvatar}>{task.assignee.name.charAt(0)}</span>
                          {task.assignee.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span style={{
                          ...styles.taskDue,
                          color: isOverdue(task) ? "var(--status-overdue)" : "var(--text-tertiary)"
                        }}>
                          {isOverdue(task) ? "⚠ " : ""}
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <div style={styles.taskActions}>
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
                      {isAdmin && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Task</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="modal-form">
              {error && (
                <div style={{ padding: "10px 14px", background: "var(--status-overdue-bg)", color: "var(--status-overdue)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)" }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  className="form-input"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">Description</label>
                <textarea
                  id="task-desc"
                  className="form-input"
                  placeholder="Describe the task..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    className="form-select"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-status">Status</label>
                  <select
                    id="task-status"
                    className="form-select"
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-assignee">Assign to</label>
                  <select
                    id="task-assignee"
                    className="form-select"
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-due">Due date</label>
                  <input
                    id="task-due"
                    type="date"
                    className="form-input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Members</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "var(--font-sm)", color: "var(--text-tertiary)", marginBottom: "8px" }}>Current Members</h3>
              {(project.members || []).map((m) => (
                <div key={m.id} style={styles.memberRow}>
                  <div style={styles.memberAvatar}>{m.user.name.charAt(0).toUpperCase()}</div>
                  <span>{m.user.name}</span>
                  <span className={`badge ${m.role === "ADMIN" ? "badge-admin" : "badge-member"}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
            {availableUsers.length > 0 && (
              <div>
                <h3 style={{ fontSize: "var(--font-sm)", color: "var(--text-tertiary)", marginBottom: "8px" }}>Add Members</h3>
                {availableUsers.map((u) => (
                  <div key={u.id} style={styles.memberRow}>
                    <div style={styles.memberAvatar}>{u.name.charAt(0).toUpperCase()}</div>
                    <span style={{ flex: 1 }}>{u.name}</span>
                    <button className="btn btn-sm btn-primary" onClick={() => handleAddMember(u.id)}>Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "var(--font-sm)",
    color: "var(--text-tertiary)",
    marginBottom: "16px",
  },
  breadcrumbLink: {
    color: "var(--accent-primary-hover)",
  },
  breadcrumbSep: {
    opacity: 0.4,
  },
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
  description: {
    fontSize: "var(--font-sm)",
    color: "var(--text-tertiary)",
    marginTop: "4px",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  membersRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "32px",
  },
  memberChip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px 4px 4px",
    background: "var(--bg-glass)",
    border: "1px solid var(--border-primary)",
    borderRadius: "var(--radius-full)",
    fontSize: "var(--font-xs)",
  },
  memberAvatar: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "var(--accent-gradient)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.65rem",
    fontWeight: "700",
    color: "white",
    flexShrink: 0,
  },
  memberName: {
    color: "var(--text-secondary)",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    minHeight: "400px",
  },
  column: {
    background: "var(--bg-glass)",
    border: "1px solid var(--border-primary)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  columnHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 16px",
    borderBottom: "1px solid var(--border-primary)",
  },
  columnDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  columnTitle: {
    fontSize: "var(--font-sm)",
    fontWeight: "600",
    flex: 1,
  },
  columnCount: {
    fontSize: "var(--font-xs)",
    color: "var(--text-tertiary)",
    background: "var(--bg-glass)",
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
  },
  columnBody: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
    overflowY: "auto",
  },
  emptyColumn: {
    fontSize: "var(--font-sm)",
    color: "var(--text-tertiary)",
    textAlign: "center",
    padding: "24px",
    opacity: 0.6,
  },
  taskCard: {
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  taskTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  taskTitle: {
    fontSize: "var(--font-sm)",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  priorityDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "4px",
  },
  taskDesc: {
    fontSize: "var(--font-xs)",
    color: "var(--text-tertiary)",
    lineHeight: "1.4",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  taskMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  taskAssignee: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "var(--font-xs)",
    color: "var(--text-secondary)",
  },
  assigneeAvatar: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "var(--accent-gradient)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.55rem",
    fontWeight: "700",
    color: "white",
  },
  taskDue: {
    fontSize: "var(--font-xs)",
  },
  taskActions: {
    display: "flex",
    gap: "6px",
    paddingTop: "6px",
    borderTop: "1px solid var(--border-primary)",
  },
  statusSelect: {
    flex: 1,
    padding: "4px 8px",
    fontSize: "var(--font-xs)",
    backgroundSize: "14px",
  },
  memberRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--font-sm)",
    color: "var(--text-secondary)",
  },
};
