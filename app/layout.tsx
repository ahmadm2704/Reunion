import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kohatians Reunion - GTG 2025",
  description: "Register for the upcoming Gathering (GTG) scheduled for November 22, 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


