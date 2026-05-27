import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wibo — AI Native CRM",
  description: "An AI-native CRM for ambitious teams.",
};

// Every page reads live data from the database at request time, so there is
// nothing to prerender at build. force-dynamic keeps the build from touching
// the DB and ensures each request sees fresh data.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-white text-[var(--foreground)]">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
