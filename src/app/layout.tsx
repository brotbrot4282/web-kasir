import type { Metadata } from "next";
import "./globals.css";
import Navbar1 from "@/components/ui/navbar-1";

export const metadata: Metadata = {
  title: "Warmindo Kasir",
  description: "Sistem Kasir untuk Warmindo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Navbar1 />
        {children}
      </body>
    </html>
  );
}
