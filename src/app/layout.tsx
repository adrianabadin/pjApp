import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Padrón de Afiliados · PJ Saladillo",
  description: "Sistema de gestión del padrón de afiliados del Partido Justicialista de Saladillo",
  openGraph: {
    title: "Padrón de Afiliados · PJ Saladillo",
    description: "Sistema de gestión del padrón de afiliados del Partido Justicialista de Saladillo",
    url: "https://pj.thecodersteam.com",
    siteName: "PJ Saladillo",
    images: [{ url: "/logo.svg", width: 200, height: 63, alt: "Partido Justicialista Saladillo" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Padrón de Afiliados · PJ Saladillo",
    description: "Sistema de gestión del padrón de afiliados del Partido Justicialista de Saladillo",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
