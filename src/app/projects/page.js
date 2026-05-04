"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", memberIds: [] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchProjects();
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setProjects([data, ...projects]);
        setShowModal(false);
        setForm({ name: "", description: "", memberIds: [] });
      }
    } catch {
      setError("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMember = (userId) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId],
    }));
  };

  const getProgress = (project) => {
    const tasks = project.tasks || [];
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.status === "DONE").length;
    return Math.round((done / tasks.length) * 100);
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Projects</h1>
          <p style={styles.subtitle}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-title">No projects yet</div>
          <div className="empty-state-text">
            {isAdmin ? "Create your first project to get started" : "You haven't been added to any projects yet"}
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => {
            const progress = getProgress(project);
            const taskCount = project.tasks?.length || 0;
            const memberCount = project.members?.length || 0;

            return (
              <Link href={`/projects/${project.id}`} key={project.id} style={{ textDecoration: "none" }}>
                <div className="card" style={styles.projectCard}>
                  <div style={styles.cardTop}>
                    <h3 style={styles.cardTitle}>{project.name}</h3>
                    {isAdmin && (
                      <button
                        className="btn btn-icon btn-secondary"
                        onClick={(e) => { e.preventDefault(); handleDelete(project.id); }}
                        title="Delete project"
                        style={{ fontSize: "0.8rem" }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  {project.description && (
                    <p style={styles.cardDesc}>{project.description}</p>
                  )}

                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${progress}%`,
                          background: progress === 100 ? "var(--status-done)" : "var(--accent-gradient)",
                        }}
                      />
                    </div>
                    <span style={styles.progressText}>{progress}%</span>
                  </div>

                  <div style={styles.cardMeta}>
                    <span style={styles.metaItem}>☰ {taskCount} task{taskCount !== 1 ? "s" : ""}</span>
                    <span style={styles.metaItem}>👥 {memberCount} member{memberCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              {error && (
                <div style={{ padding: "10px 14px", background: "var(--status-overdue-bg)", color: "var(--status-overdue)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)" }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="project-name">Project name</label>
                <input
                  id="project-name"
                  className="form-input"
                  placeholder="My Awesome Project"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="project-desc">Description (optional)</label>
                <textarea
                  id="project-desc"
                  className="form-input"
                  placeholder="Brief description of the project..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>
              {users.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Add team members</label>
                  <div style={styles.memberList}>
                    {users
                      .filter((u) => u.id !== session?.user?.id)
                      .map((user) => (
                        <label key={user.id} style={styles.memberItem}>
                          <input
                            type="checkbox"
                            checked={form.memberIds.includes(user.id)}
                            onChange={() => toggleMember(user.id)}
                            style={styles.checkbox}
                          />
                          <span>{user.name}</span>
                          <span className={`badge ${user.role === "ADMIN" ? "badge-admin" : "badge-member"}`}>
                            {user.role}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
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
    marginBottom: "32px",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  },
  projectCard: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  cardTitle: {
    fontSize: "var(--font-lg)",
    fontWeight: "700",
    letterSpacing: "-0.01em",
  },
  cardDesc: {
    fontSize: "var(--font-sm)",
    color: "var(--text-tertiary)",
    lineHeight: "1.5",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  progressBar: {
    flex: 1,
    height: "6px",
    background: "var(--bg-glass)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  progressText: {
    fontSize: "var(--font-xs)",
    fontWeight: "600",
    color: "var(--text-secondary)",
    minWidth: "32px",
    textAlign: "right",
  },
  cardMeta: {
    display: "flex",
    gap: "16px",
    paddingTop: "8px",
    borderTop: "1px solid var(--border-primary)",
  },
  metaItem: {
    fontSize: "var(--font-xs)",
    color: "var(--text-tertiary)",
  },
  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "160px",
    overflowY: "auto",
    padding: "8px",
    background: "var(--bg-glass)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-primary)",
  },
  memberItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--font-sm)",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  checkbox: {
    accentColor: "var(--accent-primary)",
  },
};
