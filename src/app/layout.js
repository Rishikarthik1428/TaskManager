import "./globals.css";

export const metadata = {
  title: "Ethara — Project Management",
  description: "Manage projects, assign tasks, and track progress with role-based access control.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
