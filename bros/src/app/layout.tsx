import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthHashHandler } from "@/components/auth-hash-handler";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bros",
  description: "Encontros entre homens. Discrição de verdade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className={`${inter.className} flex min-h-full flex-col bg-bg text-ink`}>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
