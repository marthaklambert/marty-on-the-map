import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "marty on the map",
  description: "marty on the map",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Grain texture overlay */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 9999,
            opacity: 0.15,
            backgroundImage: 'url(/grain.png)',
            backgroundRepeat: 'repeat',
          }}
        />
      </body>
    </html>
  );
}
