import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Tasks — Ethara",
};

export default function TasksLayout({ children }) {
  return (
    <Providers>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main
          style={{
            marginLeft: "var(--sidebar-width)",
            flex: 1,
            padding: "32px",
            minHeight: "100vh",
          }}
        >
          {children}
        </main>
      </div>
    </Providers>
  );
}
