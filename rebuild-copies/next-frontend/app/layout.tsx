import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Printables - PDF Template Generator & Database Manager | Dynamic PDF Creation",
  description: "Professional PDF template editor with drag-and-drop field mapping, database integration, and dynamic data submission. Create custom PDF forms, manage databases, and automate document generation with ease.",
  keywords: "PDF generator, PDF template editor, dynamic PDF, database manager, PDF form creator, document automation, PDF field mapping, drag and drop PDF, custom PDF templates, data-driven PDFs",
  authors: [{ name: "Printables" }],
  creator: "Printables",
  publisher: "Printables",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://printababes-aj3ggogle-bossj-cpus-projects.vercel.app",
    title: "Printables - Professional PDF Template Generator",
    description: "Create dynamic PDF templates with drag-and-drop field mapping and database integration. Automate document generation with our powerful PDF editor.",
    siteName: "Printables",
  },
  twitter: {
    card: "summary_large_image",
    title: "Printables - PDF Template Generator & Database Manager",
    description: "Professional PDF template editor with drag-and-drop field mapping and database integration.",
  },
  verification: {
    google: "google-site-verification-code",
  },
  alternates: {
    canonical: "https://printababes-aj3ggogle-bossj-cpus-projects.vercel.app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://printababes-aj3ggogle-bossj-cpus-projects.vercel.app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body>
        <main id="main-content" role="main">
          {children}
        </main>
      </body>
    </html>
  );
}
