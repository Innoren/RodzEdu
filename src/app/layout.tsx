import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rodzedu.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RodzEdu | Radiology Continuing Education",
    template: "%s | RodzEdu",
  },
  description:
    "Homestudy continuing education for radiologic technologists, mammography, CT, and imaging professionals — clear credits, online exams, and downloadable certificates.",
  keywords: [
    "radiology CE",
    "continuing education",
    "radiologic technologist",
    "mammography CE",
    "CT CE",
    "homestudy CE",
    "ARRT CE",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "RodzEdu",
    title: "RodzEdu | Radiology Continuing Education",
    description:
      "Homestudy CE for imaging professionals — practical courses, clear credits, and support when you need it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RodzEdu | Radiology Continuing Education",
    description:
      "Homestudy CE for imaging professionals — practical courses, clear credits, and support when you need it.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
