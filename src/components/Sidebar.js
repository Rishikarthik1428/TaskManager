"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "⬡" },
    { href: "/projects", label: "Projects", icon: "◫" },
    { href: "/tasks", label: "Tasks", icon: "☰" },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.top}>
        <Link href="/dashboard" style={styles.logo}>
          <span style={styles.logoIcon}>◆</span>
          <span style={styles.logoText}>Ethara</span>
        </Link>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span style={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={styles.bottom}>
        {session?.user && (
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div style={styles.userMeta}>
              <span style={styles.userName}>{session.user.name}</span>
              <span style={styles.userRole}>
                {session.user.role === "ADMIN" ? "Admin" : "Member"}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={styles.logoutBtn}
        >
          ↗ Sign out
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "var(--sidebar-width)",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    background: "var(--bg-secondary)",
    borderRight: "1px solid var(--border-primary)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 16px",
    zIndex: 50,
  },
  top: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 8px",
  },
  logoIcon: {
    fontSize: "1.3rem",
    background: "var(--accent-gradient)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: "800",
    letterSpacing: "-0.03em",
    background: "var(--accent-gradient)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--font-sm)",
    fontWeight: "500",
    color: "var(--text-secondary)",
    transition: "all var(--transition-fast)",
    position: "relative",
    textDecoration: "none",
  },
  navItemActive: {
    background: "var(--accent-primary-glow)",
    color: "var(--accent-primary-hover)",
    fontWeight: "600",
  },
  navIcon: {
    fontSize: "1rem",
    width: "20px",
    textAlign: "center",
  },
  activeIndicator: {
    position: "absolute",
    right: "0",
    width: "3px",
    height: "60%",
    borderRadius: "2px",
    background: "var(--accent-primary)",
  },
  bottom: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px",
    borderRadius: "var(--radius-md)",
    background: "var(--bg-glass)",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "var(--radius-md)",
    background: "var(--accent-gradient)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "var(--font-sm)",
    fontWeight: "700",
    color: "white",
    flexShrink: 0,
  },
  userMeta: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  userName: {
    fontSize: "var(--font-sm)",
    fontWeight: "600",
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userRole: {
    fontSize: "var(--font-xs)",
    color: "var(--text-tertiary)",
  },
  logoutBtn: {
    padding: "8px 12px",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--font-sm)",
    color: "var(--text-tertiary)",
    transition: "all var(--transition-fast)",
    textAlign: "left",
    cursor: "pointer",
    border: "none",
    background: "none",
    fontFamily: "var(--font-family)",
  },
};
