import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PDF Printables Studio | Modern PDF Generation Platform",
  description: "Create, manage, and generate dynamic PDF documents with custom templates. A modern platform for PDF printables with advanced customization options.",
  keywords: ["PDF", "printables", "templates", "forms", "document generation"],
  authors: [{ name: "PDF Printables Studio" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
