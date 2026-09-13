import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CUET Lost and Found Box",
  description: "CUET Lost and Found Box MVP",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
