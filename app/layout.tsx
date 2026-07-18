import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "RodzEdu — Radiology Continuing Education",
  description:
    "Trusted online continuing education courses for radiologic technologists. ARRT-aligned CE credits, on your schedule.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
