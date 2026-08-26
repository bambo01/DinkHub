import type { Metadata } from "next";
import { Comfortaa, Montserrat, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/context/AuthContext";
import { TestNotice } from "@/components/layout/TestNotice";
import "./globals.css";

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://dinkhub-eight.vercel.app";
const title = "DinkHub (Testing) — Pickleball Booking & Management Platform";
const description =
  "Testing environment for DinkHub, the all-in-one pickleball booking and management platform. Bookings made here are not official.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "DinkHub",
    images: [
      {
        url: "/metadataImage.png",
        width: 4560,
        height: 2565,
        alt: "DinkHub — Pickleball Booking & Management Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/metadataImage.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${comfortaa.variable} ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <TestNotice />
        <Analytics />
      </body>
    </html>
  );
}
