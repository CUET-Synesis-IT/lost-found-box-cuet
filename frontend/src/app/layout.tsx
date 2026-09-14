import type { Metadata } from "next";
import Link from "next/link";

import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import { AuthControls } from "@/components/auth/auth-controls";
import "./globals.css";

export const metadata: Metadata = {
  title: "CUET Lost and Found Box",
  description: "Report and recover lost items on the CUET campus.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans text-ink">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-4 w-4 bg-blueprint" aria-hidden />
              <span className="text-[17px] font-semibold tracking-tight text-ink">
                CUET Lost &amp; Found
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-ink/70">
              <Link href="/posts" className="hover:text-ink">
                Browse
              </Link>
              <Link href="/posts/create" className="hover:text-ink">
                Report an item
              </Link>
              <Link href="/dashboard" className="hidden hover:text-ink sm:inline">
                Dashboard
              </Link>
              <AuthControls />
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
